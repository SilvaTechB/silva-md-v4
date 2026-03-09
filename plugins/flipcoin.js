'use strict';
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['flip', 'coin', 'dice', 'roll'],
    description: 'Flip a coin or roll dice',
    usage:       '.flip  •  .dice  •  .dice 6  •  .roll 2d6',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const jid    = message.key.remoteJid;
        const rawCmd = ctx?.command || 'flip';

        if (rawCmd === 'flip' || rawCmd === 'coin') {
            const result = Math.random() < 0.5 ? 'HEADS 🪙' : 'TAILS 💿';
            return sendButtons(sock, jid, {
                text:   `🪙 *Coin Flip Result*\n\n${result}!`,
                footer: '⚡ Powered by Silva MD',
                buttons: [
                    { id: 'flip', text: '🪙 Flip Again' },
                    { id: 'dice', text: '🎲 Roll Dice' },
                    { id: 'menu', text: '📋 Main Menu' },
                ]
            });
        }

        let sides = 6, count = 1;
        const rollArg = args[0] || '';
        if (rollArg.toLowerCase().includes('d')) {
            const parts = rollArg.toLowerCase().split('d');
            count = Math.min(Math.max(parseInt(parts[0]) || 1, 1), 20);
            sides = Math.min(Math.max(parseInt(parts[1]) || 6, 2), 100);
        } else if (!isNaN(parseInt(rollArg))) {
            sides = Math.min(Math.max(parseInt(rollArg), 2), 100);
        }
        const rolls  = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
        const total  = rolls.reduce((a, b) => a + b, 0);
        await sendButtons(sock, jid, {
            text:   `🎲 *Dice Roll* (${count}d${sides})\n\n🎰 *Rolls:* ${rolls.join(', ')}${count > 1 ? `\n➕ *Total:* ${total}` : ''}`,
            footer: '⚡ Powered by Silva MD',
            buttons: [
                { id: `roll ${count}d${sides}`, text: `🎲 Roll ${count}d${sides} Again` },
                { id: 'flip', text: '🪙 Flip Coin' },
                { id: 'menu', text: '📋 Main Menu' },
            ]
        });
    }
};
