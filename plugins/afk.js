'use strict';

const afkStore = new Map();

function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

module.exports = {
    commands:    ['afk', 'back', 'afklist'],
    description: 'Set or clear your AFK status; notify when AFK users are mentioned',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, sender, contextInfo, safeSend, mentionedJid }) => {
        const command = (message.message?.conversation || message.message?.extendedTextMessage?.text || '')
            .trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        if (command === 'afk') {
            const reason = args.join(' ') || 'No reason given';
            afkStore.set(sender, { since: Date.now(), reason });
            await safeSend({ text: `🌙 You are now AFK.\n📝 Reason: ${reason}`, contextInfo }, { quoted: message });
            return;
        }

        if (command === 'back') {
            const data = afkStore.get(sender);
            if (!data) {
                await safeSend({ text: "You weren't AFK.", contextInfo }, { quoted: message });
                return;
            }
            afkStore.delete(sender);
            const duration = formatDuration(Date.now() - data.since);
            await safeSend({ text: `🌸 Welcome back! You were away for *${duration}*.`, contextInfo }, { quoted: message });
            return;
        }

        if (command === 'afklist') {
            if (afkStore.size === 0) {
                await safeSend({ text: '🌼 No one is AFK right now.', contextInfo }, { quoted: message });
                return;
            }
            let list = '🌿 *AFK Users:*\n\n';
            for (const [id, data] of afkStore) {
                const duration = formatDuration(Date.now() - data.since);
                list += `• @${id.split('@')[0]} — ${data.reason} _(${duration})_\n`;
            }
            await safeSend({ text: list, contextInfo, mentions: [...afkStore.keys()] }, { quoted: message });
        }
    },

    onMessage: async (sock, message, text, { jid, sender, contextInfo, safeSend, mentionedJid }) => {
        if (!mentionedJid?.length) return;
        for (const jidMentioned of mentionedJid) {
            const data = afkStore.get(jidMentioned);
            if (data) {
                const duration = formatDuration(Date.now() - data.since);
                await safeSend({
                    text: `🌙 @${jidMentioned.split('@')[0]} is AFK\n📝 Reason: ${data.reason}\n⏱ Away for: ${duration}`,
                    contextInfo,
                    mentions: [jidMentioned]
                }, { quoted: message });
            }
        }
    }
};
