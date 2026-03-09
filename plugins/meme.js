'use strict';
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['meme', 'memes'],
    description: 'Get a random meme image',
    usage:       '.meme [subreddit]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        const sub = args[0] || 'memes';
        try {
            const res = await axios.get(`https://meme-api.com/gimme/${encodeURIComponent(sub)}`, { timeout: 10000 });
            const { title, url, author, subreddit, ups } = res.data;
            if (!url) throw new Error('No meme URL');
            await sendButtons(sock, jid, {
                image:  { url },
                text:   `😂 *${title}*\n\n👤 u/${author}  •  r/${subreddit}  •  👍 ${ups?.toLocaleString() || '?'}`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'meme', text: '😂 New Meme' },
                    { id: 'meme dankmemes', text: '🔥 Dank Meme' },
                    { id: 'menu', text: '📋 Main Menu' },
                ]
            });
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Couldn't fetch a meme: ${err.message}\n\nTry: \`.meme\` or \`.meme dankmemes\``,
                contextInfo
            }, { quoted: message });
        }
    }
};
