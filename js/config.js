// ============================================================
// 大对勾托管中心2026级 — 班级回忆配置文件
// 教师修改此文件即可更新网站内容，无需改动其他代码
// ============================================================

const CLASS_CONFIG = {

  // ---- 班级基本信息 ----
  className: "大对勾托管中心2026级",
  subTitle: "青春不散场 · 梦想正起航",
  teacherName: "刘老师",
  teacherMessage: "亲爱的2026级的孩子们：\n\n三年前，你们带着稚嫩的脸庞走进这间教室；三年后，你们已经成长为一群自信、阳光的少年。作为你们的班主任，我见证了你们每一次的进步，每一个闪光的瞬间。\n\n愿你们在中考中发挥出最好的水平，考上理想的高中。无论走到哪里，大对勾永远是你们的家。\n\n——永远爱你们的刘老师",
  teacherAvatar: "",

  // ---- 倒计时 ----
  countdownTarget: "2026-06-20",  // 中考日期，格式 YYYY-MM-DD

  // ---- 公告栏 ----
  notices: [
    { text: "中考倒计时冲刺！每天进步一点点，坚持就是胜利！", date: "2026-05-15" },
    { text: "6月18日拍毕业照，请大家穿校服、佩戴校徽", date: "2026-05-10" },
    { text: "毕业典礼定于6月25日下午2点，地点学校礼堂", date: "2026-05-01" }
  ],

  // ---- 班级合影轮播（图片外链） ----
  heroPhotos: [
    { url: "https://picsum.photos/seed/class1/1200/600", alt: "2026级全班合影" },
    { url: "https://picsum.photos/seed/class2/1200/600", alt: "运动会合影" },
    { url: "https://picsum.photos/seed/class3/1200/600", alt: "元旦晚会合影" }
  ],

  // ---- 成员墙 ----
  students: [
    "陈梦潇", "陈楚妤", "孙源伯", "陈盈暄", "甄梓涵",
    "杨紫菡", "郭梓萱", "杨茉涵", "王子杰", "贠茹馨",
    "赵婧菲", "张梓暄", "赵昊阳", "方思懿", "高庭轩",
    "杜浩嘉", "于越", "岳乔松", "张旭尧", "陆熠", "何彦萱"
  ],

  // ---- 照片相册（图片外链） ----
  album: [
    { thumb: "https://picsum.photos/seed/p1/400/300", full: "https://picsum.photos/seed/p1/1200/900", caption: "2024年春游 — 动物园" },
    { thumb: "https://picsum.photos/seed/p2/400/300", full: "https://picsum.photos/seed/p2/1200/900", caption: "2024年运动会" },
    { thumb: "https://picsum.photos/seed/p3/400/300", full: "https://picsum.photos/seed/p3/1200/900", caption: "2025年元旦晚会" },
    { thumb: "https://picsum.photos/seed/p4/400/300", full: "https://picsum.photos/seed/p4/1200/900", caption: "科学实验课" },
    { thumb: "https://picsum.photos/seed/p5/400/300", full: "https://picsum.photos/seed/p5/1200/900", caption: "篮球赛" },
    { thumb: "https://picsum.photos/seed/p6/400/300", full: "https://picsum.photos/seed/p6/1200/900", caption: "义卖活动" },
    { thumb: "https://picsum.photos/seed/p7/400/300", full: "https://picsum.photos/seed/p7/1200/900", caption: "书法比赛" },
    { thumb: "https://picsum.photos/seed/p8/400/300", full: "https://picsum.photos/seed/p8/1200/900", caption: "课间日常" },
    { thumb: "https://picsum.photos/seed/p9/400/300", full: "https://picsum.photos/seed/p9/1200/900", caption: "期中表彰大会" },
    { thumb: "https://picsum.photos/seed/p10/400/300", full: "https://picsum.photos/seed/p10/1200/900", caption: "2026年毕业照" }
  ],

  // ---- 视频集锦 ----
  videos: [
    { url: "https://www.w3schools.com/html/mov_bbb.mp4", poster: "https://picsum.photos/seed/v1/800/450", title: "2025元旦晚会精彩瞬间" },
    { url: "https://www.w3schools.com/html/mov_bbb.mp4", poster: "https://picsum.photos/seed/v2/800/450", title: "运动会开幕式表演" },
    { url: "https://www.w3schools.com/html/mov_bbb.mp4", poster: "https://picsum.photos/seed/v3/800/450", title: "班级合唱比赛" }
  ],

  // ---- 文件分享 ----
  files: [
    { name: "优秀作文集《我们的青春》", url: "#", type: "pdf", size: "12MB" },
    { name: "2024-2025学年荣誉榜", url: "#", type: "pdf", size: "3MB" },
    { name: "班级毕业纪念册（电子版）", url: "#", type: "pdf", size: "25MB" }
  ],

  // ---- 回忆时间轴 ----
  timeline: [
    { date: "2024-04-02", title: "我们相遇了", desc: "初一下册，22个陌生的名字从此变成了一家人", img: "https://picsum.photos/seed/t1/600/400" },
    { date: "2024-06-6", title: "端午晚会", desc: "这是大家第一次在一起吃蛋糕", img: "https://s41.ax1x.com/2026/05/20/pez3oZV.jpg" },
    { date: "2024-10-20", title: "运动会夺冠", desc: "全班齐心协力拿下年级总分第一名！", img: "https://picsum.photos/seed/t3/600/400" },
    { date: "2025-01-01", title: "元旦晚会", desc: "我们班的小品《考试风云》笑翻全场", img: "https://picsum.photos/seed/t6/600/400" },
    { date: "2025-06-15", title: "生地会考", desc: "第一次大考，大家紧张又兴奋", img: "https://picsum.photos/seed/t4/600/400" },
    { date: "2026-03-01", title: "百日誓师", desc: "100天后，我们就要踏上中考的战场", img: "https://picsum.photos/seed/t5/600/400" },
    { date: "2026-06-20", title: "中考！加油！", desc: "三年磨一剑，出鞘必锋芒！", img: "https://picsum.photos/seed/t7/600/400" }
  ],

  // ---- 解密系统配置 ----
  secretPassword: "2026dagodui",     // 班级密码（进入解密页面的密码）
  encryptKey: "DaGouDui2026Key!",    // AES 加密密钥（必须与加密工具保持一致）
  secretHint: "我们的小秘密",
  secretIconText: "✉"
};
