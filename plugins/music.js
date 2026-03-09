'use strict';

const axios    = require('axios');
const ytSearch = require('yt-search');

const MUSIC_APIS = (link) => [
    `https://apis.davidcyriltech.my.id/download/ytmp3?url=${encodeURIComponent(link)}`,
    `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(link)}`,
    `https://api.akuari.my.id/downloader/youtubeaudio?link=${encodeURIComponent(link)}`
];

module.exports = {
    commands:    ['play'],
    description: 'Search and download a song from YouTube',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(sender, {
                text: '❌ What song do you want? Usage: `.play <song name>`',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(sender, {
            text: '🔄 Searching for your song...',
            contextInfo
        }, { quoted: message });

        const search = await ytSearch(query);
        if (!search.videos.length) {
            return sock.sendMessage(sender, {
                text: '❌ No results found. Try a different search.',
                contextInfo
            }, { quoted: message });
        }

        const video = search.videos[0];
        const link  = video.url;

        let audioUrl = null;
        let songData = null;

        for (const url of MUSIC_APIS(link)) {
            try {
                const { data } = await axios.get(url, { timeout: 20000 });
                if (data.status === 200 || data.success) {
                    audioUrl = data.result?.downloadUrl || data.url;
                    songData = {
                        title:     data.result?.title  || video.title,
                        artist:    data.result?.author || video.author?.name || 'Unknown',
                        thumbnail: data.result?.image  || video.thumbnail
                    };
                    break;
                }
            } catch (e) {
                console.error('[Music] API error:', e.message);
            }
        }

        if (!audioUrl) {
            return sock.sendMessage(sender, {
                text: '⚠️ All music APIs are down. Please try again later.',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(sender, {
            image:   { url: songData.thumbnail },
            caption: `🎶 *${songData.title}*\n🎤 *Artist:* ${songData.artist}\n\n_Powered by Silva MD_`,
            contextInfo
        }, { quoted: message });

        await sock.sendMessage(sender, {
            audio:    { url: audioUrl },
            mimetype: 'audio/mpeg',
            contextInfo
        }, { quoted: message });

        await sock.sendMessage(sender, {
            document: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${songData.title.replace(/[^\w\s]/g, '')}.mp3`,
            contextInfo
        }, { quoted: message });
    }
};
