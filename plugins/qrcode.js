'use strict';

const axios = require('axios');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['qrcode', 'qr'],
    description: 'Generate a QR code for any text or URL',
    usage:       '.qr <text or URL>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.qr <text or URL>\`\n\n_Examples:_\n• \`.qr https://silvatech.co.ke\`\n• \`.qr Hello World\`\n• \`.qr +254700000000\``,
                contextInfo
            }, { quoted: message });
        }

        const content = args.join(' ');
        const encoded = encodeURIComponent(content);
        const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encoded}&color=000000&bgcolor=ffffff&margin=20`;

        try {
            const res = await axios.get(qrUrl, { responseType: 'arraybuffer', timeout: 15000 });
            const buffer = Buffer.from(res.data);

            await sendButtons(sock, jid, {
                image:  buffer,
                text:   `✅ *QR Code Generated*\n\n📝 *Content:* ${content.length > 80 ? content.slice(0, 77) + '...' : content}`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'qr', text: '📱 Generate Another QR' },
                    { id: 'menu', text: '📋 Main Menu' },
                ]
            });

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Failed to generate QR code: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
