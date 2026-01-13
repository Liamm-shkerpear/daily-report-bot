function buildReportChannelNames(date) {
  // hỗ trợ nhiều kiểu để tìm channel cũ (nếu đặt tên không đồng nhất)
  const d = date.day;
  const m = date.month;
  const y = date.year;
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");

  return [
    `report-${d}-${m}-${y}`,
    `report-${dd}-${mm}-${y}`,
    `report-${dd}-${m}-${y}`,
    `report-${d}-${mm}-${y}`,
  ];
}

function buildTodayChannelName(date) {
  // report-14-1-2026 (không padding)
  return `report-${date.day}-${date.month}-${date.year}`;
}

module.exports = { buildReportChannelNames, buildTodayChannelName };
