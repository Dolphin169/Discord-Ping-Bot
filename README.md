# Discord Bot

A slash-command Discord bot built with [discord.js](https://discord.js.org/) v14.

## Project structure

```
discord-bot/
├── commands/            # One file per slash command
│   └── ping.js
├── events/              # One file per Discord client event
│   ├── ready.js
│   └── interactionCreate.js
├── index.js             # Bot entry point — loads commands & events, logs in
├── deploy-commands.js   # Registers slash commands with Discord's API
├── .env.example         # Template for secrets — copy to .env
├── .gitignore
└── package.json
```

## Setup

1. **Create a Discord application**
   - Go to the [Discord Developer Portal](https://discord.com/developers/applications) → New Application.
   - Under **Bot**, click "Reset Token" and copy it — this is your `DISCORD_TOKEN`.
   - Under **General Information**, copy the **Application ID** — this is your `CLIENT_ID`.
   - Under **Bot**, make sure "Public Bot" is set how you want, and enable any **Privileged Gateway Intents** you'll need later (e.g. Message Content, Server Members).

2. **Invite the bot to a server**
   - Go to **OAuth2 → URL Generator**.
   - Scopes: check `bot` and `applications.commands`.
   - Bot Permissions: pick what your bot needs (start minimal, add more later).
   - Open the generated URL and add the bot to your test server.
   - Copy that server's ID (enable Developer Mode in Discord settings → right-click the server icon → Copy Server ID) — this is your `GUILD_ID`.

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then fill in `DISCORD_TOKEN`, `CLIENT_ID`, and `GUILD_ID` in `.env`.

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Register your slash commands**
   ```bash
   npm run deploy
   ```
   This pushes commands to your test server (`GUILD_ID`) — updates are instant.
   Once ready for production, register commands globally instead (see comment in `deploy-commands.js`).

6. **Start the bot**
   ```bash
   npm start
   ```

## Adding a new command

Create a new file in `commands/`, following the pattern in `ping.js`:

```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('yourcommand')
    .setDescription('What it does'),

  async execute(interaction) {
    await interaction.reply('Your response here');
  },
};
```

Then re-run `npm run deploy` so Discord knows about it.

## Adding a new event

Create a new file in `events/`, following the pattern in `ready.js` or `interactionCreate.js`. It's picked up automatically — no manual registration needed.

## Notes

- Guild commands (scoped to `GUILD_ID`) update instantly — best for development.
- Global commands can take up to an hour to propagate — best for production, once your bot is stable.
- Never commit your `.env` file — it's already in `.gitignore`.
