'use strict';

const { sendButtons } = require('gifted-btns');
const THUMB = 'https://files.catbox.moe/5uli5p.jpeg';

module.exports = {
    commands:    ['getjid', 'jid'],
    description: 'Get the JID of the current chat',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, jid, contextInfo }) => {
        try {
            const type = jid.endsWith('@g.us')
                ? 'Group'
                : jid.endsWith('@newsletter')
                    ? 'Channel (Newsletter)'
                    : 'Private Chat';

            const caption =
`┏━━━━━━━━━━━━━━━┓
      ✦ *Silva MD JID Fetch* ✦
┗━━━━━━━━━━━━━━━┛

🔹 *Chat JID:* \`${jid}\`
🔹 *Your JID:* \`${sender}\`
🔹 *Type:* ${type}

✨ _Powered by Silva Tech Inc_`;

            await sendButtons(sock, sender, {
                image:  { url: THUMB },
                text:   caption,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'getjid', text: '🔄 Get JID Again' },
                    { id: 'ping',   text: '🏓 Ping Bot' },
                    { id: 'menu',   text: '📋 Main Menu' },
                ]
            });
        } catch (err) {
            console.error('[GetJID]', err.message);
            await sock.sendMessage(sender, {
                text: '⚠️ Failed to fetch JID.',
                contextInfo
            }, { quoted: message });
        }
    }
};
