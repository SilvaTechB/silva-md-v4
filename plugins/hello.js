'use strict';

const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['hello'],
    description: 'Simple hello test command',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, ctx) => {
        const jid = message.key.remoteJid;
        await sendButtons(sock, jid, {
            text:   `✅ *Hello!*\n\nArgs received: ${args.join(', ') || 'none'}`,
            footer: '⚡ Powered by Silva MD',
            buttons: [
                { id: 'hello', text: '👋 Hello Again' },
                { id: 'ping',  text: '🏓 Ping Bot' },
                { id: 'menu',  text: '📋 Main Menu' },
            ]
        });
    }
};
