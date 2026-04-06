import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const container=document.getElementById("canvas-container");
const panel=document.getElementById("controlPanel");

/* SCENE */
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x000000);
scene.environment = new THREE.TextureLoader().load(
  'https://threejs.org/examples/textures/2294472375_24a3b8ef46_o.jpg'
);
const ambient = new THREE.AmbientLight(0x00ff88, 0.4);
scene.add(ambient);

const directional = new THREE.DirectionalLight(0xffffff, 1.5);
directional.position.set(30,40,20);
scene.add(directional);


const camera=new THREE.PerspectiveCamera(60,container.clientWidth/container.clientHeight,0.1,1000);
camera.position.set(35,45,35);
camera.lookAt(0,0,0);

const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(container.clientWidth,container.clientHeight);
container.appendChild(renderer.domElement);

scene.add(new THREE.DirectionalLight(0xffffff,2));

function resizeRenderer(){
  const width = container.clientWidth;
  const height = container.clientHeight;

  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resizeRenderer);
resizeRenderer();

/* INTERSECTION ROADS */
const roadMat = new THREE.MeshStandardMaterial({
  color: 0x0a0a0a,
  emissive: 0x003300,
  emissiveIntensity: 0.4
});

function neonStrip(x,z,rot){
  const geo = new THREE.BoxGeometry(120,0.1,0.3);
  const mat = new THREE.MeshBasicMaterial({ color:0x00ff88 });
  const strip = new THREE.Mesh(geo,mat);

  strip.position.set(x,0.05,z);
  strip.rotation.y = rot;

  scene.add(strip);
}

function road(w,h){
  const g=new THREE.PlaneGeometry(w,h);
  const m=new THREE.Mesh(g,roadMat);
  m.rotation.x=-Math.PI/2;
  return m;
}

scene.add(road(120,18)); // horizontal
neonStrip(0,9,0);
neonStrip(0,-9,0);
scene.add(road(15,120)); // vertical
neonStrip(9,0,Math.PI/2);
neonStrip(-9,0,Math.PI/2);

/* DETECTION LINES */
function detectionNS(z){
  const g=new THREE.BoxGeometry(18,0.2,0.4);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x00ffff}));
  m.position.set(0,0.1,z);
  scene.add(m);
}
function detectionEW(x){
  const g=new THREE.BoxGeometry(0.4,0.2,18);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0x00ffff}));
  m.position.set(x,0.1,0);
  scene.add(m);
}
detectionNS(-30); detectionNS(30);
detectionEW(-30); detectionEW(30);

/* STOP LINES */
function stopNS(z){
  const g=new THREE.BoxGeometry(18,0.2,0.5);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xff0000}));
  m.position.set(0,0.1,z);
  scene.add(m);
}
function stopEW(x){
  const g=new THREE.BoxGeometry(0.5,0.2,18);
  const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xff0000}));
  m.position.set(x,0.1,0);
  scene.add(m);
}
stopNS(-20); stopNS(20);
stopEW(-20); stopEW(20);

/* SIGNAL DISPLAY */
const canvas=document.createElement("canvas");
canvas.width=512; canvas.height=256;
const ctx=canvas.getContext("2d");
const tex=new THREE.CanvasTexture(canvas);

const signal=new THREE.Mesh(
  new THREE.PlaneGeometry(10,5),
  new THREE.MeshBasicMaterial({map:tex})
);
signal.position.set(0,8,0);
scene.add(signal);

function updateSignal(text){
  ctx.fillStyle="black";
  ctx.fillRect(0,0,512,256);
  ctx.fillStyle="#00ff88";
  ctx.font="60px Orbitron";
  ctx.textAlign="center";
  ctx.fillText(text,256,150);
  tex.needsUpdate=true;
}
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

loader.setDRACOLoader(dracoLoader);
/* CAR SYSTEM */
const loader=new GLTFLoader();
let cars=[];
let queues={north:0,south:0,east:0,west:0};

let carModel = null;

// preload model once
loader.load('/CAR3D.glb', g=>{

  carModel = g.scene;

  carModel.traverse(child=>{
    if(child.isMesh){
      child.material = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        metalness: 0.6,
        roughness: 0.4
      });
    }
  });

});

let laneOffsets = {
  north: 0,
  south: 0,
  east: 0,
  west: 0
};

function spawnCar(dir){
  if(!carModel) return; // wait until loaded

  const car = carModel.clone(true);
  car.scale.set(1.8,1.8,1.8);

  const gap = 4; // spacing between cars

  if(dir==="north"){
    car.position.set(0,0,-35 - laneOffsets.north);
    car.rotation.y = 0;
    laneOffsets.north += gap;
  }

  if(dir==="south"){
    car.position.set(0,0,35 + laneOffsets.south);
    car.rotation.y = Math.PI;
    laneOffsets.south += gap;
  }

  if(dir==="east"){
    car.position.set(35 + laneOffsets.east,0,0);
    car.rotation.y = -Math.PI/2;
    laneOffsets.east += gap;
  }

  if(dir==="west"){
    car.position.set(-35 - laneOffsets.west,0,0);
    car.rotation.y = Math.PI/2;
    laneOffsets.west += gap;
  }
  car.userData.direction = dir;
  car.userData.detected = false;
  scene.add(car);
  cars.push(car);
}
window.spawnCar=spawnCar;

/* REAL DETECTION POSITIONS */
const detectionPositions={
  north:-30,
  south:30,
  east:30,
  west:-30
};

/* IR DETECTION */
function detectVehicles(){
}

/* SIGNAL LOGIC */
function getLaneOrder(){

  const lanes = ["north","east","south","west"];
  const index = lanes.indexOf(active);

  return {
    active: lanes[index],
    next: lanes[(index+1)%4],
    third: lanes[(index+2)%4],
    fourth: lanes[(index+3)%4]
  };
}

