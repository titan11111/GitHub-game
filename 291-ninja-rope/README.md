# 291｜NINJA ROPE

| 項目 | 内容 |
|---|---|
| 番号 | 291 |
| フォルダ | `291-ninja-rope` |
| ジャンル | スイングアクション |
| 概要 | 押して掴み、離して飛ぶ。振り子の勢いで谷を渡る忍者スイングアクション。 |
| 操作 | 押している間ロープで掴む／離すと飛ぶ |
| プレイ時間 | 1回30秒〜2分 |

## 起動

```sh
_tools/preview.sh 291-ninja-rope
```

または `python3 -m http.server 8000` → `http://localhost:8000/291-ninja-rope/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
