'use strict';

/* ── LOADER ── */
window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader').classList.add('gone'), 1500);
});

const I18N = {
  zh: {
    "nav.about": "关于",
    "nav.regions": "地区",
    "nav.destinations": "目的地",
    "nav.gallery": "相册",
    "nav.practical": "旅行须知",
    "nav.seasons": "季节",
    "nav.culture": "文化",
    "nav.routes": "自驾路线",
    "nav.tips": "旅行贴士",
    "nav.settings": "设置",
    "nav.tools": "工具",

    "hero.eyebrow": "终极旅行指南",
    "hero.headline": "无尽奇境<br><em>近在咫尺</em>",
    "hero.desc": "从大西洋的浩瀚海岸，到太平洋的鎏金落日；从北境苔原的寂静辽阔，到南方海岛的温润悠然——美国的风光、人文与故事，远不止一段旅程可以丈量",
    "hero.ctaPrimary": "开始探索",
    "hero.ctaGhost": "热门目的地 ↓",
    "hero.statStates": "个州",
    "hero.statParks": "座国家公园",
    "hero.statMiles": "平方英里",
    "hero.scroll": "向下滑动",

    "intro.eyebrow": "关于美国",
    "intro.heading": "一个定义了<br><em>「定义」本身的国度</em>",
    "intro.quote": "美国，不只是一个国家——它是整个世界的集合",
    "intro.body1": "美国横跨北美大陆，国土面积达<strong>380万平方英里</strong>，北接加拿大，南邻墨西哥，两洋相拥，是当今世界最富多样性的国家之一",
    "intro.body2": "从太平洋沿岸屹立千年的<strong>红杉巨木</strong>，到腹地绵延的金色草原；从阿巴拉契亚到落基山脉的层峦叠嶂，再到贯穿大陆的密西西比河——每一片土地，都自有其节奏与语言",
    "intro.factPopulation": "人口",
    "intro.factStates": "州",
    "intro.factParks": "国家公园",
    "intro.factFounded": "建国年份",
    "intro.factGdp": "GDP",
    "intro.factTimezones": "时区",
    "intro.sceneCanyon": "旧金山，加利福尼亚州",
    "intro.sceneNyc": "纽约市",
    "intro.sceneYellow": "黄石公园",

    "regions.eyebrow": "按地区探索",
    "regions.heading": "一个国家，<br><em>五种面貌</em>",
    "regions.intro": "每个地区都有自己的口音与节奏——从自由不羁的东部，到旷野辽阔的西部，风情各异，气质自成一格",
    "regions.tag": "✦ 五大地区",
    "regions.ne.name": "东北部",
    "regions.ne.desc": "美国历史的起点——鹅卵石铺就的街巷、常春藤掩映的学府、层林尽染的秋意 以及，纽约这座城市本身",
    "regions.ne.spot1": "纽约",
    "regions.ne.spot2": "波士顿",
    "regions.so.name": "南部",
    "regions.so.desc": "热忱好客的待客之道，令人难忘的地道美食，蓝调与爵士的旋律，还有木兰花香萦绕不散的夜晚",
    "regions.so.spot1": "新奥尔良",
    "regions.so.spot2": "纳什维尔",
    "regions.mw.name": "中西部",
    "regions.mw.desc": "美国的心脏地带 一望无际的大草原，波光粼粼的五大湖，以及享誉世界的芝加哥建筑群",
    "regions.mw.spot1": "芝加哥",
    "regions.mw.spot2": "底特律",
    "regions.we.name": "西部",
    "regions.we.desc": "从科技前沿到远古森林，从太平洋海岸到火山群峰——这里，是加利福尼亚",
    "regions.we.spot1": "洛杉矶",
    "regions.we.spot2": "西雅图",
    "regions.sw.name": "西南部",
    "regions.sw.desc": "赤色峡谷壮阔之间，古老文明遗迹之中，穿越仙人掌林立的荒漠——直至拉斯维加斯璀璨而不真实的夜",
    "regions.sw.spot1": "拉斯维加斯",
    "regions.sw.spot2": "凤凰城",

    "dest.eyebrow": "必选目的地",
    "dest.heading": "改变世界的<br><em>城市</em>",
    "dest.filterAll": "全部城市",
    "dest.bestTime": "最佳季节",
    "dest.budget": "预算参考",
    "dest.emptyState": "该地区暂无匹配城市，不妨换个筛选条件试试",
    "dest.filterSaved": "已收藏",
    "dest.emptyStateSaved": "你还没有收藏任何城市，点击城市卡片上的心形图标即可收藏",
    "dest.nyc.tag": "✦ 世界之都",
    "dest.nyc.name": "纽约市",
    "dest.nyc.desc": "不眠之城：故事，在这里发生——从曼哈顿，到布鲁克林",
    "dest.nyc.time": "4–6月 · 9–11月",
    "dest.la.tag": "✦ 造梦之城",
    "dest.la.name": "洛杉矶",
    "dest.la.desc": "电影、冲浪与永不褪色的阳光，在此交融成一座辽阔都市 从好莱坞山巅，一路延展至威尼斯海滩的木板道",
    "dest.la.time": "3–5月 · 9–11月",
    "dest.chicago.tag": "✦ 风城传奇",
    "dest.chicago.name": "芝加哥",
    "dest.chicago.desc": "摩天大楼的发源地，静卧于密歇根湖畔 无可比拟的建筑美学，醇厚的蓝调音乐，还有一块经典深盘披萨",
    "dest.chicago.time": "5月至9月",
    "dest.miami.tag": "✦ 阳光海岸",
    "dest.miami.name": "迈阿密",
    "dest.miami.desc": "南海滩的装饰艺术建筑，Wynwood街区的斑斓壁画，小哈瓦那的浓郁古巴咖啡，以及永不落幕的夜生活",
    "dest.miami.time": "11月至次年4月",
    "dest.nola.tag": "✦ 悠然之城",
    "dest.nola.name": "新奥尔良",
    "dest.nola.desc": "一座浸润着爵士乐、伏都历史与克里奥尔风味的城市：法语区独有的氛围，世间再难寻第二处",
    "dest.nola.time": "2月至5月",
    "dest.vegas.tag": "✦ 不夜之都",
    "dest.vegas.name": "拉斯维加斯",
    "dest.vegas.desc": "从莫哈韦沙漠中拔地而起的霓虹幻境：世界级餐饮，奢华赌场，以及一场永不散场的视觉盛宴",
    "dest.vegas.time": "3–5月 · 9–11月",
    "dest.sf.tag": "✦ 金门之城",
    "dest.sf.name": "旧金山",
    "dest.sf.desc": "起伏的山丘街道，叮当作响的缆车，还有笼罩在雾霭中的标志性大桥：这里是全球科技浪潮与反主流文化的交汇之地",
    "dest.sf.time": "9月至11月",
    "dest.seattle.tag": "✦ 翡翠之城",
    "dest.seattle.name": "西雅图",
    "dest.seattle.desc": "被水域、群山与常青森林环抱的城市：以浓郁咖啡文化、派克市场的烟火气，以及科技巨头云集而闻名",
    "dest.seattle.time": "7月至9月",
    "dest.austin.tag": "✦ 现场音乐之都",
    "dest.austin.name": "奥斯汀",
    "dest.austin.desc": "德州传统与不羁创意在此碰撞：地道的烧烤风味，户外生活方式，以及一个生生不息的现场音乐场景",
    "dest.austin.time": "9–11月 · 3–5月",
    "dest.dc.tag": "✦ 国家首都",
    "dest.dc.name": "华盛顿特区",
    "dest.dc.desc": "美国历史与政治的心脏：恢弘壮丽的新古典主义纪念建筑群，以及世界上首屈一指的免费博物馆殿堂",
    "dest.dc.time": "3–5月（樱花季）",
    "dest.honolulu.tag": "✦ 热带天堂",
    "dest.honolulu.name": "檀香山",
    "dest.honolulu.desc": "威基基海滩的碧波，休眠火山口的壮阔，以及深厚绵长的波利尼西亚传统：这里，是通往迷人夏威夷群岛的门户",
    "dest.honolulu.time": "12月中旬至3月",
    "dest.boston.tag": "✦ 历史之心",
    "dest.boston.name": "波士顿",
    "dest.boston.desc": "循着鹅卵石街道，重走美国独立革命之路；再尝一口传奇海鲜，感受这座城市近乎虔诚的体育热忱",
    "dest.boston.time": "6–10月（秋叶季）",

    "prac.eyebrow": "行前须知",
    "prac.heading": "旅行<em>要点</em>",
    "prac.learnMore": "了解更多 →",
    "prac.transport.title": "如何抵达",
    "prac.transport.body": "主要机场包括<strong>肯尼迪JFK、洛杉矶LAX、旧金山SFO、奥黑尔ORD、迈阿密MIA</strong>及亚特兰大ATL 多数免签国家的旅客，需在出发前在线申请ESTA",
    "prac.driving.title": "境内出行",
    "prac.driving.body": "离开大城市后，<strong>租车</strong>几乎是唯一之选。国内航班价格亲民，Uber与Lyft则在几乎所有大都市区域畅行无阻。",
    "prac.money.title": "货币与花费",
    "prac.money.body": "通用货币为<strong>美元（USD）</strong>，小费通常为消费金额的18–22%。经济型旅行者：每日80–120美元；中档体验：180–280美元。纽约与旧金山的消费水平位居前列。",
    "prac.health.title": "健康与安全",
    "prac.health.body": "<strong>强烈建议购买旅行保险</strong>——美国医疗水准世界一流，但费用同样不菲。紧急求助请拨打<strong>911</strong>。",

    "seasons.eyebrow": "何时启程",
    "seasons.heading": "每个季节，<br><em>都是不同的美国</em>",
    "seasons.intro": "美国的气候版图极为辽阔，出发时间取决于你要前往何处、想要遇见怎样的风景。",
    "seasons.tempLabel": "平均舒适度",
    "seasons.goTo": "推荐目的地：",
    "seasons.spring.badge": "高性价比",
    "seasons.spring.name": "春季",
    "seasons.spring.months": "3月—5月",
    "seasons.spring.desc": "华盛顿特区樱花绽放，德州原野繁花似锦，全国气温温润宜人，游人也恰到好处。",
    "seasons.spring.go": "华盛顿特区、纽约、纳什维尔",
    "seasons.summer.badge": "旺季出行",
    "seasons.summer.name": "夏季",
    "seasons.summer.months": "6月—8月",
    "seasons.summer.desc": "国家公园景致壮阔，却也人潮涌动；海滨胜地格外热闹。建议提前预订住宿。",
    "seasons.summer.go": "国家公园、新英格兰",
    "seasons.fall.badge": "小编推荐",
    "seasons.fall.name": "秋季",
    "seasons.fall.months": "9月—11月",
    "seasons.fall.desc": "全年最动人的季节。新英格兰漫山遍野的秋色美不胜收，天气清爽宜人，城市氛围也最为鲜活。",
    "seasons.fall.go": "新英格兰、大烟山",
    "seasons.winter.badge": "滑雪季",
    "seasons.winter.name": "冬季",
    "seasons.winter.months": "12月—2月",
    "seasons.winter.desc": "科罗拉多的滑雪胜地迎来高峰期；佛罗里达、夏威夷与南加州则化身为温暖惬意的避寒天堂。",
    "seasons.winter.go": "佛罗里达、夏威夷、落基山脉",

    "culture.eyebrow": "美食、音乐与文化",
    "culture.heading": "一座<br><em>多元汇聚之地</em>",
    "culture.intro": "美国最珍贵的，并非某一种文化，而是它的多元本身——没有标准，没有边界，只有不断被发现的全新世界",
    "culture.rock.name": "摇滚与乡村音乐",
    "culture.rock.desc": "纳什维尔的乡村酒吧，孟菲斯的摇滚发源地",
    "culture.jazz.name": "爵士与蓝调",
    "culture.jazz.desc": "新奥尔良法语区，音乐从不停歇",
    "culture.texmex.name": "德州墨西哥风味",
    "culture.texmex.desc": "德州风情与墨西哥灵魂的绝妙相融",
    "culture.seafood.name": "新英格兰海鲜",
    "culture.seafood.desc": "来自科德角的鲜甜龙虾卷与生蚝",
    "culture.broadway.name": "百老汇",
    "culture.broadway.desc": "曼哈顿——世界最负盛名的舞台",
    "culture.bbq.name": "美式烧烤",
    "culture.bbq.desc": "德州、堪萨斯城、卡罗来纳、孟菲斯——每一派都自成一门信仰",
    "culture.streetart.name": "街头艺术",
    "culture.streetart.desc": "Wynwood壁画区，底特律的城市涂鸦，旧金山的米慎区",
    "culture.sports.name": "体育文化",
    "culture.sports.desc": "NFL的周日盛事，棒球的悠长午后，以及大学橄榄球点燃的全民狂热",
    "culture.hollywood.name": "好莱坞",
    "culture.hollywood.desc": "全球电影、巨星与故事的心脏地带",
    "culture.pizza.name": "纽约披萨",
    "culture.pizza.desc": "薄脆可对折的一片——这座城市的味觉图腾",
    "culture.smithsonian.name": "免费博物馆群",
    "culture.smithsonian.desc": "华盛顿特区19座史密森尼博物馆，全数免费开放",
    "culture.farmtable.name": "从农场到餐桌",
    "culture.farmtable.desc": "加州引领的新鲜食材烹饪革新",

    "routes.eyebrow": "自驾路线",
    "routes.heading": "开放的公路，<br><em>正在等你出发</em>",
    "routes.intro": "美国，天生为公路旅行而生。这些传奇路线，早已超越交通本身——它们是一种成年礼，是美国故事里不可或缺的篇章。",
    "routes.route66.name": "66号公路",
    "routes.route66.dist": "芝加哥 → 洛杉矶",
    "routes.route66.duration": "2–3周",
    "routes.route66.desc": "人称「母亲之路」，从芝加哥一路延伸至圣莫尼卡。沿途尽是霓虹招牌、路边餐馆，以及色彩斑斓的彩绘沙漠。",
    "routes.route66.stop1": "芝加哥，伊利诺伊州",
    "routes.route66.stop2": "圣路易斯，密苏里州",
    "routes.route66.stop3": "大峡谷，亚利桑那州",
    "routes.route66.stop4": "圣莫尼卡，加利福尼亚州",
    "routes.pch.name": "太平洋海岸公路",
    "routes.pch.dist": "西雅图 → 圣地亚哥",
    "routes.pch.duration": "10–14天",
    "routes.pch.desc": "1号公路沿着太平洋悬崖蜿蜒铺展，堪称世界上最令人屏息的海岸公路之一。",
    "routes.pch.stop1": "西雅图，华盛顿州",
    "routes.pch.stop2": "红杉国家公园",
    "routes.pch.stop3": "大瑟尔悬崖",
    "routes.pch.stop4": "圣地亚哥，加利福尼亚州",
    "routes.parksloop.name": "国家公园环线",
    "routes.parksloop.dist": "犹他州 · 亚利桑那州 · 内华达州",
    "routes.parksloop.duration": "10–12天",
    "routes.parksloop.desc": "犹他州「五大奇迹」国家公园携手大峡谷，共同构成地球上自然奇观最为密集的区域。",
    "routes.parksloop.stop1": "拉斯维加斯（大本营）",
    "routes.parksloop.stop2": "锡安与布莱斯峡谷",
    "routes.parksloop.stop3": "纪念碑谷",
    "routes.parksloop.stop4": "大峡谷南缘",

    "tips.eyebrow": "内行建议",
    "tips.heading": "在美国，<br><em>一路从容</em>",
    "tips.intro": "美国，更青睐有备而来的旅行者：这些建议，帮你少走弯路，从容前行",
    "tips.parks.title": "提前预约国家公园",
    "tips.parks.body": "许多公园都需要<strong>预约限时入园名额</strong>，通常提前6个月开放预订。优胜美地与锡安公园的名额，往往转瞬即空。",
    "tips.tax.title": "销售税会在结账时另计",
    "tips.tax.body": "与欧洲不同，<strong>标价通常不含税</strong>，销售税因州而异（0%到10%以上不等）。所以，实付金额总会比标价更高一些。",
    "tips.sim.title": "提前备好本地SIM卡",
    "tips.sim.body": "<strong>预付费eSIM</strong>每月约30美元起。若计划深入国家公园等偏远地带，Verizon的信号覆盖表现最为可靠。",
    "tips.distance.title": "距离，远比想象中遥远",
    "tips.distance.body": "美国人惯用「小时」而非「英里」来丈量距离。<strong>从纽约到洛杉矶，需驱车41小时，跨越<span class=\"unit-dist\" data-mi=\"2789\">2,789英里</span></strong>。行程规划宁可少而精，也不要贪多求全。",
    "tips.tipping.title": "小费文化",
    "tips.tipping.body": "餐厅小费一般为消费金额的<strong>18–22%</strong>，酒吧则按每杯1–2美元支付。许多服务从业者以此为生——这是约定俗成的礼节，而非可有可无的选项。",
    "tips.pass.title": "「美丽美国」年票",
    "tips.pass.body": "<strong>年费80美元</strong>，即可畅游全美63座国家公园，无需再另行购票。只需造访2–3座公园，便已值回票价。",
    "tips.food.title": "去当地人常去的地方用餐",
    "tips.food.body": "真正美味的佳肴，鲜少藏身于游客扎堆的区域。不妨借助点评应用，寻访那些评分亮眼的家庭小馆与特色风味餐厅。",
    "tips.driving.title": "红灯亦可右转",
    "tips.driving.body": "除非另有明确标示，在全美50个州，车辆完全停稳后，均可<strong>在红灯时右转</strong>。",

    "gallery.eyebrow": "旅途影像",
    "gallery.heading": "来自旅途的<br><em>瞬间</em>",
    "gallery.intro": "一份持续更新的旅途影像集「照片版权归GitHub @TGthms, (Tim G)所有，受 CC BY 4.0 协议保护 —— 注明作者后方可使用」",
    "gallery.filterAll": "全部",
    "gallery.filterCityscapes": "城市风光",
    "gallery.filterLandmarks": "地标建筑",
    "gallery.filterNature": "自然风光",
    "gallery.filterCoast": "海岸线",
    "gallery.filterFoodCulture": "美食与文化",
    "gallery.filterRoads": "公路旅途",
    "gallery.emptyState": "该分类暂无照片——敬请期待",
    "gallery.viewAll": "展开完整相册",
    "gallery.viewLess": "收起相册",
    "gallery.item.nyc1.caption": "纽约市",
    "gallery.item.sf1.caption": "金门大桥",

    "settings.eyebrow": "个性化设置",
    "settings.heading": "打造<em>专属于你的体验</em>",
    "settings.intro": "选择喜欢的视觉主题，切换语言，或设定你熟悉的计量单位——所有偏好都会保存在这台设备上。",
    "settings.themeLabel": "主题",
    "settings.themeSub": "每个板块的配色，都会随你的选择而焕然一新。",
    "settings.themeDefault": "海军蓝",
    "settings.themeMinimal": "现代简约",
    "settings.themeElegant": "经典优雅",
    "settings.themeLuxury": "奢华旅行",
    "settings.themeGlass": "玻璃拟态",
    "settings.themeNature": "自然生态",
    "settings.languageLabel": "多语言",
    "settings.languageSub": "中文版内容，包括各地区与城市的详细介绍。",
    "settings.unitsLabel": "偏好设置",
    "settings.unitsSub": "应用于气温显示与自驾路线的距离计量",
    "settings.temperature": "温度",
    "settings.distance": "距离",
    "settings.miles": "英里",
    "settings.km": "公里",
    "settings.accessibilityLabel": "无障碍",
    "settings.accessibilitySub": "减弱动态效果，或关闭光标特效——适合对动态效果敏感的用户、性能较弱的设备，或偏好更沉静的体验。",
    "settings.reduceMotion": "动效",
    "settings.motionStandard": "标准",
    "settings.motionReduced": "减弱",
    "settings.cursorEffect": "光标特效",
    "settings.cursorOn": "开启",
    "settings.cursorOff": "关闭",

    "tools.eyebrow": "工具箱",
    "tools.heading": "更从容地<em>规划旅程</em>",
    "tools.intro": "旅行快捷工具：实时汇率、世界时钟和小费+税率计算器",
    "tools.currencyLabel": "实时汇率换算",
    "tools.currencySub": "使用 Frankfurter 每日汇率",
    "tools.amount": "金额",
    "tools.from": "从",
    "tools.to": "到",
    "tools.clockLabel": "世界时钟",
    "tools.clockSub": "用于规划国内联络与行程安排",
    "tools.tipLabel": "小费与税费估算",
    "tools.tipSub": "快速估算账单总额。",
    "tools.bill": "账单",
    "tools.tax": "税率 %",
    "tools.tip": "小费 %",

    "footer.tagline": "一份关于美国的完整旅行指南——广袤之中，故事缓缓展开，成为一段值得铭记的旅程",
    "footer.regionsTitle": "五大地区",
    "footer.destTitle": "推荐地点",
    "footer.planTitle": "行程规划",
    "footer.parks": "国家公园",
    "footer.whenToVisit": "最佳季节",
    "footer.visa": "签证与入境",
    "footer.copyright": "© 2026 美国旅行指南 &nbsp;·&nbsp; 心怀热爱，畅游在自由的公路上 | 由 Tim G 创作 · 与 AI 协作完成",
    "footer.motto": "自由的土地，勇者的家园 🇺🇸"
  },

  ja: {
    "nav.about": "概要",
    "nav.regions": "地域",
    "nav.destinations": "目的地",
    "nav.gallery": "ギャラリー",
    "nav.practical": "基本情報",
    "nav.seasons": "季節",
    "nav.culture": "文化",
    "nav.routes": "ロードトリップ",
    "nav.tips": "旅のヒント",
    "nav.settings": "設定",
    "nav.tools": "ツール",

    "hero.eyebrow": "究極の旅行ガイド",
    "hero.headline": "終わりなき<br><em>驚異の大地へ</em>",
    "hero.desc": "大西洋の波打ち際から太平洋に沈む夕日まで、極北のツンドラから亜熱帯の島々まで——アメリカには、一度の旅では出会い尽くせないほどの風景と物語が息づいています。",
    "hero.ctaPrimary": "旅を始める",
    "hero.ctaGhost": "人気の目的地 ↓",
    "hero.statStates": "の個性豊かな州",
    "hero.statParks": "の国立公園",
    "hero.statMiles": "平方マイルの大地",
    "hero.scroll": "スクロール",

    "intro.eyebrow": "アメリカ合衆国について",
    "intro.heading": "一言では<br><em>語り尽くせない国</em>",
    "intro.quote": "「アメリカとは、単なる一つの国ではない。無数の世界が寄り集まったモザイクだ——一つひとつの州が、一つの国のように豊かで、一つひとつの街が、一つの宇宙のように広い」",
    "intro.body1": "北米大陸に<strong>380万平方マイル</strong>の国土を持つアメリカは、面積で世界第3位、人口で世界第4位を誇ります。北にカナダ、南にメキシコと国境を接し、東は大西洋、西は太平洋に開かれています。",
    "intro.body2": "その地形は、まさに圧巻の一言です。太平洋岸には<strong>樹齢千年を超えるレッドウッドの森</strong>がそびえ立ち、大陸の中心には黄金色の大草原が広がります。アパラチア山脈とロッキー山脈が国土を東西に隔て、雄大なミシシッピ川がその真ん中を貫き、南西部の砂漠は陽光を浴びて赤やオレンジに燃え上がる——そんな多彩な表情を持つ国です。",
    "intro.factPopulation": "人口",
    "intro.factStates": "州",
    "intro.factParks": "国立公園",
    "intro.factFounded": "建国年",
    "intro.factGdp": "GDP",
    "intro.factTimezones": "タイムゾーン",
    "intro.sceneCanyon": "サンフランシスコ市、カリフォルニア州",
    "intro.sceneNyc": "ニューヨーク市",
    "intro.sceneYellow": "イエローストーン",

    "regions.eyebrow": "地域で見るアメリカ",
    "regions.heading": "一つの国に宿る、<br><em>五つの表情</em>",
    "regions.intro": "地域が変われば、訛りも、食も、暮らしのリズムも、まるで別の国のように変わる——自由な気風が漂う北東部から、荒々しくも雄大な西部まで。",
    "regions.tag": "✦ 地域",
    "regions.ne.name": "北東部",
    "regions.ne.desc": "アメリカの歴史が始まった場所。石畳の街並み、アイビーリーグの学舎、燃えるような紅葉、そしてニューヨークという都市そのもの。",
    "regions.ne.spot1": "ニューヨーク",
    "regions.ne.spot2": "ボストン",
    "regions.so.name": "南部",
    "regions.so.desc": "心のこもったもてなし、語り継がれる郷土料理、ブルースとジャズの旋律、そしてマグノリアの香りに包まれる夜。",
    "regions.so.spot1": "ニューオーリンズ",
    "regions.so.spot2": "ナッシュビル",
    "regions.mw.name": "中西部",
    "regions.mw.desc": "アメリカの心臓部。地平線まで続く大草原、五大湖の輝く水面、そして世界屈指と称されるシカゴの建築群。",
    "regions.mw.spot1": "シカゴ",
    "regions.mw.spot2": "デトロイト",
    "regions.we.name": "西部",
    "regions.we.desc": "テクノロジー帝国と太古の森が、静かに共存する土地。壮大な太平洋沿岸、火山がそびえる峰々、そして独自の文化を育むカリフォルニア。",
    "regions.we.spot1": "ロサンゼルス",
    "regions.we.spot2": "シアトル",
    "regions.sw.name": "南西部",
    "regions.sw.desc": "赤く染まる峡谷の岩壁、古代文明の面影を残す遺跡、サワロサボテンが林立する荒野、そして蜃気楼のように輝くラスベガスのネオン。",
    "regions.sw.spot1": "ラスベガス",
    "regions.sw.spot2": "フェニックス",

    "dest.eyebrow": "必見の目的地",
    "dest.heading": "世界を変えた<br><em>都市たち</em>",
    "dest.filterAll": "すべての都市",
    "dest.bestTime": "ベストシーズン",
    "dest.budget": "予算目安",
    "dest.emptyState": "この地域に該当する都市はまだありません。ほかの条件でお試しください。",
    "dest.filterSaved": "お気に入り",
    "dest.emptyStateSaved": "まだお気に入りの都市がありません。都市カードのハートアイコンをタップして保存しましょう。",
    "dest.nyc.tag": "✦ 世界の首都",
    "dest.nyc.name": "ニューヨーク市",
    "dest.nyc.desc": "決して眠らない街。800万の物語が、5つの区にひしめき合う——そびえ立つマンハッタンの摩天楼から、下町情緒あふれるブルックリンまで。",
    "dest.nyc.time": "4〜6月 · 9〜11月",
    "dest.la.tag": "✦ 夢を紡ぐ街",
    "dest.la.name": "ロサンゼルス",
    "dest.la.desc": "映画、サーフィン、そして絶えることのない陽光。それらが織りなす広大な都市は、ハリウッドの丘からベニスビーチの遊歩道まで続いています。",
    "dest.la.time": "3〜5月 · 9〜11月",
    "dest.chicago.tag": "✦ セカンドシティ",
    "dest.chicago.name": "シカゴ",
    "dest.chicago.desc": "摩天楼発祥の地。ミシガン湖畔にたたずむこの街には、比類なき建築美と、豊かなブルースの調べ、そして名物ピザがあります。",
    "dest.chicago.time": "5月〜9月",
    "dest.miami.tag": "✦ 太陽と海岸線",
    "dest.miami.name": "マイアミ",
    "dest.miami.desc": "サウスビーチに広がるアールデコ建築、ウィンウッド地区を彩る壁画アート、リトルハバナのキューバンコーヒー、そして夜通し賑わうナイトライフ。",
    "dest.miami.time": "11月〜4月",
    "dest.nola.tag": "✦ ビッグイージー",
    "dest.nola.name": "ニューオーリンズ",
    "dest.nola.desc": "ジャズの調べ、ブードゥーの歴史、クレオール料理の香りが息づく街。フレンチクォーターのような場所は、世界のどこを探しても見つかりません。",
    "dest.nola.time": "2月〜5月",
    "dest.vegas.tag": "✦ エンターテインメントの都",
    "dest.vegas.name": "ラスベガス",
    "dest.vegas.desc": "モハーヴェ砂漠の只中に浮かび上がる、蜃気楼のようなネオンの街。世界屈指のダイニング、豪奢なカジノ、そして尽きることのない圧巻のスペクタクル。",
    "dest.vegas.time": "3〜5月 · 9〜11月",
    "dest.sf.tag": "✦ ゴールデンゲートの街",
    "dest.sf.name": "サンフランシスコ",
    "dest.sf.desc": "起伏に富んだ丘の街並みを、ケーブルカーが軽やかに駆け抜ける。霧に包まれる象徴的な橋を望む、テクノロジーとカウンターカルチャーが交わる世界的中心地。",
    "dest.sf.time": "9月〜11月",
    "dest.seattle.tag": "✦ エメラルドシティ",
    "dest.seattle.name": "シアトル",
    "dest.seattle.desc": "水辺と山々、常緑の森に抱かれた街。コーヒー文化の発信地であり、活気あふれるパイク・プレイス・マーケットや、名だたるテック企業でも知られています。",
    "dest.seattle.time": "7月〜9月",
    "dest.austin.tag": "✦ ライブ音楽の都",
    "dest.austin.name": "オースティン",
    "dest.austin.desc": "テキサスの伝統と、型にはまらない創造の熱気が交わる街。極上のBBQ、アウトドアを愛する暮らし、そして絶えず湧き上がるライブ音楽シーン。",
    "dest.austin.time": "9〜11月 · 3〜5月",
    "dest.dc.tag": "✦ 首都",
    "dest.dc.name": "ワシントンD.C.",
    "dest.dc.desc": "アメリカの歴史と政治が息づく中心地。壮麗なネオクラシック様式の記念碑群、そして世界最高水準を誇る無料博物館の数々。",
    "dest.dc.time": "3〜5月（桜の季節）",
    "dest.honolulu.tag": "✦ 常夏の楽園",
    "dest.honolulu.name": "ホノルル",
    "dest.honolulu.desc": "ワイキキビーチの穏やかな波、雄大な火山口の景観、そして脈々と受け継がれるポリネシアの伝統。息をのむほど美しいハワイ諸島へと誘う玄関口です。",
    "dest.honolulu.time": "12月中旬〜3月",
    "dest.boston.tag": "✦ 歴史の中心地",
    "dest.boston.name": "ボストン",
    "dest.boston.desc": "石畳の道をたどれば、アメリカ独立戦争の記憶に出会う。伝説のシーフードと、この街ならではの熱狂的なスポーツ文化も見逃せません。",
    "dest.boston.time": "6〜10月（紅葉の季節）",

    "prac.eyebrow": "出発前に知っておきたいこと",
    "prac.heading": "旅の<em>基本情報</em>",
    "prac.learnMore": "詳しく見る →",
    "prac.transport.title": "現地への行き方",
    "prac.transport.body": "主要な玄関口空港は<strong>JFK、LAX、オヘア、マイアミ</strong>、そしてアトランタ。ビザ免除対象国からの旅行者の多くは、出発前にオンラインでESTAを取得しておく必要があります。",
    "prac.driving.title": "現地での移動手段",
    "prac.driving.body": "主要都市を一歩出れば、<strong>レンタカー</strong>はほぼ必須の存在に。国内線の運賃は比較的手頃で、UberやLyftはほぼすべての都市圏で利用できます。",
    "prac.money.title": "通貨と旅の費用",
    "prac.money.body": "通貨は<strong>米ドル（USD）</strong>。チップの目安は18〜22%です。節約志向の旅なら1日80〜120ドル、標準的な旅なら180〜280ドルほど。ニューヨークとサンフランシスコは、とりわけ物価が高めの都市です。",
    "prac.health.title": "健康と安全",
    "prac.health.body": "<strong>旅行保険への加入を強くおすすめします</strong>——アメリカの医療は世界最高水準を誇る一方、費用も相応に高額です。緊急時は<strong>911</strong>へ。",

    "seasons.eyebrow": "訪れるベストシーズン",
    "seasons.heading": "季節ごとに<br><em>まるで違う顔を見せる国</em>",
    "seasons.intro": "アメリカは気候の幅があまりに広いため、旅のベストシーズンは、行き先とそこで何を体験したいかによって大きく変わります。",
    "seasons.tempLabel": "平均快適度",
    "seasons.goTo": "おすすめの行き先：",
    "seasons.spring.badge": "お得な季節",
    "seasons.spring.name": "春",
    "seasons.spring.months": "3月〜5月",
    "seasons.spring.desc": "ワシントンD.C.には桜が咲き誇り、テキサスの大地には野花が広がる。全米で気温が心地よくなり、混雑もほどよい落ち着きを見せる季節です。",
    "seasons.spring.go": "ワシントンD.C.、ニューヨーク、ナッシュビル",
    "seasons.summer.badge": "最盛期",
    "seasons.summer.name": "夏",
    "seasons.summer.months": "6月〜8月",
    "seasons.summer.desc": "国立公園は息をのむ美しさを見せますが、その分混雑も覚悟を。ビーチリゾートも大いに賑わうシーズンなので、宿泊予約はお早めに。",
    "seasons.summer.go": "国立公園、ニューイングランド",
    "seasons.fall.badge": "編集部イチ推し",
    "seasons.fall.name": "秋",
    "seasons.fall.months": "9月〜11月",
    "seasons.fall.desc": "一年を通じて最も美しい季節。ニューイングランドを彩る紅葉は、思わず息をのむほど。澄み渡る空気の中、街の活気もひときわ増します。",
    "seasons.fall.go": "ニューイングランド、グレートスモーキー山脈",
    "seasons.winter.badge": "スキーシーズン",
    "seasons.winter.name": "冬",
    "seasons.winter.months": "12月〜2月",
    "seasons.winter.desc": "コロラドのスキーリゾートが最盛期を迎える一方、フロリダやハワイ、南カリフォルニアは、暖かな陽光が恋しい人々の避寒地となります。",
    "seasons.winter.go": "フロリダ、ハワイ、ロッキー山脈",

    "culture.eyebrow": "食、音楽、そして文化",
    "culture.heading": "多様性が生む、<br><em>ひとつの文化</em>",
    "culture.intro": "アメリカが誇る最大の文化的財産——それは、多様性そのものです。唯一の料理も、唯一の音楽も、唯一のアイデンティティも存在しない。その果てしない豊かさこそが、訪れるたびに新しい発見をもたらしてくれる理由です。",
    "culture.rock.name": "ロック＆カントリー",
    "culture.rock.desc": "ナッシュビルのホンキートンク酒場と、ロック発祥の地メンフィス",
    "culture.jazz.name": "ジャズ＆ブルース",
    "culture.jazz.desc": "ニューオーリンズのフレンチクォーターには、常に音楽が流れている",
    "culture.texmex.name": "テクスメクス料理",
    "culture.texmex.desc": "テキサスとメキシコが出会って生まれた、絶妙な融合料理",
    "culture.seafood.name": "ニューイングランドのシーフード",
    "culture.seafood.desc": "ケープコッド直送の、みずみずしいロブスターロールと牡蠣",
    "culture.broadway.name": "ブロードウェイ",
    "culture.broadway.desc": "マンハッタンに輝く、世界で最も名高い舞台",
    "culture.bbq.name": "アメリカンBBQ",
    "culture.bbq.desc": "テキサス、カンザスシティ、カロライナ、メンフィス——流派ごとに、確固たる信条がある",
    "culture.streetart.name": "ストリートアート",
    "culture.streetart.desc": "ウィンウッド・ウォールズ、デトロイトの壁画、サンフランシスコのミッション地区",
    "culture.sports.name": "スポーツ文化",
    "culture.sports.desc": "日曜恒例のNFL観戦、野球のゆったりとした時間、そして大学フットボールへの熱狂",
    "culture.hollywood.name": "ハリウッド",
    "culture.hollywood.desc": "映画とスター、そして物語が生まれる世界的な中心地",
    "culture.pizza.name": "ニューヨークピザ",
    "culture.pizza.desc": "折りたたんで頬張る薄い一枚——この街が誇る、ひとつの文化そのもの",
    "culture.smithsonian.name": "無料の博物館群",
    "culture.smithsonian.desc": "ワシントンD.C.に集う19のスミソニアン博物館——そのすべてが、完全無料",
    "culture.farmtable.name": "ファーム・トゥ・テーブル",
    "culture.farmtable.desc": "カリフォルニアが牽引する、新鮮な食材へのこだわりが生んだ料理革命",

    "routes.eyebrow": "壮大なロードトリップ",
    "routes.heading": "開かれた道が、<br><em>あなたを待っている</em>",
    "routes.intro": "アメリカという国は、ロードトリップのためにあるといっても過言ではありません。ここに紹介する伝説のルートは、いわば通過儀礼——壮大なアメリカ物語を彩る、忘れがたい一章です。",
    "routes.route66.name": "ルート66",
    "routes.route66.dist": "シカゴ → ロサンゼルス",
    "routes.route66.duration": "2〜3週間",
    "routes.route66.desc": "「マザーロード」の愛称で親しまれる、シカゴからサンタモニカまでの道。ネオンサイン、昔ながらのダイナー、そしてペインテッド・デザートの絶景が続きます。",
    "routes.route66.stop1": "シカゴ、イリノイ州",
    "routes.route66.stop2": "セントルイス、ミズーリ州",
    "routes.route66.stop3": "グランドキャニオン、アリゾナ州",
    "routes.route66.stop4": "サンタモニカ、カリフォルニア州",
    "routes.pch.name": "パシフィック・コースト・ハイウェイ",
    "routes.pch.dist": "シアトル → サンディエゴ",
    "routes.pch.duration": "10〜14日間",
    "routes.pch.desc": "ハイウェイ1号線は、太平洋を見下ろす断崖沿いに続いています。世界でも屈指の美しさを誇る、海岸線ドライブルートのひとつです。",
    "routes.pch.stop1": "シアトル、ワシントン州",
    "routes.pch.stop2": "レッドウッド国立公園",
    "routes.pch.stop3": "ビッグサーの断崖",
    "routes.pch.stop4": "サンディエゴ、カリフォルニア州",
    "routes.parksloop.name": "パークス・ループ",
    "routes.parksloop.dist": "ユタ州・アリゾナ州・ネバダ州",
    "routes.parksloop.duration": "10〜12日間",
    "routes.parksloop.desc": "ユタ州が誇る「マイティ・ファイブ」の国立公園に、グランドキャニオンを加えた、地球上でも類を見ないほど自然の絶景が凝縮されたエリアです。",
    "routes.parksloop.stop1": "ラスベガス（拠点）",
    "routes.parksloop.stop2": "ザイオン＆ブライスキャニオン",
    "routes.parksloop.stop3": "モニュメントバレー",
    "routes.parksloop.stop4": "グランドキャニオン・サウスリム",

    "tips.eyebrow": "現地からのアドバイス",
    "tips.heading": "アメリカを<br><em>賢く、心地よく旅する</em>",
    "tips.intro": "アメリカは、準備を怠らない旅行者に必ず応えてくれる国です。次のヒントが、時間とお金、そして余計な手間を省く助けになるはずです。",
    "tips.parks.title": "国立公園は早めの予約を",
    "tips.parks.body": "多くの公園では<strong>時間指定の入場予約</strong>が必要で、6ヶ月前から予約が始まります。ヨセミテやザイオンの人気枠は、あっという間に埋まってしまいます。",
    "tips.tax.title": "売上税はレジで加算される",
    "tips.tax.body": "ヨーロッパとは異なり、<strong>表示価格に税金は含まれていません</strong>。売上税は州ごとに異なり、0%から10%を超えることもあります。会計時の金額は、常に表示価格より高くなると心得ておきましょう。",
    "tips.sim.title": "現地SIMは事前に準備を",
    "tips.sim.body": "<strong>プリペイドeSIM</strong>は月額およそ30ドルから。国立公園など人里離れたエリアを巡るなら、電波状況に定評のあるVerizonがおすすめです。",
    "tips.distance.title": "距離感が、まったく違う",
    "tips.distance.body": "アメリカ人は、距離をマイルではなく時間で語ります。<strong>ニューヨークからロサンゼルスまでは、車で41時間、<span class=\"unit-dist\" data-mi=\"2789\">2,789マイル</span></strong>。あれもこれもと欲張らず、立ち寄る場所を絞り込んで、じっくり味わう旅程を組みましょう。",
    "tips.tipping.title": "チップの文化",
    "tips.tipping.body": "レストランでは<strong>18〜22%</strong>、バーではドリンク一杯につき1〜2ドルが目安です。多くの働き手にとってチップは生活の糧であり、選択肢ではなく、当然のマナーとして根付いています。",
    "tips.pass.title": "「アメリカ・ザ・ビューティフル」パス",
    "tips.pass.body": "<strong>年間わずか80ドル</strong>で、全63の国立公園に何度でも無料で入場できます。2〜3ヶ所を訪れるだけで、十分に元が取れる計算です。",
    "tips.food.title": "地元の人が通う店で味わう",
    "tips.food.body": "本当においしい料理は、観光客で賑わうエリアには、意外と少ないもの。評価アプリを活用して、評判の高い個人経営のダイナーや、味に定評のあるエスニック料理店を探してみましょう。",
    "tips.driving.title": "赤信号でも右折可能",
    "tips.driving.body": "標識で特に禁止されていない限り、全50州において、一時停止のうえで<strong>赤信号での右折</strong>が認められています。",

    "gallery.eyebrow": "フォトギャラリー",
    "gallery.heading": "旅の途中の<br><em>ワンシーン</em>",
    "gallery.intro": "旅の記録を集めたコレクション——カテゴリー別に整理され、旅が続く限り随時追加されます。",
    "gallery.filterAll": "すべて",
    "gallery.filterCityscapes": "都市風景",
    "gallery.filterLandmarks": "ランドマーク",
    "gallery.filterNature": "自然",
    "gallery.filterCoast": "海岸",
    "gallery.filterFoodCulture": "食と文化",
    "gallery.filterRoads": "ロード",
    "gallery.emptyState": "このカテゴリーの写真はまだありません。お楽しみに。",
    "gallery.viewAll": "ギャラリーをすべて表示",
    "gallery.viewLess": "ギャラリーを閉じる",
    "gallery.item.nyc1.caption": "ニューヨーク市",
    "gallery.item.sf1.caption": "ゴールデンゲートブリッジ",

    "settings.eyebrow": "パーソナライズ",
    "settings.heading": "自分だけの<em>旅のかたちに</em>",
    "settings.intro": "お好みのビジュアルテーマを選び、表示言語を切り替え、使い慣れた単位を設定できます。設定内容は、この端末に保存されます。",
    "settings.themeLabel": "テーマ",
    "settings.themeSub": "選んだ配色に合わせて、すべてのセクションの表情が変わります。",
    "settings.themeDefault": "ネイビー＆ゴールド",
    "settings.themeMinimal": "モダンミニマル",
    "settings.themeElegant": "クラシックエレガント",
    "settings.themeLuxury": "ラグジュアリートラベル",
    "settings.themeGlass": "グラスモーフィズム",
    "settings.themeNature": "ネイチャー／エコ",
    "settings.languageLabel": "言語",
    "settings.languageSub": "地域や都市の詳細情報を含め、ガイド全体を翻訳します。",
    "settings.unitsLabel": "単位設定",
    "settings.unitsSub": "気温表示と、ロードトリップの距離表示に反映されます。",
    "settings.temperature": "気温",
    "settings.distance": "距離",
    "settings.miles": "マイル",
    "settings.km": "キロメートル",
    "settings.accessibilityLabel": "アクセシビリティ",
    "settings.accessibilitySub": "アニメーションを控えめにしたり、カーソルエフェクトをオフにできます。動きに敏感な方、非力なデバイス、落ち着いた体験がお好みの方に。",
    "settings.reduceMotion": "モーション",
    "settings.motionStandard": "標準",
    "settings.motionReduced": "控えめ",
    "settings.cursorEffect": "カーソルエフェクト",
    "settings.cursorOn": "オン",
    "settings.cursorOff": "オフ",

    "tools.eyebrow": "旅行ツール",
    "tools.heading": "安心して<em>旅を計画</em>",
    "tools.intro": "為替、世界時計、レストラン合計をすばやく確認できます。",
    "tools.currencyLabel": "ライブ通貨換算",
    "tools.currencySub": "Frankfurter の日次為替レートを使用",
    "tools.amount": "金額",
    "tools.from": "換算元",
    "tools.to": "換算先",
    "tools.clockLabel": "世界時計",
    "tools.clockSub": "通話、到着、チェックインの計画に便利な主要タイムゾーン。",
    "tools.tipLabel": "チップ・税金計算",
    "tools.tipSub": "米国レストランの合計額をすばやく見積もります。",
    "tools.bill": "会計",
    "tools.tax": "税率 %",
    "tools.tip": "チップ %",

    "footer.tagline": "アメリカ合衆国を巡る完全ガイド——50の州、数えきれない物語、そして一生忘れられない旅の記憶。",
    "footer.regionsTitle": "地域",
    "footer.destTitle": "目的地",
    "footer.planTitle": "旅の計画",
    "footer.parks": "国立公園",
    "footer.whenToVisit": "ベストシーズン",
    "footer.visa": "ビザと入国",
    "footer.copyright": "© 2026 アメリカ旅行ガイド &nbsp;·&nbsp; 情熱を胸に、自由な道路を悠々と泳ぎます | Tim G が制作・ AI と協力して完成",
    "footer.motto": "自由の地、勇者の故郷 🇺🇸"
  }
};

