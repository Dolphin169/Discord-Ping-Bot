const { Events } = require('discord.js');
const config = require('../config.json');

// Simple in-memory cooldown so one busy conversation doesn't spam pings.
// Resets if the bot restarts — fine for this use case, no DB needed.
let lastPingTimestamp = 0;

function containsKeyword(text, keywords, wholeWordOnly, caseSensitive) {
  const source = caseSensitive ? text : text.toLowerCase();

  return keywords.some((keyword) => {
    const term = caseSensitive ? keyword : keyword.toLowerCase();

    if (!wholeWordOnly) {
      return source.includes(term);
    }

    // \b word boundaries so "cat" doesn't match inside "category"
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escaped}\\b`, caseSensitive ? '' : 'i');
    return pattern.test(source);
  });
}

// Webhook messages (and most bot messages) often put their real text inside an
// embed rather than message.content. Pull everything searchable into one string.
function extractSearchableText(message) {
  const parts = [message.content];

  for (const embed of message.embeds) {
    if (embed.title) parts.push(embed.title);
    if (embed.description) parts.push(embed.description);
    if (embed.footer?.text) parts.push(embed.footer.text);
    if (embed.author?.name) parts.push(embed.author.name);
    for (const field of embed.fields ?? []) {
      if (field.name) parts.push(field.name);
      if (field.value) parts.push(field.value);
    }
  }

  return parts.filter(Boolean).join('\n');
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
      allowedWebhookIds = [],
    } = keywordWatcher;

    // Only watch the assigned channel
    if (message.channel.id !== channelId) return;

    // If the message came from a bot account, only allow it through if it's a
    // webhook on our whitelist. Otherwise, ignore bot messages to avoid feedback loops.
    if (message.author.bot) {
      const isAllowedWebhook = message.webhookId && allowedWebhookIds.includes(message.webhookId);
      if (!isAllowedWebhook) return;
    }

    if (!keywords || keywords.length === 0) return;

    const searchableText = extractSearchableText(message);
    const matched = containsKeyword(searchableText, keywords, matchWholeWordOnly, caseSensitive);
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