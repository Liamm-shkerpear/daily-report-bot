require("dotenv").config();

module.exports = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  GUILD_ID: process.env.GUILD_ID,
  PUNISH_CHANNEL_ID: process.env.PUNISH_CHANNEL_ID,
  DAILY_CATEGORY_ID: process.env.DAILY_CATEGORY_ID,
  TIMEZONE: process.env.TIMEZONE || "Asia/Ho_Chi_Minh",

  // danh sách user cố định
   TEAM_USER_IDS: [
      "627523060899119124", //HungCuong
      "618456185468878861", //Khoa
      "608709058551349277", //Thanh
      "885538584508133386", //DucAnh
      "700895592502526004"  //Tuan
  ],
};
