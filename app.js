import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.2/build/three.module.min.js';

const canvas = document.querySelector('#scene');
const experience = document.querySelector('#experience');
const loading = document.querySelector('#loading');
const scrubberFill = document.querySelector('#scrubberFill');
const instructionText = document.querySelector('#instructionText');
const instruction = document.querySelector('.instruction');
const stepNumber = document.querySelector('#stepNumber');
const stepLabel = document.querySelector('#stepLabel');
const stageCaption = document.querySelector('.stage-caption');
const finalCopy = document.querySelector('#finalCopy');
const finalStats = document.querySelector('#finalStats');
const whip = document.querySelector('#whip');
const flash = document.querySelector('#flash');
const replayButton = document.querySelector('#replayButton');
const topbar = document.querySelector('.topbar');
const controls = document.querySelector('.controls');
const scrubber = document.querySelector('.scrubber');
const referenceButton = document.querySelector('#referenceButton');
const referenceDialog = document.querySelector('#referenceDialog');
const closeReference = document.querySelector('#closeReference');

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smooth = (t) => t * t * (3 - 2 * t);
const range = (value, start, end) => smooth(clamp((value - start) / (end - start), 0, 1));
const backOut = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a2719);
scene.fog = new THREE.Fog(0x4a2719, 16, 32);

const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 80);
const cameraTarget = new THREE.Vector3();

const hemi = new THREE.HemisphereLight(0xffdbac, 0x32170e, 2.7);
scene.add(hemi);
scene.add(new THREE.AmbientLight(0xffd5b5, 1.15));

