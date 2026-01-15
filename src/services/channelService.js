const { DateTime } = require("luxon");
const { buildTodayChannelName } = require("../utils/nameFormat");
const { DAILY_CATEGORY_ID, PUNISH_CHANNEL_ID, TIMEZONE, GUILD_ID } = require("../config");
const { loadDB, saveDB } = require("../utils/storage");

async function createTodayReportChannel(client) {
  const guild = await client.guilds.fetch(GUILD_ID);
  const punishChannel = await guild.channels.fetch(PUNISH_CHANNEL_ID);

  const now = DateTime.now().setZone(TIMEZONE);
  const today = now.startOf("day");
  const channelName = buildTodayChannelName(today);

  const channels = await guild.channels.fetch();
  const exists = channels.find(
    (ch) => ch && ch.type === 0 && ch.parentId === DAILY_CATEGORY_ID && ch.name === channelName
  );

  // 🔴 QUAN TRỌNG: nếu đã có, trả về channel đó
  if (exists) return exists;

  const newChannel = await guild.channels.create({
    name: channelName,
    type: 0,
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

  // 🔴 QUAN TRỌNG: luôn return
  return newChannel;
}

// catch-up nếu hôm nay chưa có channel thì tạo
async function catchUpCreateChannelIfMissed(client) {
  const guild = await client.guilds.fetch(GUILD_ID);
  const now = DateTime.now().setZone(TIMEZONE);
  const today = now.startOf("day");
  const key = today.toISODate();
  const channelName = buildTodayChannelName(today);

  const db = loadDB();

  const channels = await guild.channels.fetch();
  const exists = channels.find(
    (ch) => ch && ch.type === 0 && ch.parentId === DAILY_CATEGORY_ID && ch.name === channelName
  );

  if (exists) {
    db.days[key] = db.days[key] || { dateLabel: today.toFormat("d-M-yyyy") };
    db.days[key].createdChannelId = exists.id;
    db.days[key].channelName = exists.name;
    db.days[key].channelEnsuredAt = now.toISO();
    saveDB(db);

    return { created: false, channelId: exists.id };
  }

  // chưa có → tạo
  const newCh = await createTodayReportChannel(client);

  if (!newCh) {
    throw new Error("createTodayReportChannel returned undefined");
  }

  db.days[key] = db.days[key] || { dateLabel: today.toFormat("d-M-yyyy") };
  db.days[key].createdChannelId = newCh.id;
  db.days[key].channelName = newCh.name;
  db.days[key].channelEnsuredAt = now.toISO();
  saveDB(db);

  return { created: true, channelId: newCh.id };
}

module.exports = { createTodayReportChannel, catchUpCreateChannelIfMissed };
