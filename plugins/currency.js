'use strict';
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['currency', 'convert', 'rate'],
    description: 'Convert between currencies',
    usage:       '.currency <amount> <FROM> <TO>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (args.length < 3) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:* \`.currency <amount> <FROM> <TO>\`\n_Examples:_\n• \`.currency 100 USD KES\`\n• \`.currency 50 EUR GBP\``,
                contextInfo
            }, { quoted: message });
        }
        const amount = parseFloat(args[0]);
        const from   = args[1].toUpperCase();
        const to     = args[2].toUpperCase();
        if (isNaN(amount) || amount <= 0) {
            return sock.sendMessage(jid, { text: `❌ Invalid amount.`, contextInfo }, { quoted: message });
        }
        try {
            const res  = await axios.get('https://api.frankfurter.app/latest', { params: { amount, from, to }, timeout: 8000 });
            const rate = res.data.rates[to];
            if (!rate) throw new Error(`Currency "${to}" not found`);
            await sendButtons(sock, jid, {
                text:   `💱 *Currency Conversion*\n\n💵 *${amount.toLocaleString()} ${from}* → *${rate.toLocaleString()} ${to}*\n\n📅 _Rate as of ${res.data.date}_`,
                footer: '⚡ Powered by Frankfurter API',
                buttons: [
                    { id: `currency 100 ${from} ${to}`, text: `🔄 Convert 100 ${from}→${to}` },
                    { id: `currency ${amount} ${to} ${from}`, text: `↩️ Reverse` },
                    { id: 'menu', text: '📋 Main Menu' },
                ]
            });
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Conversion failed: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
