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
  scene.fog = new THREE.Fog(0x10131b, 19, 38);

  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 90);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  scene.add(new THREE.HemisphereLight(0xe6eaff, 0x262633, 1.25));
  const moonLight = new THREE.DirectionalLight(0xe8e9ff, 1.35);
  moonLight.position.set(-5, 11, 6);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(768, 768);
  moonLight.shadow.camera.left = -12;
  moonLight.shadow.camera.right = 12;
  moonLight.shadow.camera.top = 12;
  moonLight.shadow.camera.bottom = -12;
  scene.add(moonLight);

  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf0f2ff,
    emissiveIntensity: 0.28,
    roughness: 0.76,
    metalness: 0,
    flatShading: false
  });

  const shimmerPatternCanvas = document.createElement('canvas');
  shimmerPatternCanvas.width = 32;
  shimmerPatternCanvas.height = 32;
  const patternContext = shimmerPatternCanvas.getContext('2d');

  const characterCanvas = document.createElement('canvas');
  characterCanvas.width = 64;
  characterCanvas.height = 128;
  const characterContext = characterCanvas.getContext('2d');
  const characterTexture = new THREE.CanvasTexture(characterCanvas);
  characterTexture.magFilter = THREE.NearestFilter;
  characterTexture.minFilter = THREE.NearestFilter;
  characterTexture.generateMipmaps = false;

  function refreshShimmer() {
    patternContext.clearRect(0, 0, 32, 32);
    for (let y = 0; y < 32; y += 2) {
      for (let x = 0; x < 32; x += 2) {
        const value = Math.random();
        if (value > 0.79) {
          patternContext.fillStyle = value > 0.975
            ? 'rgba(255,255,255,1)'
            : 'rgba(205,235,255,0.92)';
          const size = value > 0.965 ? 4 : 2;
          patternContext.fillRect(x, y, size, size);
        }
      }
    }
    patternContext.fillStyle = '#fff';
    patternContext.fillRect((Math.random() * 15 | 0) * 2, (Math.random() * 15 | 0) * 2, 2, 2);

    characterContext.clearRect(0, 0, 64, 128);
    characterContext.fillStyle = 'rgba(255,255,255,0.32)';
    characterContext.beginPath();
    characterContext.ellipse(32, 17, 10, 12, 0, 0, Math.PI * 2);
    characterContext.fill();
    characterContext.beginPath();
    characterContext.moveTo(23, 30);
    characterContext.lineTo(41, 30);
    characterContext.lineTo(47, 38);
    characterContext.lineTo(53, 69);
    characterContext.lineTo(46, 72);
    characterContext.lineTo(41, 52);
    characterContext.lineTo(40, 78);
    characterContext.lineTo(43, 122);
    characterContext.lineTo(34, 124);
    characterContext.lineTo(32, 84);
    characterContext.lineTo(29, 124);
    characterContext.lineTo(20, 122);
    characterContext.lineTo(24, 78);
    characterContext.lineTo(23, 52);
    characterContext.lineTo(18, 72);
    characterContext.lineTo(11, 69);
    characterContext.lineTo(17, 38);
    characterContext.closePath();
    characterContext.fill();

    characterContext.globalCompositeOperation = 'source-in';
    for (let y = 0; y < 128; y += 32) {
      for (let x = 0; x < 64; x += 32) characterContext.drawImage(shimmerPatternCanvas, x, y);
    }
    characterContext.globalCompositeOperation = 'source-over';
    characterTexture.needsUpdate = true;
    drawFlashPattern();
  }

  function drawFlashPattern() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = innerWidth;
    const height = innerHeight;
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
    flashContext.globalAlpha = 0.34;
    flashContext.imageSmoothingEnabled = false;
    for (let y = 0; y < height; y += 32) {
      for (let x = 0; x < width; x += 32) {
        flashContext.drawImage(shimmerPatternCanvas, x, y);
      }
    }
    flashContext.globalAlpha = 1;
  }

  const auraCanvas = document.createElement('canvas');
  auraCanvas.width = 128;
  auraCanvas.height = 128;
  const auraContext = auraCanvas.getContext('2d');
  const auraGradient = auraContext.createRadialGradient(64, 64, 2, 64, 64, 62);
  auraGradient.addColorStop(0, 'rgba(255,255,255,0.82)');
  auraGradient.addColorStop(0.3, 'rgba(234,242,255,0.34)');
  auraGradient.addColorStop(0.65, 'rgba(207,226,255,0.1)');
  auraGradient.addColorStop(1, 'rgba(207,226,255,0)');
  auraContext.fillStyle = auraGradient;
  auraContext.fillRect(0, 0, 128, 128);
  const auraTexture = new THREE.CanvasTexture(auraCanvas);

  const player = new THREE.Group();
  scene.add(player);

  const aura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: auraTexture,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  aura.position.set(0, 1.0, 0);
  aura.scale.set(3.0, 3.2, 1);
  aura.renderOrder = 2;
  player.add(aura);

  const bodyRig = new THREE.Group();
  player.add(bodyRig);

  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 10), whiteMaterial);
  pelvis.position.set(0, 0.91, 0);
  pelvis.scale.set(1.05, 0.78, 0.8);
  pelvis.castShadow = true;
  player.add(pelvis);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.235, 0.72, 12, 3), whiteMaterial);
  torso.position.set(0, 1.34, 0);
  torso.castShadow = true;
  bodyRig.add(torso);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), whiteMaterial);
  chest.position.set(0, 1.53, -0.01);
  chest.scale.set(1.12, 0.75, 0.78);
  chest.castShadow = true;
  bodyRig.add(chest);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.12, 0.22, 10), whiteMaterial);
  neck.position.set(0, 1.82, 0);
  neck.castShadow = true;
  bodyRig.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.255, 16, 12), whiteMaterial);
  head.position.set(0, 2.08, -0.015);
  head.scale.set(0.91, 1.13, 0.94);
  head.castShadow = true;
  bodyRig.add(head);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 7), whiteMaterial);
  nose.position.set(0, 2.04, -0.245);
  nose.scale.set(0.65, 0.65, 0.75);
  bodyRig.add(nose);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 7), whiteMaterial);
    ear.position.set(side * 0.235, 2.08, 0);
    ear.scale.set(0.62, 1, 0.62);
    bodyRig.add(ear);
  }

  function makeJoint(parent, radius, y) {
    const joint = new THREE.Mesh(new THREE.SphereGeometry(radius, 10, 8), whiteMaterial);
    joint.position.y = y;
    joint.castShadow = true;
    parent.add(joint);
    return joint;
  }

  function makeSegment(parent, topRadius, bottomRadius, length) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(topRadius, bottomRadius, length, 10, 2),
      whiteMaterial
    );
    mesh.position.y = -length / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function makeLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.16, 0.88, 0);
    player.add(hip);
    makeSegment(hip, 0.145, 0.115, 0.48);
    makeJoint(hip, 0.12, -0.47);

    const knee = new THREE.Group();
    knee.position.y = -0.47;
    hip.add(knee);
    makeSegment(knee, 0.112, 0.085, 0.46);
    makeJoint(knee, 0.09, -0.44);

    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), whiteMaterial);
    foot.position.set(0, -0.45, -0.105);
    foot.scale.set(0.83, 0.58, 1.35);
    foot.castShadow = true;
    knee.add(foot);

    return { hip, knee, foot };
  }

  function makeArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.37, 1.62, 0);
    bodyRig.add(shoulder);
    makeJoint(shoulder, 0.15, 0);
    makeSegment(shoulder, 0.12, 0.095, 0.42);
    makeJoint(shoulder, 0.095, -0.41);

    const elbow = new THREE.Group();
    elbow.position.y = -0.41;
    shoulder.add(elbow);
    makeSegment(elbow, 0.09, 0.067, 0.39);
    makeJoint(elbow, 0.07, -0.38);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), whiteMaterial);
    hand.position.set(0, -0.43, -0.015);
    hand.scale.set(0.86, 1.12, 0.75);
    hand.castShadow = true;
    elbow.add(hand);

    return { shoulder, elbow, hand };
  }

  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const shimmer = new THREE.Sprite(new THREE.SpriteMaterial({
    map: characterTexture,
    transparent: true,
    opacity: 0.92,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  shimmer.position.set(0, 1.12, 0);
  shimmer.scale.set(1.12, 2.26, 1);
  shimmer.renderOrder = 8;
  bodyRig.add(shimmer);

  const auraLight = new THREE.PointLight(0xeaf1ff, 2.0, 7, 2);
  auraLight.position.set(0, 1.05, 0);
  player.add(auraLight);

  const groundRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.022, 5, 32),
    new THREE.MeshBasicMaterial({ color: 0xe8f3ff, transparent: true, opacity: 0.54 })
  );
  groundRing.rotation.x = Math.PI / 2;
  groundRing.position.y = 0.035;
  player.add(groundRing);

  let roomRoot = null;
  let doorPivot = null;
  let roomNumber = 1;
  let roomAngle = 0;
  let doorRequested = false;
  let nearDoor = false;

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
      color,
      roughness: roughness || 0.96,
      metalness: 0.02,
      flatShading: true
    });
  }

  function addBox(group, x, y, z, sx, sy, sz, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function addMoss(group, x, y, z, scale, material, random) {
    const patch = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const blob = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.16 + random() * 0.11, 0),
        material
      );
      blob.position.set((random() - 0.5) * scale, random() * 0.09, (random() - 0.5) * scale * 0.6);
      blob.scale.y = 0.35 + random() * 0.42;
      blob.castShadow = true;
      patch.add(blob);
    }
    patch.position.set(x, y, z);
    group.add(patch);
  }

  function addChest(group, x, z, wood, metal) {
    const chest = new THREE.Group();
    addBox(chest, 0, 0.32, 0, 0.98, 0.54, 0.7, wood);
    addBox(chest, 0, 0.64, 0, 1.02, 0.2, 0.74, wood);
    addBox(chest, 0, 0.36, 0.36, 0.13, 0.42, 0.035, metal);
    addBox(chest, -0.36, 0.36, 0.36, 0.065, 0.5, 0.035, metal);
    addBox(chest, 0.36, 0.36, 0.36, 0.065, 0.5, 0.035, metal);
    chest.position.set(x, 0, z);
    group.add(chest);
  }

  function addChain(group, x, z, random, metal) {
    const chain = new THREE.Group();
    const count = 5 + Math.floor(random() * 5);
    for (let i = 0; i < count; i++) {
      const link = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.023, 4, 7), metal);
      link.position.y = -i * 0.22;
      link.rotation.y = i % 2 ? 0.42 : -0.42;
      chain.add(link);
    }
    chain.position.set(x, 3.7, z);
    group.add(chain);
  }

  function addTorch(group, x, z, stoneMaterial) {
    const fixture = new THREE.Group();
    addBox(fixture, 0, 0, 0.16, 0.16, 0.5, 0.4, stoneMaterial);
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

  function releaseRoom() {
    if (!roomRoot) return;
    roomRoot.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material.dispose();
      }
    });
    scene.remove(roomRoot);
  }

  function buildRoom(number) {
    releaseRoom();

    const random = seededRandom(number * 92821 + 47);
    const wallColors = [0x585560, 0x625c67, 0x525d68, 0x68616d];
    const floorColors = [0x282b36, 0x2b2c39, 0x282f3b, 0x302c38];
    const wall = roomMaterial(wallColors[Math.floor(random() * wallColors.length)]);
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

    addBox(roomRoot, 0, -0.18, 0, 14, 0.36, 14, floorMaterial);
    for (let x = -6; x <= 6; x += 2) {
      for (let z = -6; z <= 6; z += 2) {
        if (random() > 0.66) addBox(roomRoot, x, 0.006, z, 1.92, 0.018, 1.92, darkStone);
      }
    }

    addBox(roomRoot, -6.95, 2.05, 0, 0.55, 4.1, 14.2, wall);
    addBox(roomRoot, 6.95, 2.05, 0, 0.55, 4.1, 14.2, wall);
    addBox(roomRoot, -4.55, 2.05, -6.95, 4.9, 4.1, 0.55, wall);
    addBox(roomRoot, 4.55, 2.05, -6.95, 4.9, 4.1, 0.55, wall);
    addBox(roomRoot, 0, 4.0, -6.95, 3.3, 0.42, 0.55, trim);
    addBox(roomRoot, -4.6, 2.05, 6.95, 4.8, 4.1, 0.55, wall);
    addBox(roomRoot, 4.6, 2.05, 6.95, 4.8, 4.1, 0.55, wall);
    addBox(roomRoot, 0, 4.0, 6.95, 3.2, 0.42, 0.55, trim);

    for (let i = 0; i < 4; i++) {
      const z = -4.9 + i * 3.2;
      addBox(roomRoot, -6.58, 0.45, z, 0.26, 0.9, 0.34, darkStone);
      addBox(roomRoot, 6.58, 0.45, z + 1.1, 0.26, 0.9, 0.34, darkStone);
    }

    for (const x of [-6.4, 6.4]) {
      for (const z of [-6.35, 6.35]) {
        addBox(roomRoot, x, 2.1, z, 0.72, 4.2, 0.72, darkStone);
        addBox(roomRoot, x, 4.25, z, 0.92, 0.24, 0.92, trim);
      }
    }

    addBox(roomRoot, -1.62, 1.72, -6.61, 0.2, 3.55, 0.28, trim);
    addBox(roomRoot, 1.62, 1.72, -6.61, 0.2, 3.55, 0.28, trim);
    addBox(roomRoot, 0, 3.57, -6.61, 3.45, 0.22, 0.3, trim);

    doorPivot = new THREE.Group();
    doorPivot.position.set(-1.52, 0, -6.62);
    roomRoot.add(doorPivot);
    const doorWood = roomMaterial(number % 2 ? 0x302c39 : 0x39313d, 0.82);
    addBox(doorPivot, 1.52, 1.72, 0, 3.0, 3.42, 0.2, doorWood);
    addBox(doorPivot, 1.52, 1.72, 0.12, 0.1, 3.12, 0.06, metal);
    addBox(doorPivot, 0.16, 1.72, 0.12, 0.12, 3.12, 0.06, metal);
    const handle = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 7), trim);
    handle.position.set(2.72, 1.55, 0.19);
    doorPivot.add(handle);

    const chestSpots = [[-4.65, 3.5], [4.65, 3.6], [-4.8, -2.6], [4.8, -2.7]];
    const chestCount = 2 + Math.floor(random() * 2);
    for (let i = 0; i < chestCount; i++) {
      const spot = chestSpots[Math.floor(random() * chestSpots.length)];
      addChest(roomRoot, spot[0] + (random() - 0.5) * 0.4, spot[1] + (random() - 0.5) * 0.4, wood, metal);
    }

    for (let i = 0; i < 3; i++) {
      addChain(roomRoot, -6.55, -3.2 + i * 3.1, random, metal);
      addChain(roomRoot, 6.55, -2.0 + i * 3.0, random, metal);
    }

    for (let i = 0; i < 7; i++) {
      const side = random() > 0.5 ? -1 : 1;
      addMoss(roomRoot, side * 6.43, 0.08, -5.6 + random() * 11.2, 0.78, moss, random);
    }

    addTorch(roomRoot, -6.48, -1.8, darkStone);
    addTorch(roomRoot, 6.48, 1.9, darkStone);

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
    movementBasisYaw = roomAngle;
    movementActive = false;
    velocity.set(0, 0, 0);

    camera.position.set(
      spawn.x - Math.sin(cameraYaw) * 5.25,
      spawn.y + 2.8,
      spawn.z + Math.cos(cameraYaw) * 5.25
    );
    cameraTarget.copy(spawn).add(new THREE.Vector3(0, 1.16, 0));
    camera.lookAt(cameraTarget);

    doorRequested = false;
    nearDoor = false;
    roomLabel.textContent = 'ROOM ' + String(number).padStart(2, '0');
  }

  const velocity = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const desiredVelocity = new THREE.Vector3();
  let cameraYaw = 0;
  let movementBasisYaw = 0;
  let movementActive = false;
  let walkPhase = 0;
  let started = false;
  let lastTime = performance.now();
  let shimmerTimer = 0;
  let transition = { phase: 'none', time: 0 };
  let flashAlpha = 0;
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
    setTimeout(() => { boot.style.display = 'none'; }, 700);
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
    joystick.x = clamp(dx * scale / max, -1, 1);
    joystick.y = clamp(dy * scale / max, -1, 1);
    stickKnob.style.transform =
      'translate(calc(-50% + ' + (joystick.x * max) + 'px), calc(-50% + ' + (joystick.y * max) + 'px))';
  }

  stickBase.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (stickPointer !== null) return;
    stickPointer = event.pointerId;
    stickBase.setPointerCapture(event.pointerId);
    updateStick(event);
  });
  stickBase.addEventListener('pointermove', (event) => {
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

  openButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    openDoor();
  });
  boot.addEventListener('pointerdown', startGame);

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    keys[key] = true;
    if (key === 'enter' && !started) startGame();
    if (key === 'e' || key === 'enter') openDoor();
  });
  window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
  });
  window.addEventListener('blur', () => {
    for (const key in keys) keys[key] = false;
    joystick.x = 0;
    joystick.y = 0;
    movementActive = false;
    stickPointer = null;
    stickKnob.style.transform = 'translate(-50%, -50%)';
  });

  function getInput() {
    let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    let y = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);

    if (Math.hypot(joystick.x, joystick.y) > 0.06) {
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
        if (Math.hypot(gx, gy) > 0.06) {
          x = gx;
          y = gy;
        }
        if (pad.buttons[0] && pad.buttons[0].pressed) openDoor();
        break;
      }
    }

    const rawMagnitude = Math.hypot(x, y);
    if (rawMagnitude < 0.12) return { x: 0, y: 0, magnitude: 0 };
    const magnitude = clamp((Math.min(rawMagnitude, 1) - 0.12) / 0.88, 0, 1);
    const scale = magnitude / rawMagnitude;
    return { x: x * scale, y: y * scale, magnitude };
  }

  function beginTransition() {
    if (transition.phase !== 'none') return;
    transition = { phase: 'in', time: 0 };
  }

  function updateTransition(dt) {
    if (transition.phase === 'none') return;
    transition.time += dt;

    if (transition.phase === 'in') {
      const t = clamp(transition.time / 0.56, 0, 1);
      flashAlpha = t * t * (3 - 2 * t);
      if (t >= 1) {
        roomNumber += 1;
        buildRoom(roomNumber);
        transition = { phase: 'hold', time: 0 };
      }
    } else if (transition.phase === 'hold') {
      flashAlpha = 1;
      if (transition.time >= 0.2) transition = { phase: 'out', time: 0 };
    } else if (transition.phase === 'out') {
      flashAlpha = 1 - clamp(transition.time / 0.8, 0, 1);
      if (transition.time >= 0.8) {
        flashAlpha = 0;
        transition = { phase: 'none', time: 0 };
      }
    }
    flashCanvas.style.opacity = String(flashAlpha);
  }

  function updateCamera(dt) {
    cameraYaw = dampAngle(cameraYaw, player.rotation.y, 1 - Math.exp(-dt * 2.8));

    // The negative sine keeps the camera behind the character at every heading.
    const backwardX = -Math.sin(cameraYaw);
    const backwardZ = Math.cos(cameraYaw);
    const desiredPosition = player.position.clone().add(new THREE.Vector3(
      backwardX * 5.25,
      2.8,
      backwardZ * 5.25
    ));

    if (roomRoot) {
      roomRoot.updateMatrixWorld(true);
      const localCamera = roomRoot.worldToLocal(desiredPosition.clone());
      localCamera.x = clamp(localCamera.x, -6.22, 6.22);
      localCamera.z = clamp(localCamera.z, -6.22, 6.22);
      localCamera.y = clamp(localCamera.y, 2.0, 4.4);
      desiredPosition.copy(roomRoot.localToWorld(localCamera));
    }

    camera.position.lerp(desiredPosition, 1 - Math.exp(-dt * 4.8));
    const desiredTarget = player.position.clone().add(new THREE.Vector3(0, 1.12, 0));
    cameraTarget.lerp(desiredTarget, 1 - Math.exp(-dt * 7.5));
    camera.lookAt(cameraTarget);
  }

  function updateCharacter(dt, input, isMoving) {
    const speed = velocity.length();
    const walkStrength = clamp(speed / 3.8, 0, 1);
    if (walkStrength > 0.015) {
      // Tie cadence to distance travelled so feet do not skate under a moving body.
      walkPhase += dt * speed * (Math.PI * 2 / 1.65);
    }

    const cycle = walkPhase;
    const swing = Math.sin(cycle) * 0.55 * walkStrength;
    const leftKneeBend = Math.pow(Math.max(0, Math.sin(cycle + 0.3)), 1.35) * 0.72 * walkStrength;
    const rightKneeBend = Math.pow(Math.max(0, Math.sin(cycle + Math.PI + 0.3)), 1.35) * 0.72 * walkStrength;

    leftLeg.hip.rotation.x = swing;
    rightLeg.hip.rotation.x = -swing;
    leftLeg.knee.rotation.x = leftKneeBend;
    rightLeg.knee.rotation.x = rightKneeBend;
    leftLeg.foot.rotation.x = -leftKneeBend * 0.45 + swing * 0.16;
    rightLeg.foot.rotation.x = -rightKneeBend * 0.45 - swing * 0.16;

    leftArm.shoulder.rotation.x = -swing * 0.62 - 0.04 * walkStrength;
    rightArm.shoulder.rotation.x = swing * 0.62 - 0.04 * walkStrength;
    leftArm.shoulder.rotation.z = -0.035;
    rightArm.shoulder.rotation.z = 0.035;
    leftArm.elbow.rotation.x = 0.12 + recovery * 0.18;
    rightArm.elbow.rotation.x = 0.12 + recovery * 0.18;

    const bob = Math.abs(Math.sin(cycle * 2)) * 0.035 * walkStrength;
    bodyRig.position.y = bob;
    bodyRig.rotation.x = -0.045 * walkStrength;
    bodyRig.rotation.z = -input.x * 0.035 * walkStrength;
    head.rotation.x = Math.sin(cycle * 2) * 0.012 * walkStrength;

    aura.material.opacity = 0.68 + Math.sin(performance.now() * 0.002) * 0.09;
    aura.scale.set(3.0 + bob * 3, 3.2 + bob * 3, 1);
    groundRing.material.opacity = 0.46 + Math.sin(performance.now() * 0.0024) * 0.09;
    groundRing.rotation.z += dt * 0.12;
  }

  function update(dt) {
    const input = getInput();
    const hasInput = input.magnitude > 0.001;
    const canMove = started && !doorRequested && transition.phase === 'none';

    if (hasInput && !movementActive) {
      movementBasisYaw = cameraYaw;
      movementActive = true;
    } else if (!hasInput) {
      movementActive = false;
    }

    if (!canMove) {
      movementActive = false;
    }

    desiredVelocity.set(0, 0, 0);
    if (canMove && hasInput) {
      const forward = new THREE.Vector3(
        Math.sin(movementBasisYaw), 0, -Math.cos(movementBasisYaw)
      );
      const right = new THREE.Vector3(
        Math.cos(movementBasisYaw), 0, Math.sin(movementBasisYaw)
      );
      desiredVelocity.copy(right).multiplyScalar(input.x)
        .addScaledVector(forward, -input.y)
        .multiplyScalar(3.8);
    }

    const response = desiredVelocity.lengthSq() > 0 ? 15 : 12;
    velocity.lerp(desiredVelocity, 1 - Math.exp(-dt * response));
    player.position.addScaledVector(velocity, dt);

    if (roomRoot) {
      roomRoot.updateMatrixWorld(true);
      const localPosition = roomRoot.worldToLocal(player.position.clone());
      const oldX = localPosition.x;
      const oldZ = localPosition.z;
      localPosition.x = clamp(localPosition.x, -5.78, 5.78);
      localPosition.z = clamp(localPosition.z, -5.72, 5.72);
      localPosition.y = 0;
      if (localPosition.x !== oldX || localPosition.z !== oldZ) {
        const localVelocity = velocity.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -roomAngle);
        if (localPosition.x !== oldX) localVelocity.x = 0;
        if (localPosition.z !== oldZ) localVelocity.z = 0;
        velocity.copy(localVelocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), roomAngle));
      }
      player.position.copy(roomRoot.localToWorld(localPosition));

      const doorSpace = roomRoot.worldToLocal(player.position.clone());
      nearDoor = Math.abs(doorSpace.x) < 1.72 && doorSpace.z < -4.28;
    }

    if (velocity.lengthSq() > 0.025) {
      const targetYaw = Math.atan2(velocity.x, -velocity.z);
      player.rotation.y = dampAngle(player.rotation.y, targetYaw, 1 - Math.exp(-dt * 13));
    }

    updateCharacter(dt, input, velocity.lengthSq() > 0.01);
    updateCamera(dt);

    if (started && nearDoor && !doorRequested && transition.phase === 'none') {
      prompt.classList.add('visible');
      openButton.classList.add('visible');
    } else {
      prompt.classList.remove('visible');
      openButton.classList.remove('visible');
    }

    if (doorRequested && doorPivot && transition.phase === 'none') {
      doorPivot.rotation.y += (-1.5 - doorPivot.rotation.y) * (1 - Math.exp(-dt * 5.5));
      if (doorPivot.rotation.y <= -1.46) beginTransition();
    }

    updateTransition(dt);

    shimmerTimer += dt;
    if (shimmerTimer >= 0.075) {
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
    const dt = Math.min((now - lastTime) / 1000, 0.04);
    lastTime = now;
    update(dt);
    renderer.render(scene, camera);
  }

  buildRoom(roomNumber);
  refreshShimmer();
  requestAnimationFrame(frame);
})();