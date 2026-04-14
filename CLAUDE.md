# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### CLI 爬蟲（從專案根目錄執行）
```bash
pipenv shell                                          # 進入虛擬環境
pipenv run python main.py --keyword Python --area taipei --max-pages 3
pipenv run python main.py -k "數據分析" -a taipei,new_taipei --order date -n 5 --format csv
```

### 後端（從專案根目錄執行，不是 backend/ 內）
```bash
pipenv install -r backend/requirements.txt
pipenv run uvicorn backend.main:app --reload --port 8000
```

### 前端
```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

### 測試
```bash
pipenv run python -m pytest tests/ -v
pipenv run python -m pytest tests/test_parser.py::TestParseResponse -v   # 單一測試類別
```

### 語法檢查
```bash
pipenv run python -c "import ast; [ast.parse(open(f, encoding='utf-8').read()) for f in ['scraper/parser.py','scraper/client.py','backend/main.py','backend/services/scraper_service.py']]"
```

---

## 架構總覽

本專案有兩個獨立入口，共用同一個 `scraper/` 核心：

```
CLI (main.py) ──────┐
                    ├──► scraper/ ──► 104.com.tw API
Web (backend/) ─────┘
```

### scraper/（核心，兩個模式共用）

- `config.py` — 所有常數的唯一來源：API URL、地區代碼（`AREA_CODES`）、排序碼（`ORDER_CODES`）、延遲設定
- `scraper/client.py` — `JobClient`：`requests.Session` 管理、必要 headers（`Referer` 缺少會 403）、速率限制
- `scraper/parser.py` — 純函數，無 I/O。實際 API 回應結構：`{"data": [...], "metadata": {"pagination": {...}}}`，注意 `data` 直接是 list（非 `data.list`），job ID 欄位是 `jobNo`（非 `jobId`），`tags` 是 dict（非 list）
- `scraper/models.py` — `JobListing` dataclass；`to_flat_dict()` 給 CSV 用（tags 以 `|` 分隔）

### backend/（Web 平台，FastAPI）

必須從**專案根目錄**啟動，原因：`scraper_service.py` 直接 `import config` 和 `from scraper import parser`，依賴根目錄在 `sys.path` 中。

任務生命週期：
1. `POST /api/search` → 建立 SQLite task 紀錄 → 啟動 daemon thread
2. Thread 執行 `scrape_in_thread()`，每頁更新 `_progress` dict（in-memory）
3. 完成後將 jobs 寫入 SQLite `jobs` 表，task 狀態改為 `done`
4. `GET /api/tasks/{id}` 合併 SQLite 狀態 + in-memory 進度回傳
5. `GET /api/tasks/{id}/results` 從 SQLite 讀取，呼叫 `compute_stats()` 產生圖表資料

SQLite 資料庫位置：`backend/jobinsight.db`（自動建立）

### frontend/（React + Vite）

狀態機：`idle → loading → done | error`

polling 邏輯在 `App.jsx`：`useEffect` 每 2 秒呼叫 `GET /api/tasks/{id}`，status 變 `done` 後呼叫 `/results`。Vite dev server 透過 proxy 將 `/api/*` 轉發到 `localhost:8000`。

---

## 關鍵注意事項

- **CSV 編碼**：`storage/csv_writer.py` 使用 `utf-8-sig`（含 BOM），讓 Windows Excel 正確顯示中文
- **薪資欄位**：`salary_low / salary_high` 為 `0` 時轉為 `None`（表示未揭露，非實際薪資）
- **tags 結構**：API 回傳 `{"zone": {"desc": "大台北"}, ...}`，解析時取各 value 的非空 `desc`
- **print 避免 emoji**：Windows 終端機 cp950 編碼不支援 `✓` 等符號，會 UnicodeEncodeError
- **後端匯入路徑**：`backend/` 內的程式碼用相對匯入（`from backend.database import ...`），必須從根目錄以 `uvicorn backend.main:app` 啟動