/* ── I18N ENGINE ──
   English lives directly in the HTML (already written for every section),
   so it never needs duplicating here. On first run we snapshot each
   [data-i18n]/[data-i18n-html] element's original English content; switching
   back to English just restores that snapshot rather than looking anything
   up. Switching to zh/ja overwrites content from the I18N dictionary above,
   keyed by the same data-i18n attribute already present in the markup. */
const i18nEls = document.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-aria]');
const i18nOriginals = new Map();
i18nEls.forEach(el => {
  const isHtml = el.hasAttribute('data-i18n-html');
  const isAria = el.hasAttribute('data-i18n-aria');
  i18nOriginals.set(el, isAria ? el.getAttribute('aria-label') : isHtml ? el.innerHTML : el.textContent);
});

function applyLanguage(lang) {
  const dict = I18N[lang];
  i18nEls.forEach(el => {
    const isHtml = el.hasAttribute('data-i18n-html');
    const isAria = el.hasAttribute('data-i18n-aria');
    const key = isAria ? el.getAttribute('data-i18n-aria') : isHtml ? el.getAttribute('data-i18n-html') : el.getAttribute('data-i18n');
    const translated = dict && dict[key];
    if (lang === 'en' || !translated) {
      const orig = i18nOriginals.get(el);
      if (isAria) el.setAttribute('aria-label', orig); else if (isHtml) el.innerHTML = orig; else el.textContent = orig;
    } else {
      if (isAria) el.setAttribute('aria-label', translated); else if (isHtml) el.innerHTML = translated; else el.textContent = translated;
    }
  });
  document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja' : 'en');
  document.documentElement.setAttribute('data-lang', lang);
  const titles = { en: 'America — A Travel Guide', zh: '美国 — 旅行指南', ja: 'アメリカ — 旅行ガイド' };
  document.title = titles[lang] || titles.en;
  applyUnits(); // re-stamp unit spans that may have been inside translated HTML
  if (currentModalKey) {
    const d = getModalData(currentModalKey);
    if (d) openModal(d.tag, d.title, d.body);
  }
}

