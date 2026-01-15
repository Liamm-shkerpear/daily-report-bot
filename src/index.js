const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { DISCORD_TOKEN } = require("./config");
const { startScheduler } = require("./scheduler");
const { catchUpIfMissed } = require("./services/catchupService");
const { catchUpCreateChannelIfMissed } = require("./services/channelService");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

// log lỗi để không crash im lặng
client.on("error", console.error);
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  startScheduler(client);

  // 1) đảm bảo hôm nay có channel
  await catchUpCreateChannelIfMissed(client);

  // 2) chạy bù check hôm qua nếu lỡ off
  await catchUpIfMissed(client);
});

client.login(DISCORD_TOKEN);
