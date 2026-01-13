const cron = require("node-cron");
const { TIMEZONE } = require("./config");
const { createTodayReportChannel } = require("./services/channelService");
const { runDailyCheck } = require("./services/reportService");

function startScheduler(client) {
  // 00:01 tạo channel cho ngày mới
  cron.schedule(
    "1 0 * * *",
    async () => {
      try {
        await createTodayReportChannel(client);
      } catch (e) {
        console.error("createTodayReportChannel error:", e);
      }
    },
    { timezone: TIMEZONE }
  );

  // 00:05 chốt ngày hôm qua
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
