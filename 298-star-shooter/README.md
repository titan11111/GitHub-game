# 298｜STAR SHOOTER

| 項目 | 内容 |
|---|---|
| 番号 | 298 |
| フォルダ | `298-star-shooter` |
| ジャンル | 縦スクロールシューティング |
| 概要 | 指でなぞって避けるだけ。弾は自動、30秒ごとにボスが来る縦シューティング。 |
| 操作 | ドラッグで移動（オート連射） |
| プレイ時間 | 1回1〜5分 |

## 起動

```sh
_tools/preview.sh 298-star-shooter
```

または `python3 -m http.server 8000` → `http://localhost:8000/298-star-shooter/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
