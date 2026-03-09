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

// Newsletter watermark — only safe in private chats; groups get an empty object
const GLOBAL_CONTEXT_INFO = {
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363200367779016@newsletter',
        newsletterName: '◢◤ Silva Tech Nexus ◢◤',
        serverMessageId: 144
    }
};

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
function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

async function handleMessages(sock, message) {
    try {
        const msg = message.message;
        if (!msg) return;

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

        // ── AFK auto-reply (fires before prefix check, not for owner's own messages) ──
        if (!message.key.fromMe) {
            const afkPlugin = plugins.find(p => p.commands?.includes('afk') && typeof p.isAfk === 'function');
            if (afkPlugin?.isAfk()) {
                const { reason, since } = afkPlugin.getAfkData();
                await safeSend(sock, jid, {
                    text: `🤖 *Beep boop!* This is a bot.\n\n👤 My owner is currently away.\n📝 *Reason:* ${reason}\n⏱ *Away for:* ${formatDuration(Date.now() - since)}`,
                }, { quoted: message });
                return;
            }
        }

        // ── Anti-link (group only, bot must be admin) ────────────────────────
        if (isGroup && !message.key.fromMe) {
            const antilinkOn = config.ANTILINK || global.antilinkGroups?.has(jid);
            if (antilinkOn) {
                const URL_REGEX = /(?:https?:\/\/|www\.)\S+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|gg|me|ly|co|app|xyz|info|tv|link|shop|live|club|online|site|store|pro|in|ng|ke|tz|ug|za|uk)\b(?:\/\S*)?/gi;
                if (URL_REGEX.test(text)) {
                    try {
                        await sock.sendMessage(jid, {
                            delete: message.key
                        });
                        await safeSend(sock, jid, {
                            text: `⚠️ @${from.split('@')[0]} links are not allowed in this group.`,
                            mentions: [from]
                        });
                    } catch (e) {
                        console.error('[Antilink] delete failed:', e.message);
                    }
                    return;
                }
            }
        }

        if (!text.startsWith(prefix)) return;

        const parts   = text.slice(prefix.length).trim().split(/\s+/);
        const command = parts.shift().toLowerCase();
        const args    = parts;

        console.log(`[HANDLER] cmd=${command} jid=${jid} from=${from}`);

        // ── Resolve owner ─────────────────────────────────────────────────────
        // fromMe = owner is using their own device as the bot
        const ownerNum  = (config.OWNER_NUMBER || '').replace(/\D/g, '');
        const fromNum   = from.replace(/\D/g, '').replace(/:.*$/, '');
        const isOwner   = message.key.fromMe || fromNum === ownerNum;

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
            contextInfo:   isGroup ? {} : GLOBAL_CONTEXT_INFO,
            mentionedJid:  msg.extendedTextMessage?.contextInfo?.mentionedJid || [],
            safeSend:      (content, opts) => safeSend(sock, jid, content, opts),
            reply:         (replyText) => safeSend(sock, jid, { text: replyText }, { quoted: message })
        };

        // ── Dispatch ──────────────────────────────────────────────────────────
        const RECORDING_CMDS = new Set(['play', 'song', 'sticker', 's', 'tiktok', 'tt', 'ttdl', 'tiktokdl', 'youtube', 'yt', 'instagram', 'igdl', 'ig', 'insta', 'facebook', 'fb', 'fbdl']);

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

            // ── Auto-presence: show typing or recording before responding ──────
            try {
                const presenceType = RECORDING_CMDS.has(command) ? 'recording' : 'composing';
                await sock.sendPresenceUpdate(presenceType, jid);
            } catch { /* non-fatal */ }

            try {
                await plugin.run(sock, message, args, ctx);
            } catch (err) {
                console.error(`[Plugin:${command}] ${err.stack || err.message}`);
                await safeSend(sock, jid,
                    { text: `⚠️ Command error: ${err.message || 'unknown error'}` },
                    { quoted: message }
                );
            }

            // ── Auto-presence: back to paused after responding ──────────────
            try { await sock.sendPresenceUpdate('paused', jid); } catch { /* non-fatal */ }
        }
    } catch (err) {
        console.error('[Handler] Fatal:', err.stack || err.message);
    }
}

module.exports = { handleMessages, safeSend, setupConnectionHandlers, PERM, plugins };
