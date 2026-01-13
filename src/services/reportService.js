const { DateTime } = require("luxon");
const { fetchAllMessagesInChannel } = require("../utils/discordFetch");
const { buildReportChannelNames } = require("../utils/nameFormat");
const { loadDB, saveDB } = require("../utils/storage");
const {
  GUILD_ID,
  PUNISH_CHANNEL_ID,
  DAILY_CATEGORY_ID,
  TIMEZONE,
  TEAM_USER_IDS,
} = require("../config");

async function runDailyCheck(client) {
  const guild = await client.guilds.fetch(GUILD_ID);
  await guild.members.fetch();

  const punishChannel = await guild.channels.fetch(PUNISH_CHANNEL_ID);

  const now = DateTime.now().setZone(TIMEZONE);
  const targetDay = now.minus({ days: 1 }).startOf("day");

  const dayStart = targetDay;
  const dayEnd = targetDay.endOf("day");

  // late: chỉ cần >= 00:00 hôm nay là late (tới hết ngày)
  const lateStart = targetDay.plus({ days: 1 }).startOf("day");
  const lateEnd = targetDay.plus({ days: 1 }).endOf("day");

  // tìm channel hôm qua
  const possibleNames = buildReportChannelNames(targetDay);
  const channels = await guild.channels.fetch();

  const reportChannel = channels.find(
    (ch) =>
      ch && ch.type === 0 && ch.parentId === DAILY_CATEGORY_ID && possibleNames.includes(ch.name)
  );

  if (!reportChannel) {
    await punishChannel.send(
      `⚠️ Không tìm thấy kênh report ngày ${targetDay.toFormat("d-M-yyyy")}.\nĐang tìm: ${possibleNames
        .map((n) => `\`${n}\``)
        .join(", ")}`
    );
    return;
  }

  if (!TEAM_USER_IDS || TEAM_USER_IDS.length === 0) {
    await punishChannel.send(`⚠️ TEAM_USER_IDS đang rỗng. Hãy điền danh sách userId cố định trong src/config.js`);
    return;
  }

  // fetch messages
  const msgsOnTime = await fetchAllMessagesInChannel(
    reportChannel,
    dayStart.toMillis(),
    dayEnd.toMillis()
  );
  const msgsLate = await fetchAllMessagesInChannel(
    reportChannel,
    lateStart.toMillis(),
    lateEnd.toMillis()
  );

  const onTimeSet = new Set(
    msgsOnTime.map((m) => m.author.id).filter((id) => TEAM_USER_IDS.includes(id))
  );
  const lateSet = new Set(
    msgsLate.map((m) => m.author.id).filter((id) => TEAM_USER_IDS.includes(id))
  );

  // ưu tiên late => không missing
  const missing = TEAM_USER_IDS.filter((id) => !onTimeSet.has(id) && !lateSet.has(id));
  const late = TEAM_USER_IDS.filter((id) => lateSet.has(id) && !onTimeSet.has(id));

  // lưu DB
  const db = loadDB();
  const key = targetDay.toISODate();
  db.days[key] = {
    channelId: reportChannel.id,
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
      `Kênh: <#${reportChannel.id}>`,
      ``,
      `❌ **Chưa report (${missing.length})**: ${missingMentions}`,
      `⏰ **Report trễ (${late.length})**: ${lateMentions}`,
    ].join("\n")
  );
}

module.exports = { runDailyCheck };
