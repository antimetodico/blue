import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const controlScript = await readFile(new URL('../public/mobile-controls.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const windowStub = { navigator: {} };
vm.runInNewContext(controlScript, { window: windowStub, navigator: windowStub.navigator });
const controls = windowStub.MobileControls;

function button(control) {
  const listeners = {};
  return {
    dataset: { control },
    listeners,
    addEventListener(type, listener) { (listeners[type] ??= []).push(listener); },
    setPointerCapture() {},
    fire(type, pointerId = 1) {
      for (const listener of listeners[type] ?? []) {
        listener({ pointerId, currentTarget: this, preventDefault() {} });
      }
    },
  };
}

function rootWith(...buttons) {
  return { querySelectorAll: () => buttons };
}

test('detects coarse pointers and touch-capable browsers, not ordinary desktop', () => {
  assert.equal(controls.isTouchDevice({ matchMedia: () => ({ matches: true }) }, {}), true);
  assert.equal(controls.isTouchDevice({ matchMedia: () => ({ matches: false }) }, { maxTouchPoints: 5 }), true);
  assert.equal(controls.isTouchDevice({ matchMedia: () => ({ matches: false }) }, {}), false);
});

test('touch buttons press and release the matching game controls', () => {
  const up = button('up');
  const jump = button('jump');
  const keys = {};
  controls.bindTouchControls(rootWith(up, jump), keys);
  up.fire('pointerdown', 7);
  jump.fire('pointerdown', 8);
  assert.equal(keys.w, true);
  assert.equal(keys[' '], true);
  up.fire('pointerup', 7);
  jump.fire('pointerup', 8);
  assert.equal(keys.w, false);
  assert.equal(keys[' '], false);
});

test('cancelled touches release movement and allow simultaneous fingers', () => {
  const up = button('up');
  const jump = button('jump');
  const keys = {};
  controls.bindTouchControls(rootWith(up, jump), keys);
  up.fire('pointerdown', 1);
  up.fire('pointerdown', 2);
  up.fire('pointerup', 1);
  assert.equal(keys.w, true);
  up.fire('pointercancel', 2);
  assert.equal(keys.w, false);
  jump.fire('pointerdown', 3);
  jump.fire('lostpointercapture', 3);
  assert.equal(keys[' '], false);
});

test('mobile start prompt stays hidden on desktop and is enabled for touch devices', () => {
  assert.match(html, /\.prompt\.mobile-prompt\{display:none\}/);
  assert.match(html, /\.touch-device \.mobile-prompt\{display:block\}/);
});

test('mobile layout provides touch instructions and four-way plus hop controls', () => {
  assert.match(html, /id="mobile-controls"/);
  assert.match(html, /id="mobile-hint"/);
  for (const control of ['up', 'down', 'left', 'right', 'jump']) {
    assert.match(html, new RegExp(`data-control="${control}"`));
  }
  assert.match(html, /touch-device/);
});
