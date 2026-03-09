'use strict';

const fs   = require('fs');
const path = require('path');
const config = require('../config');

const CATEGORIES = [
    { icon: '📥', name: 'Downloaders',  primary: ['yt', 'tiktok', 'instagram', 'facebook', 'apk'] },
    { icon: '🎵', name: 'Music',         primary: ['play', 'shazam'] },
    { icon: '🤖', name: 'AI & Tools',   primary: ['ai', 'shorten', 'gitclone', 'scanurl', 'tourl'] },
    { icon: '🖼️', name: 'Media',         primary: ['sticker', 'viewonce'] },
    { icon: '👥', name: 'Group',         primary: ['antidemote', 'antidelete', 'afk', 'autoreply', 'anticall', 'blocklist'] },
    { icon: '📊', name: 'Status',        primary: ['save'] },
    { icon: 'ℹ️',  name: 'Info',          primary: ['ping', 'uptime', 'owner', 'weather', 'getjid', 'spp'] },
    { icon: '🎮', name: 'Fun',           primary: ['hello', 'test'] },
    { icon: '📞', name: 'Calls',         primary: ['call'] },
];

module.exports = {
    commands:    ['menu', 'help', 'list'],
    description: 'Show all available commands',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { prefix, safeSend, contextInfo } = ctx;

        const plugins  = loadPlugins();
        const allCmds  = new Set(plugins.flatMap(p => p.commands || []));
        const assigned = new Set();

        const now = new Date().toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi'
        });

        const botNum = (config.OWNER_NUMBER || '').replace(/\D/g, '');

        const lines = [];
        lines.push(`╭━━━━━━━━━━━━━━━━━━━━━━━╮`);
        lines.push(`┃  🤖 *SILVA MD — MENU*  ┃`);
        lines.push(`╰━━━━━━━━━━━━━━━━━━━━━━━╯`);
        lines.push(``);
        lines.push(`📅 ${now}`);
        lines.push(`📱 +${botNum}`);
        lines.push(`🔑 Prefix: *${prefix}*`);
        lines.push(`📦 ${plugins.length} plugins loaded`);
        lines.push(``);
        lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);

        for (const { icon, name, primary } of CATEGORIES) {
            const found = primary.filter(c => allCmds.has(c));
            if (!found.length) continue;
            found.forEach(c => assigned.add(c));

            lines.push(``);
            lines.push(`${icon} *${name.toUpperCase()}*`);
            for (const cmd of found) {
                lines.push(`  › \`${prefix}${cmd}\``);
            }
        }

        const rest = [...allCmds].filter(c => !assigned.has(c) && !['menu','help','list'].includes(c));
        if (rest.length) {
            lines.push(``);
            lines.push(`🔧 *OTHER*`);
            for (const cmd of rest) {
                lines.push(`  › \`${prefix}${cmd}\``);
            }
        }

        lines.push(``);
        lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━`);
        lines.push(`_Type \`${prefix}help <command>\` for details_`);

        await safeSend({ text: lines.join('\n'), contextInfo }, { quoted: message });
    }
};

function loadPlugins() {
    const dir = path.join(__dirname);
    const out = [];
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
        try {
            const p = require(path.join(dir, f));
            if (Array.isArray(p.commands) && p.commands.length) out.push(p);
        } catch { }
    }
    return out;
}
