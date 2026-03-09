'use strict';

const config = require('../config');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['antidelete', 'antidel'],
    description: 'Toggle anti-delete — recovers deleted and edited messages and forwards them to you',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { safeSend, contextInfo } = ctx;
        const action = (args[0] || '').toLowerCase();

        const jid = message.key.remoteJid;
        if (action === 'on') {
            config.ANTIDELETE_GROUP   = true;
            config.ANTIDELETE_PRIVATE = true;
            await sendButtons(sock, jid, {
                text:   '🛡️ *Anti-Delete is ON*\n\nDeleted and edited messages will be recovered and forwarded to you.',
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'antidelete off', text: '🔴 Turn OFF' },
                    { id: 'menu',           text: '📋 Main Menu' },
                ]
            });
        } else if (action === 'off') {
            config.ANTIDELETE_GROUP   = false;
            config.ANTIDELETE_PRIVATE = false;
            await sendButtons(sock, jid, {
                text:   '🛡️ *Anti-Delete is OFF*',
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'antidelete on', text: '🟢 Turn ON' },
                    { id: 'menu',          text: '📋 Main Menu' },
                ]
            });
        } else {
            const groupStatus   = config.ANTIDELETE_GROUP   ? '✅ ON' : '❌ OFF';
            const privateStatus = config.ANTIDELETE_PRIVATE ? '✅ ON' : '❌ OFF';
            await sendButtons(sock, jid, {
                text:   `🛡️ *Anti-Delete Status*\n\n📌 Groups: ${groupStatus}\n📌 Private: ${privateStatus}`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'antidelete on',  text: '🟢 Enable' },
                    { id: 'antidelete off', text: '🔴 Disable' },
                    { id: 'menu',           text: '📋 Main Menu' },
                ]
            });
        }
    }
};