/* ── UNIT CONVERSION ENGINE ──
   Any element with class "unit-temp" + data-f="<fahrenheit>" or "unit-dist"
   + data-mi="<miles>" gets its displayed text regenerated here. Safe to call
   after any DOM change (language swap, modal open) since it always derives
   the label fresh from the stored raw value rather than parsing prior text. */
function applyUnits() {
  document.querySelectorAll('.unit-temp[data-f]').forEach(el => {
    const f = parseFloat(el.getAttribute('data-f'));
    if (currentTempUnit === 'c') {
      const c = Math.round((f - 32) * 5 / 9);
      el.textContent = c + '°C';
    } else {
      el.textContent = Math.round(f) + '°F';
    }
  });
  document.querySelectorAll('.unit-dist[data-mi]').forEach(el => {
    const mi = parseFloat(el.getAttribute('data-mi'));
    const suffix = el.dataset.suffix || '';
    if (currentDistUnit === 'km') {
      const km = Math.round(mi * 1.60934).toLocaleString('en-US');
      el.textContent = km + (currentLang === 'zh' ? ' 公里' : currentLang === 'ja' ? ' km' : ' km') + suffix;
    } else {
      const miFmt = Math.round(mi).toLocaleString('en-US');
      el.textContent = miFmt + (currentLang === 'zh' ? ' 英里' : currentLang === 'ja' ? ' マイル' : ' mi') + suffix;
    }
  });
}

/* ── SAFE STORAGE ──
   Wraps localStorage in try/catch so preferences persist normally when this
   file is opened directly in a browser, but the site still works perfectly
   (just without cross-visit memory) in sandboxed contexts where storage
   access throws. In-memory `current*` variables are always the source of
   truth during a session either way. */
const safeStorage = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* in-memory state still works */ }
  }
};

/* ── SETTINGS STATE ── */
let currentTheme    = safeStorage.get('usa-travel-theme', 'default');
let currentLang     = safeStorage.get('usa-travel-lang', 'en');
let currentTempUnit = safeStorage.get('usa-travel-temp-unit', 'f');
let currentDistUnit = safeStorage.get('usa-travel-dist-unit', 'mi');
let reduceMotion         = safeStorage.get('usa-travel-reduce-motion', 'off') === 'on';
let cursorEffectEnabled  = safeStorage.get('usa-travel-cursor-fx', 'on') !== 'off';

document.documentElement.setAttribute('data-theme', currentTheme);
document.documentElement.setAttribute('data-reduce-motion', reduceMotion ? 'true' : 'false');

/* Respects the manual Settings toggle AND the OS-level preference — either
   one being "on" is enough to calm things down. Checked live (not cached)
   so it also reacts if the OS setting changes mid-session. */
const prefersReducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
function motionActive() { return reduceMotion || prefersReducedMotionMQ.matches; }
function scrollBehaviorPref() { return motionActive() ? 'auto' : 'smooth'; }

/* ── THEME SWATCHES ── */
const themeSwatches = document.querySelectorAll('.theme-swatch');
function updateThemeUI(theme) {
  themeSwatches.forEach(sw => sw.classList.toggle('active', sw.dataset.themeVal === theme));
}
themeSwatches.forEach(sw => {
  sw.addEventListener('click', () => {
    currentTheme = sw.dataset.themeVal;
    document.documentElement.setAttribute('data-theme', currentTheme);
    safeStorage.set('usa-travel-theme', currentTheme);
    updateThemeUI(currentTheme);
  });
});
updateThemeUI(currentTheme);

/* ── LANGUAGE PILLS ── */
const langPills = document.querySelectorAll('#langPillGroup .pill-btn');
function updateLangUI(lang) {
  langPills.forEach(p => p.classList.toggle('active', p.dataset.langVal === lang));
}
langPills.forEach(p => {
  p.addEventListener('click', () => {
    currentLang = p.dataset.langVal;
    safeStorage.set('usa-travel-lang', currentLang);
    updateLangUI(currentLang);
    applyLanguage(currentLang);
    updateGalleryToggle();
  });
});
updateLangUI(currentLang);

/* ── UNIT PILLS ── */
const tempPills = document.querySelectorAll('#unitTempGroup .pill-btn');
const distPills = document.querySelectorAll('#unitDistGroup .pill-btn');
function updateUnitUI() {
  tempPills.forEach(p => p.classList.toggle('active', p.dataset.unitVal === currentTempUnit));
  distPills.forEach(p => p.classList.toggle('active', p.dataset.unitVal === currentDistUnit));
}
tempPills.forEach(p => p.addEventListener('click', () => {
  currentTempUnit = p.dataset.unitVal;
  safeStorage.set('usa-travel-temp-unit', currentTempUnit);
  updateUnitUI();
  applyUnits();
}));
distPills.forEach(p => p.addEventListener('click', () => {
  currentDistUnit = p.dataset.unitVal;
  safeStorage.set('usa-travel-dist-unit', currentDistUnit);
  updateUnitUI();
  applyUnits();
}));
updateUnitUI();

/* ── ACCESSIBILITY PILLS (Reduce Motion / Cursor Effect) ── */
const motionPills = document.querySelectorAll('#motionPillGroup .pill-btn');
function updateMotionUI() {
  motionPills.forEach(p => p.classList.toggle('active', p.dataset.motionVal === (reduceMotion ? 'on' : 'off')));
}
motionPills.forEach(p => p.addEventListener('click', () => {
  reduceMotion = p.dataset.motionVal === 'on';
  safeStorage.set('usa-travel-reduce-motion', reduceMotion ? 'on' : 'off');
  document.documentElement.setAttribute('data-reduce-motion', reduceMotion ? 'true' : 'false');
  updateMotionUI();
}));
updateMotionUI();

const cursorPills = document.querySelectorAll('#cursorPillGroup .pill-btn');
function updateCursorUI() {
  cursorPills.forEach(p => p.classList.toggle('active', p.dataset.cursorVal === (cursorEffectEnabled ? 'on' : 'off')));
}
cursorPills.forEach(p => p.addEventListener('click', () => {
  cursorEffectEnabled = p.dataset.cursorVal === 'on';
  safeStorage.set('usa-travel-cursor-fx', cursorEffectEnabled ? 'on' : 'off');
  updateCursorUI();
}));
updateCursorUI();

/* ── UTILITY: GET CSS VARIABLE ── */
function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#e8a435';
}

/* ── PROGRESS BAR ── */
const progressBar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  progressBar.style.width = pct + '%';
}, { passive: true });

