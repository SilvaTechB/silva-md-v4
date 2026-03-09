'use strict';

module.exports = {
    commands:    ['antidelete', 'antidel'],
    description: 'Toggle anti-delete notifications for this group — admin only',
    permission:  'admin',
    group:       true,
    private:     false,
    run: async (sock, message, args, { jid, sender, isAdmin, isOwner, contextInfo }) => {
        const action = args[0]?.toLowerCase();
        await sock.sendMessage(sender, {
            text:
`🛡️ *Anti-Delete Info*

The anti-delete feature is managed globally from the bot's main settings (config.env).

• *ANTIDELETE_GROUP* — catches deleted messages in groups
• *ANTIDELETE_PRIVATE* — catches deleted messages in private chats

To change settings, update your config.env and restart the bot.

Current group anti-delete: ${process.env.ANTIDELETE_GROUP !== 'false' ? 'ENABLED' : 'DISABLED'}`,
            contextInfo
        }, { quoted: message });
    }
};
