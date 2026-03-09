'use strict';

module.exports = {
    commands:    ['spp', 'profile', 'getpp'],
    description: 'Get a user\'s profile picture',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, isGroup, mentionedJid, contextInfo }) => {
        try {
            let user = sender;
            if (isGroup) {
                if (mentionedJid?.length) {
                    user = mentionedJid[0];
                } else {
                    const quoted = message.message?.extendedTextMessage?.contextInfo;
                    if (quoted?.participant) user = quoted.participant;
                }
            }

            const pp = await sock.profilePictureUrl(user, 'image').catch(() =>
                'https://files.catbox.moe/5uli5p.jpeg'
            );

            const name = user.split('@')[0];

            const { sendButtons } = require('gifted-btns');
            await sendButtons(sock, sender, {
                image:  { url: pp },
                text:   `🖼️ *Profile Picture*\n\n📱 *User:* +${name}`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'spp', text: '🔄 Get PP Again' },
                    { id: 'menu', text: '📋 Main Menu' },
                ]
            });
        } catch (err) {
            console.error('[GetPP]', err.message);
            await sock.sendMessage(sender, {
                text: "❌ Couldn't fetch profile picture. The user may not have one set.",
                contextInfo
            }, { quoted: message });
        }
    }
};
