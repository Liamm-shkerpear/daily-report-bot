const { DateTime } = require("luxon");
const { runDailyCheck } = require("../services/reportService");
const { ensureTodayReportThread } = require("../services/channelService");
const { TIMEZONE } = require("../config");

async function handleSlashCommand(interaction, client) {
  if (!interaction.isChatInputCommand()) return;

  // ===== /today =====
  if (interaction.commandName === "today") {
    console.log("[SLASH /today] called by", interaction.user.tag);

    await interaction.deferReply({ ephemeral: true });

    const result = await ensureTodayReportThread(client);
    console.log("[SLASH /today] ensure result:", result);

    if (!result?.threadId) {
      console.error("[SLASH /today] missing threadId:", result);
      await interaction.editReply("⚠️ Không tìm thấy thread report hôm nay.");
      return;
    }

    await interaction.editReply(
      `📌 **Daily Report hôm nay**\n👉 Vào đây để report: <#${result.threadId}>`
    );
    return;
  }

  // ===== /recheck yyyy-mm-dd =====
  if (interaction.commandName === "recheck") {
    console.log("[SLASH /recheck] called by", interaction.user.tag);

    await interaction.deferReply({ ephemeral: true });

    const dateStr = interaction.options.getString("date");
    console.log("[SLASH /recheck] date:", dateStr);

    const day = DateTime.fromISO(dateStr, { zone: TIMEZONE });
    if (!day.isValid) {
      await interaction.editReply("❌ Ngày không hợp lệ. Dùng format yyyy-mm-dd.");
      return;
    }

    await runDailyCheck(client, day.toISODate());

    await interaction.editReply(
      `✅ Đã recheck daily report cho **${day.toFormat("d-M-yyyy")}**.\nXem kết quả trong kênh punish.`
    );
  }
}

module.exports = { handleSlashCommand };
