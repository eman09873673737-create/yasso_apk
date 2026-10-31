import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Team {
constructor(scene, teamId, shirtColor, shortsColor) {
this.scene = scene;
this.id = teamId;
this.players = [];
this.shirtColor = shirtColor;
this.shortsColor = shortsColor;

this.homePositions = teamId === 0
  ? [
      [0, 25], [-12, 15], [-4, 17], [4, 17], [12, 15],
      [-13, 5], [-5, 7], [0, 4], [5, 7], [13, 5], [0, -1]
    ]
  : [
      [0, -29], [-12, -19], [-4, -21], [4, -21], [12, -19],
      [-13, -9], [-5, -11], [0, -7], [5, -11], [13, -9], [0, -3]
    ];

this.createPlayers();

}

createPlayers() {
for (let i = 0; i < 11; i++) {
const root = new THREE.Group();
const isKeeper = i === 0;
const shirt = new THREE.MeshStandardMaterial({
color: isKeeper ? 0xf3c928 : this.shirtColor,
roughness: 0.7
});
const shorts = new THREE.MeshStandardMaterial({
color: this.shortsColor,
roughness: 0.8
});
const skin = new THREE.MeshStandardMaterial({
color: 0xc58b62,
roughness: 0.9
});
const socks = new THREE.MeshStandardMaterial({
color: 0xf2f2f2
});
const shoes = new THREE.MeshStandardMaterial({
color: 0x202020,
roughness: 0.8
});

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.36, 0.55, 4, 8),
    shirt
  );
  torso.position.y = 1.25;
  torso.castShadow = true;
  root.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.23, 12, 10),
    skin
  );
  head.position.y = 2.05;
  head.castShadow = true;
  root.add(head);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.235, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.48),
    new THREE.MeshStandardMaterial({ color: 0x29201b })
  );
  hair.position.y = 2.13;
  root.add(hair);

  const legs = [];

  for (let side = -1; side <= 1; side += 2) {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.19, 0.91, 0);
    root.add(legPivot);

    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.12, 0.58, 8),
      shorts
    );
    leg.position.y = -0.18;
    leg.castShadow = true;
    legPivot.add(leg);

    const sock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.105, 0.34, 8),
      socks
    );
    sock.position.y = -0.53;
    sock.castShadow = true;
    legPivot.add(sock);

    const shoe = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.11, 0.3),
      shoes
    );
    shoe.position.set(0, -0.7, -0.08);
    shoe.castShadow = true;
    legPivot.add(shoe);

    legs.push(legPivot);
  }

  for (let side = -1; side <= 1; side += 2) {
    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.09, 0.38, 3, 6),
      shirt
    );
    arm.position.set(side * 0.43, 1.32, 0);
    arm.rotation.z = side * -0.12;
    arm.castShadow = true;
    root.add(arm);
  }

  root.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  const [x, z] = this.homePositions[i];
  root.position.set(x, 0, z);
  this.scene.add(root);

  this.players.push({
    root,
    legs,
    team: this.id,
    number: i + 1,
    isKeeper,
    speed: isKeeper ? 4.2 : 6.2,
    moveAmount: 0,
    homeX: x,
    homeZ: z
  });
}

}

updateUser(input, dt, ball) {
const player = this.players.find(p => p.userControlled);
// The main game selects the controlled player directly.
if (!player) return;

const x = input.x;
const y = input.y;
const length = Math.hypot(x, y);

if (length < 0.08) {
  player.moveAmount = 0;
  return;
}

const speed = input.sprint ? 9 : player.speed;
player.root.position.x += (x / Math.max(1, length)) * speed * dt;
player.root.position.z -= (y / Math.max(1, length)) * speed * dt;

player.moveAmount = Math.min(1, length);
player.root.rotation.y = Math.atan2(-x, -y);

player.root.position.x = THREE.MathUtils.clamp(player.root.position.x, -17, 17);
player.root.position.z = THREE.MathUtils.clamp(player.root.position.z, -29, 25);

}

update(dt, time) {
for (const player of this.players) {
if (player.moveAmount > 0.05) {
const swing = Math.sin(time * 11) * 0.65 * player.moveAmount;
player.legs[0].rotation.x = swing;
player.legs[1].rotation.x = -swing;
} else {
player.legs[0].rotation.x = THREE.MathUtils.damp(
player.legs[0].rotation.x, 0, 8, dt
);
player.legs[1].rotation.x = THREE.MathUtils.damp(
player.legs[1].rotation.x, 0, 8, dt
);
}
}
}

resetPositions() {
for (const player of this.players) {
player.root.position.set(player.homeX, 0, player.homeZ);
player.moveAmount = 0;
player.legs[0].rotation.x = 0;
player.legs[1].rotation.x = 0;
}
}
}
