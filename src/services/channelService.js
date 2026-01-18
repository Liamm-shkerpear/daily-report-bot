const { DateTime } = require("luxon");
const { buildTodayThreadName } = require("../utils/nameFormat");
const {
  PUNISH_CHANNEL_ID,
  TIMEZONE,
  GUILD_ID,
  REPORT_CHANNEL_ID,
} = require("../config");
const { loadDB, saveDB } = require("../utils/storage");

// Tạo / đảm bảo thread report cho hôm nay
async function ensureTodayReportThread(client) {
  console.log("[THREAD] ensureTodayReportThread called");

  const guild = await client.guilds.fetch(GUILD_ID);
  const punishChannel = await guild.channels.fetch(PUNISH_CHANNEL_ID);
  const reportChannel = await guild.channels.fetch(REPORT_CHANNEL_ID);

  console.log(
    "[THREAD] reportChannel:",
    reportChannel.id,
    reportChannel.name,
    reportChannel.type
  );

  const now = DateTime.now().setZone(TIMEZONE);
  const today = now.startOf("day");
  const key = today.toISODate();
  const threadName = buildTodayThreadName(today);

  console.log("[THREAD] today:", today.toISODate());
  console.log("[THREAD] expected threadName:", threadName);

  const db = loadDB();
  db.days = db.days || {};

  // Nếu DB đã có threadId
  if (db.days[key]?.threadId) {
    console.log("[THREAD] found in DB:", db.days[key].threadId);
    return {
      ensured: true,
      threadId: db.days[key].threadId,
      threadName: db.days[key].threadName,
      created: false,
    };
  }

  // 1) tìm trong cache
  let thread =
    reportChannel.threads?.cache?.find((t) => t.name === threadName) || null;

  if (thread) {
    console.log("[THREAD] found in cache:", thread.id);
  }

  // 2) fetch active threads
  if (!thread) {
    console.log("[THREAD] fetching active threads...");
    const active = await reportChannel.threads.fetchActive();
    thread = active.threads.find((t) => t.name === threadName) || null;
    if (thread) {
      console.log("[THREAD] found in active threads:", thread.id);
    }
  }

  // 3) fetch archived threads
  if (!thread) {
    console.log("[THREAD] fetching archived threads...");
    const archived = await reportChannel.threads.fetchArchived({ type: "public" });
    thread = archived.threads.find((t) => t.name === threadName) || null;
    if (thread) {
      console.log("[THREAD] found in archived threads:", thread.id);
    }
  }

  let created = false;

  // 4) chưa có → tạo mới
  if (!thread) {
    console.log("[THREAD] creating new thread...");

    try {
      thread = await reportChannel.threads.create({
        name: threadName,
        autoArchiveDuration: 1440,
        reason: `Daily report thread for ${today.toFormat("d-M-yyyy")}`,
      });
      created = true;

      console.log("[THREAD] thread created:", thread.id, thread.name);

      await thread.send(
        [
          `📌 **Daily Report — ${today.toFormat("d-M-yyyy")}**`,
          `Mọi người viết report trong thread này.`,
          ``,
          `A. Investigation done today`,
          `B. Gaps identified`,
          `C. Clarifications achieved`,
          `D. Next actions`,
        ].join("\n")
      );
    } catch (err) {
      console.error("[THREAD] FAILED to create thread:", err);
      throw err;
    }
  }

  // lưu DB
  db.days[key] = {
    ...(db.days[key] || {}),
    dateLabel: today.toFormat("d-M-yyyy"),
    threadId: thread.id,
    threadName: thread.name,
    threadEnsuredAt: now.toISO(),
  };

  saveDB(db);

  console.log("[THREAD] saved to DB:", db.days[key]);

  if (created) {
    await punishChannel.send(
      `✅ Đã tạo thread report mới: <#${thread.id}> (trong <#${REPORT_CHANNEL_ID}>)`
    );
  }

  console.log("[THREAD] return:", {
    threadId: thread.id,
    threadName: thread.name,
    created,
  });

  return {
    ensured: true,
    threadId: thread.id,
    threadName: thread.name,
    created,
  };
}

// catch-up: chỉ gọi ensure
async function catchUpCreateThreadIfMissed(client) {
  console.log("[THREAD] catchUpCreateThreadIfMissed called");
  return ensureTodayReportThread(client);
}

module.exports = {
  ensureTodayReportThread,
  catchUpCreateThreadIfMissed,
};