const keyLight = new THREE.DirectionalLight(0xffc78c, 4.4);
keyLight.position.set(-5, 11, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -9;
keyLight.shadow.camera.right = 9;
keyLight.shadow.camera.top = 9;
keyLight.shadow.camera.bottom = -9;
keyLight.shadow.bias = -0.0015;
scene.add(keyLight);

const rim = new THREE.PointLight(0xdc5b2f, 12, 24, 2);
rim.position.set(5, 3, -3);
scene.add(rim);

function canvasTexture(width, height, draw) {
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const ctx = source.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function makeCardboardTexture(base = '#a8794f') {
  return canvasTexture(384, 384, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, 'rgba(255,236,190,.16)');
    gradient.addColorStop(.55, 'rgba(91,49,27,.08)');
    gradient.addColorStop(1, 'rgba(44,22,12,.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i += 1) {
      const shade = 118 + Math.random() * 80;
      ctx.fillStyle = `rgba(${shade},${shade * .73},${shade * .48},${Math.random() * .13})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 1.8 + .4, Math.random() * 1.8 + .4);
    }
    ctx.strokeStyle = 'rgba(70,37,20,.18)';
    ctx.lineWidth = 1;
    for (let y = 5; y < h; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y) * .4);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  });
}

function makeLabelTexture() {
  return canvasTexture(720, 420, (ctx, w, h) => {
    ctx.fillStyle = '#eee1c8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#7d6046';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = '#3a2619';
    for (let x = 92; x < 438; x += 9 + ((x / 7) % 5)) ctx.fillRect(x, 46, 3 + (x % 7), 94);
    ctx.font = '700 34px Arial';
    ctx.fillText('2025.12.10—2026.12.21', 90, 190);
    ctx.font = '600 31px Arial';
    ctx.fillText('集   神秘包裹', 42, 253);
    ctx.fillText('收   用户名一行是九个字最多十六个字', 42, 315);
    ctx.font = 'italic 800 32px Arial';
    ctx.fillText('◒ UNHEARD', 42, 378);
    ctx.strokeStyle = '#b9a589';
    ctx.setLineDash([5, 7]);
    ctx.beginPath(); ctx.moveTo(42, 218); ctx.lineTo(w - 40, 218); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(42, 278); ctx.lineTo(w - 40, 278); ctx.stroke();
  });
}

function makeArtwork(type) {
  return canvasTexture(512, 640, (ctx, w, h) => {
    if (type === 'album') {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#16262e');
      bg.addColorStop(.5, '#70402e');
      bg.addColorStop(1, '#11191d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e8c8aa'; ctx.beginPath(); ctx.ellipse(330, 305, 118, 176, -.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#15191c'; ctx.beginPath(); ctx.ellipse(312, 222, 134, 103, -.15, Math.PI, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a1c18'; ctx.fillRect(340, 294, 72, 7); ctx.fillRect(276, 294, 42, 6);
      ctx.fillStyle = '#ead9c9'; ctx.font = '700 17px monospace'; ctx.fillText('RECORD THE', 26, 45); ctx.fillText('UNHEARD', 26, 70);
      ctx.font = '11px monospace'; ctx.fillStyle = '#ffffffaa';
      for (let i = 0; i < 8; i += 1) ctx.fillText(`SIDE 0${i + 1} / A MEMORY IN SOUND`, 24, 500 + i * 15);
      ctx.strokeStyle = '#fff7'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(155, 240, 102, 0, Math.PI * 2); ctx.stroke();
    } else if (type === 'book') {
      ctx.fillStyle = '#bd4f2d'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1100; i += 1) {
        ctx.fillStyle = `rgba(255,230,195,${Math.random() * .16})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 7, 2);
      }
      ctx.fillStyle = '#fff3df'; ctx.font = '700 33px Arial'; ctx.fillText('RECORD THE', 42, 76); ctx.fillText('UNHEARD', 42, 116);
      ctx.strokeStyle = '#f7dfc3'; ctx.lineWidth = 3;
      for (let r = 38; r < 170; r += 16) { ctx.beginPath(); ctx.ellipse(275, 355, r, r * .56, -.2, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#f7dfc3'; ctx.beginPath(); ctx.arc(275, 355, 12, 0, Math.PI * 2); ctx.fill();
      ctx.font = '12px monospace'; ctx.fillText('ARCHIVE / 2026', 42, h - 48);
    } else if (type === 'photo') {
      ctx.fillStyle = '#efe0c6'; ctx.fillRect(0, 0, w, h);
      const colors = ['#6c4934', '#d9b786', '#344a50', '#a64e31', '#d8c6a5'];
      for (let y = 20; y < h - 70; y += 96) {
        for (let x = 18; x < w - 30; x += 92) {
          ctx.fillStyle = colors[(x + y) % colors.length];
          ctx.fillRect(x, y, 78, 82);
          ctx.fillStyle = '#fff6'; ctx.fillRect(x + 9, y + 9, 60, 48);
        }
      }
      ctx.fillStyle = '#38251a'; ctx.font = '700 23px monospace'; ctx.fillText('MEMORY CONTACT SHEET', 22, h - 30);
    } else {
      ctx.fillStyle = '#4a4236'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#91836e'; ctx.fillRect(26, 74, w - 52, h - 130);
      ctx.fillStyle = '#211e19'; ctx.fillRect(60, 130, w - 120, 175);
      ctx.fillStyle = '#b77c43'; ctx.fillRect(82, 148, w - 164, 42);
      ctx.fillStyle = '#d8c39f'; ctx.font = '700 29px monospace'; ctx.fillText('UNHEARD / TAPE 01', 42, 48);
      ctx.beginPath(); ctx.arc(145, 220, 38, 0, Math.PI * 2); ctx.arc(w - 145, 220, 38, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,245,220,.7)'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
  });
}

const cardboardTexture = makeCardboardTexture();
cardboardTexture.wrapS = cardboardTexture.wrapT = THREE.RepeatWrapping;
cardboardTexture.repeat.set(2, 2);
const cardboard = new THREE.MeshStandardMaterial({ map: cardboardTexture, color: 0xf0d0a4, roughness: .92, metalness: 0 });
const cardboardDark = new THREE.MeshStandardMaterial({ map: cardboardTexture, color: 0xa97955, roughness: 1 });
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x4f2e1b, transparent: true, opacity: .72 });

