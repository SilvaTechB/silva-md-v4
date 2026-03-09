'use strict';
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['password', 'passwd', 'genpass'],
    description: 'Generate a strong random password',
    usage:       '.password [length]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const jid = message.key.remoteJid;
        const len = Math.min(Math.max(parseInt(args[0]) || 16, 6), 64);
        const upper  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower  = 'abcdefghijklmnopqrstuvwxyz';
        const digits = '0123456789';
        const syms   = '!@#$%^&*()-_=+[]{}|;:,.<>?';
        const all    = upper + lower + digits + syms;
        let pwd = [
            upper[Math.floor(Math.random() * upper.length)],
            lower[Math.floor(Math.random() * lower.length)],
            digits[Math.floor(Math.random() * digits.length)],
            syms[Math.floor(Math.random() * syms.length)],
        ];
        for (let i = pwd.length; i < len; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
        pwd = pwd.sort(() => Math.random() - 0.5).join('');
        const strength = len >= 20 ? '🟢 Very Strong' : len >= 14 ? '🟡 Strong' : len >= 10 ? '🟠 Moderate' : '🔴 Weak';
        await sendButtons(sock, jid, {
            text:   `🔐 *Generated Password*\n\n\`\`\`${pwd}\`\`\`\n\n📏 *Length:* ${len}  •  💪 *Strength:* ${strength}`,
            footer: '⚠️ Never share your password with anyone',
            buttons: [
                { id: `password ${len}`, text: '🔄 New Password' },
                { id: 'password 20',     text: '🔐 Strong (20 chars)' },
                { id: 'menu',            text: '📋 Main Menu' },
            ]
        });
    }
};
