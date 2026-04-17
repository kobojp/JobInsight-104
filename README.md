# JobInsight-104

104.com.tw 職缺爬蟲與分析平台。支援 CLI 快速匯出與 Web 互動儀表板兩種使用模式，共用同一個爬蟲核心。

## colab
https://colab.research.google.com/github/kobojp/JobInsight-104/blob/master/JobInsight104_Colab.ipynb?hl=zh-tw#scrollTo=VFI6Nuss4mKk

---

## 功能特色

- **雙模式入口**：CLI 一行指令匯出、Web 平台即時爬取與視覺化
- **多地區篩選**：支援縣市層級與行政區層級（台北/新北/桃園/台中/高雄等）
- **彈性排序**：相關性、最新日期、薪資、瀏覽數
- **即時進度**：Web 模式每 2 秒輪詢，顯示目前頁數/收集數
- **互動篩選**：地區、薪資下限、職缺名稱、公司、刊登日、應徵人數、標籤
- **統計圖表**：薪資分布、地區分布、工作性質分布（Recharts）
- **KPI 卡片**：總筆數、平均薪資下限、最多職缺地區、薪資揭露率
- **可取消爬取**：任意時間點中止，已收集資料仍保留
- **資料匯出**：CSV（UTF-8 BOM，Excel 相容）、JSON、前端 PDF 列印
- **搜尋歷史**：SQLite 持久化，可重新查詢或刪除歷史紀錄

---

## 架構總覽

```
CLI (main.py) ──────┐
                    ├──► scraper/ ──► 104.com.tw API
Web (backend/) ─────┘
       │
       ├── FastAPI (port 8000)
       ├── SQLite (backend/jobinsight.db)
       └── React + Vite (port 5173)
```

### 目錄結構

```
JobInsight-104/
├── main.py                    # CLI 入口
├── config.py                  # 全域常數（URL、地區碼、排序碼）
├── Pipfile                    # Python 相依套件
│
├── scraper/                   # 核心爬蟲（CLI 與 Web 共用）
│   ├── client.py              # JobClient：Session 管理、Rate Limit
│   ├── parser.py              # 純函數 API 解析，無 I/O
│   └── models.py              # JobListing dataclass
│
├── storage/                   # CLI 輸出
│   ├── csv_writer.py          # UTF-8 BOM CSV
│   └── json_writer.py         # JSON + metadata
│
├── backend/                   # Web 平台（FastAPI）
│   ├── main.py                # App 初始化、CORS、路由掛載
│   ├── database.py            # SQLite CRUD
│   ├── models.py              # Pydantic SearchRequest
│   ├── routes/
│   │   ├── search.py          # POST /api/search
│   │   ├── tasks.py           # GET /api/tasks/{id}、結果、取消、歷史
│   │   └── export.py          # GET /api/tasks/{id}/export/csv|jobs
│   └── services/
│       └── scraper_service.py # 背景執行緒、進度追蹤、統計運算
│
├── frontend/                  # React + Vite
│   └── src/
│       ├── App.jsx            # 狀態機（idle/loading/done/error）
│       ├── api/client.js      # API 呼叫封裝
│       └── components/        # SearchForm、JobTable、FilterBar、KPICards 等
│
└── tests/                     # pytest 單元測試
```

---

## 安裝

### 前置需求

- Python 3.13+
- Node.js 18+
- pipenv

### Python 環境

```bash
# 從專案根目錄
pipenv install -r backend/requirements.txt
```

### 前端

```bash
cd frontend
npm install
```

---

## 使用方式

### CLI 模式

從專案根目錄執行：

```bash
pipenv shell

# 基本搜尋
python main.py --keyword Python --area taipei

# 多地區、自訂排序、限制頁數
python main.py -k "數據分析" -a taipei,new_taipei --order date -n 5

# 指定輸出格式與目錄
python main.py -k "後端工程師" -a taipei --format csv -o ./output

# 顯示詳細 log
python main.py -k "React" -a taipei -v --max-pages 10
```

**CLI 參數總覽：**

| 參數 | 縮寫 | 說明 | 預設值 |
|------|------|------|--------|
| `--keyword` | `-k` | 搜尋關鍵字 | （空，列出全部） |
| `--area` | `-a` | 地區名稱或代碼，逗號分隔 | `taipei` |
| `--order` | | 排序：`relevance` / `date` / `salary` / `views` | `relevance` |
| `--max-pages` | `-n` | 最大爬取頁數 | 全部 |
| `--pagesize` | | 每頁筆數（1–20） | `20` |
| `--format` | | `csv` / `json` / `both` | `both` |
| `--output-dir` | `-o` | 輸出目錄 | `output/` |
| `--filename-prefix` | `-p` | 檔名前綴 | `jobs` |
| `--min-delay` | | 請求間最小延遲（秒） | `3.0` |
| `--max-delay` | | 請求間最大延遲（秒） | `6.0` |
| `--verbose` | `-v` | 開啟 DEBUG log | `false` |

