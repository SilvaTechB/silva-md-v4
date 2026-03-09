'use strict';

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    commands:    ['vv', 'antivv', 'avv', 'viewonce', 'open', 'openphoto', 'openvideo', 'vvphoto'],
    description: 'View once media opener — owner only',
    permission:  'owner',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        await sock.sendMessage(sender, { react: { text: '😃', key: message.key } });

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            await sock.sendMessage(sender, { react: { text: '😊', key: message.key } });
            return sock.sendMessage(sender, {
                text: '*Reply to a view-once photo/video/audio with this command to open it.*',
                contextInfo
            }, { quoted: message });
        }

        let type = null;
        const keys = Object.keys(quoted);
        for (const k of ['imageMessage', 'videoMessage', 'audioMessage']) {
            if (keys.includes(k)) { type = k; break; }
        }

        if (!type) {
            await sock.sendMessage(sender, { react: { text: '🥺', key: message.key } });
            return sock.sendMessage(sender, {
                text: '❌ Reply to an *image, video, or audio* message.',
                contextInfo
            }, { quoted: message });
        }

        try {
            const msgContent = quoted[type];
            const stream = await downloadContentFromMessage(msgContent, type.replace('Message', ''));
            let buffer = Buffer.alloc(0);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            if (type === 'imageMessage') {
                await sock.sendMessage(sender, {
                    image:    buffer,
                    caption:  msgContent?.caption || '',
                    mimetype: msgContent?.mimetype || 'image/jpeg'
                }, { quoted: message });
            } else if (type === 'videoMessage') {
                await sock.sendMessage(sender, {
                    video:    buffer,
                    caption:  msgContent?.caption || '',
                    mimetype: msgContent?.mimetype || 'video/mp4'
                }, { quoted: message });
            } else if (type === 'audioMessage') {
                await sock.sendMessage(sender, {
                    audio:    buffer,
                    mimetype: msgContent?.mimetype || 'audio/mp4',
                    ptt:      msgContent?.ptt || false
                }, { quoted: message });
            }

            await sock.sendMessage(sender, { react: { text: '😍', key: message.key } });
        } catch (err) {
            console.error('[ViewOnce]', err.message);
            await sock.sendMessage(sender, { react: { text: '😔', key: message.key } });
            await sock.sendMessage(sender, {
                text: `❌ Failed to open media: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
