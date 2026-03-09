'use strict';
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['imagine', 'generate', 'aiimage', 'img'],
    description: 'Generate an AI image from a text prompt',
    usage:       '.imagine <description>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.imagine <description>\`\n\n_Examples:_\n• \`.imagine a lion wearing a gold crown\`\n• \`.imagine futuristic city at night, neon lights\``,
                contextInfo
            }, { quoted: message });
        }
        const prompt = args.join(' ');
        await sock.sendMessage(jid, {
            text: `🎨 _Generating:_ "*${prompt}*"\n\n⏳ _Please wait..._`,
            contextInfo
        }, { quoted: message });
        try {
            const seed   = Math.floor(Math.random() * 999999);
            const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
            const res    = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 60000 });
            await sendButtons(sock, jid, {
                image:  Buffer.from(res.data),
                text:   `🎨 *AI Generated Image*\n\n📝 *Prompt:* ${prompt}`,
                footer: '⚡ Powered by Pollinations AI',
                buttons: [
                    { id: `imagine ${prompt}`, text: '🔄 Regenerate' },
                    { id: 'imagine',           text: '🎨 New Prompt' },
                    { id: 'menu',              text: '📋 Main Menu' },
                ]
            });
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ Image generation failed: ${err.message}`, contextInfo }, { quoted: message });
        }
    }
};
