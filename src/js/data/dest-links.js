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
    { url: 'https://www.miamidade.gov/global/economy/tourism/home.page', label: { en: 'Miami-Dade Tourism', es: 'Turismo Miami-Dade', zh: '迈阿密-戴德旅游', ja: 'マイアミデイド観光' } },
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
