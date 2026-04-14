"""
JobInsight-104 Configuration
All constants for the 104.com.tw job scraper.
"""

BASE_SEARCH_URL = "https://www.104.com.tw/jobs/search/api/jobs"
BASE_REFERER = "https://www.104.com.tw/"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# 來源：104 官方 https://static.104.com.tw/category-tool/json/Area.json
# 縣市代碼格式：6001XXX000（末三碼 000 代表整個縣市）
# 行政區代碼格式：6001XXXXXX（末三碼非 000 代表特定行政區）

AREA_CODES = {
    # ── 縣市（city-level）──────────────────────────────────────────
    "taipei":      "6001001000",  # 台北市
    "new_taipei":  "6001002000",  # 新北市
    "yilan":       "6001003000",  # 宜蘭縣
    "keelung":     "6001004000",  # 基隆市
    "taoyuan":     "6001005000",  # 桃園市
    "hsinchu":     "6001006000",  # 新竹縣市
    "miaoli":      "6001007000",  # 苗栗縣
    "taichung":    "6001008000",  # 台中市
    "changhua":    "6001010000",  # 彰化縣
    "nantou":      "6001011000",  # 南投縣
    "yunlin":      "6001012000",  # 雲林縣
    "chiayi":      "6001013000",  # 嘉義縣市
    "tainan":      "6001014000",  # 台南市
    "kaohsiung":   "6001016000",  # 高雄市
    "pingtung":    "6001018000",  # 屏東縣
    "taitung":     "6001019000",  # 台東縣
    "hualien":     "6001020000",  # 花蓮縣
    "penghu":      "6001021000",  # 澎湖縣
    "kinmen":      "6001022000",  # 金門縣
    "lienchiang":  "6001023000",  # 連江縣

    # ── 台北市行政區 ───────────────────────────────────────────────
    "taipei_zhongzheng": "6001001001",  # 台北市中正區
    "taipei_datong":     "6001001002",  # 台北市大同區
    "taipei_zhongshan":  "6001001003",  # 台北市中山區
    "taipei_songshan":   "6001001004",  # 台北市松山區
    "taipei_daan":       "6001001005",  # 台北市大安區
    "taipei_wanhua":     "6001001006",  # 台北市萬華區
    "taipei_xinyi":      "6001001007",  # 台北市信義區
    "taipei_shilin":     "6001001008",  # 台北市士林區
    "taipei_beitou":     "6001001009",  # 台北市北投區
    "taipei_neihu":      "6001001010",  # 台北市內湖區
    "taipei_nangang":    "6001001011",  # 台北市南港區
    "taipei_wenshan":    "6001001012",  # 台北市文山區

    # ── 新北市行政區 ───────────────────────────────────────────────
    "ntpc_wanli":    "6001002001",  # 新北市萬里區
    "ntpc_jinshan":  "6001002002",  # 新北市金山區
    "ntpc_banqiao":  "6001002003",  # 新北市板橋區
    "ntpc_xizhi":    "6001002004",  # 新北市汐止區
    "ntpc_shenkeng": "6001002005",  # 新北市深坑區
    "ntpc_shiding":  "6001002006",  # 新北市石碇區
    "ntpc_ruifang":  "6001002007",  # 新北市瑞芳區
    "ntpc_pingxi":   "6001002008",  # 新北市平溪區
    "ntpc_shuangxi": "6001002009",  # 新北市雙溪區
    "ntpc_gongliao": "6001002010",  # 新北市貢寮區
    "ntpc_xindian":  "6001002011",  # 新北市新店區
    "ntpc_pinglin":  "6001002012",  # 新北市坪林區
    "ntpc_wulai":    "6001002013",  # 新北市烏來區
    "ntpc_yonghe":   "6001002014",  # 新北市永和區
    "ntpc_zhonghe":  "6001002015",  # 新北市中和區
    "ntpc_tucheng":  "6001002016",  # 新北市土城區
    "ntpc_sanxia":   "6001002017",  # 新北市三峽區
    "ntpc_shulin":   "6001002018",  # 新北市樹林區
    "ntpc_yingge":   "6001002019",  # 新北市鶯歌區
    "ntpc_sanchong": "6001002020",  # 新北市三重區
    "ntpc_xinzhuang":"6001002021",  # 新北市新莊區
    "ntpc_taishan":  "6001002022",  # 新北市泰山區
    "ntpc_linkou":   "6001002023",  # 新北市林口區
    "ntpc_luzhou":   "6001002024",  # 新北市蘆洲區
    "ntpc_wugu":     "6001002025",  # 新北市五股區
    "ntpc_bali":     "6001002026",  # 新北市八里區
    "ntpc_tamsui":   "6001002027",  # 新北市淡水區
    "ntpc_sanzhi":   "6001002028",  # 新北市三芝區
    "ntpc_shimen":   "6001002029",  # 新北市石門區

    # ── 桃園市行政區 ───────────────────────────────────────────────
    "tao_zhongli":  "6001005001",  # 桃園市中壢區
    "tao_pingzhen": "6001005002",  # 桃園市平鎮區
    "tao_longtan":  "6001005003",  # 桃園市龍潭區
    "tao_yangmei":  "6001005004",  # 桃園市楊梅區
    "tao_xinwu":    "6001005005",  # 桃園市新屋區
    "tao_guanyin":  "6001005006",  # 桃園市觀音區
    "tao_taoyuan":  "6001005007",  # 桃園市桃園區
    "tao_guishan":  "6001005008",  # 桃園市龜山區
    "tao_bade":     "6001005009",  # 桃園市八德區
    "tao_daxi":     "6001005010",  # 桃園市大溪區
    "tao_fuxing":   "6001005011",  # 桃園市復興區
    "tao_dayuan":   "6001005012",  # 桃園市大園區
    "tao_luzhu":    "6001005013",  # 桃園市蘆竹區

    # ── 台中市行政區 ───────────────────────────────────────────────
    "tc_central":   "6001008001",  # 台中市中區
    "tc_east":      "6001008002",  # 台中市東區
    "tc_south":     "6001008003",  # 台中市南區
    "tc_west":      "6001008004",  # 台中市西區
    "tc_north":     "6001008005",  # 台中市北區
    "tc_beitun":    "6001008006",  # 台中市北屯區
    "tc_xitun":     "6001008007",  # 台中市西屯區
    "tc_nantun":    "6001008008",  # 台中市南屯區
    "tc_taiping":   "6001008009",  # 台中市太平區
    "tc_dali":      "6001008010",  # 台中市大里區
    "tc_wufeng":    "6001008011",  # 台中市霧峰區
    "tc_wuri":      "6001008012",  # 台中市烏日區
    "tc_fengyuan":  "6001008013",  # 台中市豐原區
    "tc_houli":     "6001008014",  # 台中市后里區
    "tc_shigang":   "6001008015",  # 台中市石岡區
    "tc_dongshi":   "6001008016",  # 台中市東勢區
    "tc_heping":    "6001008017",  # 台中市和平區
    "tc_xinshe":    "6001008018",  # 台中市新社區
    "tc_tanzi":     "6001008019",  # 台中市潭子區
    "tc_daya":      "6001008020",  # 台中市大雅區
    "tc_shengang":  "6001008021",  # 台中市神岡區
    "tc_dadu":      "6001008022",  # 台中市大肚區
    "tc_shalu":     "6001008023",  # 台中市沙鹿區
    "tc_longjing":  "6001008024",  # 台中市龍井區
    "tc_wuqi":      "6001008025",  # 台中市梧棲區
    "tc_qingshui":  "6001008026",  # 台中市清水區
    "tc_dajia":     "6001008027",  # 台中市大甲區
    "tc_waipu":     "6001008028",  # 台中市外埔區
    "tc_daan":      "6001008029",  # 台中市大安區

    # ── 高雄市行政區 ───────────────────────────────────────────────
    "ks_xinxing":   "6001016001",  # 高雄市新興區
    "ks_qianjin":   "6001016002",  # 高雄市前金區
    "ks_lingya":    "6001016003",  # 高雄市苓雅區
    "ks_yancheng":  "6001016004",  # 高雄市鹽埕區
    "ks_gushan":    "6001016005",  # 高雄市鼓山區
    "ks_qijin":     "6001016006",  # 高雄市旗津區
    "ks_qianzhen":  "6001016007",  # 高雄市前鎮區
    "ks_sanmin":    "6001016008",  # 高雄市三民區
    "ks_nanzi":     "6001016009",  # 高雄市楠梓區
    "ks_xiaogang":  "6001016010",  # 高雄市小港區
    "ks_zuoying":   "6001016011",  # 高雄市左營區
    "ks_renwu":     "6001016012",  # 高雄市仁武區
    "ks_dashe":     "6001016013",  # 高雄市大社區
    "ks_gangshan":  "6001016014",  # 高雄市岡山區
    "ks_luzhu":     "6001016015",  # 高雄市路竹區
    "ks_fengshan":  "6001016024",  # 高雄市鳳山區
    "ks_daliao":    "6001016025",  # 高雄市大寮區
    "ks_linyuan":   "6001016026",  # 高雄市林園區
    "ks_niaosong":  "6001016027",  # 高雄市鳥松區
}

ORDER_CODES = {
    "relevance": "15",
    "date":      "1",
    "salary":    "13",
    "views":     "2",
}

DEFAULT_PARAMS = {
    "jobsource": "joblist_search",
    "mode":      "s",
    "order":     "15",
    "pagesize":  "20",
}

MIN_DELAY_SECONDS = 3.0
MAX_DELAY_SECONDS = 6.0

OUTPUT_DIR = "output"
