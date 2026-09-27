// ============================================================
//  build-standalone.mjs - 単体HTML生成スクリプト
//  1) esbuild で全JS(Three.js含む)を1バンドル
//  2) CSS を読み込み
//  3) template.html にインライン化して dist-standalone/ に出力
// ============================================================

import { build } from 'esbuild'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

async function main() {
  console.log('▶ JSバンドル中（Three.js込み）…')
  const result = await build({
    entryPoints: [resolve(__dirname, 'standalone-entry.js')],
    bundle: true,
    format: 'iife',
    target: ['es2020'],
    minify: true,
    write: false,
    legalComments: 'none',
    logLevel: 'warning',
  })
  const js = result.outputFiles[0].text

  console.log('▶ CSS読み込み中…')
  const css = readFileSync(resolve(root, 'public/static/style.css'), 'utf8')

  console.log('▶ HTMLへインライン化中…')
  let html = readFileSync(resolve(__dirname, 'template.html'), 'utf8')
  // プレースホルダ置換（script内の </script> 回避のため安全に）
  const safeJs = js.replace(/<\/script>/gi, '<\\/script>')
  html = html.replace('/*__CSS__*/', css)
  html = html.replace('/*__JS__*/', safeJs)

  const outDir = resolve(root, 'dist-standalone')
  mkdirSync(outDir, { recursive: true })
  const outFile = resolve(outDir, 'monday-commute-rpg.html')
  writeFileSync(outFile, html, 'utf8')

  const sizeKb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1)
  console.log(`✅ 生成完了: ${outFile} (${sizeKb} KB)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
