const { Events } = require('discord.js');
const config = require('../config.json');

// Simple in-memory cooldown so one busy conversation doesn't spam pings.
// Resets if the bot restarts — fine for this use case, no DB needed.
let lastPingTimestamp = 0;

function containsKeyword(content, keywords, wholeWordOnly, caseSensitive) {
  const text = caseSensitive ? content : content.toLowerCase();

  return keywords.some((keyword) => {
    const term = caseSensitive ? keyword : keyword.toLowerCase();

    if (!wholeWordOnly) {
      return text.includes(term);
    }

    // \b word boundaries so "cat" doesn't match inside "category"
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, caseSensitive ? '' : 'i');
    return pattern.test(text);
  });
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    const { keywordWatcher } = config;
    if (!keywordWatcher) return;

    const {
      channelId,
      keywords,
      matchWholeWordOnly = true,
      caseSensitive = false,
      pingTarget,
      roleId,
      cooldownSeconds = 30,
    } = keywordWatcher;

    // Ignore other bots (and this bot) to avoid feedback loops
    if (message.author.bot) return;

    // Only watch the assigned channel
    if (message.channel.id !== channelId) return;

    if (!keywords || keywords.length === 0) return;

    const matched = containsKeyword(message.content, keywords, matchWholeWordOnly, caseSensitive);
    if (!matched) return;

    // Cooldown check
    const now = Date.now();
    if (now - lastPingTimestamp < cooldownSeconds * 1000) return;

    let mentionText;
    let allowedMentions;

    if (pingTarget === 'everyone') {
      mentionText = '@everyone';
      allowedMentions = { parse: ['everyone'] };
    } else {
      if (!roleId || roleId === 'PUT_ROLE_ID_HERE') {
        console.warn('⚠️  keywordWatcher.roleId is not set in config.json — skipping ping.');
        return;
      }
      mentionText = `<@&${roleId}>`;
      allowedMentions = { roles: [roleId] };
    }

    lastPingTimestamp = now;

    await message.reply({
      content: `${mentionText} keyword detected in this channel.`,
      allowedMentions,
    });
  },
};