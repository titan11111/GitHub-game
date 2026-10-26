# learnings: GitHub Pages自動デプロイが4回連続失敗していた件（壊れたgitlink）

- 日付: 2026-10-26
- 対象: `titan11111/GitHub-game` リポジトリの GitHub Pages 自動デプロイ（Actions: pages-build-deployment）
- ステータス: 原因特定・修正・再デプロイ成功まで確認済み
- 影響範囲: 002含め**リポジトリ全体**。10/12・10/21(×2)・10/26の直近4回のデプロイが全て同じエラーで失敗し、その間にpushされた全ゲームの変更がPagesへ反映されていなかった

## 症状

`gh run list -R titan11111/GitHub-game` の `pages-build-deployment` が毎回 `completed / failure`。
`gh api repos/titan11111/GitHub-game/pages` の `status` は `errored`。

## 原因（確定）

```
##[error]fatal: No url found for submodule path '273-tsumeshogi-100ren' in .gitmodules
##[error]The process '/usr/bin/git' failed with exit code 128
```

`273-tsumeshogi-100ren` が通常ファイルではなく **gitlink（mode 160000）** として記録されていた
（`git ls-files -s 273-tsumeshogi-100ren` → `160000 2e698ed... 0 273-tsumeshogi-100ren`）。
一方でリポジトリに `.gitmodules` は存在しない。

原因は「273のフォルダが独自の `.git` を持った状態で、親リポジトリから `git add` された」こと。
`git submodule add` を経ていないため `.gitmodules` に登録されず、GitHub Actions の
`actions/checkout`（submodules取得あり）がこのgitlinkを解決しようとして毎回 exit 128 で死ぬ。
コミット履歴を見ると、この状態は少なくとも10/12より前から続いていた（`git log -- 273-tsumeshogi-100ren`）。

## 修正

```bash
git rm --cached 273-tsumeshogi-100ren   # インデックスからgitlink参照だけを外す。ローカルのフォルダ・.gitは無傷
git commit -m "..."
git push
```

ローカルの `273-tsumeshogi-100ren/` フォルダと、その中の独自 `.git` 履歴は一切変更していない。
親リポジトリ側がそれを「サブモジュールとして追跡する」のをやめただけ。

## 検証

- `gh run list -R titan11111/GitHub-game --limit 1` → `completed / success`
- `gh api repos/titan11111/GitHub-game/pages` → `status: built`
- 本番URLのHTMLとローカルのSHA-256一致を確認（002-sky-sweeper-unity-game で実施）
- Playwrightで本番URLを実際に開き、コンソールエラー0・ゲーム動作を確認

## 次に活かす条件

- **pushしただけで「公開完了」と言わない**。`gh run list -R titan11111/GitHub-game --limit 1` でPages Actionsの結果を見るまでは未確認として扱う
- 新しいフォルダを `git add` する前に、そのフォルダが独自の `.git` を持っていないか確認する（`find <folder> -name .git -maxdepth 1`）。持っていたら `git submodule add` で正式に登録するか、`.git` ごと削除してから通常ファイルとして取り込む
- 273-tsumeshogi-100ren のコンテンツ自体がPagesに正しく載っているかは今回のスコープ外（gitlinkだったため実体ファイルはそもそも親リポジトリに入っていない）。別途、この作品を通常ファイルとして取り込み直す必要がある
