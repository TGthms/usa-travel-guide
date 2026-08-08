'use strict';
/**
 * Official / helpful destination travel links shown in city detail modals.
 * Loaded on the homepage before app.js.
 */
/* Official / helpful travel links shown when a city card is expanded */
window.DEST_TRAVEL_LINKS = {
  nyc: [
    { url: 'https://www.nyctourism.com/', label: { en: 'NYC Tourism (official)', es: 'Turismo de NYC (oficial)', zh: '纽约官方旅游', ja: 'NYC観光（公式）' } },
    { url: 'https://www.mta.info/', label: { en: 'MTA · Public transit', es: 'MTA · Transporte público', zh: 'MTA · 公共交通', ja: 'MTA · 公共交通' } },
    { url: 'https://www.nps.gov/stli/index.htm', label: { en: 'Statue of Liberty (NPS)', es: 'Estatua de la Libertad (NPS)', zh: '自由女神像（国家公园）', ja: '自由の女神（NPS）' } }
  ],
  la: [
    { url: 'https://www.discoverlosangeles.com/', label: { en: 'Visit Los Angeles (official)', es: 'Visita Los Ángeles (oficial)', zh: '探索洛杉矶（官方）', ja: 'ロサンゼルス観光（公式）' } },
    { url: 'https://www.metro.net/', label: { en: 'LA Metro · Transit', es: 'LA Metro · Transporte', zh: '洛杉矶地铁', ja: 'LAメトロ' } },
    { url: 'https://www.nps.gov/samo/index.htm', label: { en: 'Santa Monica Mountains (NPS)', es: 'Montañas Santa Mónica (NPS)', zh: '圣莫尼卡山国家游憩区', ja: 'サンタモニカ山地（NPS）' } }
  ],
  chicago: [
    { url: 'https://www.choosechicago.com/', label: { en: 'Choose Chicago (official)', es: 'Choose Chicago (oficial)', zh: '芝加哥官方旅游', ja: 'シカゴ観光（公式）' } },
    { url: 'https://www.transitchicago.com/', label: { en: 'CTA · “L” transit', es: 'CTA · Metro “L”', zh: 'CTA · 轨道交通', ja: 'CTA · L線' } },
    { url: 'https://www.architecture.org/', label: { en: 'Chicago Architecture Center', es: 'Centro de Arquitectura de Chicago', zh: '芝加哥建筑中心', ja: 'シカゴ建築センター' } }
  ],
  miami: [
    { url: 'https://www.miamiandbeaches.com/', label: { en: 'Miami & Beaches (official)', es: 'Miami y sus playas (oficial)', zh: '迈阿密海滩官方旅游', ja: 'マイアミ観光（公式）' } },
    { url: 'https://www.miamiandbeaches.com/plan-your-trip', label: { en: 'Miami · Plan your trip', es: 'Miami · Planifica tu viaje', zh: '迈阿密 · 行程规划', ja: 'マイアミ · 旅の計画' } },
    { url: 'https://www.nps.gov/bisc/index.htm', label: { en: 'Biscayne National Park', es: 'Parque Nacional Biscayne', zh: '比斯坎国家公园', ja: 'ビスケーン国立公園' } }
  ],
  nola: [
    { url: 'https://www.neworleans.com/', label: { en: 'New Orleans Tourism (official)', es: 'Turismo de Nueva Orleans (oficial)', zh: '新奥尔良官方旅游', ja: 'ニューオーリンズ観光（公式）' } },
    { url: 'https://www.nola.gov/', label: { en: 'City of New Orleans', es: 'Ciudad de Nueva Orleans', zh: '新奥尔良市政府', ja: 'ニューオーリンズ市' } },
    { url: 'https://www.nps.gov/jazz/index.htm', label: { en: 'New Orleans Jazz (NPS)', es: 'Jazz de Nueva Orleans (NPS)', zh: '新奥尔良爵士国家历史公园', ja: 'ニューオーリンズ・ジャズ（NPS）' } }
  ],
  vegas: [
    { url: 'https://www.visitlasvegas.com/', label: { en: 'Visit Las Vegas (official)', es: 'Visit Las Vegas (oficial)', zh: '拉斯维加斯官方旅游', ja: 'ラスベガス観光（公式）' } },
    { url: 'https://www.rtcsnv.com/', label: { en: 'RTC · Transit', es: 'RTC · Transporte', zh: 'RTC · 公交', ja: 'RTC · 交通' } },
    { url: 'https://www.nps.gov/grca/index.htm', label: { en: 'Grand Canyon (nearby)', es: 'Gran Cañón (cercano)', zh: '大峡谷（周边）', ja: 'グランドキャニオン（近郊）' } }
  ],
  sf: [
    { url: 'https://www.sftravel.com/', label: { en: 'San Francisco Travel (official)', es: 'San Francisco Travel (oficial)', zh: '旧金山官方旅游', ja: 'サンフランシスコ観光（公式）' } },
    { url: 'https://www.sfmta.com/', label: { en: 'SFMTA · Muni transit', es: 'SFMTA · Transporte Muni', zh: 'SFMTA · 市政交通', ja: 'SFMTA · ミュニ' } },
    { url: 'https://www.nps.gov/goga/index.htm', label: { en: 'Golden Gate National Recreation Area', es: 'Área recreativa Golden Gate (NPS)', zh: '金门国家游憩区', ja: 'ゴールデンゲート国立レクリエーション地域' } }
  ],
  seattle: [
    { url: 'https://visitseattle.org/', label: { en: 'Visit Seattle (official)', es: 'Visit Seattle (oficial)', zh: '西雅图官方旅游', ja: 'シアトル観光（公式）' } },
    { url: 'https://www.soundtransit.org/', label: { en: 'Sound Transit', es: 'Sound Transit', zh: 'Sound Transit 公交', ja: 'サウンド・トランジット' } },
    { url: 'https://www.nps.gov/olym/index.htm', label: { en: 'Olympic National Park (nearby)', es: 'Parque Nacional Olympic (cercano)', zh: '奥林匹克国家公园（周边）', ja: 'オリンピック国立公園（近郊）' } }
  ],
  austin: [
    { url: 'https://www.austintexas.org/', label: { en: 'Visit Austin (official)', es: 'Visit Austin (oficial)', zh: '奥斯汀官方旅游', ja: 'オースティン観光（公式）' } },
    { url: 'https://www.capmetro.org/', label: { en: 'CapMetro · Transit', es: 'CapMetro · Transporte', zh: 'CapMetro · 公交', ja: 'CapMetro · 交通' } },
    { url: 'https://www.nps.gov/lame/index.htm', label: { en: 'Lyndon B. Johnson NHP (nearby)', es: 'Lyndon B. Johnson NHP (cercano)', zh: '约翰逊国家历史公园（周边）', ja: 'リンドン・B・ジョンソン国定史跡（近郊）' } }
  ],
  dc: [
    { url: 'https://washington.org/', label: { en: 'Destination DC (official)', es: 'Destination DC (oficial)', zh: '华盛顿特区官方旅游', ja: 'ワシントンD.C.観光（公式）' } },
    { url: 'https://www.wmata.com/', label: { en: 'Metro · WMATA', es: 'Metro · WMATA', zh: '华盛顿地铁 WMATA', ja: 'メトロ · WMATA' } },
    { url: 'https://www.si.edu/', label: { en: 'Smithsonian Museums (free)', es: 'Museos Smithsonian (gratis)', zh: '史密森尼博物馆（免费）', ja: 'スミソニアン博物館（無料）' } }
  ],
  honolulu: [
    { url: 'https://www.gohawaii.com/islands/oahu', label: { en: 'Go Hawaii · Oʻahu (official)', es: 'Go Hawaii · Oahu (oficial)', zh: '夏威夷 · 瓦胡岛官方', ja: 'ハワイ公式 · オアフ' } },
    { url: 'https://www.thebus.org/', label: { en: 'TheBus · Oʻahu transit', es: 'TheBus · Transporte Oahu', zh: 'TheBus · 瓦胡公交', ja: 'TheBus · オアフ交通' } },
    { url: 'https://www.nps.gov/valr/index.htm', label: { en: 'Pearl Harbor (NPS)', es: 'Pearl Harbor (NPS)', zh: '珍珠港国家纪念地', ja: '真珠湾（NPS）' } }
  ],
  boston: [
    { url: 'https://www.bostonusa.com/', label: { en: 'Meet Boston (official)', es: 'Meet Boston (oficial)', zh: '波士顿官方旅游', ja: 'ボストン観光（公式）' } },
    { url: 'https://www.mbta.com/', label: { en: 'MBTA · “T” transit', es: 'MBTA · Metro “T”', zh: 'MBTA · 轨道交通', ja: 'MBTA · T線' } },
    { url: 'https://www.nps.gov/bost/index.htm', label: { en: 'Boston National Historical Park', es: 'Parque Histórico Nacional de Boston', zh: '波士顿国家历史公园', ja: 'ボストン国定史跡公園' } }
  ]
};

