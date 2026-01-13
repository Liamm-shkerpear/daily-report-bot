const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { DISCORD_TOKEN } = require("./config");
const { startScheduler } = require("./scheduler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent, // optional
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  startScheduler(client);
});

client.login(DISCORD_TOKEN);
