import * as THREE from
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { Team } from './Team.js';
import { Ball } from './Ball.js';
import { AI } from './AI.js';

const $ = id => document.getElementById(id);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bbdca);
scene.fog = new THREE.Fog(0x9bbdca, 70, 150);

const camera = new THREE.PerspectiveCamera(
  58, innerWidth / innerHeight, 0.1, 200
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance'
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x35533a, 2));

const sun = new THREE.DirectionalLight(0xfff0d8, 2.5);
sun.position.set(-20, 35, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const material = color =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85 });

function box(w, h, d, color, x, y, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material(color)
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function line(w, d, x, z) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.035, d),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );

  mesh.position.set(x, 0.02, z);
  scene.add(mesh);
}

function buildStadium() {
  box(36, 0.3, 58, 0x237c39, 0, -0.2, -2);

  for (let i = 0; i < 8; i++) {
    box(
      35.8, 0.015, 7.1,
      i % 2 ? 0x247e38 : 0x2a8742,
      0, -0.035, -27 + i * 7.2
    );
  }

  line(36, 0.12, 0, 26);
  line(36, 0.12, 0, -30);
  line(0.12, 56, -18, -2);
  line(0.12, 56, 18, -2);
  line(36, 0.12, 0, -2);

  line(20, 0.12, 0, 16);
  line(20, 0.12, 0, -20);
  line(0.12, 10, -10, 21);
  line(0.12, 10, 10, 21);
  line(0.12, 10, -10, -25);
  line(0.12, 10, 10, -25);

  const circle = new THREE.Mesh(
    new THREE.RingGeometry(5.8, 5.95, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    })
  );

  circle.rotation.x = -Math.PI / 2;
  circle.position.set(0, 0.025, -2);
  scene.add(circle);

  for (const z of [-30, 26]) {
    box(8, 0.18, 0.2, 0xffffff, 0, 3, z);
    box(0.18, 3, 0.2, 0xffffff, -4, 1.5, z);
    box(0.18, 3, 0.2, 0xffffff, 4, 1.5, z);
  }

  box(42, 5, 5, 0x46515a, 0, 2.5, -35);
  box(42, 5, 5, 0x46515a, 0, 2.5, 31);
  box(5, 5, 62, 0x46515a, -22, 2.5, -2);
  box(5, 5, 62, 0x46515a, 22, 2.5, -2);
}

buildStadium();

const home = new Team(scene, 0, 0x1765d1, 0xf1f1f1);
const away = new Team(scene, 1, 0xc72d2d, 0xf1f1f1);
const ball = new Ball(scene);
const ai = new AI(home, away, ball);

let controlled = home.players[7];
let started = false;
let homeScore = 0;
let awayScore = 0;
let elapsed = 0;
let lastTime = performance.now();

const input = {
  x: 0,
  y: 0,
  sprint: false
};

function setupJoystick() {
  const base = $('joystick');
  const knob = $('stickKnob');
  let pointerId = null;

  function move(e) {
    const r = base.getBoundingClientRect();

    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);

    const max = 36;
    const length = Math.hypot(x, y);

    if (length > max) {
      x = x / length * max;
      y = y / length * max;
    }

    input.x = x / max;
    input.y = y / max;

    knob.style.left =
      (base.clientWidth / 2 - 24 + x) + 'px';

    knob.style.top =
      (base.clientHeight / 2 - 24 + y) + 'px';
  }

  function reset() {
    pointerId = null;
    input.x = 0;
    input.y = 0;

    knob.style.left =
      (base.clientWidth / 2 - 24) + 'px';

    knob.style.top =
      (base.clientHeight / 2 - 24) + 'px';
  }

  base.addEventListener('pointerdown', e => {
    pointerId = e.pointerId;
    base.setPointerCapture(pointerId);
    move(e);
  });

  base.addEventListener('pointermove', e => {
    if (e.pointerId === pointerId) move(e);
  });

  base.addEventListener('pointerup', reset);
  base.addEventListener('pointercancel', reset);
}

setupJoystick();

$('sprintBtn').addEventListener('pointerdown', e => {
  e.preventDefault();
  input.sprint = true;
});

for (const event of ['pointerup', 'pointercancel', 'pointerleave']) {
  $('sprintBtn').addEventListener(event, () => {
    input.sprint = false;
  });
}

$('startBtn').addEventListener('click', () => {
  started = true;
  $('menu').style.display = 'none';
  $('status').textContent = 'المباراة بدأت';
});

$('shootBtn').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (started) ball.shoot(controlled, away.players);
});

$('passBtn').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (started) ball.pass(controlled, home.players);
});

$('switchBtn').addEventListener('pointerdown', e => {
  e.preventDefault();

  const candidates = home.players.filter(p => !p.isKeeper);

  candidates.sort((a, b) =>
    a.root.position.distanceTo(ball.mesh.position) -
    b.root.position.distanceTo(ball.mesh.position)
  );

  if (candidates.length) controlled = candidates[0];
});

function resetMatchBall() {
  ball.reset();
  home.resetPositions();
  away.resetPositions();
  controlled = home.players[7];
}

function animate(now) {
  requestAnimationFrame(animate);

  const dt = Math.min((now - lastTime) / 1000, 0.04);
  lastTime = now;

  if (started) {
    elapsed += dt;

    controlled.updateUser(input, dt, ball);
    ai.update(dt, controlled);

    ball.update(dt, home.players, away.players);
    home.update(dt, now / 1000);
    away.update(dt, now / 1000);

    if (
      ball.mesh.position.z < -30 &&
      Math.abs(ball.mesh.position.x) < 4
    ) {
      homeScore++;
      resetMatchBall();
    }

    if (
      ball.mesh.position.z > 26 &&
      Math.abs(ball.mesh.position.x) < 4
    ) {
      awayScore++;
      resetMatchBall();
    }

    $('homeScore').textContent = homeScore;
    $('awayScore').textContent = awayScore;

    const seconds = Math.floor(elapsed);

    $('clock').textContent =
      String(Math.floor(seconds / 60)).padStart(2, '0') +
      ':' +
      String(seconds % 60).padStart(2, '0');

    $('status').textContent = ball.owner
      ? (ball.owner.team === 0 ? 'فريقك مستحوذ على الكرة' : 'الخصم مستحوذ على الكرة')
      : 'الكرة حرة';

    const p = controlled.root.position;

    const target = new THREE.Vector3(
      p.x * 0.45,
      8.5,
      p.z + 11
    );

    camera.position.lerp(target, 1 - Math.pow(0.001, dt));
    camera.lookAt(p.x * 0.5, 1.2, p.z - 5);
  } else {
    camera.position.set(0, 22, 43);
    camera.lookAt(0, 0, -2);
  }

  renderer.render(scene, camera);
}

$('loading').style.display = 'none';

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
