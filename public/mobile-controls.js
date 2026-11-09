(() => {
  const controlKeys = {
    up: ['w'],
    down: ['s'],
    left: ['a'],
    right: ['d'],
    jump: [' '],
  };

  function isTouchDevice(windowObject = window, navigatorObject = navigator) {
    const coarsePointer = typeof windowObject.matchMedia === 'function'
      && windowObject.matchMedia('(pointer: coarse)').matches;
    return Boolean(coarsePointer || navigatorObject.maxTouchPoints > 0 || 'ontouchstart' in windowObject);
  }

  function bindTouchControls(root, keys) {
    const activePointers = new Map();
    const activeCounts = new Map();

    function setControl(control, pressed) {
      for (const key of controlKeys[control] ?? []) keys[key] = pressed;
    }

    root.querySelectorAll('[data-control]').forEach((button) => {
      const control = button.dataset.control;
      if (!controlKeys[control]) return;

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (activePointers.has(event.pointerId)) return;
        activePointers.set(event.pointerId, control);
        activeCounts.set(control, (activeCounts.get(control) ?? 0) + 1);
        setControl(control, true);
        try { button.setPointerCapture(event.pointerId); } catch (_) { /* capture may be unavailable */ }
      });

      const release = (event) => {
        if (activePointers.get(event.pointerId) !== control) return;
        activePointers.delete(event.pointerId);
        const remaining = (activeCounts.get(control) ?? 1) - 1;
        if (remaining > 0) activeCounts.set(control, remaining);
        else {
          activeCounts.delete(control);
          setControl(control, false);
        }
      };

      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
  }

  const touchDevice = isTouchDevice();
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.classList.toggle('touch-device', touchDevice);
  }

  window.MobileControls = { isTouchDevice, bindTouchControls };
})();
