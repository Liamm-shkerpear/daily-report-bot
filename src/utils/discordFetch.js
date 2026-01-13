async function fetchAllMessagesInChannel(channel, afterMs, beforeMs) {
  let lastId = null;
  let collected = [];

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;

    const arr = [...batch.values()];
    collected.push(...arr);

    lastId = arr[arr.length - 1].id;

    // tối ưu: nếu message cũ nhất đã < afterMs thì dừng
    const oldest = arr[arr.length - 1];
    if (oldest.createdTimestamp < afterMs) break;
  }

  return collected.filter(
    (msg) => msg.createdTimestamp >= afterMs && msg.createdTimestamp <= beforeMs
  );
}

module.exports = { fetchAllMessagesInChannel };
