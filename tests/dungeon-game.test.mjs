import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const game = await readFile(new URL('../public/dungeon.js', import.meta.url), 'utf8');

test('loads the dungeon game and provides its main interface elements', () => {
  assert.match(html, /<script src="dungeon\.js"><\/script>/);
  assert.match(html, /id="game"/);
  assert.match(html, /id="flash"/);
  assert.match(html, /id="room-label"/);
  assert.match(html, /id="open-button"/);
});

test('character shimmer is a camera-facing pixel texture', () => {
  assert.match(game, /new THREE\.CanvasTexture\(characterCanvas\)/);
  assert.match(game, /THREE\.NearestFilter/);
  assert.match(game, /new THREE\.Sprite/);
  assert.match(game, /depthTest: false/);
  assert.match(game, /function refreshShimmer/);
  assert.match(game, /function drawFlashPattern/);
});

test('movement and camera follow use smoothed real-time vectors', () => {
  assert.match(game, /function getInput/);
  assert.match(game, /velocity\.lerp\(desiredVelocity/);
  assert.match(game, /dampAngle\(cameraYaw, player\.rotation\.y/);
  assert.match(game, /camera\.position\.lerp/);
  assert.match(game, /leftLeg\.rotation\.x/);
  assert.match(game, /rightArm\.rotation\.x/);
});

test('rooms are seeded and decorated with chests, chains, and moss', () => {
  assert.match(game, /function seededRandom/);
  assert.match(game, /function buildRoom/);
  assert.match(game, /addChest\(roomRoot/);
  assert.match(game, /addChain\(roomRoot/);
  assert.match(game, /addMoss\(roomRoot/);
  assert.match(game, /roomRoot\.rotation\.y = roomAngle/);
});

test('door interaction opens the door before the full-screen transition', () => {
  assert.match(game, /function openDoor/);
  assert.match(game, /doorPivot\.rotation\.y = Math\.max/);
  assert.match(game, /function beginTransition/);
  assert.match(game, /buildRoom\(roomNumber \+ 1\)/);
  assert.match(game, /flashCanvas\.style\.opacity/);
});

test('supports touch joystick, keyboard, and browser gamepads', () => {
  assert.match(html, /id="stick-base"/);
  assert.match(game, /stickBase\.addEventListener\('pointerdown'/);
  assert.match(game, /event\.pointerId === stickPointer/);
  assert.match(game, /arrowup/);
  assert.match(game, /navigator\.getGamepads/);
});
