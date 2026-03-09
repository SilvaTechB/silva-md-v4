'use strict';

const axios = require('axios');
const { sendButtons } = require('gifted-btns');
const OWM_KEY = '060a6bcfa19809c2cd4d97a212b19273';

module.exports = {
    commands:    ['weather', 'climate', 'mosam'],
    description: 'Get current weather for a location',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        if (!args.length) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a location.\nExample: .weather Nairobi',
                contextInfo
            }, { quoted: message });
        }

        const location = args.join(' ');
        const loading  = await sock.sendMessage(sender, {
            text: '⏳ Fetching weather data...',
            contextInfo
        }, { quoted: message });

        try {
            const { data } = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${OWM_KEY}`,
                { timeout: 10000 }
            );

            const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;

            if (loading) await sock.sendMessage(sender, { delete: loading.key });

            await sendButtons(sock, sender, {
                image:  { url: iconUrl },
                text:
                    `🌍 *${data.name}, ${data.sys.country} — Weather*\n\n` +
                    `🌡️ Temp: *${data.main.temp}°C*  (min ${data.main.temp_min}° / max ${data.main.temp_max}°)\n` +
                    `💧 Humidity: ${data.main.humidity}%\n` +
                    `💨 Wind: ${data.wind.speed} km/h\n` +
                    `🌤️ ${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)}`,
                footer: '⚡ Powered by OpenWeatherMap',
                buttons: [
                    { id: `weather ${location}`, text: `🔄 Refresh ${location}` },
                    { id: 'weather Nairobi',     text: '🇰🇪 Nairobi' },
                    { id: 'menu',                text: '📋 Main Menu' },
                ]
            });
        } catch (err) {
            console.error('[Weather]', err.message);
            const msg = err.response?.status === 404
                ? '❌ Location not found. Please check the name.'
                : '❌ Failed to fetch weather. Try again later.';
            await sock.sendMessage(sender, { text: msg, contextInfo }, { quoted: message });
        }
    }
};
