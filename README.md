# WebKohShin

WebKohShin is a simple website monitoring tool.

## 使い方

1. リリースページの zip を任意の場所に展開
2. WebKohShin.exe のショートカットを %APPDATA%/Microsoft/Windows/Start Menu/Programs に作成
3. WebKohShin.exe を起動

## プロキシを使うには

1. requestConfig.json.sample を WebKohShin.exe と同じフォルダにコピーし、requestConfig.json にリネーム
2. requestConfig.json を編集
3. 次のチェックから設定が有効になります

## ビルド

* For dev
  ```
  npm start
  ```
* For release
  ```
  npm run build
  ```
