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
    { url: "https://i.imgs.ovh/2026/05/22/d9a80d0ba4266411999519026aaccfd8.jpg", alt: "端午晚会合影" }
  ],

  // ---- 成员墙 ----
  students: [
    "杨紫菡","陆熠","杨茉涵","王子杰","孙源伯",
    "岳乔松","贠茹馨","高庭轩","陈楚妤","何彦萱",
    "潘馨燃","陈梦潇","邓依霖","张梓暄","杜烁洋",
    "王晗永","张旭尧","赵雨暄","侯美泽","韩承远",
    "于越","杜浩嘉","甄梓涵","朱菁钰","唐扬",
    "赵昊阳","李博宇","陈盈暄","赵婧菲","王珞茜","方思懿"
  ],

  // ---- 照片相册（图片外链） ----
  album: [
    { thumb: "https://s41.ax1x.com/2026/05/22/pmS7ijO.jpg", full: "https://s41.ax1x.com/2026/05/22/pmS7ijO.jpg", caption: "初三下册开学前一天" },
    { thumb: "https://i.imgs.ovh/2026/05/22/78e1582bfb2c693f8aaf4ae4bb336378.jpg", full: "https://i.imgs.ovh/2026/05/22/78e1582bfb2c693f8aaf4ae4bb336378.jpg", caption: "独与大家的祝福" },
    { thumb: "https://i.imgs.ovh/2026/05/22/d7b606c28edd069ee4ee89cf28a8c933.jpg", full: "https://i.imgs.ovh/2026/05/22/d7b606c28edd069ee4ee89cf28a8c933.jpg", caption: "第一次烤蛋挞" },
    { thumb: "https://i.imgs.ovh/2026/05/22/e4dda664b3bcc37ff82eb09358c1f08a.jpg", full: "https://i.imgs.ovh/2026/05/22/e4dda664b3bcc37ff82eb09358c1f08a.jpg", caption: "大家一起过生日" },
    { thumb: "https://s41.ax1x.com/2026/05/22/pmS7EHH.jpg", full: "https://s41.ax1x.com/2026/05/22/pmS7EHH.jpg", caption: "暑假班结束" },
    { thumb: "https://i.imgs.ovh/2026/05/22/0f237655d0ebb6851bc9b80ab65e623c.jpg", full: "https://i.imgs.ovh/2026/05/22/0f237655d0ebb6851bc9b80ab65e623c.jpg", caption: "套圈活动" },
    { thumb: "https://s41.ax1x.com/2026/05/22/pmS7kuD.jpg", full: "https://s41.ax1x.com/2026/05/22/pmS7kuD.jpg", caption: "最后一次寒假班" },
    { thumb: "https://i.imgs.ovh/2026/05/22/b26caf508ddc4a214eca903dd2e900dd.jpg", full: "https://i.imgs.ovh/2026/05/22/b26caf508ddc4a214eca903dd2e900dd.jpg", caption: "某次周末的随手记录" },
    { thumb: "https://i.imgs.ovh/2026/05/22/e9c00e590290018b3eec2fa1f479cece.jpg", full: "https://i.imgs.ovh/2026/05/22/e9c00e590290018b3eec2fa1f479cece.jpg", caption: "谁还记得比脸大的披萨" },
    { thumb: "https://picsum.photos/seed/p10/400/300", full: "https://picsum.photos/seed/p10/1200/900", caption: "2026年毕业照" }
  ],

  // ---- 视频集锦 ----
  // type: "video" = 本地/直链视频, "embed" = iframe 嵌入（如 Bilibili）
  videos: [
    { type: "embed", embed: '<iframe src="https://player.bilibili.com/player.html?isOutside=true&aid=116613546312918&bvid=BV1rtL868Ehu&cid=38510528799&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>', poster: "https://picsum.photos/seed/v1/800/450", title: "一起过生日了！" },
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
    { date: "2024-04-02", title: "我们相遇了", desc: "初一下册，一转眼三年已然结束", img: "https://picsum.photos/seed/t1/600/400" },
    { date: "2024-06-06", title: "端午晚会", desc: "这是大家第一次在一起吃蛋糕", img: "https://s41.ax1x.com/2026/05/20/pez3oZV.jpg" },
    { date: "2024-11-22", title: "温老师在大展身手", desc: "还记得我们自己制作的爆米花是什么味道嘛？", img: "https://s41.ax1x.com/2026/05/22/pmS799x.jpg" },
    { date: "2025-03-14", title: "某天中午", desc: "那天午后，大家睡的都很安逸", img: "https://s41.ax1x.com/2026/05/22/pmS7ZEd.jpg" },
    { date: "2025-06-23", title: "生地会考", desc: "第一次大考，大家紧张又兴奋", img: "https://i.imgs.ovh/2026/05/22/1bc138d58ea9f13f2c4c6abf9e524a94.png" },
    { date: "2026-03-01", title: "百日誓师", desc: "100天后，我们就要踏上中考的战场", img: "https://picsum.photos/seed/t5/600/400" },
    { date: "2026-06-20", title: "中考！加油！", desc: "三年磨一剑，出鞘必锋芒！", img: "https://picsum.photos/seed/t7/600/400" }
  ],

  // ---- 解密系统配置 ----
  secretPassword: "2026dagodui",     // 班级密码（进入解密页面的密码）
  encryptKey: "DaGouDui2026Key!",    // AES 加密密钥（必须与加密工具保持一致）
  secretHint: "我们的小秘密",
  secretIconText: "✉"
};

// ============================================================
// 1.1 新增：Leancloud 微后端配置
// ============================================================
const LC_CONFIG = {
  appId: "",
  appKey: "",
  serverURL: ""
};

// ============================================================
// 1.1 新增：背景音乐配置
// ============================================================
const MUSIC_CONFIG = {
  src: "assets/Sacred Play Secret Place.mp3",
  title: "Sacred Play Secret Place",
  defaultVolume: 0.4
};

// ============================================================
// 1.1 新增：弹幕留言配置
// ============================================================
const DANMU_CONFIG = {
  pollInterval: 5000,
  cooldown: 5000,
  maxLength: 50,
  dailyLimit: 200,
  tracks: 3
};

// ============================================================
// 1.1 新增：教师语音寄语本地预设（Leancloud 未配置时降级使用）
// ============================================================
const VOICE_PRESETS = [
  {
    teacherName: "刘老师",
    avatar: "",
    title: "致我最骄傲的2026级",
    audioSrc: "",
    duration: "2:30",
    sortOrder: 1
  }
];
