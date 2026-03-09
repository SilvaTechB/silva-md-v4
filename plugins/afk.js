'use strict';

const { sendButtons } = require('gifted-btns');
let afkActive = false;
let afkReason  = 'No reason given';
let afkSince   = 0;

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

module.exports = {
    commands:    ['afk', 'back'],
    description: 'Owner AFK mode — bot auto-replies to everyone while you are away',
    permission:  'owner',
    group:       true,
    private:     true,

    isAfk:      () => afkActive,
    getAfkData: () => ({ reason: afkReason, since: afkSince }),

    run: async (sock, message, args, ctx) => {
        const { safeSend, contextInfo } = ctx;
        const cmdText = (message.message?.conversation || message.message?.extendedTextMessage?.text || '')
            .trim().split(/\s+/)[0].replace(/^[^a-zA-Z]*/, '').toLowerCase();

        if (cmdText === 'afk') {
            afkActive = true;
            afkReason  = args.join(' ') || 'No reason given';
            afkSince   = Date.now();
            await sendButtons(sock, message.key.remoteJid, {
                text:   `🌙 *AFK Mode Activated*\n\n📝 Reason: ${afkReason}\n\n_Anyone who messages you will receive an auto-reply._`,
                footer: '⚡ Type .back to return',
                buttons: [
                    { id: 'back', text: '🌸 Back (Deactivate AFK)' },
                    { id: 'menu', text: '📋 Main Menu' },
                ]
            });
            return;
        }

        if (cmdText === 'back') {
            if (!afkActive) {
                await sock.sendMessage(message.key.remoteJid, { text: '✅ AFK mode is not currently active.', contextInfo }, { quoted: message });
                return;
            }
            const duration = formatDuration(Date.now() - afkSince);
            afkActive = false;
            await sendButtons(sock, message.key.remoteJid, {
                text:   `🌸 *Welcome Back!*\n\n⏱ You were away for *${duration}*.`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'afk',  text: '🌙 Go AFK Again' },
                    { id: 'menu', text: '📋 Main Menu' },
                ]
            });
        }
    }
};
