'use strict';
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['lyrics', 'lyric'],
    description: 'Search song lyrics by artist and title',
    usage:       '.lyrics <artist> - <song>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.lyrics <artist> - <song>\`\n\n_Example:_ \`.lyrics Drake - God's Plan\``,
                contextInfo
            }, { quoted: message });
        }
        const query  = args.join(' ');
        const sep    = query.includes(' - ') ? query.split(' - ') : [null, query];
        const artist = sep[0]?.trim() || 'unknown';
        const title  = sep[1]?.trim() || sep[0]?.trim() || query;

        try {
            const res  = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`, { timeout: 12000 });
            const raw  = res.data?.lyrics;
            if (!raw) throw new Error('Not found');
            const lyrics  = raw.trim().slice(0, 3500);
            const trunc   = raw.length > 3500 ? '\n_[…truncated]_' : '';
            await sendButtons(sock, jid, {
                text:   `🎵 *${title}* — ${artist}\n\n${lyrics}${trunc}`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'lyrics', text: '🎵 Search Lyrics' },
                    { id: 'play',   text: '▶️ Play Song' },
                    { id: 'menu',   text: '📋 Main Menu' },
                ]
            });
        } catch {
            await sock.sendMessage(jid, {
                text: `❌ Lyrics not found for *"${title}"* by *${artist}*.\n\nFormat: \`.lyrics Artist - Song Title\``,
                contextInfo
            }, { quoted: message });
        }
    }
};
