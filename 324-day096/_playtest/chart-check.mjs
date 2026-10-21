import assert from 'node:assert/strict';
import { songs, Performance } from '../chart.js';
for (const song of songs) {
  const game = new Performance(song);
  for (const note of game.notes) {
    game.advance(note.t - .001);
    game.finishHit(game.match(note.t, note.type, note.hand), .035);
  }
  game.advance(game.duration);
  const result = game.result();
  assert.equal(result.rank, 5);
  assert.equal(result.miss, 0);
  assert.equal(result.relax, 100);
  process.stdout.write(`${song.name}: ${JSON.stringify(result)}\n`);
}
const game = new Performance(songs[0]);
const first = game.notes[0];
game.finishHit(game.match(first.t, 'K', 0), .3);
assert.equal(game.ok, 1);
assert.equal(game.score, 25);
assert.equal(game.relaxed, 0);
process.stdout.write('音種違いと力みの倍率: PASS\n');
