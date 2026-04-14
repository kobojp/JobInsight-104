// 來源：104 官方 Area.json（6001XXX000 = 縣市，6001XXXXXX = 行政區）
// 只有在 config.py AREA_CODES 中有行政區代碼的城市才列出

export const CITY_OPTIONS = [
  { value: 'taipei',     label: '台北市' },
  { value: 'new_taipei', label: '新北市' },
  { value: 'taoyuan',    label: '桃園市' },
  { value: 'taichung',   label: '台中市' },
  { value: 'tainan',     label: '台南市' },
  { value: 'kaohsiung',  label: '高雄市' },
  { value: 'keelung',    label: '基隆市' },
  { value: 'hsinchu',    label: '新竹縣市' },
  { value: 'miaoli',     label: '苗栗縣' },
  { value: 'changhua',   label: '彰化縣' },
  { value: 'nantou',     label: '南投縣' },
  { value: 'yunlin',     label: '雲林縣' },
  { value: 'chiayi',     label: '嘉義縣市' },
  { value: 'pingtung',   label: '屏東縣' },
  { value: 'yilan',      label: '宜蘭縣' },
  { value: 'hualien',    label: '花蓮縣' },
  { value: 'taitung',    label: '台東縣' },
  { value: 'penghu',     label: '澎湖縣' },
  { value: 'kinmen',     label: '金門縣' },
  { value: 'lienchiang', label: '連江縣' },
]

// 有行政區細選的城市（其餘城市只能選全市）
export const DISTRICT_MAP = {
  taipei: [
    { key: 'taipei_zhongzheng', label: '中正區' },
    { key: 'taipei_datong',     label: '大同區' },
    { key: 'taipei_zhongshan',  label: '中山區' },
    { key: 'taipei_songshan',   label: '松山區' },
    { key: 'taipei_daan',       label: '大安區' },
    { key: 'taipei_wanhua',     label: '萬華區' },
    { key: 'taipei_xinyi',      label: '信義區' },
    { key: 'taipei_shilin',     label: '士林區' },
    { key: 'taipei_beitou',     label: '北投區' },
    { key: 'taipei_neihu',      label: '內湖區' },
    { key: 'taipei_nangang',    label: '南港區' },
    { key: 'taipei_wenshan',    label: '文山區' },
  ],
  new_taipei: [
    { key: 'ntpc_banqiao',  label: '板橋區' },
    { key: 'ntpc_xizhi',    label: '汐止區' },
    { key: 'ntpc_xindian',  label: '新店區' },
    { key: 'ntpc_yonghe',   label: '永和區' },
    { key: 'ntpc_zhonghe',  label: '中和區' },
    { key: 'ntpc_tucheng',  label: '土城區' },
    { key: 'ntpc_sanxia',   label: '三峽區' },
    { key: 'ntpc_shulin',   label: '樹林區' },
    { key: 'ntpc_sanchong', label: '三重區' },
    { key: 'ntpc_xinzhuang',label: '新莊區' },
    { key: 'ntpc_linkou',   label: '林口區' },
    { key: 'ntpc_luzhou',   label: '蘆洲區' },
    { key: 'ntpc_tamsui',   label: '淡水區' },
    { key: 'ntpc_wanli',    label: '萬里區' },
    { key: 'ntpc_jinshan',  label: '金山區' },
    { key: 'ntpc_shenkeng', label: '深坑區' },
    { key: 'ntpc_ruifang',  label: '瑞芳區' },
    { key: 'ntpc_yingge',   label: '鶯歌區' },
    { key: 'ntpc_taishan',  label: '泰山區' },
    { key: 'ntpc_wugu',     label: '五股區' },
    { key: 'ntpc_bali',     label: '八里區' },
    { key: 'ntpc_sanzhi',   label: '三芝區' },
  ],
  taoyuan: [
    { key: 'tao_zhongli',  label: '中壢區' },
    { key: 'tao_pingzhen', label: '平鎮區' },
    { key: 'tao_longtan',  label: '龍潭區' },
    { key: 'tao_yangmei',  label: '楊梅區' },
    { key: 'tao_xinwu',    label: '新屋區' },
    { key: 'tao_guanyin',  label: '觀音區' },
    { key: 'tao_taoyuan',  label: '桃園區' },
    { key: 'tao_guishan',  label: '龜山區' },
    { key: 'tao_bade',     label: '八德區' },
    { key: 'tao_daxi',     label: '大溪區' },
    { key: 'tao_fuxing',   label: '復興區' },
    { key: 'tao_dayuan',   label: '大園區' },
    { key: 'tao_luzhu',    label: '蘆竹區' },
  ],
  taichung: [
    { key: 'tc_central',  label: '中區' },
    { key: 'tc_east',     label: '東區' },
    { key: 'tc_south',    label: '南區' },
    { key: 'tc_west',     label: '西區' },
    { key: 'tc_north',    label: '北區' },
    { key: 'tc_beitun',   label: '北屯區' },
    { key: 'tc_xitun',    label: '西屯區' },
    { key: 'tc_nantun',   label: '南屯區' },
    { key: 'tc_taiping',  label: '太平區' },
    { key: 'tc_dali',     label: '大里區' },
    { key: 'tc_wufeng',   label: '霧峰區' },
    { key: 'tc_wuri',     label: '烏日區' },
    { key: 'tc_fengyuan', label: '豐原區' },
    { key: 'tc_houli',    label: '后里區' },
    { key: 'tc_shigang',  label: '石岡區' },
    { key: 'tc_dongshi',  label: '東勢區' },
    { key: 'tc_heping',   label: '和平區' },
    { key: 'tc_xinshe',   label: '新社區' },
    { key: 'tc_tanzi',    label: '潭子區' },
    { key: 'tc_daya',     label: '大雅區' },
    { key: 'tc_shengang', label: '神岡區' },
    { key: 'tc_dadu',     label: '大肚區' },
    { key: 'tc_shalu',    label: '沙鹿區' },
    { key: 'tc_longjing', label: '龍井區' },
    { key: 'tc_wuqi',     label: '梧棲區' },
    { key: 'tc_qingshui', label: '清水區' },
    { key: 'tc_dajia',    label: '大甲區' },
    { key: 'tc_waipu',    label: '外埔區' },
    { key: 'tc_daan',     label: '大安區' },
  ],
  kaohsiung: [
    { key: 'ks_xinxing',  label: '新興區' },
    { key: 'ks_qianjin',  label: '前金區' },
    { key: 'ks_lingya',   label: '苓雅區' },
    { key: 'ks_yancheng', label: '鹽埕區' },
    { key: 'ks_gushan',   label: '鼓山區' },
    { key: 'ks_qijin',    label: '旗津區' },
    { key: 'ks_qianzhen', label: '前鎮區' },
    { key: 'ks_sanmin',   label: '三民區' },
    { key: 'ks_nanzi',    label: '楠梓區' },
    { key: 'ks_xiaogang', label: '小港區' },
    { key: 'ks_zuoying',  label: '左營區' },
    { key: 'ks_renwu',    label: '仁武區' },
    { key: 'ks_dashe',    label: '大社區' },
    { key: 'ks_gangshan', label: '岡山區' },
    { key: 'ks_luzhu',    label: '路竹區' },
    { key: 'ks_fengshan', label: '鳳山區' },
    { key: 'ks_daliao',   label: '大寮區' },
    { key: 'ks_linyuan',  label: '林園區' },
    { key: 'ks_niaosong', label: '鳥松區' },
  ],
}