輸出檔案格式：`output/jobs_20240414_153000.csv`

### Web 模式

**啟動後端**（從專案根目錄）：

```bash
pipenv run uvicorn backend.main:app --reload --port 8000
```

**啟動前端**（另開終端機）：

```bash
cd frontend
npm run dev
```

開啟瀏覽器 [http://localhost:5173](http://localhost:5173)

> Vite dev server 透過 proxy 將 `/api/*` 轉發到 `localhost:8000`，不需手動設定跨域。

---

## 地區代碼

`--area` 支援以下名稱（可用逗號組合多個）：

| 名稱 | 地區 | 名稱 | 地區 |
|------|------|------|------|
| `taipei` | 台北市 | `taichung` | 台中市 |
| `new_taipei` | 新北市 | `tainan` | 台南市 |
| `taoyuan` | 桃園市 | `kaohsiung` | 高雄市 |
| `hsinchu` | 新竹縣市 | `keelung` | 基隆市 |
| `yilan` | 宜蘭縣 | `hualien` | 花蓮縣 |

台北市行政區範例：`taipei_daan`、`taipei_xinyi`、`taipei_zhongshan`  
新北市行政區範例：`ntpc_banqiao`、`ntpc_xindian`、`ntpc_tamsui`  
桃園市行政區範例：`tao_zhongli`、`tao_taoyuan`、`tao_guishan`  

完整代碼列表請見 [config.py](config.py)。

---

## Web API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| `POST` | `/api/search` | 建立爬取任務，回傳 `task_id` |
| `GET` | `/api/tasks/{id}` | 查詢任務狀態與即時進度 |
| `GET` | `/api/tasks/{id}/results` | 取得分頁結果、統計、篩選選項 |
| `POST` | `/api/tasks/{id}/cancel` | 請求中止爬取 |
| `GET` | `/api/history` | 列出最近搜尋紀錄 |
| `DELETE` | `/api/tasks` | 批次刪除任務 |
| `GET` | `/api/tasks/{id}/export/csv` | 匯出 CSV（支援篩選） |
| `GET` | `/api/tasks/{id}/export/jobs` | 匯出 JSON（供前端 PDF 用） |
| `GET` | `/api/health` | 健康檢查 |

**POST /api/search 請求範例：**

```json
{
  "keyword": "Python",
  "area": "taipei,new_taipei",
  "order": "date",
  "max_pages": 5,
  "pagesize": 20
}
```

**任務狀態流程：** `pending` → `running` → `done` | `cancelled` | `failed`

---

## 資料欄位

| 欄位 | 說明 |
|------|------|
| `job_id` | 104 職缺編號（`jobNo`） |
| `job_name` | 職缺名稱 |
| `company_name` | 公司名稱 |
| `salary_low` / `salary_high` | 薪資下/上限（`0` 或 `null` 表示未揭露） |
| `salary_desc` | 薪資文字說明 |
| `job_addr_no_desc` | 地區（如「台北市大安區」） |
| `job_address` | 詳細地址 |
| `appear_date` | 刊登日期 |
| `apply_cnt` | 應徵人數 |
| `period_desc` | 工作性質（全職/兼職等） |
| `option_edu` | 學歷要求代碼 |
| `tags` | 標籤（CSV 用 `\|` 分隔） |
| `job_url` | 職缺連結 |
| `scraped_at` | 爬取時間戳 |

---

## 執行測試

```bash
# 全部測試
pipenv run python -m pytest tests/ -v

# 單一測試類別
pipenv run python -m pytest tests/test_parser.py::TestParseResponse -v
```

---

## 技術棧

**後端**
- Python 3.13、pipenv
- [requests](https://docs.python-requests.org/) — HTTP 請求
- [FastAPI](https://fastapi.tiangolo.com/) + [uvicorn](https://www.uvicorn.org/) — Web 框架
- [Pydantic v2](https://docs.pydantic.dev/) — 資料驗證
- [pandas](https://pandas.pydata.org/) — 統計運算
- SQLite — 任務與職缺持久化

**前端**
- [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) — 樣式
- [Recharts](https://recharts.org/) — 圖表
- [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) — PDF 匯出

---

## 注意事項

- **請求延遲**：預設每次請求間隔 3–6 秒（隨機），避免對伺服器造成負擔
- **CSV 編碼**：使用 UTF-8 BOM，確保 Windows Excel 正確顯示中文
- **後端必須從根目錄啟動**：`scraper_service.py` 直接 import 根目錄的 `config` 和 `scraper`
- **薪資為 0**：表示該職缺未揭露薪資，非實際薪資
