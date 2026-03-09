const config = require('../config');
const { sendButtons } = require('gifted-btns');

if (!global.antilinkGroups) global.antilinkGroups = new Set();

module.exports = {
    commands: ['antilink'],
    description: 'Toggle antilink protection in a group. Deletes any message containing a URL.',
    permission: 'admin',
    group: true,
    private: false,

    async run(sock, message, args, ctx) {
        const { jid } = ctx;
        const sub = (args[0] || '').toLowerCase();

        const globalOn = config.ANTILINK;
        const groupOn  = global.antilinkGroups.has(jid);

        if (!sub) {
            const status = globalOn ? '✅ ON (global config)' : groupOn ? '✅ ON (this group)' : '❌ OFF';
            return sendButtons(sock, jid, {
                text:   `🔗 *Anti-Link Status*\n\nStatus: ${status}`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'antilink on',  text: '🟢 Enable' },
                    { id: 'antilink off', text: '🔴 Disable' },
                    { id: 'menu',         text: '📋 Main Menu' },
                ]
            });
        }

        if (sub === 'on') {
            global.antilinkGroups.add(jid);
            return sendButtons(sock, jid, {
                text:   '✅ *Anti-Link is ON*\n\nAny message containing a link will be automatically deleted.',
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'antilink off', text: '🔴 Turn OFF' },
                    { id: 'menu',         text: '📋 Main Menu' },
                ]
            });
        }

        if (sub === 'off') {
            global.antilinkGroups.delete(jid);
            return sendButtons(sock, jid, {
                text:   globalOn
                    ? '⚠️ Anti-link is *still active globally* (via config). Contact the bot owner to fully disable.'
                    : '❌ *Anti-Link is OFF* for this group.',
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'antilink on', text: '🟢 Turn ON' },
                    { id: 'menu',        text: '📋 Main Menu' },
                ]
            });
        }

        return sendButtons(sock, jid, {
            text:   'Usage: `.antilink on` or `.antilink off`',
            footer: '⚡ Powered by Silva MD',
            buttons: [
                { id: 'antilink on',  text: '🟢 Enable' },
                { id: 'antilink off', text: '🔴 Disable' },
            ]
        });
    }
};