/**
 * 將 area 字串反解成 { selectedCities, districtSelections }
 * e.g. "taipei_zhongzheng,taipei_datong,new_taipei"
 *   → { selectedCities: ['taipei','new_taipei'], districtSelections: { taipei: ['taipei_zhongzheng','taipei_datong'] } }
 */
export function parseAreaParam(areaStr) {
  if (!areaStr) return { selectedCities: ['taipei'], districtSelections: {} }

  const keys = areaStr.split(',').map(s => s.trim()).filter(Boolean)
  const cityKeys = new Set(CITY_OPTIONS.map(c => c.value))

  // Build a lookup: district key → city key
  const districtToCity = {}
  for (const [city, districts] of Object.entries(DISTRICT_MAP)) {
    for (const d of districts) {
      districtToCity[d.key] = city
    }
  }

  const selectedCities = []
  const districtSelections = {}

  for (const key of keys) {
    if (cityKeys.has(key)) {
      // Whole city selected
      if (!selectedCities.includes(key)) selectedCities.push(key)
    } else if (districtToCity[key]) {
      const city = districtToCity[key]
      if (!selectedCities.includes(city)) selectedCities.push(city)
      if (!districtSelections[city]) districtSelections[city] = []
      districtSelections[city].push(key)
    }
  }

  return {
    selectedCities: selectedCities.length > 0 ? selectedCities : ['taipei'],
    districtSelections,
  }
}

/**
 * 根據已選城市與行政區，組出送給後端的 area 字串
 * 規則：
 *   - 某城市無選行政區 → 用城市代碼 key（e.g. "taipei"）
 *   - 某城市有選行政區 → 用行政區 key 列表（e.g. "taipei_daan,taipei_xinyi"）
 */
export function buildAreaParam(selectedCities, districtSelections) {
  const parts = []
  for (const city of selectedCities) {
    const districts = districtSelections[city] || []
    if (districts.length === 0) {
      parts.push(city)
    } else {
      parts.push(...districts)
    }
  }
  return parts.join(',')
}
