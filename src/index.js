const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { DISCORD_TOKEN } = require("./config");
const { startScheduler } = require("./scheduler");
const { catchUpIfMissed } = require("./services/catchupService");
const { catchUpCreateThreadIfMissed } = require("./services/channelService");
const { handleSlashCommand } = require("./handlers/slashHandler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    // ❌ KHÔNG cần GuildMembers cho logic report bằng thread
  ],
  partials: [Partials.Channel, Partials.Message],
});

// log lỗi để không crash im lặng
client.on("error", console.error);
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // 1️⃣ Start cron jobs
  startScheduler(client);

  // 2️⃣ Ensure thread report cho hôm nay
  await catchUpCreateThreadIfMissed(client);

  // 3️⃣ Check bù các ngày bị miss (theo checkedAt)
  await catchUpIfMissed(client);
});

client.on("interactionCreate", async (interaction) => {
  try {
    await handleSlashCommand(interaction, client);
  } catch (err) {
    console.error("Slash command error:", err);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("❌ Có lỗi xảy ra.");
    }
  }
});

client.login(DISCORD_TOKEN);
