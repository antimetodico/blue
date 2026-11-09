import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const game = await readFile(new URL('../public/dungeon.js', import.meta.url), 'utf8');

test('loads the current dungeon page and its gameplay controls', () => {
  assert.match(html, /<script src="dungeon\.js"><\/script>/);
  for (const id of ['game', 'flash', 'room-label', 'open-button', 'stick-base', 'stick-knob']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
});

test('character has a human-shaped articulated rig', () => {
  for (const feature of ['pelvis', 'torso', 'chest', 'neck', 'head', 'nose']) {
    assert.match(game, new RegExp('const ' + feature + ' ='));
  }
  assert.match(game, /function makeLeg/);
  assert.match(game, /function makeArm/);
  assert.match(game, /leftLeg\.knee\.rotation\.x/);
  assert.match(game, /rightArm\.shoulder\.rotation\.x/);
});

test('pixel shimmer remains a camera-facing overlay with a white aura', () => {
  assert.match(game, /new THREE\.CanvasTexture\(characterCanvas\)/);
  assert.match(game, /THREE\.NearestFilter/);
  assert.match(game, /new THREE\.Sprite/);
  assert.match(game, /blending: THREE\.AdditiveBlending/);
  assert.match(game, /function refreshShimmer/);
  assert.match(game, /function drawFlashPattern/);
  assert.match(game, /new THREE\.PointLight\(0xeaf1ff/);
});

test('camera stays behind the character at every heading and follows smoothly', () => {
  assert.match(game, /const backwardX = -Math\.sin\(cameraYaw\)/);
  assert.match(game, /const backwardZ = Math\.cos\(cameraYaw\)/);
  assert.match(game, /cameraYaw = dampAngle\(cameraYaw, player\.rotation\.y/);
  assert.match(game, /camera\.position\.lerp\(desiredPosition/);
  assert.match(game, /cameraTarget\.lerp\(desiredTarget/);
  assert.match(game, /camera\.lookAt\(cameraTarget\)/);
});

test('movement reference is locked during a movement stroke to avoid camera feedback', () => {
  assert.match(game, /if \(hasInput && !movementActive\)/);
  assert.match(game, /movementBasisYaw = cameraYaw/);
  assert.match(game, /const forward = new THREE\.Vector3\(\s*Math\.sin\(movementBasisYaw\)/);
  assert.match(game, /velocity\.lerp\(desiredVelocity/);
  assert.match(game, /player\.rotation\.y = dampAngle/);
  assert.match(game, /walkPhase \+= dt \* speed \* \(Math\.PI \* 2 \/ 1\.65\)/);
});

test('rooms retain procedural decorations and a door transition', () => {
  assert.match(game, /function seededRandom/);
  assert.match(game, /function buildRoom/);
  assert.match(game, /addChest\(roomRoot/);
  assert.match(game, /addChain\(roomRoot/);
  assert.match(game, /addMoss\(roomRoot/);
  assert.match(game, /doorPivot\.rotation\.y \+=/);
  assert.match(game, /function beginTransition/);
  assert.match(game, /buildRoom\(roomNumber\)/);
  assert.match(game, /flashCanvas\.style\.opacity/);
});

test('supports keyboard, touch joystick and gamepad input', () => {
  assert.match(game, /stickBase\.addEventListener\('pointerdown'/);
  assert.match(game, /event\.pointerId === stickPointer/);
  assert.match(game, /arrowup/);
  assert.match(game, /navigator\.getGamepads/);
  assert.match(html, /E TO OPEN/);
});