/* ── CURSOR TRAIL (Performance/Touch Fixed) ── */
(function() {
  // Disable on touch devices
  if (window.matchMedia("(pointer: coarse)").matches) return;

  const c = document.getElementById('cursorCanvas');
  const ctx = c.getContext('2d');
  const particles = [];
  let mx = -999, my = -999;
  let isMouseIn = false;

  function resize() { c.width = window.innerWidth; c.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  
  window.addEventListener('mousemove', e => { 
    mx = e.clientX; my = e.clientY; 
    isMouseIn = true;
  }, { passive: true });
  
  window.addEventListener('mouseleave', () => { isMouseIn = false; });
  window.addEventListener('blur', () => { isMouseIn = false; }); // tab switch fix

  let frame = 0;
  function tick() {
    requestAnimationFrame(tick);
    frame++;
    ctx.clearRect(0, 0, c.width, c.height);

    // Respect the "Cursor Trail" Settings toggle and reduced-motion preference.
    // Bail out early (after clearing) so a disable takes effect on the very
    // next frame instead of waiting for existing particles to fade out.
    if (!cursorEffectEnabled || motionActive()) {
      if (particles.length) particles.length = 0;
      return;
    }

    // Dynamically fetch theme accent color
    const themeAccent = getCssVar('--accent-1');

    if (frame % 2 === 0 && isMouseIn) {
      particles.push({
        x: mx + (Math.random() - .5) * 6,
        y: my + (Math.random() - .5) * 6,
        vx: (Math.random() - .5) * 0.6,
        vy: -Math.random() * 1.2 - 0.3,
        life: 1,
        size: Math.random() * 3 + 1,
        color: themeAccent // Storing current theme color
      });
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.life -= 0.035;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.globalAlpha = p.life * 0.6;
      ctx.fillStyle = p.color; 
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  tick();
})();

/* ── DOT MAP (Theme Aware) ── */
(function() {
  const canvas = document.getElementById('dotMap');
  const ctx = canvas.getContext('2d');
  const dots = [];
  let W, H, needRebuild = true;

  const stateData = [
    {cx:.78,cy:.20,rx:.05,ry:.05},{cx:.82,cy:.18,rx:.04,ry:.04},{cx:.80,cy:.24,rx:.04,ry:.04},
    {cx:.72,cy:.38,rx:.06,ry:.06},{cx:.76,cy:.44,rx:.05,ry:.07},{cx:.70,cy:.50,rx:.04,ry:.06},
    {cx:.64,cy:.45,rx:.06,ry:.05},{cx:.58,cy:.48,rx:.05,ry:.05},{cx:.62,cy:.38,rx:.05,ry:.05},
    {cx:.55,cy:.28,rx:.09,ry:.08},{cx:.60,cy:.30,rx:.07,ry:.06},{cx:.50,cy:.32,rx:.07,ry:.06},
    {cx:.44,cy:.28,rx:.07,ry:.07},{cx:.48,cy:.22,rx:.06,ry:.05},
    {cx:.42,cy:.35,rx:.08,ry:.08},{cx:.36,cy:.35,rx:.07,ry:.08},{cx:.38,cy:.25,rx:.07,ry:.07},
    {cx:.28,cy:.30,rx:.08,ry:.09},{cx:.24,cy:.38,rx:.07,ry:.08},{cx:.30,cy:.42,rx:.06,ry:.06},
    {cx:.22,cy:.45,rx:.08,ry:.07},{cx:.28,cy:.50,rx:.06,ry:.06},
    {cx:.12,cy:.28,rx:.06,ry:.12},{cx:.10,cy:.40,rx:.05,ry:.08},{cx:.14,cy:.50,rx:.06,ry:.06},
    {cx:.40,cy:.52,rx:.08,ry:.09},{cx:.44,cy:.58,rx:.05,ry:.06},
    {cx:.74,cy:.52,rx:.04,ry:.04},{cx:.76,cy:.58,rx:.03,ry:.05},
    {cx:.08,cy:.72,rx:.06,ry:.04},{cx:.20,cy:.74,rx:.04,ry:.02},
  ];

  function buildDots() {
    dots.length = 0;
    stateData.forEach(({cx,cy,rx,ry}) => {
      const n = Math.floor(rx * ry * 9000);
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random());
        dots.push({
          nx: cx + r * rx * Math.cos(angle),
          ny: cy + r * ry * Math.sin(angle),
          alpha: 0,
          target: .15 + Math.random() * .5,
          delay: Math.random() * 2.8,
          pulse: Math.random() * Math.PI * 2,
          size: .8 + Math.random() * 1.4,
        });
      }
    });
    needRebuild = false;
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    needRebuild = true;
  }
  resize();
  window.addEventListener('resize', () => { resize(); }, { passive: true });

  let t0 = null;
  function draw(ts) {
    if (needRebuild) buildDots();
    if (!t0) t0 = ts;
    const elapsed = (ts - t0) / 1000;
    W = canvas.width; H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const mw = W * .65, mh = H * .58, mx2 = W * .16, my2 = H * .16;
    
    ctx.fillStyle = getCssVar('--accent-1'); // Theme aware color

    dots.forEach(d => {
      if (elapsed < d.delay) return;
      d.alpha = Math.min(d.target, d.alpha + .008);
      const pulse = motionActive() ? 1 : (Math.sin(elapsed * .55 + d.pulse) * .15 + .85);
      ctx.globalAlpha = d.alpha * pulse;
      ctx.beginPath();
      ctx.arc(mx2 + d.nx * mw, my2 + d.ny * mh, d.size * .5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();

/* ── NAVBAR + ACTIVE LINK ── */
const navbar = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]:not(#settings)');
const navLinks = document.querySelectorAll('.nav-links a[data-section]');

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.classList.toggle('scrolled', y > 60);
  document.getElementById('back-top').classList.toggle('visible', y > 400);
  let current = '';
  sections.forEach(s => { if (y >= s.offsetTop - 200) current = s.id; });
  navLinks.forEach(a => a.classList.toggle('active-link', a.dataset.section === current));
}, { passive: true });

/* ── PARALLAX ── */
const heroBg  = document.getElementById('heroBg');
window.addEventListener('scroll', () => {
  if (motionActive()) { heroBg.style.transform = 'none'; return; }
  const y = window.scrollY;
  if (y < window.innerHeight * 1.2) {
    heroBg.style.transform  = `translateY(${y * 0.38}px)`;
  }
}, { passive: true });

/* ── HERO SCROLL CLICK ── */
document.getElementById('heroScroll').addEventListener('click', () => {
  document.getElementById('intro').scrollIntoView({ behavior: scrollBehaviorPref() });
});

/* ── REGIONS CAROUSEL (mirrors destinations pattern; grid on desktop, carousel below 1100px) ── */
const regionsTrack = document.getElementById('regionsTrack');
const regionBtnLeft = document.getElementById('regionScrollLeft');
const regionBtnRight = document.getElementById('regionScrollRight');

function regionScrollStep() {
  const card = regionsTrack.querySelector('.region-card');
  if (!card) return 300;
  const style = getComputedStyle(regionsTrack);
  const gap = parseFloat(style.columnGap || style.gap || 16);
  return card.getBoundingClientRect().width + gap;
}
regionBtnLeft.addEventListener('click', () => {
  regionsTrack.scrollBy({ left: -regionScrollStep(), behavior: scrollBehaviorPref() });
});
regionBtnRight.addEventListener('click', () => {
  regionsTrack.scrollBy({ left: regionScrollStep(), behavior: scrollBehaviorPref() });
});

/* ── DESTINATION FAVORITES ──
   A lightweight "save for later" system. Persists the same way as other
   preferences (safeStorage with in-memory fallback). The heart button sits
   on every destination card; state survives filtering, language switches,
   and (when storage is available) page reloads. */
let favorites = new Set();
try {
  const saved = JSON.parse(safeStorage.get('usa-travel-favorites', '[]'));
  if (Array.isArray(saved)) favorites = new Set(saved);
} catch (e) { /* corrupted or absent — start fresh */ }

const savedCountEl = document.getElementById('savedCount');
function persistFavorites() {
  safeStorage.set('usa-travel-favorites', JSON.stringify([...favorites]));
  if (savedCountEl) savedCountEl.textContent = favorites.size;
}
function syncFavoriteButtons() {
  document.querySelectorAll('.dest-card').forEach(card => {
    const btn = card.querySelector('.dest-fav-btn');
    if (btn) btn.classList.toggle('active', favorites.has(card.dataset.dest));
  });
}
function toggleFavorite(btn) {
  const card = btn.closest('.dest-card');
  const key = card.dataset.dest;
  if (favorites.has(key)) { favorites.delete(key); btn.classList.remove('active'); }
  else { favorites.add(key); btn.classList.add('active'); btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse'); }
  persistFavorites();
  // Live-refresh the "Saved" filter view if it's the active one
  if (destFilterBar && destFilterBar.querySelector('.dest-filter-btn.active')?.dataset.filter === 'saved') {
    applyDestFilter('saved');
  }
}
syncFavoriteButtons();
persistFavorites(); // paints the initial count without re-writing storage unnecessarily

/* ── DESTINATION FILTER (region + saved) ── */
const destFilterBar = document.getElementById('destFilterBar');
const destEmptyState = document.getElementById('destEmptyState');
const destEmptyStateDefaultKey = destEmptyState ? destEmptyState.getAttribute('data-i18n') : null;
const EMPTY_STATE_SAVED_TEXT = { en: "You haven't saved any cities yet. Tap the heart icon on a city card to save it.", zh: "你还没有收藏任何城市。点击城市卡片上的心形图标即可收藏。", ja: "まだお気に入りの都市がありません。都市カードのハートアイコンをタップして保存しましょう。" };

function applyDestFilter(filter) {
  let visibleCount = 0;
  destTrack.querySelectorAll('.dest-card').forEach(card => {
    const match = filter === 'all' || (filter === 'saved' ? favorites.has(card.dataset.dest) : card.dataset.region === filter);
    card.classList.toggle('filtered-out', !match);
    if (match) visibleCount++;
  });
  if (destEmptyState) {
    destEmptyState.classList.toggle('show', visibleCount === 0);
    if (filter === 'saved') {
      destEmptyState.removeAttribute('data-i18n');
      destEmptyState.textContent = EMPTY_STATE_SAVED_TEXT[currentLang] || EMPTY_STATE_SAVED_TEXT.en;
    } else if (destEmptyStateDefaultKey) {
      destEmptyState.setAttribute('data-i18n', destEmptyStateDefaultKey);
      const dict = I18N[currentLang];
      destEmptyState.textContent = (dict && dict[destEmptyStateDefaultKey]) || i18nOriginals.get(destEmptyState) || destEmptyState.textContent;
    }
  }
}
if (destFilterBar) {
  destFilterBar.addEventListener('click', e => {
    const btn = e.target.closest('.dest-filter-btn');
    if (!btn) return;
    destFilterBar.querySelectorAll('.dest-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyDestFilter(btn.dataset.filter);
    destTrack.scrollTo({ left: 0, behavior: scrollBehaviorPref() });
  });
}

/* ── DESTINATIONS CAROUSEL ── */
const destTrack = document.getElementById('destTrack');
const btnLeft = document.getElementById('destScrollLeft');
const btnRight = document.getElementById('destScrollRight');

function updateCarouselBtns() {
  const maxScroll = destTrack.scrollWidth - destTrack.clientWidth;
  btnLeft.disabled = destTrack.scrollLeft <= 5;
  btnRight.disabled = destTrack.scrollLeft >= maxScroll - 5;
}

function destScrollStep() {
  const card = destTrack.querySelector('.dest-card');
  if (!card) return 344;
  const style = getComputedStyle(destTrack);
  const gap = parseFloat(style.columnGap || style.gap || 24);
  return card.getBoundingClientRect().width + gap;
}

btnLeft.addEventListener('click', () => {
  destTrack.scrollBy({ left: -destScrollStep(), behavior: scrollBehaviorPref() });
});
btnRight.addEventListener('click', () => {
  destTrack.scrollBy({ left: destScrollStep(), behavior: scrollBehaviorPref() });
});
destTrack.addEventListener('scroll', updateCarouselBtns, {passive: true});
// Initial check
setTimeout(updateCarouselBtns, 500); 

/* ── SCROLL REVEAL ── */
const allReveal = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target); } });
}, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
allReveal.forEach(el => revObs.observe(el));

/* ── TEMPERATURE BARS ── */
const tempObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.temp-fill').forEach(b => b.classList.add('animated'));
      tempObs.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
const tb = document.getElementById('tempBars');
if (tb) tempObs.observe(tb);

/* ── BACK TO TOP ── */
document.getElementById('back-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: scrollBehaviorPref() });
});

/* ── SMOOTH ANCHORS ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const hash = a.getAttribute('href');
    if (!hash || hash === '#') return;
    if (a.classList.contains('nav-logo')) return;
    const target = document.querySelector(hash);
    if (!target) return; // let the browser handle anything we don't recognize
    e.preventDefault();
    closeMobileNav();
    target.scrollIntoView({ behavior: scrollBehaviorPref(), block: 'start' });
  });
});

/* ── HAMBURGER ── */
const hamburger = document.getElementById('hamburger');
const navMobile = document.getElementById('navMobile');
hamburger.addEventListener('click', () => {
  const willOpen = !hamburger.classList.contains('open');
  if (willOpen) {
    lockSettingsBackground();
    hamburger.classList.add('open');
    navMobile.classList.add('open');
  } else {
    hamburger.classList.remove('open');
    navMobile.classList.remove('open');
    unlockSettingsBackground();
  }
  hamburger.setAttribute('aria-expanded', String(willOpen));
});

function closeMobileNav() {
  const wasOpen = navMobile.classList.contains('open');
  navMobile.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  if (wasOpen) unlockSettingsBackground();
}

/* ── SETTINGS DIALOG ── */
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsOpenBtn = document.getElementById('settingsOpen');
const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
const settingsCloseBtn = document.getElementById('settingsClose');
let lastSettingsTrigger = null;
let settingsScrollY = 0;

function lockSettingsBackground() {
  settingsScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${settingsScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
}

function unlockSettingsBackground() {
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  document.body.style.overflow = '';
  window.scrollTo(0, settingsScrollY);
}

function openSettings(trigger) {
  if (settingsOverlay.classList.contains('open')) return;
  lastSettingsTrigger = trigger || document.activeElement;
  closeMobileNav();
  lockSettingsBackground();
  settingsOverlay.classList.add('open');
  settingsOverlay.setAttribute('aria-hidden', 'false');
  settingsOverlay.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  setTimeout(() => settingsCloseBtn.focus(), 100);
}

function closeSettings() {
  if (!settingsOverlay.classList.contains('open')) return;
  settingsOverlay.classList.remove('open');
  settingsOverlay.setAttribute('aria-hidden', 'true');
  unlockSettingsBackground();
  if (lastSettingsTrigger && typeof lastSettingsTrigger.focus === 'function') lastSettingsTrigger.focus();
}

settingsOpenBtn.addEventListener('click', () => openSettings(settingsOpenBtn));
mobileSettingsBtn.addEventListener('click', () => openSettings(mobileSettingsBtn));
settingsCloseBtn.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', e => { if (e.target === settingsOverlay) closeSettings(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && settingsOverlay.classList.contains('open')) closeSettings();
});


/* ── TRAVEL TOOLS DIALOG ── */
const toolsOverlay = document.getElementById('toolsOverlay');
const toolsOpenBtn = document.getElementById('toolsOpen');
const mobileToolsBtn = document.getElementById('mobileToolsBtn');
const toolsCloseBtn = document.getElementById('toolsClose');
let lastToolsTrigger = null;

function openTools(trigger) {
  if (toolsOverlay.classList.contains('open')) return;
  if (settingsOverlay.classList.contains('open')) closeSettings();
  lastToolsTrigger = trigger || document.activeElement;
  closeMobileNav();
  lockSettingsBackground();
  toolsOverlay.classList.add('open');
  toolsOverlay.setAttribute('aria-hidden', 'false');
  toolsOverlay.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  updateWorldClock();
  updateTipEstimator();
  updateCurrency();
  setTimeout(() => toolsCloseBtn.focus(), 100);
}

function closeTools() {
  if (!toolsOverlay.classList.contains('open')) return;
  toolsOverlay.classList.remove('open');
  toolsOverlay.setAttribute('aria-hidden', 'true');
  unlockSettingsBackground();
  if (lastToolsTrigger && typeof lastToolsTrigger.focus === 'function') lastToolsTrigger.focus();
}

toolsOpenBtn.addEventListener('click', () => openTools(toolsOpenBtn));
mobileToolsBtn.addEventListener('click', () => openTools(mobileToolsBtn));
toolsCloseBtn.addEventListener('click', closeTools);
toolsOverlay.addEventListener('click', e => { if (e.target === toolsOverlay) closeTools(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && toolsOverlay.classList.contains('open')) closeTools();
});

const currencyAmount = document.getElementById('currencyAmount');
const currencyFrom = document.getElementById('currencyFrom');
const currencyTo = document.getElementById('currencyTo');
const currencyResult = document.getElementById('currencyResult');
const currencyMeta = document.getElementById('currencyMeta');
const currencySwap = document.getElementById('currencySwap');
let currencyAbort = null;

function moneyFmt(value, currency) {
  try { return new Intl.NumberFormat(currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value); }
  catch (e) { return `${value.toFixed(2)} ${currency}`; }
}

