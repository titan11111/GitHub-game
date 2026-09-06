# 297｜SUSHI CATCH

| 項目 | 内容 |
|---|---|
| 番号 | 297 |
| フォルダ | `297-sushi-catch` |
| ジャンル | キャッチ / 判断アクション |
| 概要 | 落ちてくる寿司を、注文どおりのネタだけ皿で受け止める60秒勝負。 |
| 操作 | 画面をなぞって皿を移動 |
| プレイ時間 | 1回60秒〜（注文達成で延長） |

## 起動

```sh
_tools/preview.sh 297-sushi-catch
```

または `python3 -m http.server 8000` → `http://localhost:8000/297-sushi-catch/`

## 構成

- `index.html` 単体で完結（外部CDN・外部アセットなし／音はWebAudio合成）
- iOS対応: ダブルタップズーム禁止・WebAudio unlock・safe-area・Canvas DPR対応
