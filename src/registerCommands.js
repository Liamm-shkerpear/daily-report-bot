const { REST, Routes, SlashCommandBuilder } = require("discord.js");
const { DISCORD_TOKEN, GUILD_ID } = require("./config");

const commands = [
  new SlashCommandBuilder()
    .setName("today")
    .setDescription("Jump to today’s daily report thread"),

  new SlashCommandBuilder()
    .setName("recheck")
    .setDescription("Recheck daily report for a specific date")
    .addStringOption((opt) =>
      opt
        .setName("date")
        .setDescription("Date in format yyyy-mm-dd")
        .setRequired(true)
    ),
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("Slash commands registered.");
  } catch (err) {
    console.error(err);
  }
})();
