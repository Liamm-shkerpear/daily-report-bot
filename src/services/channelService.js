const { DateTime } = require("luxon");
const { buildTodayChannelName } = require("../utils/nameFormat");
const { DAILY_CATEGORY_ID, PUNISH_CHANNEL_ID, TIMEZONE, GUILD_ID } = require("../config");

async function createTodayReportChannel(client) {
  const guild = await client.guilds.fetch(GUILD_ID);
  const punishChannel = await guild.channels.fetch(PUNISH_CHANNEL_ID);

  const now = DateTime.now().setZone(TIMEZONE);
  const today = now.startOf("day");

  const channelName = buildTodayChannelName(today);

  // check trùng
  const channels = await guild.channels.fetch();
  const exists = channels.find(
    (ch) => ch && ch.type === 0 && ch.parentId === DAILY_CATEGORY_ID && ch.name === channelName
  );
  if (exists) return;

  const newChannel = await guild.channels.create({
    name: channelName,
    type: 0, // GuildText
    parent: DAILY_CATEGORY_ID,
    topic: `Daily report for ${today.toFormat("d-M-yyyy")} (created by bot at ${now.toFormat("HH:mm")})`,
  });

  await newChannel.send(
    [
      `📌 **Daily Report — ${today.toFormat("d-M-yyyy")}**`,
      `Mọi người viết report trong ngày tại đây.`,
      ``,
      `A. Investigation done today`,
      `B. Gaps identified`,
      `C. Clarifications achieved`,
      `D. Next actions`,
    ].join("\n")
  );

  await punishChannel.send(`✅ Đã tạo kênh report mới: <#${newChannel.id}>`);
}

module.exports = { createTodayReportChannel };
