# Raw Air — 接案作品集網站

網址：https://raw-air.github.io/

純靜態網站，沒有建置步驟。三個檔案：

| 檔案 | 放什麼 |
|---|---|
| `index.html` | 所有文字內容、作品、服務、流程 |
| `css/style.css` | 外觀 |
| `js/main.js` | 動畫、概念圖實驗室、設定 |

## 常見修改

**加 Email / LINE 按鈕**
打開 `js/main.js`，最上面的 `CONFIG`：

```js
email: 'you@example.com',   // 填了就會出現「寫信給我」
line: 'your-line-id',       // 填 LINE ID 或 https://lin.ee/... 連結
```

**改作品**
`index.html` 搜尋 `<!-- 作品 1 -->`，每個 `<article class="work">` 是一件作品。標題、說明、標籤直接改字。

**改概念圖的例子**
`js/main.js` 搜尋 `const IDEAS`，每一項有 `notes`（右邊的需求筆記）和 `html`（畫面）。

**改品牌名**
全站搜尋 `RAW AIR` 取代即可。

## 更新上線

改完後在這個資料夾：

```
git add -A
git commit -m "更新內容"
git push
```

GitHub Pages 大約 1 分鐘後生效。

## 本機預覽

```
python -m http.server 8791
```

然後開 http://localhost:8791/
