# Taishin AI Trader

這是一個基於台新證券 Nova API 的 AI 交易助理，具備自動監控、定時回報與條件觸發下單功能。

## ✨ 核心功能
- **定時回報**：每 5 分鐘自動透過 Telegram 發送監控目標的行情。
- **條件下單**：當價格達到預設條件時，自動執行台新 API 下單。
- **冰山架構**：複雜的憑證認證與 SDK 呼叫皆封裝在 `TaishinClient` 中。
- **型別安全**：嚴格遵循 TS Mastery 準則。

## 🚀 快速開始

### 1. 安裝台新 SDK
由於台新 SDK 未發佈於 npm，請將官方提供的 `taishinsdk.tgz` 放入專案根目錄並安裝：
```bash
npm install ./taishinsdk.tgz
```

### 2. 環境變數
配置 `.env` 檔案，填入 TG Token、Admin Chat ID 以及台新帳號憑證資訊。

### 3. 啟動監控
```bash
npm run dev
```

## 🛠️ 技術棧
- **Telegraf**: Telegram Bot 框架。
- **Node-Cron**: 處理定時監控排程。
- **Zod**: 環境變數與資料校驗。
- **Result Pattern**: 統一的錯誤處理機制。
