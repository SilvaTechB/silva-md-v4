'use strict';

const { performance } = require('perf_hooks');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['ping'],
    description: 'Check bot response time and uptime',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { jid, contextInfo, safeSend }) => {
        const start = performance.now();
        await safeSend({ text: '🏓 Pinging...' }, { quoted: message });
        const ms = (performance.now() - start).toFixed(2);

        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);

        await sendButtons(sock, message.key.remoteJid, {
            text:   `✅ *Bot is Online!*\n\n⏱ *Response:* ${ms} ms\n⏳ *Uptime:* ${h}h ${m}m ${s}s`,
            footer: '⚡ Powered by Silva MD',
            buttons: [
                { id: 'ping',   text: '🏓 Ping Again' },
                { id: 'uptime', text: '⏱ Check Uptime' },
                { id: 'menu',   text: '📋 Main Menu' },
            ]
        });
    }
};
