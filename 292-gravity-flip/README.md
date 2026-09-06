# 292｜GRAVITY FLIP

| 項目 | 内容 |
|---|---|
| 番号 | 292 |
| フォルダ | `292-gravity-flip` |
| ジャンル | 重力反転アクション |
| 概要 | タップで天地を反転し、床と天井を行き来して針を避ける高速アクション。 |
| 操作 | タップで重力反転 |
| プレイ時間 | 1回30秒〜2分 |

## 起動

```sh
_tools/preview.sh 292-gravity-flip
```

または `python3 -m http.server 8000` → `http://localhost:8000/292-gravity-flip/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
