# 294｜BUBBLE POP

| 項目 | 内容 |
|---|---|
| 番号 | 294 |
| フォルダ | `294-bubble-pop` |
| ジャンル | パズル / シューター |
| 概要 | なぞって狙い、離して撃つ。3つ揃えて弾けさせる王道バブルシューター。 |
| 操作 | ドラッグで照準、離して発射 |
| プレイ時間 | 1回3〜8分 |

## 起動

```sh
_tools/preview.sh 294-bubble-pop
```

または `python3 -m http.server 8000` → `http://localhost:8000/294-bubble-pop/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
