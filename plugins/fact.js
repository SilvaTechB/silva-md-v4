'use strict';
const axios = require('axios');
const { sendButtons } = require('gifted-btns');

module.exports = {
    commands:    ['fact', 'facts', 'funfact'],
    description: 'Get a random interesting fact',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const jid = message.key.remoteJid;
        let fact;
        try {
            const res = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random', { params: { language: 'en' }, timeout: 8000 });
            fact = res.data?.text;
            if (!fact) throw new Error('empty');
        } catch {
            const fallbacks = [
                "Honey never spoils — edible honey has been found in 3,000-year-old Egyptian tombs.",
                "A group of flamingos is called a 'flamboyance'.",
                "Bananas are curved because they grow towards the sun.",
                "The Eiffel Tower can be 15 cm taller in summer due to metal expansion.",
                "Octopuses have three hearts and blue blood.",
                "Sharks are older than trees — they've existed for over 400 million years.",
            ];
            fact = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
        await sendButtons(sock, jid, {
            text:   `🧠 *Random Fact*\n\n💡 ${fact}`,
            footer: '⚡ Powered by Silva MD',
            buttons: [
                { id: 'fact',  text: '🧠 Another Fact' },
                { id: 'quote', text: '💬 Get a Quote' },
                { id: 'menu',  text: '📋 Main Menu' },
            ]
        });
    }
};
