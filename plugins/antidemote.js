'use strict';

const { sendButtons } = require('gifted-btns');
// Groups where anti-demote is enabled — read by silva.js event handler
const enabledGroups = new Set();
global.antiDemoteGroups = enabledGroups;

module.exports = {
    commands:    ['antidemote'],
    description: 'Kick anyone who demotes a group admin (requires bot to be admin)',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, safeSend, contextInfo, isBotAdmin } = ctx;
        const action = (args[0] || '').toLowerCase();

        if (!isBotAdmin) {
            await safeSend({
                text: '⚠️ *Anti-Demote* requires the bot to be a group admin first.',
                contextInfo
            }, { quoted: message });
            return;
        }

        if (action === 'on') {
            enabledGroups.add(jid);
            await sendButtons(sock, jid, {
                text:   '🛡️ *Anti-Demote is ON*\n\nAnyone who demotes a group admin will be re-promoted automatically.',
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'antidemote off', text: '🔴 Turn OFF' },
                    { id: 'menu',           text: '📋 Main Menu' },
                ]
            });
        } else if (action === 'off') {
            enabledGroups.delete(jid);
            await sendButtons(sock, jid, {
                text:   '🛡️ *Anti-Demote is OFF*',
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'antidemote on', text: '🟢 Turn ON' },
                    { id: 'menu',          text: '📋 Main Menu' },
                ]
            });
        } else {
            const status = enabledGroups.has(jid) ? '✅ ON' : '❌ OFF';
            await sendButtons(sock, jid, {
                text:   `🛡️ *Anti-Demote*\n\nStatus: ${status}`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'antidemote on',  text: '🟢 Enable' },
                    { id: 'antidemote off', text: '🔴 Disable' },
                    { id: 'menu',           text: '📋 Main Menu' },
                ]
            });
        }
    }
};