let running=false;
let paused=false;
let active="north";
let timer=0;

function greenTime(lane){
  return Math.floor(queues[lane]*2.2+3);
}

function getPriorityOrder(){

  const laneArray = [
    { lane: "north", count: queues.north },
    { lane: "south", count: queues.south },
    { lane: "east",  count: queues.east  },
    { lane: "west",  count: queues.west  }
  ];

  // Sort descending by vehicle count
  laneArray.sort((a,b)=> b.count - a.count);
  return laneArray;
}

setInterval(()=>{

  if(!running || paused) return;

  const priority = getPriorityOrder();

  // If no cars in any lane
  if(priority[0].count === 0){
    active = null;
    timer = 0;
    updateSignal("NO ACTIVE LANE");
    return;
  }

  // If timer finished OR active lane empty → pick highest priority
  if(timer <= 0 || !active || queues[active] === 0){

    active = priority[0].lane;
    timer = Math.floor(priority[0].count * 2.2 + 3);
  }
  else{
    timer--;
  }

  updateSignal(`GO ${active.toUpperCase()} - ${timer}s`);

},1000);

/* DASHBOARD PANELS */
function updateControlPanel(){

  const priority = getPriorityOrder();

  panel.innerHTML = `
    <h3>SPAWN VEHICLES</h3>
    <button onclick="spawnCar('north')">Spawn North</button>
    <button onclick="spawnCar('south')">Spawn South</button>
    <button onclick="spawnCar('east')">Spawn East</button>
    <button onclick="spawnCar('west')">Spawn West</button>

    <hr>

    <h3>IR CAMERA DATA</h3>
    <p>North: ${queues.north}</p>
    <p>South: ${queues.south}</p>
    <p>East: ${queues.east}</p>
    <p>West: ${queues.west}</p>

    <hr>

    <h3>Priority Order</h3>
    <p>1st: ${priority[0].lane.toUpperCase()} (${priority[0].count})</p>
    <p>2nd: ${priority[1].lane.toUpperCase()} (${priority[1].count})</p>
    <p>3rd: ${priority[2].lane.toUpperCase()} (${priority[2].count})</p>
    <p>4th: ${priority[3].lane.toUpperCase()} (${priority[3].count})</p>

    <hr>

    <h3>Green Time Formula</h3>
    <p>G = (Vehicles × 2.2) + 3</p>

    <hr>

    <h3>Signal Queue</h3>
    <p>Active: ${active ? active.toUpperCase() : "NONE"}</p>
    <p>Next: ${priority[1] ? priority[1].lane.toUpperCase() : "NONE"}</p>
    <p>Third: ${priority[2] ? priority[2].lane.toUpperCase() : "NONE"}</p>
  `;
}


const startBtn = document.getElementById("startBtn");

startBtn.onclick = ()=>{

  running = !running;

  if(running){
    startBtn.textContent = "Stop";
    nextLane();
  }
  else{
    startBtn.textContent = "Start";

    // CLEAR ALL CARS
    cars.forEach(c=> scene.remove(c));
    cars = [];

    // Reset lane offsets
    laneOffsets = {
      north:0,
      south:0,
      east:0,
      west:0
    };
  }
};
const pauseBtn = document.getElementById("pauseBtn");

pauseBtn.onclick = ()=>{
  paused = !paused;

  pauseBtn.textContent = paused ? "Resume" : "Pause";
};
/* MOVEMENT */
function moveCars(){

  const speed = 0.7;   // FIX 4 → faster cars

  cars.forEach((c, index)=>{

    const dir = c.userData.direction;
        /* DETECTION LOGIC */
    if(!c.userData.detected){

      const detect=detectionPositions[dir];

      if(
        (dir==="north"&&c.position.z>=detect)||
        (dir==="south"&&c.position.z<=detect)||
        (dir==="east"&&c.position.x<=detect)||
        (dir==="west"&&c.position.x>=detect)
      ){
        queues[dir]++;
        c.userData.detected=true;
        console.log("Detected:", dir, queues[dir]);
      }
    }
    if(!running || paused) return;

    /* ---------------- STOP LOGIC (FIX 3) ---------------- */

    if(active !== null && dir !== active){

      if(
        (dir==="north" && c.position.z >= -20) ||
        (dir==="south" && c.position.z <= 20) ||
        (dir==="east"  && c.position.x <= 20) ||
        (dir==="west"  && c.position.x >= -20)
      ){
        return; // stop at stop line
      }
    }

    /* ---------------- MOVEMENT ---------------- */

    if(dir==="north") c.position.z += speed;
    if(dir==="south") c.position.z -= speed;
    if(dir==="east")  c.position.x -= speed;
    if(dir==="west")  c.position.x += speed;

    /* ---------------- QUICK DISAPPEAR (FIX 4) ---------------- */
    if(Math.abs(c.position.x) < 1.5 && Math.abs(c.position.z) < 1.5){
       if(c.userData.detected){
          queues[dir]--;
            if(queues[dir] < 0) queues[dir] = 0;
          }
      scene.remove(c);
      cars.splice(index, 1);

      // IMPORTANT: reduce lane offset so next cars move forward properly
      if(laneOffsets && laneOffsets[dir] !== undefined){
        laneOffsets[dir] -= 4;
        if(laneOffsets[dir] < 0) laneOffsets[dir] = 0;
      }
    }

  });

}
setInterval(updateControlPanel, 1000);
updateControlPanel();

function animate(){
  requestAnimationFrame(animate);
  moveCars();
  renderer.render(scene,camera);
}
animate();
