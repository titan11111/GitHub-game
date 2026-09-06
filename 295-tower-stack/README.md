# 295｜TOWER STACK

| 項目 | 内容 |
|---|---|
| 番号 | 295 |
| フォルダ | `295-tower-stack` |
| ジャンル | タイミング / スタック |
| 概要 | タップで止めて積むだけ。ピタリ止めると幅が戻る、天まで届け系タワー。 |
| 操作 | タップで止める |
| プレイ時間 | 1回30秒〜3分 |

## 起動

```sh
_tools/preview.sh 295-tower-stack
```

または `python3 -m http.server 8000` → `http://localhost:8000/295-tower-stack/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
