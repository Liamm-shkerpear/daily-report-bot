const { DateTime } = require("luxon");
const { fetchAllMessagesInChannel } = require("../utils/discordFetch");
const { buildReportThreadNames } = require("../utils/nameFormat");
const { loadDB, saveDB } = require("../utils/storage");
const {
  GUILD_ID,
  PUNISH_CHANNEL_ID,
  REPORT_CHANNEL_ID,
  TIMEZONE,
  TEAM_USER_IDS,
} = require("../config");

async function findReportThread(reportChannel, targetDay) {
  const possibleNames = buildReportThreadNames(targetDay);

  // 1) active cache
  let thread =
    reportChannel.threads?.cache?.find((t) => possibleNames.includes(t.name)) || null;

  // 2) active fetch
  if (!thread) {
    const active = await reportChannel.threads.fetchActive();
    thread = active.threads.find((t) => possibleNames.includes(t.name)) || null;
  }

  // 3) archived fetch (public)
  if (!thread) {
    const archived = await reportChannel.threads.fetchArchived({ type: "public" });
    thread = archived.threads.find((t) => possibleNames.includes(t.name)) || null;
  }

  return { thread, possibleNames };
}

async function runDailyCheck(client, targetISODate = null) {
  const guild = await client.guilds.fetch(GUILD_ID);

  // ❗ bỏ guild.members.fetch() để tránh rate limit (không cần cho logic này)
  const punishChannel = await guild.channels.fetch(PUNISH_CHANNEL_ID);
  const reportChannel = await guild.channels.fetch(REPORT_CHANNEL_ID);

  const now = DateTime.now().setZone(TIMEZONE);

  const targetDay = targetISODate
    ? DateTime.fromISO(targetISODate).setZone(TIMEZONE).startOf("day")
    : now.minus({ days: 1 }).startOf("day");

  const dayStart = targetDay;
  const dayEnd = targetDay.endOf("day");

  const lateStart = targetDay.plus({ days: 1 }).startOf("day");
  const lateEnd = targetDay.plus({ days: 1 }).endOf("day");

  if (!TEAM_USER_IDS || TEAM_USER_IDS.length === 0) {
    await punishChannel.send(`⚠️ TEAM_USER_IDS đang rỗng.`);
    return;
  }

  const { thread: reportThread, possibleNames } = await findReportThread(reportChannel, targetDay);

  if (!reportThread) {
    await punishChannel.send(
      `⚠️ Không tìm thấy thread report ngày ${targetDay.toFormat("d-M-yyyy")} trong <#${REPORT_CHANNEL_ID}>.\nĐang tìm: ${possibleNames
        .map((n) => `\`${n}\``)
        .join(", ")}`
    );
    return;
  }

  const msgsOnTime = await fetchAllMessagesInChannel(
    reportThread,
    dayStart.toMillis(),
    dayEnd.toMillis()
  );

  const msgsLate = await fetchAllMessagesInChannel(
    reportThread,
    lateStart.toMillis(),
    lateEnd.toMillis()
  );

  const onTimeSet = new Set(
    msgsOnTime.map((m) => m.author.id).filter((id) => TEAM_USER_IDS.includes(id))
  );

  const lateSet = new Set(
    msgsLate.map((m) => m.author.id).filter((id) => TEAM_USER_IDS.includes(id))
  );

  const missing = TEAM_USER_IDS.filter((id) => !onTimeSet.has(id) && !lateSet.has(id));
  const late = TEAM_USER_IDS.filter((id) => lateSet.has(id) && !onTimeSet.has(id));

  const db = loadDB();
  db.days = db.days || {};
  const key = targetDay.toISODate();

  db.days[key] = {
    ...(db.days[key] || {}),
    threadId: reportThread.id,
    threadName: reportThread.name,
    dateLabel: targetDay.toFormat("d-M-yyyy"),
    missing,
    late,
    checkedAt: now.toISO(),
  };

  saveDB(db);

  const missingMentions = missing.length ? missing.map((id) => `<@${id}>`).join(", ") : "Không có ✅";
  const lateMentions = late.length ? late.map((id) => `<@${id}>`).join(", ") : "Không có ✅";

  await punishChannel.send(
    [
      `📌 **Daily Report Check — ${targetDay.toFormat("d-M-yyyy")}**`,
      `Thread: <#${reportThread.id}> (trong <#${REPORT_CHANNEL_ID}>)`,
      ``,
      `❌ **Chưa report (${missing.length})**: ${missingMentions}`,
      `⏰ **Report trễ (${late.length})**: ${lateMentions}`,
    ].join("\n")
  );
}

module.exports = { runDailyCheck };
