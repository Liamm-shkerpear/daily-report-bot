const cron = require("node-cron");
const { TIMEZONE } = require("./config");
const { ensureTodayReportThread } = require("./services/channelService");
const { runDailyCheck } = require("./services/reportService");

function startScheduler(client) {
  // 🧵 00:01 — đảm bảo thread report cho ngày mới
  cron.schedule(
    "1 0 * * *",
    async () => {
      try {
        await ensureTodayReportThread(client);
      } catch (e) {
        console.error("ensureTodayReportThread error:", e);
      }
    },
    { timezone: TIMEZONE }
  );

  // ✅ 00:05 — check report của ngày hôm qua (trong thread)
  cron.schedule(
    "5 0 * * *",
    async () => {
      try {
        await runDailyCheck(client);
      } catch (e) {
        console.error("runDailyCheck error:", e);
      }
    },
    { timezone: TIMEZONE }
  );
}

module.exports = { startScheduler };
