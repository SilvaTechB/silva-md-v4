'use strict';

const axios = require('axios');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['shorten'],
    description: 'Shorten a URL using TinyURL',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        if (!args[0]) {
            return sock.sendMessage(sender, {
                text: '❌ Usage: .shorten <url>',
                contextInfo
            }, { quoted: message });
        }
        try {
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(args[0])}`);
            await sendButtons(sock, sender, {
                text:   `🔗 *Shortened URL*\n\n${res.data}`,
                footer: '⚡ Powered by TinyURL via Silva MD',
                buttons: [
                    { id: 'shorten', text: '🔗 Shorten Another' },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({ display_text: '🌐 Open Link', url: res.data })
                    },
                    { id: 'menu', text: '📋 Main Menu' },
                ]
            });
        } catch {
            await sock.sendMessage(sender, {
                text: '❌ Failed to shorten URL.',
                contextInfo
            }, { quoted: message });
        }
    }
};