window.DEST_LINKS_HEADING = {
  en: 'Helpful links',
  es: 'Enlaces útiles',
  zh: '实用链接',
  ja: '役立つリンク'
};

/**
 * Modal-key → helpful links for regions, routes, culture, practical, tips.
 * Appended by home.js getModalData() (same UI as destination links).
 * Prefer official .gov / tourism / transit / park sources.
 */
window.GUIDE_SECTION_LINKS = {
  /* ── Regions ── */
  region_northeast: [
    { url: 'https://www.visittheusa.com/destinations/discover-new-england/', label: { en: 'Visit the USA · New England', es: 'Visit the USA · Nueva Inglaterra', zh: 'Visit the USA · 新英格兰', ja: 'Visit the USA · ニューイングランド' } },
    { url: 'https://www.nps.gov/acad/index.htm', label: { en: 'Acadia National Park (NPS)', es: 'Parque Nacional Acadia (NPS)', zh: '阿卡迪亚国家公园', ja: 'アカデミー国立公園' } },
    { url: 'https://www.amtrak.com/', label: { en: 'Amtrak · Northeast Corridor', es: 'Amtrak · Corredor Noreste', zh: 'Amtrak · 东北走廊', ja: 'Amtrak · 北東回廊' } }
  ],
  region_south: [
    { url: 'https://www.visittheusa.com/destinations/travel-south-usa/', label: { en: 'Visit the USA · The South', es: 'Visit the USA · El Sur', zh: 'Visit the USA · 美国南方', ja: 'Visit the USA · 南部' } },
    { url: 'https://www.nps.gov/grsm/index.htm', label: { en: 'Great Smoky Mountains (NPS)', es: 'Great Smoky Mountains (NPS)', zh: '大烟山国家公园', ja: 'グレートスモーキー山脈国立公園' } },
    { url: 'https://www.nps.gov/ever/index.htm', label: { en: 'Everglades National Park', es: 'Parque Nacional Everglades', zh: '大沼泽地国家公园', ja: 'エバーグレーズ国立公園' } }
  ],
  region_midwest: [
    { url: 'https://www.visittheusa.com/', label: { en: 'Visit the USA (official)', es: 'Visit the USA (oficial)', zh: 'Visit the USA（官方）', ja: 'Visit the USA（公式）' } },
    { url: 'https://www.nps.gov/indu/index.htm', label: { en: 'Indiana Dunes (NPS)', es: 'Indiana Dunes (NPS)', zh: '印第安纳沙丘国家公园', ja: 'インディアナデューンズ国立公園' } },
    { url: 'https://www.choosechicago.com/', label: { en: 'Choose Chicago', es: 'Choose Chicago', zh: '芝加哥旅游', ja: 'シカゴ観光' } }
  ],
  region_west: [
    { url: 'https://www.visitcalifornia.com/', label: { en: 'Visit California (official)', es: 'Visit California (oficial)', zh: '加利福尼亚官方旅游', ja: 'カリフォルニア観光（公式）' } },
    { url: 'https://www.nps.gov/yose/index.htm', label: { en: 'Yosemite National Park', es: 'Parque Nacional Yosemite', zh: '优胜美地国家公园', ja: 'ヨセミテ国立公園' } },
    { url: 'https://www.nps.gov/olym/index.htm', label: { en: 'Olympic National Park', es: 'Parque Nacional Olympic', zh: '奥林匹克国家公园', ja: 'オリンピック国立公園' } }
  ],
  region_southwest: [
    { url: 'https://www.visitarizona.com/', label: { en: 'Visit Arizona (official)', es: 'Visit Arizona (oficial)', zh: '亚利桑那官方旅游', ja: 'アリゾナ観光（公式）' } },
    { url: 'https://www.nps.gov/grca/index.htm', label: { en: 'Grand Canyon National Park', es: 'Parque Nacional del Gran Cañón', zh: '大峡谷国家公园', ja: 'グランドキャニオン国立公園' } },
    { url: 'https://www.nps.gov/zion/index.htm', label: { en: 'Zion National Park', es: 'Parque Nacional Zion', zh: '锡安国家公园', ja: 'ザイオン国立公園' } }
  ],

  /* ── Routes ── */
  route_route66: [
    { url: 'https://www.nps.gov/subjects/travelroute66/index.htm', label: { en: 'Travel Route 66 (NPS)', es: 'Viajar la Ruta 66 (NPS)', zh: '66号公路之旅（NPS）', ja: 'ルート66を旅する（NPS）' } },
    { url: 'https://www.nps.gov/grca/index.htm', label: { en: 'Grand Canyon (easy detour)', es: 'Gran Cañón (desvío fácil)', zh: '大峡谷（顺路）', ja: 'グランドキャニオン（寄り道）' } },
    { url: 'tools-drive.html', label: { en: 'Estimate road-trip cost →', es: 'Estimar coste del viaje →', zh: '估算自驾费用 →', ja: 'ロードトリップ費用を見積もる →' }, internal: true }
  ],
  route_pch: [
    { url: 'https://www.nps.gov/redw/index.htm', label: { en: 'Redwood National and State Parks', es: 'Parques Redwood', zh: '红杉国家与州立公园', ja: 'レッドウッド国立・州立公園' } },
    { url: 'https://www.nps.gov/pore/index.htm', label: { en: 'Point Reyes (nearby)', es: 'Point Reyes (cercano)', zh: '雷耶斯角（周边）', ja: 'ポイントレイズ（近郊）' } },
    { url: 'https://dot.ca.gov/travel', label: { en: 'Caltrans · California travel', es: 'Caltrans · Viajar en California', zh: 'Caltrans · 加州路况', ja: 'Caltrans · カリフォルニア交通' } },
    { url: 'tools-drive.html', label: { en: 'Estimate road-trip cost →', es: 'Estimar coste del viaje →', zh: '估算自驾费用 →', ja: 'ロードトリップ費用を見積もる →' }, internal: true }
  ],
  route_parksloop: [
    { url: 'https://www.recreation.gov/', label: { en: 'Recreation.gov · Timed entry', es: 'Recreation.gov · Entrada programada', zh: 'Recreation.gov · 限时入园', ja: 'Recreation.gov · 時間指定入場' } },
    { url: 'https://www.nps.gov/zion/index.htm', label: { en: 'Zion National Park', es: 'Parque Nacional Zion', zh: '锡安国家公园', ja: 'ザイオン国立公園' } },
    { url: 'https://www.nps.gov/brca/index.htm', label: { en: 'Bryce Canyon National Park', es: 'Parque Nacional Bryce Canyon', zh: '布莱斯峡谷国家公园', ja: 'ブライスキャニオン国立公園' } },
    { url: 'https://www.nps.gov/grca/index.htm', label: { en: 'Grand Canyon National Park', es: 'Parque Nacional del Gran Cañón', zh: '大峡谷国家公园', ja: 'グランドキャニオン国立公園' } },
    { url: 'tools-drive.html', label: { en: 'Estimate road-trip cost →', es: 'Estimar coste del viaje →', zh: '估算自驾费用 →', ja: 'ロードトリップ費用を見積もる →' }, internal: true }
  ],

  /* ── Culture ── */
  culture_rock: [
    { url: 'https://countrymusichalloffame.org/', label: { en: 'Country Music Hall of Fame · Nashville', es: 'Country Music Hall of Fame · Nashville', zh: '乡村音乐名人堂 · 纳什维尔', ja: 'カントリー・ミュージック殿堂 · ナッシュビル' } },
    { url: 'https://www.visitmusiccity.com/', label: { en: 'Visit Music City · Nashville', es: 'Visit Music City · Nashville', zh: '纳什维尔音乐之城', ja: 'ナッシュビル観光' } },
    { url: 'https://www.memphistravel.com/', label: { en: 'Memphis Travel · Birthplace of rock & soul', es: 'Memphis Travel · Cuna del rock y soul', zh: '孟菲斯旅游 · 摇滚与灵魂乐发源地', ja: 'メンフィス観光 · ロック＆ソウルの発祥地' } }
  ],
  culture_jazz: [
    { url: 'https://www.nps.gov/jazz/index.htm', label: { en: 'New Orleans Jazz National Historical Park', es: 'Parque Histórico del Jazz de Nueva Orleans', zh: '新奥尔良爵士国家历史公园', ja: 'ニューオーリンズ・ジャズ国定史跡' } },
    { url: 'https://www.neworleans.com/', label: { en: 'New Orleans Tourism', es: 'Turismo de Nueva Orleans', zh: '新奥尔良旅游', ja: 'ニューオーリンズ観光' } }
  ],
  culture_texmex: [
    { url: 'https://www.traveltexas.com/', label: { en: 'Travel Texas (official)', es: 'Travel Texas (oficial)', zh: '得克萨斯官方旅游', ja: 'テキサス観光（公式）' } },
    { url: 'https://www.nps.gov/saan/index.htm', label: { en: 'San Antonio Missions (NPS)', es: 'Misiones de San Antonio (NPS)', zh: '圣安东尼奥传教站', ja: 'サンアントニオ・ミッションズ' } }
  ],
  culture_seafood: [
    { url: 'https://www.visitmaine.com/', label: { en: 'Visit Maine (official)', es: 'Visit Maine (oficial)', zh: '缅因官方旅游', ja: 'メイン州観光（公式）' } },
    { url: 'https://www.nps.gov/acad/index.htm', label: { en: 'Acadia National Park', es: 'Parque Nacional Acadia', zh: '阿卡迪亚国家公园', ja: 'アカデミー国立公園' } }
  ],
  culture_broadway: [
    { url: 'https://www.broadway.org/', label: { en: 'Broadway.org (official)', es: 'Broadway.org (oficial)', zh: 'Broadway.org（官方）', ja: 'Broadway.org（公式）' } },
    { url: 'https://www.tdf.org/discount-ticket-programs/tkts-by-tdf/', label: { en: 'TKTS · Same-day discounts', es: 'TKTS · Descuentos del día', zh: 'TKTS · 当日折扣票', ja: 'TKTS · 当日割引' } }
  ],
  culture_bbq: [
    { url: 'https://www.traveltexas.com/', label: { en: 'Travel Texas · BBQ country', es: 'Travel Texas · País del BBQ', zh: '得州烧烤之乡', ja: 'テキサスBBQ' } },
    { url: 'https://www.memphistravel.com/', label: { en: 'Memphis Travel', es: 'Memphis Travel', zh: '孟菲斯旅游', ja: 'メンフィス観光' } }
  ],
  culture_streetart: [
    { url: 'https://thewynwoodwalls.com/', label: { en: 'Wynwood Walls (official)', es: 'Wynwood Walls (oficial)', zh: 'Wynwood Walls（官方）', ja: 'ウィンウッド・ウォールズ（公式）' } },
    { url: 'https://www.miamiandbeaches.com/', label: { en: 'Miami & Beaches', es: 'Miami y sus playas', zh: '迈阿密海滩', ja: 'マイアミ観光' } }
  ],
  culture_sports: [
    { url: 'https://www.nfl.com/schedules/', label: { en: 'NFL · Schedules', es: 'NFL · Calendarios', zh: 'NFL 赛程', ja: 'NFL スケジュール' } },
    { url: 'https://www.mlb.com/tickets', label: { en: 'MLB · Tickets', es: 'MLB · Entradas', zh: 'MLB 门票', ja: 'MLB チケット' } }
  ],
  culture_hollywood: [
    { url: 'https://walkoffame.com/', label: { en: 'Hollywood Walk of Fame (official)', es: 'Paseo de la Fama (oficial)', zh: '好莱坞星光大道（官方）', ja: 'ハリウッド・ウォーク・オブ・フェーム（公式）' } },
    { url: 'https://www.discoverlosangeles.com/', label: { en: 'Discover Los Angeles', es: 'Descubre Los Ángeles', zh: '探索洛杉矶', ja: 'ロサンゼルス観光' } }
  ],
  culture_pizza: [
    { url: 'https://www.nyctourism.com/', label: { en: 'NYC Tourism (official)', es: 'Turismo de NYC (oficial)', zh: '纽约官方旅游', ja: 'NYC観光（公式）' } }
  ],
  culture_smithsonian: [
    { url: 'https://www.si.edu/', label: { en: 'Smithsonian · Museums (free)', es: 'Smithsonian · Museos (gratis)', zh: '史密森尼博物馆（免费）', ja: 'スミソニアン博物館（無料）' } },
    { url: 'https://www.si.edu/visit', label: { en: 'Plan your Smithsonian visit', es: 'Planifica tu visita', zh: '规划史密森尼参观', ja: 'スミソニアン訪問プラン' } }
  ],
  culture_farmtable: [
    { url: 'https://www.visitcalifornia.com/', label: { en: 'Visit California (official)', es: 'Visit California (oficial)', zh: '加利福尼亚官方旅游', ja: 'カリフォルニア観光（公式）' } },
    { url: 'https://www.visittheusa.com/trip/next-level-dining-u-s-foodie-destinations-to-put-on-your-radar/', label: { en: 'Visit the USA · Foodie destinations', es: 'Visit the USA · Destinos gastronómicos', zh: 'Visit the USA · 美食目的地', ja: 'Visit the USA · 美食の目的地' } },
    { url: 'https://www.nps.gov/goga/index.htm', label: { en: 'Golden Gate NRA (SF Bay Area)', es: 'Golden Gate NRA', zh: '金门国家游憩区', ja: 'ゴールデンゲート国立レクリエーション地域' } }
  ],

  /* ── Practical (cards already link tools; modals get more depth) ── */
  prac_driving: [
    { url: 'tools-drive.html', label: { en: 'Estimate road-trip cost →', es: 'Estimar coste del viaje →', zh: '估算自驾费用 →', ja: 'ロードトリップ費用を見積もる →' }, internal: true },
    { url: 'https://www.amtrak.com/', label: { en: 'Amtrak · Long-distance trains', es: 'Amtrak · Trenes de larga distancia', zh: 'Amtrak · 长途火车', ja: 'Amtrak · 長距離列車' } },
    { url: 'https://www.usa.gov/non-citizen-driving', label: { en: 'USA.gov · Driving as a visitor', es: 'USA.gov · Conducir como visitante', zh: 'USA.gov · 游客驾车须知', ja: 'USA.gov · 訪問者の運転' } },
    { url: 'https://www.nhtsa.gov/', label: { en: 'NHTSA · Road safety', es: 'NHTSA · Seguridad vial', zh: 'NHTSA · 道路安全', ja: 'NHTSA · 交通安全' } }
  ],
  prac_money: [
    { url: 'tools-currency.html', label: { en: 'Open currency converter →', es: 'Abrir convertidor de divisas →', zh: '打开货币换算器 →', ja: '通貨コンバーターを開く →' }, internal: true },
    { url: 'tools-tip-tax.html', label: { en: 'Tip & sales tax calculator →', es: 'Calculadora de propina e impuestos →', zh: '小费与销售税计算器 →', ja: 'チップと売上税の計算機 →' }, internal: true },
    { url: 'https://www.consumerfinance.gov/consumer-tools/credit-cards/', label: { en: 'CFPB · Credit cards basics', es: 'CFPB · Tarjetas de crédito', zh: 'CFPB · 信用卡常识', ja: 'CFPB · クレジットカード基礎' } }
  ],
  prac_health: [
    { url: 'tools-emergency.html', label: { en: 'Useful emergency numbers →', es: 'Números de emergencia →', zh: '实用紧急电话 →', ja: '役立つ緊急連絡先 →' }, internal: true },
    { url: 'https://wwwnc.cdc.gov/travel', label: { en: 'CDC · Travelers’ Health', es: 'CDC · Salud del viajero', zh: 'CDC · 旅行者健康', ja: 'CDC · 渡航者の健康' } },
    { url: 'https://www.ready.gov/', label: { en: 'Ready.gov · Emergency prep', es: 'Ready.gov · Preparación', zh: 'Ready.gov · 应急准备', ja: 'Ready.gov · 緊急準備' } }
  ],

  /* ── Tips ── */
  tip_sim: [
    { url: 'https://www.airalo.com/', label: { en: 'Airalo · Travel eSIM (before you fly)', es: 'Airalo · eSIM de viaje (antes de volar)', zh: 'Airalo · 出发前买旅行 eSIM', ja: 'Airalo · 渡航前の旅行eSIM' } },
    { url: 'https://prepaid.t-mobile.com/', label: { en: 'T-Mobile · Prepaid', es: 'T-Mobile · Prepago', zh: 'T-Mobile · 预付费', ja: 'T-Mobile · プリペイド' } },
    { url: 'https://www.verizon.com/plans/prepaid/', label: { en: 'Verizon · Prepaid (strong rural coverage)', es: 'Verizon · Prepago (buena cobertura rural)', zh: 'Verizon · 预付费（偏远覆盖较好）', ja: 'Verizon · プリペイド（郊外に強い）' } },
    { url: 'https://www.att.com/prepaid/', label: { en: 'AT&T · Prepaid', es: 'AT&T · Prepago', zh: 'AT&T · 预付费', ja: 'AT&T · プリペイド' } }
  ],
  tip_pass: [
    { url: 'https://www.nps.gov/planyourvisit/passes.htm', label: { en: 'NPS · America the Beautiful passes', es: 'NPS · Pases America the Beautiful', zh: 'NPS · 美丽美国年票说明', ja: 'NPS · America the Beautiful パス' } },
    { url: 'https://store.usgs.gov/recreational-passes', label: { en: 'USGS Store · Buy a pass', es: 'Tienda USGS · Comprar pase', zh: 'USGS 商店 · 购买年票', ja: 'USGSストア · パス購入' } },
    { url: 'https://www.recreation.gov/pass', label: { en: 'Recreation.gov · Digital passes', es: 'Recreation.gov · Pases digitales', zh: 'Recreation.gov · 电子年票', ja: 'Recreation.gov · デジタルパス' } }
  ],
  tip_food: [
    { url: 'https://www.visittheusa.com/trip/next-level-dining-u-s-foodie-destinations-to-put-on-your-radar/', label: { en: 'Visit the USA · Foodie destinations', es: 'Visit the USA · Destinos gastronómicos', zh: 'Visit the USA · 美食目的地', ja: 'Visit the USA · 美食の目的地' } }
  ],
  tip_driving: [
    { url: 'https://www.nhtsa.gov/road-safety', label: { en: 'NHTSA · Road safety tips', es: 'NHTSA · Consejos de seguridad vial', zh: 'NHTSA · 道路安全提示', ja: 'NHTSA · 交通安全のヒント' } },
    { url: 'tools-drive.html', label: { en: 'Estimate road-trip cost →', es: 'Estimar coste del viaje →', zh: '估算自驾费用 →', ja: 'ロードトリップ費用を見積もる →' }, internal: true }
  ]
};