async function updateCurrency() {
  const amount = Math.max(0, Number(currencyAmount.value) || 0);
  const base = currencyFrom.value;
  const quote = currencyTo.value;
  if (base === quote) {
    currencyResult.textContent = `${moneyFmt(amount, base)} = ${moneyFmt(amount, quote)}`;
    currencyMeta.textContent = 'Same currency selected.';
    return;
  }
  if (currencyAbort) currencyAbort.abort();
  currencyAbort = new AbortController();
  currencyResult.textContent = 'Updating...';
  currencyMeta.textContent = 'Fetching latest available daily rate.';
  try {
    const res = await fetch(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`, { signal: currencyAbort.signal });
    if (!res.ok) throw new Error('Rate unavailable');
    const data = await res.json();
    const converted = amount * Number(data.rate);
    currencyResult.textContent = `${moneyFmt(amount, base)} = ${moneyFmt(converted, quote)}`;
    currencyMeta.textContent = `1 ${base} = ${Number(data.rate).toFixed(4)} ${quote}${data.date ? ` · ${data.date}` : ''}`;
  } catch (err) {
    if (err.name === 'AbortError') return;
    currencyResult.textContent = 'Rate unavailable';
    currencyMeta.textContent = 'Check your connection and try again.';
  }
}

[currencyAmount, currencyFrom, currencyTo].forEach(el => el.addEventListener('input', updateCurrency));
[currencyFrom, currencyTo].forEach(el => el.addEventListener('change', updateCurrency));
currencySwap.addEventListener('click', () => {
  const from = currencyFrom.value;
  currencyFrom.value = currencyTo.value;
  currencyTo.value = from;
  updateCurrency();
});

const worldClockList = document.getElementById('worldClockList');
const CLOCK_ZONES = [
  ['Los Angeles', 'America/Los_Angeles'], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Paris', 'Europe/Paris'], ['Tokyo', 'Asia/Tokyo'], ['Shanghai', 'Asia/Shanghai']
];
function updateWorldClock() {
  const locale = currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : 'en-US';
  worldClockList.innerHTML = CLOCK_ZONES.map(([city, zone]) => {
    const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: currentLang === 'en', timeZone: zone }).format(new Date());
    return `<div class="clock-row"><div><div class="clock-city">${city}</div><div class="clock-zone">${zone.replace('_', ' ')}</div></div><div class="clock-time">${time}</div></div>`;
  }).join('');
}
updateWorldClock();
setInterval(updateWorldClock, 30000);

const billAmount = document.getElementById('billAmount');
const taxRate = document.getElementById('taxRate');
const tipRate = document.getElementById('tipRate');
const tipResult = document.getElementById('tipResult');
const tipMeta = document.getElementById('tipMeta');
function updateTipEstimator() {
  const bill = Math.max(0, Number(billAmount.value) || 0);
  const tax = bill * Math.max(0, Number(taxRate.value) || 0) / 100;
  const tip = bill * Math.max(0, Number(tipRate.value) || 0) / 100;
  const total = bill + tax + tip;
  tipResult.textContent = moneyFmt(total, 'USD');
  tipMeta.textContent = `Tax ${moneyFmt(tax, 'USD')} · Tip ${moneyFmt(tip, 'USD')}`;
}
[billAmount, taxRate, tipRate].forEach(el => el.addEventListener('input', updateTipEstimator));
updateTipEstimator();

/* ── MODAL SYSTEM ── */
const overlay   = document.getElementById('modal-overlay');
const modalTag  = document.getElementById('modal-tag');
const modalTitle= document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

const MODAL_DATA = {
  region_northeast: {
    tag: '✦ Region — The Northeast', title: 'The Northeast',
    body: `<p>The most densely settled and historically rich corner of the United States, the Northeast spans from Maine's rugged coast to the bustling megalopolis of Washington D.C. This is where America began.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">9</div><div class="modal-fact-label">States</div></div><div class="modal-fact"><div class="modal-fact-num">55M+</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">Sep–Nov</div><div class="modal-fact-label">Best Season</div></div></div><div class="modal-highlights"><div class="modal-highlight">NYC: Times Square, Central Park, Brooklyn Bridge, The Met</div><div class="modal-highlight">Boston: Freedom Trail, Harvard, Fenway Park</div></div>`
  },
  region_south: {
    tag: '✦ Region — The South', title: 'The American South',
    body: `<p>No region in America is as rich in storytelling, music, and culinary heritage as the South. From the Spanish moss-draped squares of Savannah to the neon-lit honky-tonks of Nashville.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">16</div><div class="modal-fact-label">States</div></div><div class="modal-fact"><div class="modal-fact-num">125M+</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">Mar–May</div><div class="modal-fact-label">Best Season</div></div></div>`
  },
  region_midwest: {
    tag: '✦ Region — The Midwest', title: 'The Midwest',
    body: `<p>Often overlooked by international travelers, the Midwest rewards the curious with world-class museums, extraordinary food scenes, and a genuine, unpretentious warmth.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">12</div><div class="modal-fact-label">States</div></div><div class="modal-fact"><div class="modal-fact-num">68M+</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">Jun–Sep</div><div class="modal-fact-label">Best Season</div></div></div>`
  },
  region_west: {
    tag: '✦ Region — The West', title: 'The American West',
    body: `<p>The West is where America's mythology lives: the Gold Rush, the frontier, the counterculture, the tech revolution. It contains the nation's tallest mountains and its driest deserts.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">11</div><div class="modal-fact-label">States</div></div><div class="modal-fact"><div class="modal-fact-num">80M+</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">Year-round</div><div class="modal-fact-label">Best Season</div></div></div>`
  },
  region_southwest: {
    tag: '✦ Region — The Southwest', title: 'The Southwest',
    body: `<p>Nowhere else on the planet do geology and light combine as they do in the American Southwest. The Colorado Plateau is the most spectacular erosional landscape on Earth.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">4</div><div class="modal-fact-label">Core States</div></div><div class="modal-fact"><div class="modal-fact-num">5</div><div class="modal-fact-label">Utah's Mighty Parks</div></div><div class="modal-fact"><div class="modal-fact-num">Mar–May</div><div class="modal-fact-label">Best Season</div></div></div>`
  },
  
  /* NEW EXTENDED DESTINATIONS */
  dest_nyc: { tag: '✦ Destination', title: 'New York City', body: `<p>New York City is the definitive world city. Eight million people crammed onto a handful of islands, speaking 800 languages.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">8M+</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">5</div><div class="modal-fact-label">Boroughs</div></div><div class="modal-fact"><div class="modal-fact-num">$$$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_la: { tag: '✦ Destination', title: 'Los Angeles', body: `<p>The sprawling epicenter of the global entertainment industry. From the Griffith Observatory to the beaches of Santa Monica, LA is less a single city and more a massive collection of distinct, car-connected neighborhoods.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">4M</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="75">75°F</div><div class="modal-fact-label">Avg Temp</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_chicago: { tag: '✦ Destination', title: 'Chicago', body: `<p>America's architectural capital. Sitting majestically on Lake Michigan, Chicago boasts a stunning skyline, world-renowned museums, and a phenomenal food scene.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">2.7M</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">1871</div><div class="modal-fact-label">Great Fire</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_miami: { tag: '✦ Destination', title: 'Miami', body: `<p>Miami is the most international city in the United States — a place where Latin America, the Caribbean, and North America converge in a tropical, neon-lit blur.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">470K</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">Deco</div><div class="modal-fact-label">Architecture</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_nola: { tag: '✦ Destination', title: 'New Orleans', body: `<p>There is nowhere else in America like New Orleans. A gorgeous, complicated port city that birthed Jazz, perfects Creole food, and celebrates life with second-line parades.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">380K</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">1718</div><div class="modal-fact-label">Founded</div></div><div class="modal-fact"><div class="modal-fact-num">$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_vegas: { tag: '✦ Destination', title: 'Las Vegas', body: `<p>An adult playground in the desert. Famous for mega-casino resorts, Michelin-star dining, residencies by global superstars, and access to nearby natural wonders like the Grand Canyon.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">650K</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">24/7</div><div class="modal-fact-label">Nightlife</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_sf: { tag: '✦ Destination', title: 'San Francisco', body: `<p>Famous for the Golden Gate Bridge, steep streets, and Alcatraz. It is a stunning, compact city acting as the cultural and financial heart of Northern California.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">800K</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">Hills</div><div class="modal-fact-label">Geography</div></div><div class="modal-fact"><div class="modal-fact-num">$$$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_seattle: { tag: '✦ Destination', title: 'Seattle', body: `<p>Surrounded by water and majestic mountains. Famous for its coffee culture, Pike Place Market, and acting as the lush gateway to the Pacific Northwest.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">730K</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">Rainy</div><div class="modal-fact-label">Winter Climate</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_austin: { tag: '✦ Destination', title: 'Austin', body: `<p>The Live Music Capital of the World. Austin blends traditional Texas cowboy culture with an explosive tech industry, incredible BBQ, and weird, eclectic art.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">960K</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">BBQ</div><div class="modal-fact-label">Cuisine</div></div><div class="modal-fact"><div class="modal-fact-num">$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_dc: { tag: '✦ Destination', title: 'Washington D.C.', body: `<p>The political heart of the United States. Designed with grand avenues, it houses the US Capitol, the White House, and the incredible (and free) Smithsonian museum network.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">690K</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">19</div><div class="modal-fact-label">Free Museums</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_honolulu: { tag: '✦ Destination', title: 'Honolulu', body: `<p>The capital of Hawaii on the island of Oahu. A stunning fusion of Polynesian culture, East Asian influences, and American lifestyle, framed by iconic Waikiki Beach.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">340K</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">Aloha</div><div class="modal-fact-label">Spirit</div></div><div class="modal-fact"><div class="modal-fact-num">$$$$</div><div class="modal-fact-label">Budget</div></div></div>` },
  dest_boston: { tag: '✦ Destination', title: 'Boston', body: `<p>One of America's oldest cities, rich with Revolutionary War history. Walk the Freedom Trail, visit historic Harvard University, and catch a game at Fenway Park.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">650K</div><div class="modal-fact-label">Population</div></div><div class="modal-fact"><div class="modal-fact-num">1630</div><div class="modal-fact-label">Founded</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">Budget</div></div></div>` },

  // Facts
  fact_population: { tag: '✦ Quick Fact', title: 'Population Diversity', body: '<p>The US population sits at roughly <strong>333 million</strong>. What makes it unique is its unprecedented diversity: it is a nation entirely comprised of indigenous peoples and immigrants from every nation on Earth.</p>' },
  fact_states: { tag: '✦ Quick Fact', title: '50 Unique States', body: '<p>The US is a federal republic of 50 states. Each state maintains its own constitution, laws, and distinct cultural identity. Traveling from Texas to Vermont feels as different as traveling from Spain to Sweden.</p>' },
  fact_parks: { tag: '✦ Quick Fact', title: 'National Parks', body: '<p>America\'s "Best Idea" was the creation of the National Park System. Today there are <strong>63 designated National Parks</strong>, protecting millions of acres of pristine wilderness, geothermal wonders, and ancient ecosystems.</p>' },
  fact_founded: { tag: '✦ Quick Fact', title: '1776', body: '<p>The United States declared independence from Great Britain on July 4, 1776. This bold democratic experiment has since shaped global history.</p>' },
  fact_gdp: { tag: '✦ Quick Fact', title: 'Economic Powerhouse', body: '<p>With a GDP exceeding <strong>$30 Trillion</strong>, the US holds the largest economy in the world. California alone would rank as the world\'s 5th largest economy.</p>' },
  fact_timezones: { tag: '✦ Quick Fact', title: '6 Time Zones', body: '<p>The US spans six time zones (Eastern, Central, Mountain, Pacific, Alaska, and Hawaii). A flight from New York to Los Angeles takes about 6 hours.</p>' },

  // Seasons
  season_spring: { tag: '✦ Season', title: 'Spring in America', body: `<p>Spring is widely considered the best all-around value season: comfortable temperatures nationwide, blooming landscapes, and crowds that haven't yet reached summer peaks.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="72">72°F</div><div class="modal-fact-label">Avg High</div></div><div class="modal-fact"><div class="modal-fact-num">Mar–May</div><div class="modal-fact-label">Months</div></div><div class="modal-fact"><div class="modal-fact-num">Moderate</div><div class="modal-fact-label">Crowds</div></div></div><div class="modal-highlights"><div class="modal-highlight">D.C.'s cherry blossoms peak in late March / early April</div><div class="modal-highlight">Texas Hill Country wildflowers bloom through April</div></div>` },
  season_summer: { tag: '✦ Season', title: 'Summer in America', body: `<p>Peak travel season. National parks, coastlines, and iconic road trips are all in their glory — but so are the crowds and prices. Book accommodations and park reservations well ahead.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="88">88°F</div><div class="modal-fact-label">Avg High</div></div><div class="modal-fact"><div class="modal-fact-num">Jun–Aug</div><div class="modal-fact-label">Months</div></div><div class="modal-fact"><div class="modal-fact-num">Peak</div><div class="modal-fact-label">Crowds</div></div></div><div class="modal-highlights"><div class="modal-highlight">Long daylight hours are ideal for national park hiking</div><div class="modal-highlight">New England beach towns are in full swing</div></div>` },
  season_fall: { tag: '✦ Season', title: 'Fall in America', body: `<p>Many locals consider autumn the single best season to travel: crisp air, thinning crowds, and — above all — New England's legendary foliage transforming entire mountainsides into fire-colored canvases.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="62">62°F</div><div class="modal-fact-label">Avg High</div></div><div class="modal-fact"><div class="modal-fact-num">Sep–Nov</div><div class="modal-fact-label">Months</div></div><div class="modal-fact"><div class="modal-fact-num">Light</div><div class="modal-fact-label">Crowds</div></div></div><div class="modal-highlights"><div class="modal-highlight">Vermont &amp; New Hampshire foliage peaks in early-mid October</div><div class="modal-highlight">Great Smoky Mountains color runs into early November</div></div>` },
  season_winter: { tag: '✦ Season', title: 'Winter in America', body: `<p>A tale of two Americas: bitter cold and world-class skiing in the Rockies and Northeast, versus warm, sunny escapes in Florida, Southern California, and Hawaii. Pick your climate.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="38">38°F</div><div class="modal-fact-label">Avg High</div></div><div class="modal-fact"><div class="modal-fact-num">Dec–Feb</div><div class="modal-fact-label">Months</div></div><div class="modal-fact"><div class="modal-fact-num">Varies</div><div class="modal-fact-label">Crowds</div></div></div><div class="modal-highlights"><div class="modal-highlight">Colorado's ski resorts peak from late December through March</div><div class="modal-highlight">Hawaii &amp; South Florida stay warm and dry year-round</div></div>` },

  // Routes
  route_route66: { tag: '✦ Road Trip', title: 'Route 66 — The Mother Road', body: `<p>The most legendary road trip in America. Route 66 stretches from downtown Chicago to the Santa Monica Pier, threading through eight states, faded neon motel signs, and the wide-open majesty of the Painted Desert.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-dist" data-mi="2448">2,448 mi</div><div class="modal-fact-label">Total Distance</div></div><div class="modal-fact"><div class="modal-fact-num">8</div><div class="modal-fact-label">States</div></div><div class="modal-fact"><div class="modal-fact-num">2–3 Wks</div><div class="modal-fact-label">Duration</div></div></div><div class="modal-highlights"><div class="modal-highlight">Cadillac Ranch — ten graffiti-covered Cadillacs buried nose-down in a Texas field</div><div class="modal-highlight">The Grand Canyon is an easy detour near Williams, Arizona</div></div>` },
  route_pch: { tag: '✦ Road Trip', title: 'The Pacific Coast Highway', body: `<p>Highway 1 clings to cliffs above the Pacific for nearly the entire length of the West Coast. It is consistently ranked among the most scenic drives on Earth, alternating towering redwoods, wild beaches, and impossibly dramatic coastline.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-dist" data-mi="1650">1,650 mi</div><div class="modal-fact-label">Total Distance</div></div><div class="modal-fact"><div class="modal-fact-num">3</div><div class="modal-fact-label">States</div></div><div class="modal-fact"><div class="modal-fact-num">10–14 Days</div><div class="modal-fact-label">Duration</div></div></div><div class="modal-highlights"><div class="modal-highlight">Big Sur's Bixby Bridge is one of the most photographed spots in California</div><div class="modal-highlight">Redwood National Park has trees older than the Roman Empire</div></div>` },
  route_parksloop: { tag: '✦ Road Trip', title: 'The Grand Circle Parks Loop', body: `<p>Utah's "Mighty Five" national parks plus the Grand Canyon form the densest concentration of geological spectacle anywhere on the planet. Base yourself in Las Vegas and loop through red-rock canyons, hoodoos, and ancient mesas.</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-dist" data-mi="980">980 mi</div><div class="modal-fact-label">Total Distance</div></div><div class="modal-fact"><div class="modal-fact-num">3</div><div class="modal-fact-label">States</div></div><div class="modal-fact"><div class="modal-fact-num">10–12 Days</div><div class="modal-fact-label">Duration</div></div></div><div class="modal-highlights"><div class="modal-highlight">Zion's Angels Landing is one of the most thrilling day hikes in the US</div><div class="modal-highlight">Monument Valley's mesas appear in countless classic Western films</div></div>` },

  // Culture
  culture_rock: { tag: '✦ Cultural Pillar', title: 'The Birth of Rock & Country', body: '<p>American music changed the world. <strong>Memphis</strong> birthed Rock & Roll, blending blues with country. <strong>Nashville</strong> remains the undisputed capital of Country music.</p>' },
  culture_jazz: { tag: '✦ Cultural Pillar', title: 'Jazz & The Blues', body: '<p>Born in the streets of <strong>New Orleans</strong>, Jazz is America\'s original art form. From the smoky clubs of the French Quarter to the legendary blues joints of the Mississippi Delta.</p>' },
  culture_texmex: { tag: '✦ Cultural Pillar', title: 'Tex-Mex Cuisine', body: '<p>Born along the Texas-Mexico border, this culinary fusion gave the world fajitas, nachos, and chili con carne, heavily relying on melted cheeses, beef, and spices.</p>' },
  culture_seafood: { tag: '✦ Cultural Pillar', title: 'New England Seafood', body: '<p>The cold waters of the Atlantic coast produce extraordinary seafood. A trip to Maine isn\'t complete without a fresh lobster roll, while Boston is famous for clam chowder.</p>' },
  culture_broadway: { tag: '✦ Cultural Pillar', title: 'Broadway & Theater', body: '<p>The 41 professional theaters in Manhattan\'s Theater District represent the highest level of commercial theater in the English-speaking world.</p>' },
  culture_bbq: { tag: '✦ Cultural Pillar', title: 'The Religion of BBQ', body: '<p>American Barbecue is deeply regional. <strong>Texas</strong> focuses on smoked brisket. <strong>Kansas City</strong> loves thick sauces. <strong>The Carolinas</strong> prefer pork, and <strong>Memphis</strong> excels at dry-rubbed ribs.</p>' },
  culture_streetart: { tag: '✦ Cultural Pillar', title: 'Urban Street Art', body: '<p>American cities are open-air museums. Miami\'s Wynwood Walls revolutionized neighborhood revitalization through graffiti. Cities like Los Angeles and Detroit boast thousands of murals.</p>' },
  culture_sports: { tag: '✦ Cultural Pillar', title: 'Sports as Religion', body: '<p>Americans consume sports voraciously. Tailgating before an NFL game, attending a baseball game in the heat of summer, or watching the frenzied passion of College Football.</p>' },
  culture_hollywood: { tag: '✦ Cultural Pillar', title: 'Hollywood', body: '<p>Los Angeles is the dream factory of the world. The Hollywood sign, the Walk of Fame, and the sprawling studio lots still dictate global pop culture.</p>' },
  culture_pizza: { tag: '✦ Cultural Pillar', title: 'NYC Pizza Culture', body: '<p>Brought by Italian immigrants, the New York slice is characterized by its wide, thin, foldable crust. You can grab a perfect slice for just a few dollars on almost any Manhattan corner.</p>' },
  culture_smithsonian: { tag: '✦ Cultural Pillar', title: 'The Smithsonian Institution', body: '<p>Located in Washington D.C., the Smithsonian is the world\'s largest museum complex. Every single one of its 19 museums is <strong>completely free to enter</strong>.</p>' },
  culture_farmtable: { tag: '✦ Cultural Pillar', title: 'Farm-to-Table Revolution', body: '<p>Pioneered in places like Berkeley, the Farm-to-Table movement emphasizes hyper-local, seasonal, and organic ingredients. The Pacific Northwest and California lead the world here.</p>' },

  // Practical/Tips
  prac_transport: { tag: '✦ Travel Essential', title: 'Getting to the USA', body: '<p>Primary gateways for international arrivals are <strong>JFK in New York</strong>, <strong>LAX in Los Angeles</strong>, and <strong>O\'Hare in Chicago</strong>. For most visitors from Visa Waiver Program countries, entry requires an <strong>ESTA</strong>.</p>' },
  prac_driving: { tag: '✦ Travel Essential', title: 'Getting Around America', body: '<p>The US is a driving nation. Outside of major cities like NYC, Boston, and Chicago, a rental car is essential. For city travel, Uber and Lyft operate everywhere.</p>' },
  prac_money: { tag: '✦ Travel Essential', title: 'Money & Costs', body: '<p>Credit and debit cards are accepted virtually everywhere. <strong>Tipping is mandatory:</strong> 18–22% at restaurants. Also, sales tax is never included in the displayed price.</p>' },
  prac_health: { tag: '✦ Travel Essential', title: 'Health & Safety', body: '<p>The US has excellent healthcare, but it is expensive without insurance. <strong>Comprehensive travel insurance is absolutely essential.</strong> Emergency number is <strong>911</strong>.</p>' },

  tip_parks: { tag: '✦ Insider Tip', title: 'Booking National Parks', body: '<p>Do not just show up to popular National Parks in summer. Parks like Yosemite and Arches require <strong>timed-entry reservations</strong> just to drive in. Book months in advance.</p>' },
  tip_tax: { tag: '✦ Insider Tip', title: 'Sales Tax at the Register', body: '<p>The US does not include sales tax in the sticker price. Tax varies locally, typically ranging from <strong>4% to 10%</strong> depending on the state and city.</p>' },
  tip_sim: { tag: '✦ Insider Tip', title: 'Getting Connected', body: '<p>Purchase a prepaid eSIM before you arrive (like Airalo) or a physical SIM from T-Mobile/AT&T. If visiting remote National Parks, <strong>Verizon</strong> offers the best rural coverage.</p>' },
  tip_distance: { tag: '✦ Insider Tip', title: 'Enormous Distances', body: '<p>"In Europe, 100 miles is a long way. In America, 100 years is a long time." Driving from Florida to New York takes 20 hours. Do not try to see the East Coast and the Grand Canyon in a 7-day trip.</p>' },
  tip_tipping: { tag: '✦ Insider Tip', title: 'Tipping is Not Optional', body: '<p>Waitstaff and bartenders rely heavily on tips to make a living wage. The standard rate is <strong>18% to 22%</strong> on the pre-tax bill. Leaving no tip is considered highly offensive.</p>' },
  tip_pass: { tag: '✦ Insider Tip', title: 'America The Beautiful Pass', body: '<p>If you plan to visit 3 or more National Parks, buy the <strong>$80 Annual Pass</strong>. It covers entry for a whole vehicle at all 63 National Parks for an entire year.</p>' },
  tip_food: { tag: '✦ Insider Tip', title: 'Eat Like a Local', body: '<p>Avoid chain restaurants near tourist traps. Walk 15 minutes in any direction to find where the locals eat. Use Yelp or Google Maps to find highly-rated mom-and-pop diners.</p>' },
  tip_driving: { tag: '✦ Insider Tip', title: 'Right Turn on Red', body: '<p>Unless there is a specific sign saying "No Turn on Red," it is perfectly legal to make a right turn at a red traffic light, provided you come to a complete stop first.</p>' },
};

/* Translated modal content, keyed identically to MODAL_DATA above.
   getModalData() falls back to English MODAL_DATA for any key missing here. */
const MODAL_DATA_I18N = {
zh: {
  region_northeast: {
    tag: '✦ 地区 — 东北部', title: '东北部',
    body: `<p>美国人口最密集、历史底蕴最深厚的角落，东北部从缅因州崎岖的海岸线一直延伸到繁华的华盛顿特区都会区。这里是美国的起源之地。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">9</div><div class="modal-fact-label">州数</div></div><div class="modal-fact"><div class="modal-fact-num">5500万+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">9–11月</div><div class="modal-fact-label">最佳季节</div></div></div><div class="modal-highlights"><div class="modal-highlight">纽约：时代广场、中央公园、布鲁克林大桥、大都会博物馆</div><div class="modal-highlight">波士顿：自由之路、哈佛大学、芬威球场</div></div>`
  },
  region_south: {
    tag: '✦ 地区 — 南部', title: '美国南部',
    body: `<p>美国没有哪个地区能像南部这样，拥有如此丰富的故事、音乐与美食传统。从萨凡纳挂满西班牙苔藓的广场，到纳什维尔霓虹闪烁的乡村酒吧。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">16</div><div class="modal-fact-label">州数</div></div><div class="modal-fact"><div class="modal-fact-num">1.25亿+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">3–5月</div><div class="modal-fact-label">最佳季节</div></div></div>`
  },
  region_midwest: {
    tag: '✦ 地区 — 中西部', title: '中西部',
    body: `<p>常被国际游客忽视的中西部，却以世界级的博物馆、非凡的美食场景，以及真诚朴实的热情回馈着好奇的旅行者。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">12</div><div class="modal-fact-label">州数</div></div><div class="modal-fact"><div class="modal-fact-num">6800万+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">6–9月</div><div class="modal-fact-label">最佳季节</div></div></div>`
  },
  region_west: {
    tag: '✦ 地区 — 西部', title: '美国西部',
    body: `<p>西部是美国神话的发源地：淘金热、边疆开拓、反主流文化、科技革命，皆在此地生根。这里既有全国最高的山峰，也有最干旱的沙漠。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">11</div><div class="modal-fact-label">州数</div></div><div class="modal-fact"><div class="modal-fact-num">8000万+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">全年皆宜</div><div class="modal-fact-label">最佳季节</div></div></div>`
  },
  region_southwest: {
    tag: '✦ 地区 — 西南部', title: '西南部',
    body: `<p>地球上再没有第二个地方，能像美国西南部这样将地质构造与光影完美结合。科罗拉多高原是地球上最壮观的侵蚀地貌景观。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">4</div><div class="modal-fact-label">核心州</div></div><div class="modal-fact"><div class="modal-fact-num">5</div><div class="modal-fact-label">犹他五大公园</div></div><div class="modal-fact"><div class="modal-fact-num">3–5月</div><div class="modal-fact-label">最佳季节</div></div></div>`
  },

  dest_nyc: { tag: '✦ 目的地', title: '纽约市', body: `<p>纽约市是当之无愧的世界之都。八百万人挤在几座岛屿上，说着800种语言。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">800万+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">5</div><div class="modal-fact-label">行政区</div></div><div class="modal-fact"><div class="modal-fact-num">$$$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_la: { tag: '✦ 目的地', title: '洛杉矶', body: `<p>全球娱乐产业蔓延式发展的核心地带。从格里菲斯天文台到圣莫尼卡海滩，洛杉矶与其说是一座城市，不如说是众多独立、依赖汽车连接的社区的庞大集合。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">400万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="75">75°F</div><div class="modal-fact-label">平均气温</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_chicago: { tag: '✦ 目的地', title: '芝加哥', body: `<p>美国的建筑之都。芝加哥雄踞密歇根湖畔，拥有令人惊叹的天际线、世界闻名的博物馆，以及极佳的美食场景。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">270万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">1871</div><div class="modal-fact-label">大火之年</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_miami: { tag: '✦ 目的地', title: '迈阿密', body: `<p>迈阿密是美国最具国际化色彩的城市——拉丁美洲、加勒比海与北美文化在此交汇，呈现出一种热带霓虹般的独特氛围。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">47万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">装饰艺术</div><div class="modal-fact-label">建筑风格</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_nola: { tag: '✦ 目的地', title: '新奥尔良', body: `<p>美国再无第二个地方能与新奥尔良相比。这座迷人而复杂的港口城市孕育了爵士乐，成就了极致的克里奥尔美食，并以街头巡游庆祝生命的每一刻。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">38万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">1718</div><div class="modal-fact-label">建城年份</div></div><div class="modal-fact"><div class="modal-fact-num">$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_vegas: { tag: '✦ 目的地', title: '拉斯维加斯', body: `<p>沙漠中的成人游乐场。以超大型赌场度假村、米其林星级餐饮、全球巨星驻场演出，以及临近大峡谷等自然奇观的便利交通而闻名。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">65万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">24/7</div><div class="modal-fact-label">夜生活</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_sf: { tag: '✦ 目的地', title: '旧金山', body: `<p>以金门大桥、陡峭的街道和恶魔岛闻名。这座精致紧凑的城市，是北加州的文化与金融中心。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">80万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">丘陵</div><div class="modal-fact-label">地形</div></div><div class="modal-fact"><div class="modal-fact-num">$$$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_seattle: { tag: '✦ 目的地', title: '西雅图', body: `<p>被水域与雄伟山脉环抱。以咖啡文化、派克市场闻名，也是通往太平洋西北地区葱郁自然风光的门户。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">73万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">多雨</div><div class="modal-fact-label">冬季气候</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_austin: { tag: '✦ 目的地', title: '奥斯汀', body: `<p>世界现场音乐之都。奥斯汀将传统德州牛仔文化与蓬勃发展的科技产业、绝佳的烧烤美食，以及古怪多元的艺术氛围融为一体。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">96万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">烧烤</div><div class="modal-fact-label">特色美食</div></div><div class="modal-fact"><div class="modal-fact-num">$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_dc: { tag: '✦ 目的地', title: '华盛顿特区', body: `<p>美国的政治心脏。这座城市以宏伟大道规划而成，坐落着美国国会大厦、白宫，以及令人惊叹的免费史密森尼博物馆群。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">69万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">19</div><div class="modal-fact-label">免费博物馆</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_honolulu: { tag: '✦ 目的地', title: '檀香山', body: `<p>夏威夷州的首府，坐落在瓦胡岛上。波利尼西亚文化、东亚影响与美式生活方式在此完美融合，标志性的威基基海滩环绕四周。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">34万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">Aloha</div><div class="modal-fact-label">精神</div></div><div class="modal-fact"><div class="modal-fact-num">$$$$</div><div class="modal-fact-label">预算</div></div></div>` },
  dest_boston: { tag: '✦ 目的地', title: '波士顿', body: `<p>美国最古老的城市之一，承载着丰富的独立战争历史。漫步自由之路，参观历史悠久的哈佛大学，或在芬威球场观看一场比赛。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">65万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">1630</div><div class="modal-fact-label">建城年份</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">预算</div></div></div>` },

  fact_population: { tag: '✦ 趣味知识', title: '人口多样性', body: '<p>美国人口约为<strong>3.33亿</strong>。其独特之处在于前所未有的多样性：这是一个完全由原住民和来自世界各国的移民共同构成的国家。</p>' },
  fact_states: { tag: '✦ 趣味知识', title: '50个各具特色的州', body: '<p>美国是由50个州组成的联邦共和国。每个州都拥有自己的宪法、法律以及独特的文化身份。从德克萨斯到佛蒙特，旅行的感受差异之大，堪比从西班牙到瑞典。</p>' },
  fact_parks: { tag: '✦ 趣味知识', title: '国家公园', body: '<p>建立国家公园体系被誉为美国"最伟大的创意"。如今，美国已拥有<strong>63座正式指定的国家公园</strong>，守护着数百万英亩的原始荒野、地热奇观与古老生态系统。</p>' },
  fact_founded: { tag: '✦ 趣味知识', title: '1776年', body: '<p>1776年7月4日，美国正式宣布脱离大英帝国独立。这场大胆的民主实验此后深刻塑造了世界历史的进程。</p>' },
  fact_gdp: { tag: '✦ 趣味知识', title: '经济强国', body: '<p>美国GDP超过<strong>30万亿美元</strong>，是世界第一大经济体。仅加州的经济体量，就足以登上全球前五大经济体之列。</p>' },
  fact_timezones: { tag: '✦ 趣味知识', title: '6个时区', body: '<p>美国横跨六个时区（东部、中部、山地、太平洋、阿拉斯加和夏威夷）。从纽约飞往洛杉矶大约需要6小时。</p>' },

  season_spring: { tag: '✦ 季节', title: '美国的春季', body: `<p>春季普遍被认为是综合性价比最高的季节：全国气温宜人，风景生机勃勃，人潮也尚未达到夏季高峰。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="72">72°F</div><div class="modal-fact-label">平均高温</div></div><div class="modal-fact"><div class="modal-fact-num">3–5月</div><div class="modal-fact-label">月份</div></div><div class="modal-fact"><div class="modal-fact-num">适中</div><div class="modal-fact-label">人流量</div></div></div><div class="modal-highlights"><div class="modal-highlight">华盛顿特区的樱花在三月末至四月初盛放</div><div class="modal-highlight">德州丘陵地带的野花花期持续至四月</div></div>` },
  season_summer: { tag: '✦ 季节', title: '美国的夏季', body: `<p>旅游旺季。国家公园、海岸线与经典自驾路线都处于最佳状态——但人潮与物价也随之攀升。请务必提前预订住宿与公园门票。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="88">88°F</div><div class="modal-fact-label">平均高温</div></div><div class="modal-fact"><div class="modal-fact-num">6–8月</div><div class="modal-fact-label">月份</div></div><div class="modal-fact"><div class="modal-fact-num">高峰</div><div class="modal-fact-label">人流量</div></div></div><div class="modal-highlights"><div class="modal-highlight">白昼时间长，是徒步游览国家公园的理想时机</div><div class="modal-highlight">新英格兰海滨小镇进入全盛时期</div></div>` },
  season_fall: { tag: '✦ 季节', title: '美国的秋季', body: `<p>许多本地人认为秋季是全年最佳旅行季节：空气清爽，人潮渐少，最重要的是，新英格兰传奇般的秋叶将整片山峦染成如火如荼的绚烂色彩。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="62">62°F</div><div class="modal-fact-label">平均高温</div></div><div class="modal-fact"><div class="modal-fact-num">9–11月</div><div class="modal-fact-label">月份</div></div><div class="modal-fact"><div class="modal-fact-num">较少</div><div class="modal-fact-label">人流量</div></div></div><div class="modal-highlights"><div class="modal-highlight">佛蒙特与新罕布什尔的秋叶在十月上中旬达到顶峰</div><div class="modal-highlight">大烟山的秋色可持续至十一月初</div></div>` },
  season_winter: { tag: '✦ 季节', title: '美国的冬季', body: `<p>这是两个截然不同的美国：落基山脉与东北部严寒刺骨，滑雪场景世界一流；而佛罗里达、南加州与夏威夷则是温暖阳光的避寒胜地。选择你想要的气候。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="38">38°F</div><div class="modal-fact-label">平均高温</div></div><div class="modal-fact"><div class="modal-fact-num">12–2月</div><div class="modal-fact-label">月份</div></div><div class="modal-fact"><div class="modal-fact-num">因地而异</div><div class="modal-fact-label">人流量</div></div></div><div class="modal-highlights"><div class="modal-highlight">科罗拉多滑雪胜地在12月末至次年3月迎来高峰</div><div class="modal-highlight">夏威夷与南佛罗里达全年温暖干燥</div></div>` },

  route_route66: { tag: '✦ 自驾路线', title: '66号公路 — 母亲之路', body: `<p>美国最富传奇色彩的自驾路线。66号公路从芝加哥市中心延伸至圣莫尼卡码头，贯穿八个州，沿途尽是褪色的霓虹汽车旅馆招牌，以及彩绘沙漠的辽阔壮美。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-dist" data-mi="2448">2,448 mi</div><div class="modal-fact-label">总里程</div></div><div class="modal-fact"><div class="modal-fact-num">8</div><div class="modal-fact-label">途经州数</div></div><div class="modal-fact"><div class="modal-fact-num">2–3周</div><div class="modal-fact-label">建议时长</div></div></div><div class="modal-highlights"><div class="modal-highlight">凯迪拉克农场——十辆涂鸦装饰的凯迪拉克车头朝下埋在德州的田野中</div><div class="modal-highlight">在亚利桑那州威廉姆斯附近，可轻松绕道前往大峡谷</div></div>` },
  route_pch: { tag: '✦ 自驾路线', title: '太平洋海岸公路', body: `<p>1号公路几乎全程沿着太平洋沿岸的悬崖蜿蜒而行，贯穿整个西海岸。它一直被公认为地球上最美的公路之一，沿途交替出现参天红杉、荒野海滩与令人惊叹的壮丽海岸线。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-dist" data-mi="1650">1,650 mi</div><div class="modal-fact-label">总里程</div></div><div class="modal-fact"><div class="modal-fact-num">3</div><div class="modal-fact-label">途经州数</div></div><div class="modal-fact"><div class="modal-fact-num">10–14天</div><div class="modal-fact-label">建议时长</div></div></div><div class="modal-highlights"><div class="modal-highlight">大瑟尔的比克斯比大桥是加州拍照率最高的地点之一</div><div class="modal-highlight">红杉国家公园中的树木比罗马帝国的历史还要悠久</div></div>` },
  route_parksloop: { tag: '✦ 自驾路线', title: '大环线国家公园之旅', body: `<p>犹他州的"五大奇迹"国家公园加上大峡谷，构成了地球上自然奇观最为密集的区域。以拉斯维加斯为大本营，环游红岩峡谷、奇石地貌与古老台地。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-dist" data-mi="980">980 mi</div><div class="modal-fact-label">总里程</div></div><div class="modal-fact"><div class="modal-fact-num">3</div><div class="modal-fact-label">途经州数</div></div><div class="modal-fact"><div class="modal-fact-num">10–12天</div><div class="modal-fact-label">建议时长</div></div></div><div class="modal-highlights"><div class="modal-highlight">锡安国家公园的天使降临径，是美国最刺激的单日徒步路线之一</div><div class="modal-highlight">纪念碑谷的台地曾出现在无数经典西部电影之中</div></div>` },

  culture_rock: { tag: '✦ 文化支柱', title: '摇滚与乡村音乐的诞生', body: '<p>美国音乐改变了世界。<strong>孟菲斯</strong>孕育了摇滚乐，将蓝调与乡村音乐融为一体。<strong>纳什维尔</strong>至今仍是无可争议的乡村音乐之都。</p>' },
  culture_jazz: { tag: '✦ 文化支柱', title: '爵士与蓝调', body: '<p>诞生于<strong>新奥尔良</strong>街头的爵士乐，是美国原创的艺术形式。从法语区烟雾缭绕的俱乐部，到密西西比三角洲传奇的蓝调酒吧。</p>' },
  culture_texmex: { tag: '✦ 文化支柱', title: '德州墨西哥风味料理', body: '<p>这种融合料理诞生于德州与墨西哥边境地带，为世界带来了法士达、玉米片和辣肉酱，大量运用融化奶酪、牛肉与香料。</p>' },
  culture_seafood: { tag: '✦ 文化支柱', title: '新英格兰海鲜', body: '<p>大西洋沿岸的冷水域孕育出非凡的海鲜。到缅因州旅行，怎能不品尝一份新鲜的龙虾卷；而波士顿则以蛤蜊浓汤闻名遐迩。</p>' },
  culture_broadway: { tag: '✦ 文化支柱', title: '百老汇与戏剧', body: '<p>曼哈顿剧院区内的41家专业剧院，代表着英语世界商业戏剧的最高水准。</p>' },
  culture_bbq: { tag: '✦ 文化支柱', title: '烧烤信仰', body: '<p>美式烧烤有着极强的地域特色。<strong>德州</strong>专注于烟熏牛胸肉。<strong>堪萨斯城</strong>偏爱浓稠酱汁。<strong>卡罗来纳</strong>钟情猪肉，而<strong>孟菲斯</strong>则擅长干抹料排骨。</p>' },
  culture_streetart: { tag: '✦ 文化支柱', title: '城市街头艺术', body: '<p>美国的城市宛如露天博物馆。迈阿密的Wynwood壁画区通过涂鸦艺术彻底革新了社区复兴模式。洛杉矶与底特律等城市，则拥有数以千计的壁画作品。</p>' },
  culture_sports: { tag: '✦ 文化支柱', title: '体育即信仰', body: '<p>美国人对体育的热爱近乎狂热。无论是NFL赛前的车尾派对、盛夏时节的棒球赛现场，还是观看大学橄榄球赛时那份近乎痴狂的激情。</p>' },
  culture_hollywood: { tag: '✦ 文化支柱', title: '好莱坞', body: '<p>洛杉矶是世界的造梦工厂。好莱坞标志、星光大道，以及绵延不绝的制片厂片场，至今仍在引领着全球流行文化的走向。</p>' },
  culture_pizza: { tag: '✦ 文化支柱', title: '纽约披萨文化', body: '<p>由意大利移民带入美国，纽约披萨以宽大、轻薄、可对折的饼皮著称。在曼哈顿几乎任何一个街角，你都能以几美元的价格买到一块完美的披萨。</p>' },
  culture_smithsonian: { tag: '✦ 文化支柱', title: '史密森尼学会', body: '<p>坐落于华盛顿特区，史密森尼学会是世界上规模最大的博物馆机构。旗下全部19座博物馆<strong>均可完全免费参观</strong>。</p>' },
  culture_farmtable: { tag: '✦ 文化支柱', title: '从农场到餐桌革命', body: '<p>这一理念率先在伯克利等地兴起，强调高度本地化、时令性与有机食材。太平洋西北地区与加州在这一领域引领全球潮流。</p>' },

  prac_transport: { tag: '✦ 旅行要点', title: '如何抵达美国', body: '<p>国际旅客的主要入境口岸包括<strong>纽约的肯尼迪机场</strong>、<strong>洛杉矶的LAX机场</strong>，以及<strong>芝加哥的奥黑尔机场</strong>。对于大多数免签计划国家的游客而言，入境需要申请<strong>ESTA</strong>。</p>' },
  prac_driving: { tag: '✦ 旅行要点', title: '美国境内出行', body: '<p>美国是一个高度依赖驾车出行的国家。除纽约、波士顿、芝加哥等大城市外，租车几乎是必需的。在城市内出行，Uber和Lyft随处可用。</p>' },
  prac_money: { tag: '✦ 旅行要点', title: '货币与花费', body: '<p>信用卡与借记卡几乎在所有场所都可使用。<strong>小费是强制性的：</strong>餐厅小费为18–22%。此外，销售税从不包含在标示价格之中。</p>' },
  prac_health: { tag: '✦ 旅行要点', title: '健康与安全', body: '<p>美国拥有优质的医疗体系，但若无保险，费用极其高昂。<strong>购买全面的旅行保险绝对是必不可少的。</strong>紧急电话号码为<strong>911</strong>。</p>' },

  tip_parks: { tag: '✦ 小提示', title: '预订国家公园', body: '<p>夏季切勿直接前往热门国家公园却不做准备。像优胜美地和拱门国家公园这类公园，即使只是开车进入，也需要<strong>预约限时入园名额</strong>。请提前数月预订。</p>' },
  tip_tax: { tag: '✦ 小提示', title: '结账时另计的销售税', body: '<p>美国的标价并不包含销售税。税率因地而异，通常在<strong>4%到10%</strong>之间，具体取决于所在州与城市。</p>' },
  tip_sim: { tag: '✦ 小提示', title: '保持网络连接', body: '<p>建议在抵达前购买预付费eSIM（如Airalo），或抵达后在T-Mobile/AT&T购买实体SIM卡。若计划前往偏远的国家公园，<strong>Verizon</strong>的乡村地区信号覆盖最佳。</p>' },
  tip_distance: { tag: '✦ 小提示', title: '距离远超想象', body: '<p>"在欧洲，100英里已是很远的距离；在美国，100年才算得上悠久的历史。"从佛罗里达开车到纽约需要20小时。切勿试图在7天的行程中，同时游览东海岸与大峡谷。</p>' },
  tip_tipping: { tag: '✦ 小提示', title: '小费并非可选项', body: '<p>服务员与调酒师的生计在很大程度上依赖小费维持。标准小费比例为税前账单的<strong>18%至22%</strong>。不给小费会被视为极不礼貌的行为。</p>' },
  tip_pass: { tag: '✦ 小提示', title: '"美丽美国"年票', body: '<p>如果你计划游览3座或以上的国家公园，不妨购买<strong>80美元的年票</strong>。该通票可让一整车人在一年内免费进入全部63座国家公园。</p>' },
  tip_food: { tag: '✦ 小提示', title: '像当地人一样用餐', body: '<p>避开旅游陷阱附近的连锁餐厅。朝任意方向步行15分钟，就能找到当地人常去的餐馆。可借助Yelp或谷歌地图，寻找评分很高的家庭小馆。</p>' },
  tip_driving: { tag: '✦ 小提示', title: '红灯右转', body: '<p>除非有明确标示"禁止红灯右转"，否则在完全停稳车辆后，红灯时右转在美国是完全合法的行为。</p>' }
},
ja: {
  region_northeast: {
    tag: '✦ 地域 — 北東部', title: '北東部',
    body: `<p>アメリカで最も人口密度が高く、歴史的にも重厚なこの一角は、メイン州の荒々しい海岸線から活気あふれる大都市圏ワシントンD.C.まで広がっています。ここはアメリカ誕生の地です。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">9</div><div class="modal-fact-label">州数</div></div><div class="modal-fact"><div class="modal-fact-num">5,500万+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">9〜11月</div><div class="modal-fact-label">ベストシーズン</div></div></div><div class="modal-highlights"><div class="modal-highlight">ニューヨーク：タイムズスクエア、セントラルパーク、ブルックリン橋、メトロポリタン美術館</div><div class="modal-highlight">ボストン：フリーダムトレイル、ハーバード大学、フェンウェイパーク</div></div>`
  },
  region_south: {
    tag: '✦ 地域 — 南部', title: 'アメリカ南部',
    body: `<p>物語性、音楽、そして食文化の豊かさにおいて、南部に匹敵する地域はアメリカにありません。スパニッシュモスに覆われたサバンナの広場から、ネオンきらめくナッシュビルのホンキートンクまで。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">16</div><div class="modal-fact-label">州数</div></div><div class="modal-fact"><div class="modal-fact-num">1億2,500万+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">3〜5月</div><div class="modal-fact-label">ベストシーズン</div></div></div>`
  },
  region_midwest: {
    tag: '✦ 地域 — 中西部', title: '中西部',
    body: `<p>海外からの旅行者に見過ごされがちな中西部ですが、世界水準の博物館、驚くほど豊かな食文化、そして飾らない温かさで好奇心旺盛な旅行者に応えてくれます。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">12</div><div class="modal-fact-label">州数</div></div><div class="modal-fact"><div class="modal-fact-num">6,800万+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">6〜9月</div><div class="modal-fact-label">ベストシーズン</div></div></div>`
  },
  region_west: {
    tag: '✦ 地域 — 西部', title: 'アメリカ西部',
    body: `<p>西部はアメリカの神話が息づく場所——ゴールドラッシュ、フロンティア精神、カウンターカルチャー、そしてテック革命。全米最高峰の山々と、最も乾燥した砂漠がここにあります。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">11</div><div class="modal-fact-label">州数</div></div><div class="modal-fact"><div class="modal-fact-num">8,000万+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">通年</div><div class="modal-fact-label">ベストシーズン</div></div></div>`
  },
  region_southwest: {
    tag: '✦ 地域 — 南西部', title: '南西部',
    body: `<p>地質と光がこれほど見事に融合する場所は、地球上どこを探してもアメリカ南西部をおいて他にありません。コロラド高原は、地球上で最も壮大な侵食地形です。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">4</div><div class="modal-fact-label">中心となる州</div></div><div class="modal-fact"><div class="modal-fact-num">5</div><div class="modal-fact-label">ユタ州の名立たる公園</div></div><div class="modal-fact"><div class="modal-fact-num">3〜5月</div><div class="modal-fact-label">ベストシーズン</div></div></div>`
  },

  dest_nyc: { tag: '✦ 目的地', title: 'ニューヨーク市', body: `<p>ニューヨーク市はまさに世界都市の代名詞。800万人がわずかな島々にひしめき合い、800もの言語が飛び交います。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">800万+</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">5</div><div class="modal-fact-label">行政区</div></div><div class="modal-fact"><div class="modal-fact-num">$$$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_la: { tag: '✦ 目的地', title: 'ロサンゼルス', body: `<p>世界的なエンターテインメント産業が広がる中心地。グリフィス天文台からサンタモニカのビーチまで、ロサンゼルスは一つの街というより、車で結ばれた個性豊かな地区の巨大な集合体です。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">400万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="75">75°F</div><div class="modal-fact-label">平均気温</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_chicago: { tag: '✦ 目的地', title: 'シカゴ', body: `<p>アメリカの建築の都。ミシガン湖畔に堂々と佇むシカゴは、息をのむスカイライン、世界的に名高い博物館群、そして卓越した食文化を誇ります。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">270万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">1871</div><div class="modal-fact-label">大火の年</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_miami: { tag: '✦ 目的地', title: 'マイアミ', body: `<p>マイアミはアメリカで最も国際色豊かな都市——ラテンアメリカ、カリブ海、北米が交差し、トロピカルでネオンきらめく独特の空気を作り出しています。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">47万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">アールデコ</div><div class="modal-fact-label">建築様式</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_nola: { tag: '✦ 目的地', title: 'ニューオーリンズ', body: `<p>ニューオーリンズのような場所は、アメリカのどこにもありません。ジャズを生み出し、クレオール料理を極め、セカンドラインパレードで人生を祝福する、美しくも複雑な港町です。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">38万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">1718</div><div class="modal-fact-label">創設年</div></div><div class="modal-fact"><div class="modal-fact-num">$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_vegas: { tag: '✦ 目的地', title: 'ラスベガス', body: `<p>砂漠に現れた大人の遊び場。巨大カジノリゾート、ミシュラン星付きレストラン、世界的スーパースターのレジデンシー公演、そしてグランドキャニオンなど近郊の自然の絶景へのアクセスの良さで知られています。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">65万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">24/7</div><div class="modal-fact-label">ナイトライフ</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_sf: { tag: '✦ 目的地', title: 'サンフランシスコ', body: `<p>ゴールデンゲートブリッジ、急な坂道、そしてアルカトラズ島で有名。北カリフォルニアの文化と金融の中心地として機能する、コンパクトで見事な街です。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">80万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">丘陵地形</div><div class="modal-fact-label">地形</div></div><div class="modal-fact"><div class="modal-fact-num">$$$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_seattle: { tag: '✦ 目的地', title: 'シアトル', body: `<p>水と雄大な山々に囲まれた街。コーヒー文化やパイク・プレイス・マーケットで有名で、太平洋北西部への緑豊かな玄関口としての役割も担っています。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">73万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">多雨</div><div class="modal-fact-label">冬の気候</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_austin: { tag: '✦ 目的地', title: 'オースティン', body: `<p>世界のライブ音楽の都。オースティンは伝統的なテキサスのカウボーイ文化と、急成長するテック産業、極上のBBQ、そして風変わりで個性的なアートシーンを融合させています。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">96万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">BBQ</div><div class="modal-fact-label">名物料理</div></div><div class="modal-fact"><div class="modal-fact-num">$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_dc: { tag: '✦ 目的地', title: 'ワシントンD.C.', body: `<p>アメリカの政治の中心地。壮大な大通りを軸に設計され、連邦議会議事堂、ホワイトハウス、そして驚くほど充実した無料のスミソニアン博物館群を擁しています。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">69万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">19</div><div class="modal-fact-label">無料博物館</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_honolulu: { tag: '✦ 目的地', title: 'ホノルル', body: `<p>オアフ島にあるハワイ州の州都。ポリネシア文化、東アジアの影響、アメリカ的ライフスタイルが見事に融合し、象徴的なワイキキビーチがその魅力を引き立てています。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">34万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">アロハ</div><div class="modal-fact-label">スピリット</div></div><div class="modal-fact"><div class="modal-fact-num">$$$$</div><div class="modal-fact-label">予算</div></div></div>` },
  dest_boston: { tag: '✦ 目的地', title: 'ボストン', body: `<p>アメリカ独立戦争の歴史が色濃く残る、最古の都市の一つ。フリーダムトレイルを歩き、歴史あるハーバード大学を訪れ、フェンウェイパークで試合観戦を楽しみましょう。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num">65万</div><div class="modal-fact-label">人口</div></div><div class="modal-fact"><div class="modal-fact-num">1630</div><div class="modal-fact-label">創設年</div></div><div class="modal-fact"><div class="modal-fact-num">$$$</div><div class="modal-fact-label">予算</div></div></div>` },

  fact_population: { tag: '✦ 豆知識', title: '人口の多様性', body: '<p>アメリカの人口はおよそ<strong>3億3,300万人</strong>。その最大の特徴は前例のない多様性にあります——先住民と、世界中のあらゆる国からの移民によって成り立つ国なのです。</p>' },
  fact_states: { tag: '✦ 豆知識', title: '50の個性豊かな州', body: '<p>アメリカは50の州からなる連邦共和国です。各州はそれぞれ独自の憲法、法律、そして際立った文化的アイデンティティを持っています。テキサスからバーモントへの旅は、スペインからスウェーデンへ旅するのと同じくらいの違いを感じさせます。</p>' },
  fact_parks: { tag: '✦ 豆知識', title: '国立公園', body: '<p>国立公園制度の創設は、アメリカの「最良のアイデア」と称されています。現在、<strong>63の国立公園</strong>が指定されており、数百万エーカーに及ぶ手つかずの自然、地熱の驚異、そして太古の生態系を守り続けています。</p>' },
  fact_founded: { tag: '✦ 豆知識', title: '1776年', body: '<p>1776年7月4日、アメリカはイギリスからの独立を宣言しました。この大胆な民主主義の実験は、その後の世界史を大きく形作ってきました。</p>' },
  fact_gdp: { tag: '✦ 豆知識', title: '経済大国', body: '<p>GDPが<strong>30兆ドル</strong>を超えるアメリカは、世界最大の経済大国です。カリフォルニア州単独でも、世界第5位の経済規模に匹敵します。</p>' },
  fact_timezones: { tag: '✦ 豆知識', title: '6つのタイムゾーン', body: '<p>アメリカは6つのタイムゾーン（東部、中部、山岳部、太平洋、アラスカ、ハワイ）にまたがっています。ニューヨークからロサンゼルスへのフライトは約6時間です。</p>' },

  season_spring: { tag: '✦ 季節', title: 'アメリカの春', body: `<p>春は総合的に見て最もお得なシーズンとされています。全米で心地よい気温となり、風景は花で彩られ、混雑も夏のピークほどではありません。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="72">72°F</div><div class="modal-fact-label">平均最高気温</div></div><div class="modal-fact"><div class="modal-fact-num">3〜5月</div><div class="modal-fact-label">時期</div></div><div class="modal-fact"><div class="modal-fact-num">中程度</div><div class="modal-fact-label">混雑度</div></div></div><div class="modal-highlights"><div class="modal-highlight">ワシントンD.C.の桜は3月末から4月初旬に見頃を迎えます</div><div class="modal-highlight">テキサス・ヒルカントリーの野花は4月まで咲き続けます</div></div>` },
  season_summer: { tag: '✦ 季節', title: 'アメリカの夏', body: `<p>旅行のピークシーズン。国立公園、海岸線、そして象徴的なロードトリップ、そのすべてが最盛期を迎えます——ただし混雑と価格の高騰も同様です。宿泊施設と公園の予約は早めに済ませましょう。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="88">88°F</div><div class="modal-fact-label">平均最高気温</div></div><div class="modal-fact"><div class="modal-fact-num">6〜8月</div><div class="modal-fact-label">時期</div></div><div class="modal-fact"><div class="modal-fact-num">最盛期</div><div class="modal-fact-label">混雑度</div></div></div><div class="modal-highlights"><div class="modal-highlight">日照時間が長く、国立公園でのハイキングに最適です</div><div class="modal-highlight">ニューイングランドのビーチタウンが最盛期を迎えます</div></div>` },
  season_fall: { tag: '✦ 季節', title: 'アメリカの秋', body: `<p>多くの地元民が「旅に最も適した季節」と口を揃える秋。澄んだ空気、少なくなる人出、そして何より、ニューイングランドの伝説的な紅葉が山々全体を燃えるような色彩のキャンバスへと変えます。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="62">62°F</div><div class="modal-fact-label">平均最高気温</div></div><div class="modal-fact"><div class="modal-fact-num">9〜11月</div><div class="modal-fact-label">時期</div></div><div class="modal-fact"><div class="modal-fact-num">少なめ</div><div class="modal-fact-label">混雑度</div></div></div><div class="modal-highlights"><div class="modal-highlight">バーモント州とニューハンプシャー州の紅葉は10月上旬から中旬がピークです</div><div class="modal-highlight">グレートスモーキー山脈の紅葉は11月初旬まで続きます</div></div>` },
  season_winter: { tag: '✦ 季節', title: 'アメリカの冬', body: `<p>まさに二つの顔を持つアメリカ：ロッキー山脈と北東部は厳しい寒さと世界水準のスキー場、一方フロリダ、南カリフォルニア、ハワイは暖かく晴れやかな避寒地。お好みの気候をお選びください。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-temp" data-f="38">38°F</div><div class="modal-fact-label">平均最高気温</div></div><div class="modal-fact"><div class="modal-fact-num">12〜2月</div><div class="modal-fact-label">時期</div></div><div class="modal-fact"><div class="modal-fact-num">場所による</div><div class="modal-fact-label">混雑度</div></div></div><div class="modal-highlights"><div class="modal-highlight">コロラドのスキーリゾートは12月末から3月にかけて最盛期を迎えます</div><div class="modal-highlight">ハワイと南フロリダは一年を通して温暖で乾燥しています</div></div>` },

  route_route66: { tag: '✦ ロードトリップ', title: 'ルート66 — マザーロード', body: `<p>アメリカで最も伝説的なロードトリップ。ルート66はシカゴのダウンタウンからサンタモニカ桟橋まで続き、8つの州を貫きながら、色あせたネオンのモーテル看板や、雄大に広がるペインテッド・デザートを通り抜けます。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-dist" data-mi="2448">2,448 mi</div><div class="modal-fact-label">総距離</div></div><div class="modal-fact"><div class="modal-fact-num">8</div><div class="modal-fact-label">通過する州</div></div><div class="modal-fact"><div class="modal-fact-num">2〜3週間</div><div class="modal-fact-label">目安期間</div></div></div><div class="modal-highlights"><div class="modal-highlight">キャデラック・ランチ——テキサスの畑に頭から突き刺さった、落書きだらけの10台のキャデラック</div><div class="modal-highlight">アリゾナ州ウィリアムズ付近からグランドキャニオンへ気軽に立ち寄れます</div></div>` },
  route_pch: { tag: '✦ ロードトリップ', title: 'パシフィック・コースト・ハイウェイ', body: `<p>ハイウェイ1号線は、西海岸のほぼ全域にわたって太平洋を見下ろす崖沿いを走ります。地球上で最も景観に優れたドライブルートの一つとして常に高く評価されており、そびえ立つレッドウッド、手つかずのビーチ、息をのむようなドラマチックな海岸線が次々と現れます。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-dist" data-mi="1650">1,650 mi</div><div class="modal-fact-label">総距離</div></div><div class="modal-fact"><div class="modal-fact-num">3</div><div class="modal-fact-label">通過する州</div></div><div class="modal-fact"><div class="modal-fact-num">10〜14日間</div><div class="modal-fact-label">目安期間</div></div></div><div class="modal-highlights"><div class="modal-highlight">ビッグサーのビクスビー橋は、カリフォルニアで最も撮影される場所の一つです</div><div class="modal-highlight">レッドウッド国立公園には、ローマ帝国よりも古い木々があります</div></div>` },
  route_parksloop: { tag: '✦ ロードトリップ', title: 'グランドサークル・パークスループ', body: `<p>ユタ州の「マイティ・ファイブ」国立公園とグランドキャニオンを合わせると、地球上で最も地質学的な絶景が凝縮されたエリアとなります。ラスベガスを拠点に、赤い岩の峡谷、奇岩群、そして古代の台地を巡りましょう。</p><div class="modal-facts"><div class="modal-fact"><div class="modal-fact-num unit-dist" data-mi="980">980 mi</div><div class="modal-fact-label">総距離</div></div><div class="modal-fact"><div class="modal-fact-num">3</div><div class="modal-fact-label">通過する州</div></div><div class="modal-fact"><div class="modal-fact-num">10〜12日間</div><div class="modal-fact-label">目安期間</div></div></div><div class="modal-highlights"><div class="modal-highlight">ザイオン国立公園のエンジェルスランディングは、アメリカ屈指のスリル満点な日帰りハイキングコースです</div><div class="modal-highlight">モニュメントバレーの台地は、数々の名作西部劇に登場してきました</div></div>` },

  culture_rock: { tag: '✦ 文化の柱', title: 'ロック＆カントリーの誕生', body: '<p>アメリカ音楽は世界を変えました。<strong>メンフィス</strong>はブルースとカントリーを融合させ、ロックンロールを生み出しました。<strong>ナッシュビル</strong>は今なお、カントリー音楽の紛れもない首都です。</p>' },
  culture_jazz: { tag: '✦ 文化の柱', title: 'ジャズとブルース', body: '<p><strong>ニューオーリンズ</strong>の街角で生まれたジャズは、アメリカ独自の芸術形式です。フレンチクォーターの煙たなびくクラブから、ミシシッピ・デルタの伝説的なブルースの店まで。</p>' },
  culture_texmex: { tag: '✦ 文化の柱', title: 'テクスメクス料理', body: '<p>テキサスとメキシコの国境地帯で生まれたこの融合料理は、ファヒータ、ナチョス、チリコンカーンを世界に届けました。とろけるチーズ、牛肉、スパイスを豊富に使うのが特徴です。</p>' },
  culture_seafood: { tag: '✦ 文化の柱', title: 'ニューイングランドのシーフード', body: '<p>大西洋沿岸の冷たい海が、極上のシーフードを育みます。メイン州への旅なら、獲れたてのロブスターロールは欠かせません。一方、ボストンはクラムチャウダーで有名です。</p>' },
  culture_broadway: { tag: '✦ 文化の柱', title: 'ブロードウェイと演劇', body: '<p>マンハッタンのシアター・ディストリクトにある41の専門劇場は、英語圏における商業演劇の最高峰を体現しています。</p>' },
  culture_bbq: { tag: '✦ 文化の柱', title: 'BBQという信仰', body: '<p>アメリカのバーベキューは地域色が非常に強い文化です。<strong>テキサス</strong>はスモークブリスケットが中心。<strong>カンザスシティ</strong>は濃厚なソースを好みます。<strong>カロライナ</strong>は豚肉が主役で、<strong>メンフィス</strong>はドライラブのリブを得意とします。</p>' },
  culture_streetart: { tag: '✦ 文化の柱', title: '都市のストリートアート', body: '<p>アメリカの都市はまるで屋外美術館です。マイアミのウィンウッド・ウォールズは、グラフィティによる地域再生の先駆けとなりました。ロサンゼルスやデトロイトのような都市には、何千もの壁画が存在します。</p>' },
  culture_sports: { tag: '✦ 文化の柱', title: '信仰としてのスポーツ', body: '<p>アメリカ人はスポーツに貪欲なまでに情熱を注ぎます。NFL観戦前のテールゲートパーティー、真夏の野球観戦、あるいは熱狂的な大学フットボールの応援まで。</p>' },
  culture_hollywood: { tag: '✦ 文化の柱', title: 'ハリウッド', body: '<p>ロサンゼルスは世界の夢工場です。ハリウッドサイン、ウォーク・オブ・フェイム、そして広大なスタジオの数々が、今なお世界のポップカルチャーを動かし続けています。</p>' },
  culture_pizza: { tag: '✦ 文化の柱', title: 'ニューヨークのピザ文化', body: '<p>イタリア移民によってもたらされたニューヨーク・スライスは、幅広く薄い、折り曲げて食べられる生地が特徴です。マンハッタンのほぼどの角でも、わずか数ドルで完璧な一切れが手に入ります。</p>' },
  culture_smithsonian: { tag: '✦ 文化の柱', title: 'スミソニアン協会', body: '<p>ワシントンD.C.にあるスミソニアン協会は、世界最大の博物館複合施設です。19ある博物館すべてが<strong>完全に無料で入場できます</strong>。</p>' },
  culture_farmtable: { tag: '✦ 文化の柱', title: 'ファーム・トゥ・テーブル革命', body: '<p>バークレーなどの地で先駆けとなったこのムーブメントは、徹底した地産地消、旬、そして有機食材を重視します。太平洋北西部とカリフォルニアが、世界をリードする存在です。</p>' },

  prac_transport: { tag: '✦ 旅の基本', title: 'アメリカへの行き方', body: '<p>国際線の主な玄関口は、<strong>ニューヨークのJFK空港</strong>、<strong>ロサンゼルスのLAX空港</strong>、そして<strong>シカゴのオヘア空港</strong>です。ビザ免除プログラム対象国からの旅行者の多くは、<strong>ESTA</strong>の取得が入国に必要です。</p>' },
  prac_driving: { tag: '✦ 旅の基本', title: 'アメリカ国内の移動', body: '<p>アメリカは車社会です。ニューヨーク、ボストン、シカゴのような大都市を離れると、レンタカーはほぼ必須になります。都市内の移動では、UberやLyftがどこでも利用できます。</p>' },
  prac_money: { tag: '✦ 旅の基本', title: '通貨と費用', body: '<p>クレジットカードとデビットカードはほぼどこでも使用可能です。<strong>チップは必須：</strong>レストランでは18〜22%が目安。また、表示価格には売上税が含まれていない点にも注意が必要です。</p>' },
  prac_health: { tag: '✦ 旅の基本', title: '健康と安全', body: '<p>アメリカの医療水準は非常に高いですが、保険がないと費用は高額になります。<strong>包括的な旅行保険への加入は絶対に欠かせません。</strong>緊急通報番号は<strong>911</strong>です。</p>' },

  tip_parks: { tag: '✦ 現地情報', title: '国立公園の予約について', body: '<p>夏に人気の国立公園へ、予約なしでふらっと訪れるのはおすすめしません。ヨセミテやアーチーズのような公園では、車で入園するだけでも<strong>時間指定の予約</strong>が必要です。数ヶ月前から予約しておきましょう。</p>' },
  tip_tax: { tag: '✦ 現地情報', title: 'レジで加算される売上税', body: '<p>アメリカでは、表示価格に売上税は含まれていません。税率は地域によって異なり、州や市によって<strong>おおよそ4%から10%</strong>の範囲で変動します。</p>' },
  tip_sim: { tag: '✦ 現地情報', title: '通信手段を確保する', body: '<p>渡航前にAiraloなどでプリペイドeSIMを購入するか、現地でT-MobileやAT&Tの物理SIMを入手しましょう。人里離れた国立公園を訪れる場合、<strong>Verizon</strong>が最も広範囲をカバーしています。</p>' },
  tip_distance: { tag: '✦ 現地情報', title: '距離の感覚が桁違い', body: '<p>「ヨーロッパでは100マイルは長い距離だが、アメリカでは100年でようやく長い歴史と言える」。フロリダからニューヨークまで車で20時間かかります。7日間の旅程で東海岸とグランドキャニオンの両方を見ようとするのはやめましょう。</p>' },
  tip_tipping: { tag: '✦ 現地情報', title: 'チップは任意ではない', body: '<p>ウェイターやバーテンダーの生活は、チップに大きく依存しています。標準的な相場は、税抜き金額の<strong>18%から22%</strong>。チップを渡さないことは、非常に無礼な行為とみなされます。</p>' },
  tip_pass: { tag: '✦ 現地情報', title: '「アメリカ・ザ・ビューティフル」パス', body: '<p>3つ以上の国立公園を訪れる予定があるなら、<strong>年間80ドルのアニュアルパス</strong>を購入しましょう。1年間、1台の車両につき全63の国立公園への入場がすべて無料になります。</p>' },
  tip_food: { tag: '✦ 現地情報', title: '地元の人のように食事する', body: '<p>観光客向けのエリア周辺にあるチェーン店は避けましょう。どの方向でもいいので15分ほど歩けば、地元の人が実際に利用しているお店が見つかります。YelpやGoogleマップを使って、評価の高い個人経営のダイナーを探しましょう。</p>' },
  tip_driving: { tag: '✦ 現地情報', title: '赤信号での右折', body: '<p>「赤信号での右折禁止」という明確な標識がない限り、完全に停止した後であれば、赤信号での右折はアメリカ全土で合法です。</p>' }
}
};

let currentModalKey = null;

function openModal(tag, title, body) {
  modalTag.textContent = tag;
  modalTitle.textContent = title;
  modalBody.innerHTML = body;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  applyUnits();
}
function closeModal() {
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  currentModalKey = null;
}

document.getElementById('modal-close').addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Keyboard accessibility for interactive elements
document.querySelectorAll('.prac-card, .season-card, .culture-tile, .dest-card, .region-card, .route-card, .tip-row, .fact-card, .gallery-item').forEach(card => {
  card.addEventListener('keydown', e => {
    if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });
});

function getModalData(key) {
  const localized = MODAL_DATA_I18N[currentLang] && MODAL_DATA_I18N[currentLang][key];
  return localized || MODAL_DATA[key];
}

document.querySelectorAll('[data-modal]').forEach(el => {
  el.addEventListener('click', () => {
    const type = el.dataset.modal;
    let key = '';
    if (type === 'region')  key = `region_${el.dataset.region}`;
    if (type === 'dest')    key = `dest_${el.dataset.dest}`;
    if (type === 'season')  key = `season_${el.dataset.season}`;
    if (type === 'route')   key = `route_${el.dataset.route}`;
    if (type === 'prac')    key = `prac_${el.dataset.prac}`;
    if (type === 'culture') key = `culture_${el.dataset.culture}`;
    if (type === 'tip')     key = `tip_${el.dataset.tip}`;
    if (type === 'fact')    key = `fact_${el.dataset.fact}`;

    const d = getModalData(key);
    if (d) { currentModalKey = key; openModal(d.tag, d.title, d.body); }
  });
});

/* ── APPLY SAVED PREFERENCES ON LOAD (must run after everything above is defined) ── */
applyLanguage(currentLang);
applyUnits();

// ═══════════════════════════════════════════════════════════════════════
// GALLERY — filtering, scroll-in animation, image loading state, lightbox
// ═══════════════════════════════════════════════════════════════════════

const galleryGrid = document.getElementById('galleryGrid');
const filterBtns = document.querySelectorAll('.gallery-filter');
const galleryEmptyState = document.getElementById('galleryEmptyState');
const galleryToggle = document.getElementById('galleryToggle');
let visibleItems = [...document.querySelectorAll('.gallery-item')];
let currentIndex = 0;
let lastFocusedThumb = null; // so closing the lightbox returns focus sensibly
let galleryExpanded = false;
const GALLERY_PREVIEW_LIMIT = 6;
const GALLERY_TOGGLE_TEXT = {
  en: { more: 'View Full Gallery', less: 'Show Fewer Photos' },
  zh: { more: '展开完整相册', less: '收起相册' },
  ja: { more: 'ギャラリーをすべて表示', less: 'ギャラリーを閉じる' }
};

// Mirrors the EMPTY_STATE_SAVED_TEXT pattern used by the destinations filter:
// the "photo not added yet" placeholder is generated dynamically in JS, so it
// can't pick up a data-i18n attribute — it's translated by hand instead.
const GALLERY_PLACEHOLDER_TEXT = {
  en: 'Photo not added yet',
  zh: '照片尚未上传',
  ja: '写真はまだ追加されていません'
};

// --- Entrance animation: each tile fades/rises into place the first time
// it scrolls into view, then is left alone (mirrors the site's .reveal system,
// but kept separate so hiding/showing tiles via filters never fights with it).
const galleryObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      galleryObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

// --- Image loading state: tile shows a plain background until its photo has
// actually finished loading, then the photo fades in. Handles both slow
// connections and images the browser already had cached (which fire "load"
// before we can even attach the listener, hence the `.complete` check) - and
// handles a missing/broken file (the "error" case) with a visible placeholder
// rather than silently leaving the tile blank forever.
function watchImageLoad(img) {
  const item = img.closest('.gallery-item');
  if (img.complete && img.naturalWidth > 0) {
    img.classList.add('loaded');
  } else if (img.complete) {
    // .complete is true even for failed loads once the browser gives up, so
    // naturalWidth === 0 here means "tried and failed", not "still loading".
    showLoadError(item);
  } else {
    img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
    img.addEventListener('error', () => showLoadError(item), { once: true });
  }
}
function showLoadError(item) {
  item.classList.add('load-error');
  item.setAttribute('tabindex', '-1');
  item.removeAttribute('role');
  if (!item.querySelector('.gallery-item-placeholder')) {
    const ph = document.createElement('div');
    ph.className = 'gallery-item-placeholder';
    const text = GALLERY_PLACEHOLDER_TEXT[currentLang] || GALLERY_PLACEHOLDER_TEXT.en;
    ph.innerHTML = `<span class="ph-icon">🖼️</span><span class="ph-text">${text}</span>`;
    item.appendChild(ph);
  }
}

function initGalleryItem(item, index) {
  item.style.transitionDelay = `${(index % 6) * 60}ms`; // gentle stagger, resets every 6 tiles
  galleryObs.observe(item);
  watchImageLoad(item.querySelector('img'));
}
document.querySelectorAll('.gallery-item').forEach(initGalleryItem);

function getGalleryFilter() {
  return document.querySelector('.gallery-filter.active')?.dataset.filter || 'all';
}

function galleryFilterMatches(item, filter = getGalleryFilter()) {
  return filter === 'all' || item.dataset.category === filter;
}

function refreshVisibleGalleryItems() {
  visibleItems = [...document.querySelectorAll('.gallery-item:not(.hidden):not(.gallery-overflow-hidden):not(.load-error)')];
}

function updateGalleryToggle() {
  if (!galleryToggle) return;
  const matches = [...document.querySelectorAll('.gallery-item')].filter(item => galleryFilterMatches(item));
  const shouldShow = matches.length > GALLERY_PREVIEW_LIMIT;
  galleryToggle.closest('.gallery-actions').style.display = shouldShow ? 'flex' : 'none';
  galleryToggle.setAttribute('aria-expanded', String(galleryExpanded));
  galleryToggle.textContent = galleryExpanded
    ? (GALLERY_TOGGLE_TEXT[currentLang]?.less || GALLERY_TOGGLE_TEXT.en.less)
    : (GALLERY_TOGGLE_TEXT[currentLang]?.more || GALLERY_TOGGLE_TEXT.en.more);
}

function applyGalleryLimit() {
  const filter = getGalleryFilter();
  let visibleMatchIndex = 0;
  document.querySelectorAll('.gallery-item').forEach(item => {
    const match = galleryFilterMatches(item, filter);
    const overflow = match && !galleryExpanded && visibleMatchIndex >= GALLERY_PREVIEW_LIMIT;
    item.classList.toggle('gallery-overflow-hidden', overflow);
    if (match) visibleMatchIndex++;
  });
  updateGalleryToggle();
  refreshVisibleGalleryItems();
}

applyGalleryLimit();

if (galleryToggle) {
  galleryToggle.addEventListener('click', () => {
    galleryExpanded = !galleryExpanded;
    applyGalleryLimit();
  });
}

// --- Filtering: items leaving shrink/fade out, THEN get display:none once
// that transition finishes (so it actually animates instead of vanishing
// instantly); items entering just drop their hidden state and re-run the
// same rise-in animation.
const FADE_MS = 300;
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    galleryExpanded = false;
    let matchCount = 0;

    document.querySelectorAll('.gallery-item').forEach((item, index) => {
      const match = filter === 'all' || item.dataset.category === filter;
      if (match) matchCount++;
      if (match) {
        item.classList.remove('fade-out', 'hidden', 'gallery-overflow-hidden');
        item.style.transitionDelay = `${(index % 6) * 40}ms`;
        requestAnimationFrame(() => item.classList.add('in-view'));
      } else if (!item.classList.contains('hidden')) {
        item.classList.add('fade-out');
        setTimeout(() => item.classList.add('hidden'), FADE_MS);
      }
    });

    if (galleryEmptyState) galleryEmptyState.classList.toggle('show', matchCount === 0);

    setTimeout(() => {
      applyGalleryLimit();
    }, FADE_MS + 20);
  });
});

