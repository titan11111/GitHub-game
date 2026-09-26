# LEARNINGS — 264-jutai-drive（18:42発に間に合え）

## 2026-09-26 BGM（Web Audio ループ）

- 外部 MP3 なし。126BPM の Am–F–C–G 進行を `bgmTick()` で先読みスケジュール。エンジン音・クラクションと master 経由でミュート共有。
- ミュート状態は `tg.264.mute` に保存（`tg.264.best` と同系統）。
- タイトル初タップで `audioInit()`（iOS unlock）。走行中は BGM 0.11、タイトル／リザルトは 0.07。ポーズ中は 0。
