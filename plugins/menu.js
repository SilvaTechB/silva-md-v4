'use strict';

const fs   = require('fs');
const path = require('path');

const CATEGORIES = {
    'Downloader': ['yt', 'youtube', 'tiktok', 'tt', 'ttdl', 'tiktokdl', 'facebook', 'fb', 'fbdl', 'instagram', 'igdl', 'ig', 'insta', 'apk', 'apkdl', 'getapk'],
    'Music':      ['play', 'shazam', 'identify', 'song'],
    'AI & Tools': ['ai', 'gpt', 'chatgpt', 'shorten', 'tourl', 'imgtourl', 'imgurl', 'geturl', 'upload', 'scanurl', 'urlscan', 'checksafe', 'gitclone'],
    'Media':      ['sticker', 's', 'vv', 'antivv', 'avv', 'viewonce', 'open', 'openphoto', 'openvideo', 'vvphoto'],
    'Group':      ['anticall', 'antidelete', 'antidel', 'autoreply', 'ar', 'afk', 'back', 'afklist', 'blocklist', 'listblock'],
    'Info':       ['ping', 'uptime', 'runtime', 'owner', 'creator', 'repo', 'repository', 'github', 'getjid', 'jid', 'spp', 'profile', 'getpp', 'weather', 'climate', 'mosam'],
    'Status':     ['save', 'nitumie', 'statussave'],
    'Fun':        ['hello', 'test', 'botdemo', 'features'],
    'Calls':      ['call', 'support', 'ss'],
};

module.exports = {
    commands:    ['menu', 'help', 'list'],
    description: 'Show all available commands',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { sender, prefix, reply } = ctx;

        const plugins  = loadPlugins();
        const allCmds  = new Set(plugins.flatMap(p => p.commands || []));
        const assigned = new Set();

        const now = new Date().toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi'
        });

        const lines = [];
        lines.push(`╭─────────────────────`);
        lines.push(`│ *✦ Silva MD — Menu*`);
        lines.push(`│ ${now}`);
        lines.push(`│ Prefix: \`${prefix}\``);
        lines.push(`╰─────────────────────`);
        lines.push('');

        for (const [cat, cmds] of Object.entries(CATEGORIES)) {
            const found = cmds.filter(c => allCmds.has(c) && !assigned.has(c));
            if (!found.length) continue;
            found.forEach(c => assigned.add(c));
            lines.push(`*${cat}*`);
            lines.push(found.map(c => `  \`${prefix}${c}\``).join('  '));
            lines.push('');
        }

        const rest = [...allCmds].filter(c => !assigned.has(c) && c !== 'menu' && c !== 'help' && c !== 'list');
        if (rest.length) {
            lines.push(`*Other*`);
            lines.push(rest.map(c => `  \`${prefix}${c}\``).join('  '));
            lines.push('');
        }

        lines.push(`_${plugins.length} plugins • Type ${prefix}help <cmd> for details_`);

        await reply(lines.join('\n'));
    }
};

function loadPlugins() {
    const dir   = path.join(__dirname);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    const out   = [];
    for (const f of files) {
        try {
            const p = require(path.join(dir, f));
            if (Array.isArray(p.commands) && p.commands.length) out.push(p);
        } catch { }
    }
    return out;
}
