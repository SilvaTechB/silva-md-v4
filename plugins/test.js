'use strict';

const config = require('../config');

module.exports = {
    commands:    ['test', 'botdemo', 'features'],
    description: 'Show bot feature overview',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, prefix, contextInfo }) => {
        const p       = prefix || config.PREFIX || '.';
        const botName = config.BOT_NAME || 'Silva MD';

        const menu =
`🛠️ *${botName} — Feature Overview* 🛠️

⚙️ *Core*
• ${p}ping — Response time
• ${p}uptime — Runtime stats
• ${p}owner — Bot owner info

🎭 *Media*
• ${p}sticker — Image/video to sticker
• ${p}yt — YouTube download
• ${p}play — Music download

🌐 *Downloads*
• ${p}tiktok — TikTok video
• ${p}ig — Instagram video
• ${p}fb — Facebook video
• ${p}apk — APK downloader

🤖 *AI & Tools*
• ${p}ai — Ask AI a question
• ${p}weather — Weather report
• ${p}shorten — Shorten URL
• ${p}scanurl — URL safety scan
• ${p}gitclone — Clone GitHub repo

🛡️ *Group (Admin)*
• ${p}antidelete — Anti-delete toggle
• ${p}autoreply — Auto-reply toggle

_Type any command to try it!_`;

        await sock.sendMessage(sender, { text: menu, contextInfo }, { quoted: message });
    }
};
