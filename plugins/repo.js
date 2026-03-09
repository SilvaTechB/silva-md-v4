'use strict';

const axios  = require('axios');
const moment = require('moment-timezone');

module.exports = {
    commands:    ['repo', 'repository', 'github'],
    description: 'Show Silva MD GitHub repository info',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const loading = await sock.sendMessage(sender, {
            text: '🔄 Fetching repository details...',
            contextInfo
        }, { quoted: message });

        try {
            const { data } = await axios.get(
                'https://api.github.com/repos/SilvaTechB/silva-md-bot',
                { timeout: 10000 }
            );

            if (loading) await sock.sendMessage(sender, { delete: loading.key });

            const info =
`*✨ SILVA MD BOT REPOSITORY*

📦 *Repo:* [${data.name}](${data.html_url})
📝 *Description:* ${data.description || 'N/A'}

🌟 *Stars:* ${data.stargazers_count}
🍴 *Forks:* ${data.forks_count}
💻 *Language:* ${data.language || 'Unknown'}
📦 *Size:* ${(data.size / 1024).toFixed(1)} MB
📜 *License:* ${data.license?.name || 'None'}
⚠️ *Open Issues:* ${data.open_issues}
🕒 *Last Updated:* ${moment(data.updated_at).fromNow()}

⚡ _Powered by Silva Tech Inc_`;

            await sock.sendMessage(sender, {
                image:   { url: 'https://files.catbox.moe/5uli5p.jpeg' },
                caption: info,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title:               'GitHub Repository',
                        body:                'Explore the codebase!',
                        thumbnailUrl:        'https://files.catbox.moe/5uli5p.jpeg',
                        sourceUrl:           data.html_url,
                        mediaType:           1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: message });
        } catch (err) {
            console.error('[Repo]', err.message);
            await sock.sendMessage(sender, {
                text: '❌ Failed to fetch repo details.',
                contextInfo
            }, { quoted: message });
        }
    }
};
