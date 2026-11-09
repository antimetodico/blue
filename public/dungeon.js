(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const flashCanvas = document.getElementById('flash');
  const flashContext = flashCanvas.getContext('2d');
  const boot = document.getElementById('boot');
  const roomLabel = document.getElementById('room-label');
  const prompt = document.getElementById('open-hint');
  const openButton = document.getElementById('open-button');
  const stickBase = document.getElementById('stick-base');
  const stickKnob = document.getElementById('stick-knob');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10131b);
  scene.fog = new THREE.Fog(0x10131b, 17, 34);

  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 80);
  camera.position.set(0, 4.2, 12);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  scene.add(new THREE.HemisphereLight(0xd9e5ff, 0x302c37, 1.15));
  const moonLight = new THREE.DirectionalLight(0xe6e4ff, 1.2);
  moonLight.position.set(-5, 10, 5);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(768, 768);
  moonLight.shadow.camera.left = -12;
  moonLight.shadow.camera.right = 12;
  moonLight.shadow.camera.top = 12;
  moonLight.shadow.camera.bottom = -12;
  scene.add(moonLight);

  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe9edff,
    emissiveIntensity: 0.2,
    roughness: 0.72,
    flatShading: true
  });

  const shimmerPatternCanvas = document.createElement('canvas');
  shimmerPatternCanvas.width = 32;
  shimmerPatternCanvas.height = 32;
  const patternContext = shimmerPatternCanvas.getContext('2d');

  const characterCanvas = document.createElement('canvas');
  characterCanvas.width = 64;
  characterCanvas.height = 128;
  const characterContext = characterCanvas.getContext('2d');

  function refreshShimmer() {
    patternContext.clearRect(0, 0, 32, 32);
    for (let y = 0; y < 32; y += 2) {
      for (let x = 0; x < 32; x += 2) {
        const roll = Math.random();
        if (roll > 0.83) {
          patternContext.fillStyle = roll > 0.975 ? 'rgba(255,255,255,1)' : 'rgba(204,244,255,0.76)';
          patternContext.fillRect(x, y, roll > 0.96 ? 3 : 2, roll > 0.96 ? 3 : 2);
        }
      }
    }
    patternContext.fillStyle = 'rgba(255,255,255,0.95)';
    patternContext.fillRect((Math.random() * 15 | 0) * 2, (Math.random() * 15 | 0) * 2, 2, 2);

    characterContext.clearRect(0, 0, 64, 128);
    characterContext.fillStyle = 'rgba(255,255,255,0.14)';
    characterContext.beginPath();
    characterContext.ellipse(32, 17, 11, 12, 0, 0, Math.PI * 2);
    characterContext.fill();
    characterContext.beginPath();
    characterContext.moveTo(23, 31);
    characterContext.lineTo(41, 31);
    characterContext.lineTo(47, 67);
    characterContext.lineTo(39, 75);
    characterContext.lineTo(38, 119);
    characterContext.lineTo(27, 119);
    characterContext.lineTo(24, 77);
    characterContext.lineTo(25, 119);
    characterContext.lineTo(14, 119);
    characterContext.lineTo(16, 73);
    characterContext.lineTo(10, 67);
    characterContext.closePath();
    characterContext.fill();
    characterContext.fillRect(8, 35, 9, 39);
    characterContext.fillRect(47, 35, 9, 39);
    characterContext.globalCompositeOperation = 'source-in';
    for (let y = 0; y < 128; y += 32) {
      for (let x = 0; x < 64; x += 32) characterContext.drawImage(shimmerPatternCanvas, x, y);
    }
    characterContext.globalCompositeOperation = 'source-over';
    characterTexture.needsUpdate = true;
    drawFlashPattern();
  }

  const characterTexture = new THREE.CanvasTexture(characterCanvas);
  characterTexture.magFilter = THREE.NearestFilter;
  characterTexture.minFilter = THREE.NearestFilter;
  characterTexture.generateMipmaps = false;

  function drawFlashPattern() {
    const width = innerWidth;
    const height = innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (flashCanvas.width !== pixelWidth || flashCanvas.height !== pixelHeight) {
      flashCanvas.width = pixelWidth;
      flashCanvas.height = pixelHeight;
    }
    flashContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    flashContext.clearRect(0, 0, width, height);
    flashContext.fillStyle = '#fff';
    flashContext.fillRect(0, 0, width, height);
    flashContext.globalAlpha = 0.42;
    flashContext.imageSmoothingEnabled = false;
    for (let y = 0; y < height; y += 32) {
      for (let x = 0; x < width; x += 32) flashContext.drawImage(shimmerPatternCanvas, x, y);
    }
    flashContext.globalAlpha = 1;
  }

  const auraCanvas = document.createElement('canvas');
  auraCanvas.width = 128;
  auraCanvas.height = 128;
  const auraContext = auraCanvas.getContext('2d');
  const auraGradient = auraContext.createRadialGradient(64, 64, 2, 64, 64, 62);
  auraGradient.addColorStop(0, 'rgba(255,255,255,0.78)');
  auraGradient.addColorStop(0.25, 'rgba(235,244,255,0.35)');
  auraGradient.addColorStop(0.62, 'rgba(204,226,255,0.1)');
  auraGradient.addColorStop(1, 'rgba(204,226,255,0)');
  auraContext.fillStyle = auraGradient;
  auraContext.fillRect(0, 0, 128, 128);
  const auraTexture = new THREE.CanvasTexture(auraCanvas);

  const player = new THREE.Group();
  scene.add(player);

  const aura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: auraTexture,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  aura.position.set(0, 1.05, 0);
  aura.scale.set(2.8, 3.2, 1);
  aura.renderOrder = 2;
  player.add(aura);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.4, 0.78, 7), whiteMaterial);
  torso.position.y = 1.12;
  torso.castShadow = true;
  player.add(torso);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), whiteMaterial);
  head.position.y = 1.72;
  head.castShadow = true;
  player.add(head);

  function makeLimb(radiusTop, radiusBottom, length) {
    const pivot = new THREE.Group();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 6), whiteMaterial);
    mesh.position.y = -length / 2;
    mesh.castShadow = true;
    pivot.add(mesh);
    const joint = new THREE.Mesh(new THREE.SphereGeometry(radiusBottom, 6, 5), whiteMaterial);
    joint.position.y = -length + 0.02;
    joint.castShadow = true;
    pivot.add(joint);
    return pivot;
  }

  const leftLeg = makeLimb(0.12, 0.14, 0.66);
  const rightLeg = makeLimb(0.12, 0.14, 0.66);
  leftLeg.position.set(-0.17, 0.76, 0);
  rightLeg.position.set(0.17, 0.76, 0);
  player.add(leftLeg, rightLeg);

  const leftArm = makeLimb(0.105, 0.12, 0.59);
  const rightArm = makeLimb(0.105, 0.12, 0.59);
  leftArm.position.set(-0.39, 1.39, 0);
  rightArm.position.set(0.39, 1.39, 0);
  player.add(leftArm, rightArm);

  const shimmer = new THREE.Sprite(new THREE.SpriteMaterial({
    map: characterTexture,
    transparent: true,
    opacity: 0.94,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  shimmer.position.set(0, 1.1, 0);
  shimmer.scale.set(0.98, 2.22, 1);
  shimmer.renderOrder = 20;
  player.add(shimmer);

  const auraLight = new THREE.PointLight(0xeaf1ff, 1.9, 6.5, 2);
  auraLight.position.set(0, 1.1, 0);
  player.add(auraLight);

  const groundRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.025, 5, 28),
    new THREE.MeshBasicMaterial({ color: 0xe8f3ff, transparent: true, opacity: 0.58 })
  );
  groundRing.rotation.x = Math.PI / 2;
  groundRing.position.y = 0.045;
  player.add(groundRing);

  let roomRoot = null;
  let doorPivot = null;
  let doorRequested = false;
  let roomNumber = 1;
  let roomAngle = 0;

  function seededRandom(seed) {
    let value = seed >>> 0;
    return function () {
      value += 0x6D2B79F5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function roomMaterial(color, roughness) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness || 0.96,
      metalness: 0.02,
      flatShading: true
    });
  }

  function addRoomBox(group, x, y, z, sx, sy, sz, material, rotationY) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
    mesh.position.set(x, y, z);
    if (rotationY) mesh.rotation.y = rotationY;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function addMoss(group, x, y, z, scale, material, random) {
    const patch = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const blob = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.17 + random() * 0.12, 0),
        material
      );
      blob.position.set((random() - 0.5) * scale, random() * 0.1, (random() - 0.5) * scale * 0.6);
      blob.scale.y = 0.35 + random() * 0.45;
      blob.castShadow = true;
      patch.add(blob);
    }
    patch.position.set(x, y, z);
    group.add(patch);
  }

  function addChest(group, x, z, wood, metal) {
    const chest = new THREE.Group();
    addRoomBox(chest, 0, 0.34, 0, 1.05, 0.58, 0.76, wood);
    const lid = addRoomBox(chest, 0, 0.69, 0, 1.08, 0.22, 0.79, wood);
    lid.rotation.x = -0.04;
    addRoomBox(chest, 0, 0.37, 0.395, 0.16, 0.42, 0.035, metal);
    addRoomBox(chest, -0.38, 0.37, 0.395, 0.07, 0.52, 0.035, metal);
    addRoomBox(chest, 0.38, 0.37, 0.395, 0.07, 0.52, 0.035, metal);
    chest.position.set(x, 0, z);
    group.add(chest);
  }

  function addChain(group, x, z, random, metal) {
    const chain = new THREE.Group();
    const count = 5 + Math.floor(random() * 5);
    for (let i = 0; i < count; i++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.024, 4, 7), metal);
      link.position.y = -i * 0.24;
      link.rotation.x = Math.PI / 2;
      link.rotation.z = i % 2 ? 0.45 : -0.45;
      chain.add(link);
    }
    chain.position.set(x, 3.75, z);
    group.add(chain);
  }

  function addTorch(group, x, z, side, stoneMaterial) {
    const fixture = new THREE.Group();
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.45), stoneMaterial);
    bracket.position.set(0, 0, side * 0.2);
    fixture.add(bracket);
    const flame = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.12, 1),
      new THREE.MeshBasicMaterial({ color: 0xe8ddff })
    );
    flame.position.y = 0.36;
    fixture.add(flame);
    const light = new THREE.PointLight(0xd9ddff, 1.25, 5.5, 2);
    light.position.y = 0.45;
    fixture.add(light);
    fixture.position.set(x, 2.55, z);
    group.add(fixture);
  }

  function buildRoom(number) {
    if (roomRoot) {
      scene.remove(roomRoot);
      roomRoot.traverse(function (object) {
        if (object.geometry) object.geometry.dispose();
        if (object.material && object.material.dispose) object.material.dispose();
      });
    }

    const random = seededRandom(number * 92821 + 47);
    const wallColors = [0x585560, 0x625c67, 0x525d68, 0x68616d];
    const floorColors = [0x282b36, 0x2b2c39, 0x282f3b, 0x302c38];
    const stoneColor = wallColors[Math.floor(random() * wallColors.length)];
    const wall = roomMaterial(stoneColor);
    const darkStone = roomMaterial(0x373945);
    const floorMaterial = roomMaterial(floorColors[number % floorColors.length], 0.9);
    const trim = roomMaterial(0x8b8291, 0.78);
    const wood = roomMaterial(number % 2 ? 0x493d43 : 0x53464a);
    const metal = roomMaterial(0xa3a4b6, 0.48);
    const moss = roomMaterial(0x536d62, 1);

    roomRoot = new THREE.Group();
    roomAngle = Math.floor(random() * 4) * Math.PI / 2;
    roomRoot.rotation.y = roomAngle;
    scene.add(roomRoot);

    addRoomBox(roomRoot, 0, -0.18, 0, 14, 0.36, 14, floorMaterial);
    for (let x = -6; x <= 6; x += 2) {
      for (let z = -6; z <= 6; z += 2) {
        if (random() > 0.66) {
          const tile = addRoomBox(roomRoot, x, 0.006, z, 1.92, 0.018, 1.92, darkStone);
          tile.material = darkStone;
        }
      }
    }

    addRoomBox(roomRoot, -6.95, 2.05, 0, 0.55, 4.1, 14.2, wall);
    addRoomBox(roomRoot, 6.95, 2.05, 0, 0.55, 4.1, 14.2, wall);
    addRoomBox(roomRoot, -4.55, 2.05, -6.95, 4.9, 4.1, 0.55, wall);
    addRoomBox(roomRoot, 4.55, 2.05, -6.95, 4.9, 4.1, 0.55, wall);
    addRoomBox(roomRoot, 0, 4.0, -6.95, 3.3, 0.42, 0.55, trim);
    addRoomBox(roomRoot, -4.6, 2.05, 6.95, 4.8, 4.1, 0.55, wall);
    addRoomBox(roomRoot, 4.6, 2.05, 6.95, 4.8, 4.1, 0.55, wall);
    addRoomBox(roomRoot, 0, 4.0, 6.95, 3.2, 0.42, 0.55, trim);

    for (let i = 0; i < 4; i++) {
      const z = -4.9 + i * 3.2;
      addRoomBox(roomRoot, -6.58, 0.45, z, 0.26, 0.9, 0.34, darkStone);
      addRoomBox(roomRoot, 6.58, 0.45, z + 1.1, 0.26, 0.9, 0.34, darkStone);
    }

    for (const x of [-6.4, 6.4]) {
      for (const z of [-6.35, 6.35]) {
        addRoomBox(roomRoot, x, 2.1, z, 0.72, 4.2, 0.72, darkStone);
        addRoomBox(roomRoot, x, 4.25, z, 0.92, 0.24, 0.92, trim);
      }
    }

    addRoomBox(roomRoot, -1.62, 1.72, -6.61, 0.2, 3.55, 0.28, trim);
    addRoomBox(roomRoot, 1.62, 1.72, -6.61, 0.2, 3.55, 0.28, trim);
    addRoomBox(roomRoot, 0, 3.57, -6.61, 3.45, 0.22, 0.3, trim);

    doorPivot = new THREE.Group();
    doorPivot.position.set(-1.52, 0, -6.62);
    roomRoot.add(doorPivot);
    const doorWood = roomMaterial(number % 2 ? 0x302c39 : 0x39313d, 0.82);
    addRoomBox(doorPivot, 1.52, 1.72, 0, 3.0, 3.42, 0.2, doorWood);
    addRoomBox(doorPivot, 1.52, 1.72, 0.12, 0.1, 3.12, 0.06, metal);
    addRoomBox(doorPivot, 0.16, 1.72, 0.12, 0.12, 3.12, 0.06, metal);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.09, 7, 6), trim);
    handle.position.set(2.72, 1.55, 0.19);
    doorPivot.add(handle);

    const chestSpots = [[-4.65, 3.5], [4.65, 3.6], [-4.8, -2.6], [4.8, -2.7]];
    const chestCount = 2 + Math.floor(random() * 2);
    for (let i = 0; i < chestCount; i++) {
      const spot = chestSpots[Math.floor(random() * chestSpots.length)];
      addChest(roomRoot, spot[0] + (random() - 0.5) * 0.55, spot[1] + (random() - 0.5) * 0.45, wood, metal);
    }

    for (let i = 0; i < 3; i++) {
      addChain(roomRoot, -6.55, -3.2 + i * 3.1, random, metal);
      addChain(roomRoot, 6.55, -2.0 + i * 3.0, random, metal);
    }

    for (let i = 0; i < 7; i++) {
      const side = random() > 0.5 ? -1 : 1;
      addMoss(roomRoot, side * (6.45 + random() * 0.08), 0.08, -5.6 + random() * 11.2, 0.78, moss, random);
    }

    addTorch(roomRoot, -6.48, -1.8, -1, darkStone);
    addTorch(roomRoot, 6.48, 1.9, 1, darkStone);

    for (let i = 0; i < 6; i++) {
      const x = (random() - 0.5) * 9.2;
      const z = (random() - 0.5) * 8.4;
      if (Math.abs(x) < 2 && z > -3) continue;
      const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18 + random() * 0.22, 0), darkStone);
      rubble.position.set(x, 0.12, z);
      rubble.rotation.set(random(), random(), random());
      rubble.castShadow = true;
      roomRoot.add(rubble);
    }

    roomRoot.updateMatrixWorld(true);
    const spawn = roomRoot.localToWorld(new THREE.Vector3(0, 0, 4.65));
    player.position.copy(spawn);
    player.rotation.set(0, roomAngle, 0);
    cameraYaw = roomAngle;
    velocity.set(0, 0, 0);
    const behind = new THREE.Vector3(Math.sin(roomAngle), 0, Math.cos(roomAngle)).multiplyScalar(7.4);
    camera.position.copy(spawn.clone().add(behind).add(new THREE.Vector3(0, 4.2, 0)));
    cameraTarget.copy(spawn).add(new THREE.Vector3(0, 1.05, 0));
    camera.lookAt(cameraTarget);
    doorRequested = false;
    roomLabel.textContent = 'ROOM ' + String(number).padStart(2, '0');
  }

  const velocity = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3(0, 1, 0);
  let cameraYaw = 0;
  let walkPhase = 0;
  let started = false;
  let lastTime = performance.now();
  let shimmerTimer = 0;
  let transition = { phase: 'none', time: 0 };
  let flashAlpha = 0;
  let nearDoor = false;
  const joystick = { x: 0, y: 0 };
  const keys = Object.create(null);
  let stickPointer = null;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function dampAngle(from, to, amount) {
    const difference = Math.atan2(Math.sin(to - from), Math.cos(to - from));
    return from + difference * amount;
  }

  function startGame() {
    if (started) return;
    started = true;
    boot.classList.add('hidden');
    setTimeout(function () { boot.style.display = 'none'; }, 700);
    lastTime = performance.now();
  }

  function openDoor() {
    if (!started || !nearDoor || doorRequested || transition.phase !== 'none') return;
    doorRequested = true;
    prompt.classList.remove('visible');
    openButton.classList.remove('visible');
  }

  function updateStick(event) {
    const rect = stickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const max = rect.width * 0.34;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const scale = distance > max ? max / distance : 1;
    joystick.x = clamp((dx * scale) / max, -1, 1);
    joystick.y = clamp((dy * scale) / max, -1, 1);
    stickKnob.style.transform = 'translate(calc(-50% + ' + (joystick.x * max) + 'px), calc(-50% + ' + (joystick.y * max) + 'px))';
  }

  stickBase.addEventListener('pointerdown', function (event) {
    event.preventDefault();
    stickPointer = event.pointerId;
    stickBase.setPointerCapture(event.pointerId);
    updateStick(event);
  });
  stickBase.addEventListener('pointermove', function (event) {
    if (event.pointerId === stickPointer) updateStick(event);
  });
  function releaseStick(event) {
    if (event.pointerId !== stickPointer) return;
    stickPointer = null;
    joystick.x = 0;
    joystick.y = 0;
    stickKnob.style.transform = 'translate(-50%, -50%)';
  }
  stickBase.addEventListener('pointerup', releaseStick);
  stickBase.addEventListener('pointercancel', releaseStick);
  stickBase.addEventListener('lostpointercapture', releaseStick);

  openButton.addEventListener('pointerdown', function (event) {
    event.preventDefault();
    openDoor();
  });
  boot.addEventListener('pointerdown', startGame);

  window.addEventListener('keydown', function (event) {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
    keys[key] = true;
    if (key === 'enter' && !started) startGame();
    if (key === 'e' || key === 'enter') openDoor();
  });
  window.addEventListener('keyup', function (event) {
    keys[event.key.toLowerCase()] = false;
  });
  window.addEventListener('blur', function () {
    for (const key in keys) keys[key] = false;
    joystick.x = 0;
    joystick.y = 0;
    stickKnob.style.transform = 'translate(-50%, -50%)';
  });

  function getInput() {
    let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    let y = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
    if (Math.hypot(joystick.x, joystick.y) > 0.08) {
      x = joystick.x;
      y = joystick.y;
    }

    if (navigator.getGamepads) {
      const pads = navigator.getGamepads();
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i];
        if (!pad || !pad.connected) continue;
        const gx = Math.abs(pad.axes[0] || 0) > 0.16 ? pad.axes[0] : 0;
        const gy = Math.abs(pad.axes[1] || 0) > 0.16 ? pad.axes[1] : 0;
        if (Math.hypot(gx, gy) > 0.08) {
          x = gx;
          y = gy;
        }
        if (pad.buttons[0] && pad.buttons[0].pressed) openDoor();
        break;
      }
    }
    const magnitude = Math.hypot(x, y);
    if (magnitude > 1) {
      x /= magnitude;
      y /= magnitude;
    }
    return { x: x, y: y, magnitude: Math.min(1, magnitude) };
  }

  function beginTransition() {
    if (transition.phase !== 'none') return;
    transition = { phase: 'in', time: 0 };
  }

  function updateTransition(dt) {
    if (transition.phase === 'none') return;
    transition.time += dt;

    if (transition.phase === 'in') {
      const t = clamp(transition.time / 0.52, 0, 1);
      flashAlpha = t * t * (3 - 2 * t);
      if (t >= 1) {
        buildRoom(roomNumber + 1);
        roomNumber += 1;
        transition = { phase: 'hold', time: 0 };
      }
    } else if (transition.phase === 'hold') {
      flashAlpha = 1;
      if (transition.time >= 0.16) transition = { phase: 'out', time: 0 };
    } else if (transition.phase === 'out') {
      flashAlpha = 1 - clamp(transition.time / 0.7, 0, 1);
      if (transition.time >= 0.7) {
        flashAlpha = 0;
        transition = { phase: 'none', time: 0 };
      }
    }
    flashCanvas.style.opacity = String(flashAlpha);
  }

  function update(dt) {
    const input = getInput();
    const forward = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const right = new THREE.Vector3(Math.cos(cameraYaw), 0, Math.sin(cameraYaw));
    const moveDirection = right.multiplyScalar(input.x).add(forward.multiplyScalar(-input.y));
    if (moveDirection.lengthSq() > 1) moveDirection.normalize();

    const canMove = started && !doorRequested && transition.phase === 'none';
    const desiredVelocity = canMove
      ? moveDirection.clone().multiplyScalar(3.65 * input.magnitude)
      : new THREE.Vector3();
    velocity.lerp(desiredVelocity, 1 - Math.exp(-dt * 11));
    player.position.addScaledVector(velocity, dt);

    if (roomRoot) {
      const localPosition = roomRoot.worldToLocal(player.position.clone());
      localPosition.x = clamp(localPosition.x, -5.78, 5.78);
      localPosition.z = clamp(localPosition.z, -5.72, 5.72);
      localPosition.y = 0;
      player.position.copy(roomRoot.localToWorld(localPosition));
      roomRoot.updateMatrixWorld(true);

      const doorPosition = roomRoot.worldToLocal(player.position.clone());
      nearDoor = Math.abs(doorPosition.x) < 1.75 && doorPosition.z < -4.15;
    }

    if (canMove && velocity.length() > 0.08) {
      const targetYaw = Math.atan2(velocity.x, -velocity.z);
      player.rotation.y = dampAngle(player.rotation.y, targetYaw, 1 - Math.exp(-dt * 14));
    }
    cameraYaw = dampAngle(cameraYaw, player.rotation.y, 1 - Math.exp(-dt * 2.15));

    const speed = velocity.length();
    const walkStrength = clamp(speed / 3.65, 0, 1);
    if (walkStrength > 0.02) walkPhase += dt * (5.2 + speed * 1.8);
    const stride = Math.sin(walkPhase) * 0.62 * walkStrength;
    leftLeg.rotation.x = stride;
    rightLeg.rotation.x = -stride;
    leftArm.rotation.x = -stride * 0.72 - 0.08 * walkStrength;
    rightArm.rotation.x = stride * 0.72 - 0.08 * walkStrength;
    torso.position.y = 1.12 + Math.abs(Math.sin(walkPhase * 2)) * 0.045 * walkStrength;
    head.position.y = 1.72 + Math.abs(Math.sin(walkPhase * 2)) * 0.025 * walkStrength;
    aura.material.opacity = 0.64 + Math.sin(performance.now() * 0.0021) * 0.08;
    groundRing.rotation.z += dt * 0.22;

    const cameraForward = new THREE.Vector3(Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    const desiredCamera = player.position.clone()
      .add(new THREE.Vector3(Math.sin(cameraYaw), 0, Math.cos(cameraYaw)).multiplyScalar(7.35))
      .add(new THREE.Vector3(0, 4.05, 0));
    camera.position.lerp(desiredCamera, 1 - Math.exp(-dt * 2.7));
    const desiredTarget = player.position.clone().add(new THREE.Vector3(0, 1.05, 0)).add(cameraForward.multiplyScalar(0.65));
    cameraTarget.lerp(desiredTarget, 1 - Math.exp(-dt * 4.2));
    camera.lookAt(cameraTarget);

    if (started && nearDoor && !doorRequested && transition.phase === 'none') {
      prompt.classList.add('visible');
      openButton.classList.add('visible');
    } else {
      prompt.classList.remove('visible');
      openButton.classList.remove('visible');
    }

    if (doorRequested && doorPivot && transition.phase === 'none') {
      doorPivot.rotation.y = Math.max(-1.48, doorPivot.rotation.y - dt * 4.1);
      if (doorPivot.rotation.y <= -1.47) beginTransition();
    }

    updateTransition(dt);

    shimmerTimer += dt;
    if (shimmerTimer > 0.085) {
      shimmerTimer = 0;
      refreshShimmer();
    }
  }

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    drawFlashPattern();
  }
  window.addEventListener('resize', resize);

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    update(dt);
    renderer.render(scene, camera);
  }

  buildRoom(roomNumber);
  refreshShimmer();
  requestAnimationFrame(frame);
})();