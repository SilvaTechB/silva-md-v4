'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config');

let isJidGroup;
try {
    ({ isJidGroup } = require('@whiskeysockets/baileys'));
} catch {
    isJidGroup = (jid) => typeof jid === 'string' && jid.endsWith('@g.us');
}

// ─── Permission constants ────────────────────────────────────────────────────
const PERM = {
    PUBLIC: 'public',
    ADMIN:  'admin',
    OWNER:  'owner'
};

// ─── Group metadata cache (5 min TTL) ───────────────────────────────────────
const groupCache = new Map();
const GROUP_CACHE_TTL = 5 * 60 * 1000;

async function getCachedGroupMetadata(sock, jid) {
    const hit = groupCache.get(jid);
    if (hit && Date.now() < hit.expiry) return hit.metadata;
    try {
        const metadata = await sock.groupMetadata(jid);
        groupCache.set(jid, { metadata, expiry: Date.now() + GROUP_CACHE_TTL });
        return metadata;
    } catch {
        return null;
    }
}

// Invalidate cache when group membership changes
function bindGroupCacheInvalidation(sock) {
    sock.ev.on('group-participants.update', ({ id }) => groupCache.delete(id));
}

// ─── Safe send ───────────────────────────────────────────────────────────────
async function safeSend(sock, jid, content, opts = {}) {
    if (!jid || !sock?.sendMessage) return null;
    try {
        return await sock.sendMessage(jid, content, opts);
    } catch (err) {
        console.error(`[SafeSend] ${jid}: ${err.message}`);
        return null;
    }
}

// Context info kept empty — newsletter watermarks cause "waiting for this message" in groups
const GLOBAL_CONTEXT_INFO = {};

// ─── Plugin loader ───────────────────────────────────────────────────────────
const plugins = [];
const pluginDir = path.join(__dirname, 'plugins');

function loadPlugins() {
    if (!fs.existsSync(pluginDir)) return;
    const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const pluginPath = path.join(pluginDir, file);
        try {
            delete require.cache[require.resolve(pluginPath)];
            const plugin = require(pluginPath);

            if (!plugin.commands && plugin.name) plugin.commands = [plugin.name];
            if (!plugin.run && typeof plugin.handler === 'function') plugin.run = plugin.handler;

            if (Array.isArray(plugin.commands) && plugin.commands.length && typeof plugin.run === 'function') {
                plugins.push(plugin);
                console.log(`[Plugin] Loaded: ${file} (${plugin.commands.join(', ')})`);
            } else {
                console.warn(`[Plugin] Skipped: ${file} — missing commands or run/handler`);
            }
        } catch (err) {
            console.error(`[Plugin] Error loading ${file}:`, err.stack || err.message);
        }
    }
    console.log(`[Plugin] ${plugins.length} plugins loaded`);
}

loadPlugins();

// ─── Connection handlers ─────────────────────────────────────────────────────
function setupConnectionHandlers(sock) {
    bindGroupCacheInvalidation(sock);
    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') console.log('[Handler] WhatsApp connection open.');
    });
}

// ─── Main message handler ────────────────────────────────────────────────────
async function handleMessages(sock, message) {
    try {
        const msg = message.message;
        if (!msg || message.key.fromMe) return;

        // jid  = the chat to respond to (group JID or private JID)
        // from = the individual who typed the command
        const jid    = message.key.remoteJid;
        const from   = message.key.participant || jid;
        // sender = chat JID for responses (matches legacy plugin expectation of m.key.remoteJid)
        const sender = jid;
        if (!jid || !from) return;

        const isGroup = isJidGroup(jid);
        const prefix  = config.PREFIX || '.';

        // ── Extract text ─────────────────────────────────────────────────────
        const text =
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption || '';

        if (!text.startsWith(prefix)) return;

        const parts   = text.slice(prefix.length).trim().split(/\s+/);
        const command = parts.shift().toLowerCase();
        const args    = parts;

        console.log(`[HANDLER] cmd=${command} jid=${jid} from=${from}`);

        // ── Resolve owner ─────────────────────────────────────────────────────
        const ownerNum  = (config.OWNER_NUMBER || '').replace(/\D/g, '');
        const fromNum   = from.replace(/\D/g, '').replace(/:.*$/, '');
        const isOwner   = fromNum === ownerNum;

        // ── Resolve group admin status ────────────────────────────────────────
        let isAdmin    = false;
        let isBotAdmin = false;
        let groupMetadata = null;

        if (isGroup) {
            groupMetadata = await getCachedGroupMetadata(sock, jid);
            if (groupMetadata?.participants) {
                const botNum = (sock.user?.id || '').replace(/\D/g, '').replace(/:.*$/, '');
                for (const p of groupMetadata.participants) {
                    const pNum = p.id.replace(/\D/g, '').replace(/:.*$/, '');
                    const role = p.admin;
                    if (pNum === fromNum)  isAdmin    = role === 'admin' || role === 'superadmin';
                    if (pNum === botNum)   isBotAdmin = role === 'admin' || role === 'superadmin';
                }
            }
        }

        // ── Build unified context ─────────────────────────────────────────────
        const ctx = {
            sock,
            conn:          sock,
            m:             message,
            message,
            sender,               // = jid (the chat) — where plugins send responses
            from,                 // = individual who typed the command
            jid,
            chat:          jid,
            isGroup,
            isAdmin,
            isBotAdmin,
            isOwner,
            args,
            text,
            prefix,
            groupMetadata,
            contextInfo:   GLOBAL_CONTEXT_INFO,
            mentionedJid:  msg.extendedTextMessage?.contextInfo?.mentionedJid || [],
            safeSend:      (content, opts) => safeSend(sock, jid, content, opts),
            reply:         (replyText) => safeSend(sock, jid, { text: replyText }, { quoted: message })
        };

        // ── Dispatch ──────────────────────────────────────────────────────────
        for (const plugin of plugins) {
            if (!plugin.commands.includes(command)) continue;

            // Scope guards
            const allowGroup   = plugin.group   !== false;
            const allowPrivate = plugin.private !== false;
            if (isGroup  && !allowGroup)   continue;
            if (!isGroup && !allowPrivate) continue;

            // Permission check
            const perm = (plugin.permission || PERM.PUBLIC).toLowerCase();
            let allowed = false;
            if      (perm === PERM.PUBLIC) allowed = true;
            else if (perm === PERM.ADMIN)  allowed = isAdmin || isOwner;
            else if (perm === PERM.OWNER)  allowed = isOwner;

            if (!allowed) {
                const notice = perm === PERM.OWNER
                    ? '⛔ This command is reserved for the bot owner.'
                    : `⛔ This command requires ${isGroup ? 'group admin' : 'elevated'} privileges.`;
                await safeSend(sock, jid, { text: notice }, { quoted: message });
                continue;
            }

            try {
                await plugin.run(sock, message, args, ctx);
            } catch (err) {
                console.error(`[Plugin:${command}] ${err.stack || err.message}`);
                await safeSend(sock, jid,
                    { text: `⚠️ Command error: ${err.message || 'unknown error'}` },
                    { quoted: message }
                );
            }
        }
    } catch (err) {
        console.error('[Handler] Fatal:', err.stack || err.message);
    }
}

module.exports = { handleMessages, safeSend, setupConnectionHandlers, PERM };
