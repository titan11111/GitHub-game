// ============================================================
//  standalone-entry.js - 単体HTML用エントリ
//  Three.js をローカルバンドルし、全ゲームコードを1ファイルに統合
// ============================================================

import * as THREE from 'three'
import { Dialog, toast, resumeAudio, fmtTime, alarmSound } from '../public/static/js/utils.js'
import { createBuilders } from '../public/static/js/builders.js'
import { createScenes } from '../public/static/js/world.js'
import { decorateStreet, bindInteractions } from '../public/static/js/interactions.js'
import { Game } from '../public/static/js/game.js'
import { CONFIG } from '../public/static/js/config.js'
import { playTetris, playSickCall, playCoffee, playPigeons, choiceDialog } from '../public/static/js/minigames.js'

// ゲーム内から参照できるようグローバルにも公開（デバッグ用）
window.__THREE = THREE

async function boot() {
  const status = document.getElementById('loading-status')
  try {
    status && (status.textContent = '世界を構築中…')

    const B = createBuilders(THREE)
    const scenes = createScenes(THREE, B)
    decorateStreet(THREE, B, scenes.street)

    Dialog.init()

    const game = new Game(THREE, B, scenes)
    window.__game = game
    bindInteractions(game)

    document.getElementById('hud-score').textContent = '0'
    document.getElementById('hud-time').textContent = fmtTime(game.time)
    game.updateObjective()

    setTimeout(() => {
      Dialog.show([
        { speaker: '', text: '──── 月曜日 6:30 ────' },
        { speaker: '', text: 'リンリンリンリン！！ 目覚ましが鳴り響く。' },
        { speaker: '心の声', text: '（……月曜か。布団から出て、目覚ましを止めないと）' },
      ])
    }, 400)

    const title = document.getElementById('title-screen')
    title.classList.remove('hidden')
    document.getElementById('title-start').onclick = () => {
      resumeAudio()
      title.classList.add('hidden')
      document.getElementById('loading').classList.add('hidden')
      game.start()
      startAlarmActually(game)
    }

    setupHelp()
  } catch (e) {
    console.error(e)
    if (status) status.textContent = '起動に失敗しました: ' + e.message
  }
}

function startAlarmActually(game) {
  const iv = setInterval(() => {
    if (game.flags.woke || game.ending) {
      clearInterval(iv)
      document.getElementById('alarm-flash').classList.remove('active')
      return
    }
    alarmSound()
  }, 1500)
  game._alarmTimer = iv
  document.getElementById('alarm-flash').classList.add('active')
}

function setupHelp() {
  const panel = document.getElementById('help-panel')
  const btn = document.getElementById('help-btn')
  if (!btn) return
  btn.onclick = () => panel.classList.toggle('hidden')
  const close = document.getElementById('help-close')
  if (close) close.onclick = () => panel.classList.add('hidden')
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
else boot()