function addEdges(mesh, threshold = 25) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, threshold), edgeMaterial);
  edges.renderOrder = 3;
  mesh.add(edges);
}

function boxMesh(geometry, material = cardboard) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addEdges(mesh);
  return mesh;
}

const floorTexture = makeCardboardTexture('#70432d');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(7, 9);
const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, color: 0x8e4f31, roughness: .78 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.15;
floor.receiveShadow = true;
scene.add(floor);

const wallTexture = canvasTexture(512, 512, (ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#3e251d');
  g.addColorStop(.43, '#66402f');
  g.addColorStop(.68, '#9a623e');
  g.addColorStop(1, '#c38955');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * .24, h * .68, 10, w * .24, h * .68, w * .75);
  glow.addColorStop(0, 'rgba(255,203,132,.36)'); glow.addColorStop(1, 'rgba(48,25,17,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2800; i += 1) {
    ctx.fillStyle = `rgba(255,235,196,${Math.random() * .08})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 3, Math.random() * 3);
  }
});
const wall = new THREE.Mesh(new THREE.PlaneGeometry(32, 20), new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 1 }));
wall.position.set(0, 5.5, -7.5);
wall.receiveShadow = true;
scene.add(wall);

const posterTexture = canvasTexture(320, 420, (ctx, w, h) => {
  ctx.fillStyle = '#4b4d52'; ctx.fillRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#c28f65'); g.addColorStop(.55, '#5c5651'); g.addColorStop(1, '#27323c');
  ctx.fillStyle = g; ctx.fillRect(12, 12, w - 24, h - 24);
  ctx.fillStyle = '#e1b58d'; ctx.beginPath(); ctx.ellipse(212, 170, 54, 78, -.16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#292b2f'; ctx.beginPath(); ctx.ellipse(206, 120, 67, 45, -.12, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e6d2bc88'; ctx.fillRect(34, 310, 210, 7); ctx.fillRect(34, 330, 150, 5);
});
const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 2.1), new THREE.MeshBasicMaterial({ map: posterTexture, transparent: true, opacity: .72 }));
poster.position.set(-3.65, 3.65, -7.35);
scene.add(poster);

const backdropSeam = new THREE.Mesh(new THREE.BoxGeometry(30, .045, .08), new THREE.MeshBasicMaterial({ color: 0xd1a078, transparent: true, opacity: .38 }));
backdropSeam.position.set(0, -.7, -7.32);
scene.add(backdropSeam);

const box = new THREE.Group();
box.position.set(0, 0, .2);
scene.add(box);

const W = 5.65;
const D = 4.25;
const H = 1.05;
const floorY = -2.02;
const topY = floorY + H;

const bottom = boxMesh(new THREE.BoxGeometry(W, .13, D), cardboardDark);
bottom.position.y = floorY + .06;
box.add(bottom);

const frontWall = boxMesh(new THREE.BoxGeometry(W, H, .14));
frontWall.position.set(0, floorY + H / 2, D / 2);
box.add(frontWall);
const backWall = boxMesh(new THREE.BoxGeometry(W, H, .14));
backWall.position.set(0, floorY + H / 2, -D / 2);
box.add(backWall);
const leftWall = boxMesh(new THREE.BoxGeometry(.14, H, D));
leftWall.position.set(-W / 2, floorY + H / 2, 0);
box.add(leftWall);
const rightWall = boxMesh(new THREE.BoxGeometry(.14, H, D));
rightWall.position.set(W / 2, floorY + H / 2, 0);
box.add(rightWall);

function flap(name, geometry, pivotPosition, meshPosition) {
  const pivot = new THREE.Group();
  pivot.name = name;
  pivot.position.copy(pivotPosition);
  const mesh = boxMesh(geometry);
  mesh.position.copy(meshPosition);
  pivot.add(mesh);
  box.add(pivot);
  return { pivot, mesh };
}

const frontFlap = flap('front-flap', new THREE.BoxGeometry(W, .11, D / 2), new THREE.Vector3(0, topY, D / 2), new THREE.Vector3(0, 0, -D / 4));
const backFlap = flap('back-flap', new THREE.BoxGeometry(W, .11, D / 2), new THREE.Vector3(0, topY + .03, -D / 2), new THREE.Vector3(0, 0, D / 4));
const leftFlap = flap('left-flap', new THREE.BoxGeometry(W / 2, .11, D), new THREE.Vector3(-W / 2, topY + .07, 0), new THREE.Vector3(W / 4, 0, 0));
const rightFlap = flap('right-flap', new THREE.BoxGeometry(W / 2, .11, D), new THREE.Vector3(W / 2, topY + .1, 0), new THREE.Vector3(-W / 4, 0, 0));

const labelMaterial = new THREE.MeshBasicMaterial({ map: makeLabelTexture(), transparent: true, side: THREE.DoubleSide, toneMapped: false });
const label = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.68), labelMaterial);
label.rotation.x = -Math.PI / 2;
label.position.set(.85, topY + .19, -.82);
box.add(label);

const logoTexture = canvasTexture(512, 128, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#fff6e6';
  ctx.font = 'italic 800 70px Arial';
  ctx.fillText('◒ UNHEARD', 10, 88);
});
const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .6), new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, toneMapped: false }));
logo.rotation.x = -Math.PI / 2;
logo.position.set(-1.55, topY + .2, 1.32);
box.add(logo);

function tearShape(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, -height / 2);
  const count = 28;
  for (let i = 1; i <= count; i += 1) {
    const x = width * i / count;
    shape.lineTo(x, -height / 2 + (i % 2 ? .07 : -.03));
  }
  for (let i = count; i >= 0; i -= 1) {
    const x = width * i / count;
    shape.lineTo(x, height / 2 + (i % 2 ? -.07 : .04));
  }
  shape.closePath();
  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

const tearGroup = new THREE.Group();
tearGroup.position.set(-W / 2 + .08, topY + .23, .36);
box.add(tearGroup);
const tearGapMaterial = new THREE.MeshStandardMaterial({ color: 0x4b2c1b, roughness: 1, side: THREE.DoubleSide });
const tearGap = new THREE.Mesh(tearShape(W - .16, .48), tearGapMaterial);
tearGap.scale.x = .001;
tearGroup.add(tearGap);

const pullTab = new THREE.Mesh(new THREE.CircleGeometry(.26, 32), new THREE.MeshBasicMaterial({ color: 0xf7eee0, side: THREE.DoubleSide, toneMapped: false }));
pullTab.rotation.x = -Math.PI / 2;
pullTab.position.set(.12, .035, 0);
tearGroup.add(pullTab);

const crease = new THREE.LineDashedMaterial({ color: 0x5f3a25, dashSize: .12, gapSize: .1, transparent: true, opacity: .62 });
const creaseGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2, topY + .22, .36), new THREE.Vector3(W / 2, topY + .22, .36)]);
const creaseLine = new THREE.Line(creaseGeo, crease);
creaseLine.computeLineDistances();
box.add(creaseLine);

function makeObject(width, height, depth, texture, sideColor) {
  const sides = new THREE.MeshStandardMaterial({ color: sideColor, roughness: .75 });
  const front = new THREE.MeshStandardMaterial({ map: texture, roughness: .72 });
  const materials = [sides, sides, sides, sides, front, sides];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addEdges(mesh, 35);
  return mesh;
}

const itemsGroup = new THREE.Group();
box.add(itemsGroup);

const itemSpecs = [
  { mesh: makeObject(1.9, 2.08, .14, makeArtwork('album'), 0xddd3c3), start: new THREE.Vector3(-.38, -1.25, -.2), end: new THREE.Vector3(-1.05, .68, .08), rot: new THREE.Euler(-.05, -.14, -.11), delay: .61, endAt: .81 },
  { mesh: makeObject(1.48, 1.96, .28, makeArtwork('book'), 0xe9d9be), start: new THREE.Vector3(.28, -1.22, -.42), end: new THREE.Vector3(1.15, .72, -.18), rot: new THREE.Euler(-.08, .16, .12), delay: .64, endAt: .85 },
  { mesh: makeObject(.86, .92, .07, makeArtwork('photo'), 0xe7dcc5), start: new THREE.Vector3(.1, -1.3, .3), end: new THREE.Vector3(.08, -.02, 1.48), rot: new THREE.Euler(-.2, .08, -.08), delay: .68, endAt: .89 },
  { mesh: makeObject(1.06, 1.12, .18, makeArtwork('tape'), 0x6f6759), start: new THREE.Vector3(-.2, -1.38, -.85), end: new THREE.Vector3(-1.9, -.36, -.62), rot: new THREE.Euler(-.08, -.18, .05), delay: .66, endAt: .87 },
];

for (const item of itemSpecs) {
  item.mesh.position.copy(item.start);
  item.mesh.scale.setScalar(.55);
  item.mesh.visible = false;
  itemsGroup.add(item.mesh);
}

function makeRadio() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x817667, roughness: .8, metalness: .08 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2f2c28, roughness: .86 });
  const body = boxMesh(new THREE.BoxGeometry(2.5, 1.28, .72), bodyMaterial);
  group.add(body);
  const display = new THREE.Mesh(new THREE.BoxGeometry(.62, .25, .045), new THREE.MeshBasicMaterial({ color: 0x627258 }));
  display.position.set(-.52, .08, .38); group.add(display);
  for (const x of [-.78, .72]) {
    const speaker = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, .05, 32), dark);
    speaker.rotation.x = Math.PI / 2; speaker.position.set(x, -.2, .39); group.add(speaker);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.43, .035, 8, 32), new THREE.MeshBasicMaterial({ color: 0xa89b86 }));
    ring.position.set(x, -.2, .425); group.add(ring);
  }
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .08, 24), bodyMaterial);
  knob.rotation.x = Math.PI / 2; knob.position.set(.82, .38, .4); group.add(knob);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(.7, .055, 8, 28, Math.PI), bodyMaterial);
  handle.rotation.z = Math.PI; handle.position.set(0, .6, 0); group.add(handle);
  group.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
  return group;
}

const radio = makeRadio();
radio.position.set(-3.8, -.08, -2.1);
radio.rotation.y = -.08;
radio.scale.setScalar(.001);
scene.add(radio);

function croppedReferenceTexture(x, y, width, height) {
  const texture = new THREE.TextureLoader().load('./assets/reference-03.webp');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(width / 1204, height / 2690);
  texture.offset.set(x / 1204, 1 - (y + height) / 2690);
  return texture;
}

itemSpecs[0].mesh.material[4].map = croppedReferenceTexture(260, 1200, 350, 330);
itemSpecs[1].mesh.material[4].map = croppedReferenceTexture(700, 1220, 285, 400);
itemSpecs[2].mesh.material[4].map = croppedReferenceTexture(555, 1430, 155, 190);
for (const item of itemSpecs) item.mesh.material[4].needsUpdate = true;

const radioFace = new THREE.Mesh(
  new THREE.PlaneGeometry(2.48, 1.26),
  new THREE.MeshBasicMaterial({ map: croppedReferenceTexture(0, 1050, 310, 310), transparent: true })
);
radioFace.position.z = .375;
radio.add(radioFace);

const dustCount = 95;
const dustPositions = new Float32Array(dustCount * 3);
const dustDirections = [];
for (let i = 0; i < dustCount; i += 1) {
  dustDirections.push(new THREE.Vector3((Math.random() - .5) * 6, Math.random() * 4 + .6, (Math.random() - .5) * 4));
}
const dustGeometry = new THREE.BufferGeometry();
dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dustMaterial = new THREE.PointsMaterial({ color: 0xffd39a, size: .055, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
const dust = new THREE.Points(dustGeometry, dustMaterial);
dust.position.set(0, topY + .1, .1);
scene.add(dust);

const ambientDustCount = 170;
const ambientPositions = new Float32Array(ambientDustCount * 3);
for (let i = 0; i < ambientDustCount; i += 1) {
  ambientPositions[i * 3] = (Math.random() - .5) * 14;
  ambientPositions[i * 3 + 1] = Math.random() * 10 - 2;
  ambientPositions[i * 3 + 2] = Math.random() * 9 - 5;
}
const ambientGeometry = new THREE.BufferGeometry();
ambientGeometry.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
const ambientDust = new THREE.Points(ambientGeometry, new THREE.PointsMaterial({ color: 0xf8d9ac, size: .025, transparent: true, opacity: .23, depthWrite: false }));
scene.add(ambientDust);

let targetProgress = 0;
let displayProgress = 0;
let dragging = false;
let pointerId = null;
let dragStartX = 0;
let dragStartProgress = 0;
let lastPointerX = 0;
let lastPointerTime = 0;
let velocity = 0;
let burstTriggered = false;
let audioContext = null;

function resize() {
  const rect = experience.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function updateCamera(progress) {
  const turn = clamp((progress - .38) / (.7 - .38), 0, 1);
  const turnEase = smooth(turn);
  const theta = turnEase * 1.309;
  const targetY = lerp(-.42, .8, turnEase);
  const radius = lerp(15.02, 16.25, turnEase);
  camera.position.set(
    Math.sin(turn * Math.PI) * .42,
    targetY + Math.cos(theta) * radius,
    Math.sin(theta) * radius
  );
  camera.up.set(0, lerp(0, 1, turnEase), lerp(-1, 0, turnEase)).normalize();
  cameraTarget.set(0, targetY, 0);
  camera.lookAt(cameraTarget);
  camera.rotation.z += Math.sin(turn * Math.PI) * -.035;
}

function updateDust(progress) {
  const t = clamp((progress - .61) / .22, 0, 1);
  const alpha = t < .15 ? t / .15 : 1 - (t - .15) / .85;
  dustMaterial.opacity = clamp(alpha, 0, 1) * .62;
  for (let i = 0; i < dustCount; i += 1) {
    const d = dustDirections[i];
    dustPositions[i * 3] = d.x * t;
    dustPositions[i * 3 + 1] = d.y * t - 2.4 * t * t;
    dustPositions[i * 3 + 2] = d.z * t;
  }
  dustGeometry.attributes.position.needsUpdate = true;
}

function updateScene(progress) {
  updateCamera(progress);

  const tear = range(progress, .02, .35);
  tearGap.scale.x = Math.max(.001, tear);
  pullTab.position.x = .08 + (W - .26) * tear;
  pullTab.scale.setScalar(1 + Math.sin(tear * Math.PI) * .18);
  creaseLine.material.opacity = .62 * (1 - tear);

  const open = range(progress, .46, .73);
  frontFlap.pivot.rotation.x = lerp(0, 2.48, open);
  backFlap.pivot.rotation.x = lerp(0, -2.34, open);
  leftFlap.pivot.rotation.z = lerp(0, -2.36, open);
  rightFlap.pivot.rotation.z = lerp(0, 2.36, open);
  const flapShrink = lerp(1, .82, open);
  frontFlap.mesh.scale.z = flapShrink;
  frontFlap.mesh.position.z = -D / 4 * flapShrink;
  backFlap.mesh.scale.z = flapShrink;
  backFlap.mesh.position.z = D / 4 * flapShrink;
  leftFlap.mesh.scale.x = flapShrink;
  leftFlap.mesh.position.x = W / 4 * flapShrink;
  rightFlap.mesh.scale.x = flapShrink;
  rightFlap.mesh.position.x = -W / 4 * flapShrink;
  labelMaterial.opacity = 1 - range(progress, .37, .54);
  logo.material.opacity = 1 - range(progress, .36, .5);
  tearGapMaterial.opacity = 1 - range(progress, .4, .55);
  tearGroup.visible = progress < .57;

  box.rotation.y = lerp(0, -.12, range(progress, .38, .72));
  box.position.y = Math.sin(range(progress, .52, .68) * Math.PI) * .11;

  for (const item of itemSpecs) {
    const raw = clamp((progress - item.delay) / (item.endAt - item.delay), 0, 1);
    const pop = backOut(raw);
    item.mesh.visible = raw > .005;
    item.mesh.position.set(
      lerp(item.start.x, item.end.x, pop),
      lerp(item.start.y, item.end.y, pop),
      lerp(item.start.z, item.end.z, pop)
    );
    item.mesh.rotation.set(item.rot.x * pop, item.rot.y * pop, item.rot.z * pop);
    item.mesh.scale.setScalar(lerp(.55, 1, Math.min(pop, 1)));
  }

  const radioIn = backOut(range(progress, .48, .71));
  radio.scale.setScalar(Math.max(.001, Math.min(radioIn, 1)) * .95);
  radio.position.y = lerp(-1.8, -.08, radioIn);

  const turn = clamp((progress - .38) / (.7 - .38), 0, 1);
  const whipStrength = Math.pow(Math.sin(turn * Math.PI), 2.2);
  whip.style.opacity = String(whipStrength * .72);
  whip.style.transform = `translateX(${lerp(-18, 18, turn)}%) skewX(-8deg)`;
  poster.material.opacity = .72 * range(progress, .44, .66);
  backdropSeam.material.opacity = .38 * range(progress, .44, .66);

  updateDust(progress);
  ambientDust.rotation.y += .0004;

  const flashStrength = Math.max(0, 1 - Math.abs(progress - .695) / .045);
  flash.style.opacity = String(flashStrength * .52);
  scrubberFill.style.width = `${progress * 100}%`;

  const finalIn = range(progress, .56, .75);
  finalCopy.style.opacity = String(finalIn);
  finalCopy.style.transform = `translateY(${lerp(18, 0, finalIn)}px)`;
  finalCopy.setAttribute('aria-hidden', finalIn > .5 ? 'false' : 'true');
  const statsIn = range(progress, .79, .94);
  finalStats.style.opacity = String(statsIn);
  finalStats.style.transform = `translateY(${lerp(10, 0, statsIn)}px)`;
  finalStats.setAttribute('aria-hidden', statsIn > .5 ? 'false' : 'true');
  stageCaption.style.opacity = String(1 - range(progress, .48, .64));
  stageCaption.style.transform = `translateY(${-12 * range(progress, .48, .64)}px)`;
  topbar.style.opacity = String(1 - range(progress, .43, .62));

  if (progress < .34) {
    stepNumber.textContent = '01'; stepLabel.textContent = '撕开封条'; instructionText.textContent = '按住纸箱向右滑';
  } else if (progress < .69) {
    stepNumber.textContent = '02'; stepLabel.textContent = '环绕拉远'; instructionText.textContent = '继续向右，拉开全景侧视图';
  } else {
    stepNumber.textContent = '03'; stepLabel.textContent = '内容蹦出'; instructionText.textContent = '松手，看它砰地出现';
  }

  const finished = progress > .965;
  instruction.style.display = finished ? 'none' : 'flex';
  replayButton.style.display = finished ? 'block' : 'none';
  controls.classList.toggle('is-final', progress > .9);

  if (progress > .625 && !burstTriggered) {
    burstTriggered = true;
    playPop();
    navigator.vibrate?.([12, 24, 22]);
  }
  if (progress < .55) burstTriggered = false;
}

function playPop() {
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(110, now);
    oscillator.frequency.exponentialRampToValueAtTime(46, now + .18);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.19, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .22);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now); oscillator.stop(now + .23);
  } catch { /* Sound is a progressive enhancement. */ }
}

function setTarget(value, duration = .55) {
  window.gsap.killTweensOf(progressState);
  progressState.value = targetProgress;
  window.gsap.to(progressState, {
    value: clamp(value, 0, 1),
    duration,
    ease: value === 1 ? 'back.out(1.35)' : 'power3.out',
    onUpdate: () => { targetProgress = clamp(progressState.value, 0, 1); },
  });
}

const progressState = { value: 0 };

function snapTarget() {
  const projected = clamp(targetProgress + velocity * .18, 0, 1);
  let destination = 0;
  if (projected >= .82) destination = 1;
  else if (projected >= .48) destination = .69;
  else if (projected >= .16) destination = .36;
  setTarget(destination, destination === 1 ? .75 : .5);
}

experience.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button, dialog')) return;
  dragging = true;
  pointerId = event.pointerId;
  dragStartX = event.clientX;
  lastPointerX = event.clientX;
  lastPointerTime = performance.now();
  dragStartProgress = targetProgress;
  velocity = 0;
  progressState.value = targetProgress;
  window.gsap.killTweensOf(progressState);
  experience.setPointerCapture(pointerId);
  experience.classList.add('is-dragging');
  try { audioContext ??= new (window.AudioContext || window.webkitAudioContext)(); audioContext.resume(); } catch {}
});

experience.addEventListener('pointermove', (event) => {
  if (!dragging || event.pointerId !== pointerId) return;
  const rect = experience.getBoundingClientRect();
  const now = performance.now();
  const deltaX = event.clientX - lastPointerX;
  const deltaTime = Math.max(16, now - lastPointerTime);
  velocity = deltaX / rect.width / (deltaTime / 1000);
  lastPointerX = event.clientX;
  lastPointerTime = now;
  targetProgress = clamp(dragStartProgress + (event.clientX - dragStartX) / (rect.width * .77), 0, 1);
  progressState.value = targetProgress;
});

function finishDrag(event) {
  if (!dragging || event.pointerId !== pointerId) return;
  dragging = false;
  experience.classList.remove('is-dragging');
  try { experience.releasePointerCapture(pointerId); } catch {}
  pointerId = null;
  snapTarget();
}

experience.addEventListener('pointerup', finishDrag);
experience.addEventListener('pointercancel', finishDrag);

experience.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight' || event.key === ' ') { event.preventDefault(); setTarget(targetProgress < .34 ? .36 : targetProgress < .68 ? .69 : 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); setTarget(targetProgress > .72 ? .69 : targetProgress > .4 ? .36 : 0); }
  if (event.key.toLowerCase() === 'r') setTarget(0, .8);
});

replayButton.addEventListener('click', () => setTarget(0, 1));
referenceButton.addEventListener('click', () => referenceDialog.showModal());
closeReference.addEventListener('click', () => referenceDialog.close());
referenceDialog.addEventListener('click', (event) => {
  const rect = referenceDialog.getBoundingClientRect();
  const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
  if (!inside) referenceDialog.close();
});

let lastTime = performance.now();
function render(now) {
  const delta = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  const damping = 1 - Math.pow(.00015, delta);
  displayProgress = lerp(displayProgress, targetProgress, damping);
  if (Math.abs(displayProgress - targetProgress) < .0001) displayProgress = targetProgress;
  updateScene(displayProgress);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

window.addEventListener('resize', resize);
resize();
updateScene(0);
requestAnimationFrame(render);
setTimeout(() => loading.classList.add('is-hidden'), 350);