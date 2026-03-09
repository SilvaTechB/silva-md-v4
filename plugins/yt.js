'use strict';

const ytdl = require('ytdl-core');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['yt', 'youtube'],
    description: 'Download a YouTube video',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !ytdl.validateURL(url)) {
            return sock.sendMessage(sender, {
                text: '🎬 Invalid YouTube URL!\nExample: .yt https://youtu.be/dQw4w9WgXcQ',
                contextInfo
            }, { quoted: message });
        }
        try {
            const info    = await ytdl.getInfo(url);
            const format  = ytdl.chooseFormat(info.formats, { quality: 'highest' });
            const details = info.videoDetails;

            await sock.sendMessage(sender, {
                video:   { url: format.url },
                caption:
`▶️ *${details.title}*
👤 ${details.author.name}  •  ⏱ ${Math.floor(details.lengthSeconds / 60)}m ${details.lengthSeconds % 60}s`,
                contextInfo
            }, { quoted: message });
            await sendButtons(sock, sender, {
                text:   `✅ *YouTube Download*\n\n🎬 ${details.title}\n👤 ${details.author.name}`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'play', text: '🎵 Download Audio (MP3)' },
                    { id: 'yt',   text: '▶️ Download Another' },
                    { id: 'menu', text: '📋 Main Menu' },
                ]
            });
        } catch (err) {
            console.error('[YT]', err.message);
            await sock.sendMessage(sender, {
                text: `❌ Failed to download video.\n${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