// --- Lightbox ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxMeta = document.getElementById('lightboxMeta');
const lightboxCounter = document.getElementById('lightboxCounter');
const lightboxCloseBtn = document.getElementById('lightboxClose');

function preload(src) { const i = new Image(); i.src = src; } // warms the browser cache for instant next/prev

function renderLightboxContent(index) {
  const item = visibleItems[index];
  if (!item) return;
  const img = item.querySelector('img');
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCaption.textContent = item.querySelector('.gallery-caption').textContent;
  const location = item.dataset.location || '';
  const date = item.dataset.date || '';
  lightboxMeta.textContent = [location, date].filter(Boolean).join(' · ');
  lightboxCounter.textContent = `${index + 1} / ${visibleItems.length}`;
  // Warm the neighbors so arrow/swipe navigation feels instant.
  const next = visibleItems[(index + 1) % visibleItems.length];
  const prev = visibleItems[(index - 1 + visibleItems.length) % visibleItems.length];
  if (next) preload(next.querySelector('img').src);
  if (prev) preload(prev.querySelector('img').src);
}

function openLightbox(index) {
  if (index < 0 || visibleItems.length === 0) return;
  currentIndex = index;
  renderLightboxContent(index);
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  lightboxCloseBtn.focus();
}
function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastFocusedThumb) lastFocusedThumb.focus();
}
// Crossfade between photos: fade the current image out, swap its content
// once it's actually invisible, then fade the new one in.
function navigate(step) {
  if (visibleItems.length < 2) return;
  lightboxImg.classList.add('switching');
  setTimeout(() => {
    currentIndex = (currentIndex + step + visibleItems.length) % visibleItems.length;
    renderLightboxContent(currentIndex);
    lightboxImg.classList.remove('switching');
  }, 180);
}
function showNext() { navigate(1); }
function showPrev() { navigate(-1); }

document.querySelectorAll('.gallery-item').forEach((item) => {
  item.addEventListener('click', () => {
    if (item.classList.contains('load-error')) return; // nothing valid to show yet
    lastFocusedThumb = item;
    refreshVisibleGalleryItems();
    openLightbox(visibleItems.indexOf(item));
  });
});
lightboxCloseBtn.addEventListener('click', closeLightbox);
document.getElementById('lightboxNext').addEventListener('click', showNext);
document.getElementById('lightboxPrev').addEventListener('click', showPrev);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
});

// Mobile: swipe left/right anywhere on the lightbox to go next/prev
let touchStartX = 0;
lightbox.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].clientX;
}, { passive: true });
lightbox.addEventListener('touchend', e => {
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(diff) > 40) { // ignore tiny accidental swipes
    diff < 0 ? showNext() : showPrev();
  }
}, { passive: true });
