const canvas=document.getElementById('cafeCanvas'),ctx=canvas.getContext('2d');
const orderText=document.getElementById('orderText'),visitorText=document.getElementById('visitorText'),message=document.getElementById('message'),phaseText=document.getElementById('phaseText');
const cafe=document.getElementById('cafe'),basement=document.getElementById('basement');
const keys={};
const desserts=[
 {icon:'🍰',name:'Клубничный пирог'}, {icon:'☕',name:'Кофе'}, {icon:'🍪',name:'Печенье'}, {icon:'🧁',name:'Кекс'},
 {icon:'🍩',name:'Пончик'}, {icon:'🥧',name:'Яблочный пирог'}, {icon:'🍮',name:'Пудинг'}, {icon:'🫖',name:'Чай'}
];
const normalCustomers=[
 {animal:'🐰',name:'Кролик',order:0,table:0},{animal:'🐱',name:'Котик',order:1,table:1},{animal:'🦔',name:'Ёжик',order:2,table:2},{animal:'🐰',name:'Крольчиха',order:3,table:3},
 {animal:'🐱',name:'Котик',order:4,table:1},{animal:'🦔',name:'Ёжик',order:5,table:0},{animal:'🐰',name:'Кролик',order:6,table:2},{animal:'🐱',name:'Котик',order:7,table:3}
];
const predators=[{animal:'🐺',name:'Волк',order:1,table:0},{animal:'🦊',name:'Лиса',order:0,table:1},{animal:'🐻',name:'Медведь',order:5,table:2}];
let group='normal',customerIndex=0,predatorIndex=0,holding=null,gameEnded=false,chase=false,shake=false;
const player={x:500,y:590,speed:4.2};
const tables=[[270,190],[730,190],[270,360],[730,360]];
function resize(){canvas.width=1000;canvas.height=650}resize();
window.addEventListener('resize',resize);
window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();if(e.code==='KeyE'&&!e.repeat&&!gameEnded&&!chase)interactCafe()});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
function currentCustomer(){return group==='normal'?normalCustomers[customerIndex]:predators[predatorIndex]}
function updateOrder(){const c=currentCustomer();if(!c)return;const d=desserts[c.order];orderText.textContent=d.icon+' '+d.name;visitorText.textContent=group==='normal'?`Посетитель ${customerIndex+1} / ${normalCustomers.length}`:`ХИЩНИК: ${c.name}`;phaseText.textContent=group==='normal'?'МИЛОЕ УТРО':'ЧТО-ТО НЕ ТАК…';phaseText.style.background=group==='normal'?'#6b3b40':'#4b252b'}
function drawWindow(x){ctx.fillStyle='#9bd6e6';ctx.fillRect(x,25,120,62);ctx.fillStyle='#dceff2';ctx.fillRect(x+57,25,6,62);ctx.fillRect(x,53,120,6);ctx.strokeStyle='#43242a';ctx.lineWidth=6;ctx.strokeRect(x,25,120,62)}
function drawTable(x,y,active){ctx.fillStyle=active?(group==='normal'?'#c97873':'#754047'):'#a95d59';ctx.fillRect(x-66,y-43,132,86);ctx.fillStyle='#f0dfc8';ctx.fillRect(x-54,y-33,108,66);ctx.strokeStyle='#4a252b';ctx.lineWidth=5;ctx.strokeRect(x-54,y-33,108,66);ctx.font='21px Arial';ctx.textAlign='center';ctx.fillText('🍓',x,y+7)}
function drawCounter(){ctx.fillStyle='#63352f';ctx.fillRect(335,475,330,110);ctx.fillStyle='#9f5c4e';ctx.fillRect(347,486,306,74);ctx.strokeStyle='#3e2025';ctx.lineWidth=5;ctx.strokeRect(347,486,306,74);ctx.fillStyle='#ffe5ca';ctx.font='bold 18px Arial';ctx.fillText('СТОЙКА ДЕСЕРТОВ',500,510);desserts.forEach((d,i)=>{ctx.font='25px Arial';ctx.fillText(d.icon,388+(i%4)*74,542+Math.floor(i/4)*0)});ctx.fillStyle='#704038';ctx.fillRect(320,585,360,35)}
function drawCafe(){ctx.clearRect(0,0,1000,650);ctx.fillStyle=group==='normal'?'#f5dcc2':'#c29b8c';ctx.fillRect(0,0,1000,650);for(let y=105;y<650;y+=50)for(let x=0;x<1000;x+=50){ctx.fillStyle=((x/50+y/50)%2===0)?(group==='normal'?'#f6dfc4':'#d1afa0'):(group==='normal'?'#bd7069':'#8f6466');ctx.fillRect(x,y,50,50)}ctx.fillStyle='#66383c';ctx.fillRect(0,0,1000,105);for(let x=0;x<1000;x+=100){ctx.fillStyle='#784246';ctx.fillRect(x+8,8,84,80)}drawWindow(55);drawWindow(825);ctx.fillStyle='#4a2928';ctx.fillRect(455,15,90,90);ctx.fillStyle='#dda65e';ctx.fillRect(472,32,56,73);drawCounter();tables.forEach((p,i)=>drawTable(p[0],p[1],i===currentCustomer()?.table));const c=currentCustomer();if(c){ctx.font=group==='normal'?'48px Arial':'56px Arial';ctx.fillText(c.animal,tables[c.table][0],tables[c.table][1]-43)}ctx.font='50px Arial';ctx.fillText('🐰',player.x,player.y);if(holding!==null){const d=desserts[holding];ctx.font='30px Arial';ctx.fillText(d.icon,player.x+34,player.y-25);ctx.font='11px Arial';ctx.fillStyle='#fff';ctx.fillText(d.name,player.x,player.y+13)}if(nearCounter()&&holding===null&&!chase){ctx.font='bold 16px Arial';ctx.fillStyle='#fff5df';ctx.fillText('E — ВЗЯТЬ ДЕСЕРТ',500,630)}else if(nearTable()&&holding!==null&&!chase){ctx.font='bold 16px Arial';ctx.fillStyle='#fff5df';ctx.fillText('E — ОТДАТЬ ЗАКАЗ',500,630)}if(chase){ctx.fillStyle='rgba(50,0,0,.18)';ctx.fillRect(0,0,1000,650);ctx.font='64px Arial';ctx.fillText('🐺',player.x-170,player.y);}}
function nearCounter(){return player.x>330&&player.x<670&&player.y>455&&player.y<635}
function nearTable(){const c=currentCustomer();if(!c)return false;const p=tables[c.table];return Math.hypot(player.x-p[0],player.y-p[1])<105}
function interactCafe(){if(!currentCustomer())return;if(nearCounter()&&holding===null){holding=currentCustomer().order;showMessage('ВЗЯТО: '+desserts[holding].name);return}if(nearTable()&&holding!==null){if(holding!==currentCustomer().order){showMessage('ЭТО НЕ ТОТ ЗАКАЗ');return}holding=null;advanceCustomer()}}
function advanceCustomer(){showMessage('ЗАКАЗ ПРИНЯТ!');if(group==='normal'){customerIndex++;if(customerIndex>=normalCustomers.length){startPredators()}else updateOrder()}else{predatorIndex++;if(predatorIndex>=predators.length){startChase()}else updateOrder()}}
function startPredators(){group='predators';customerIndex=0;predatorIndex=0;holding=null;cafe.classList.add('scary');phaseText.textContent='НЕОЖИДАННЫЕ ГОСТИ';updateOrder();showMessage('В КАФЕ ПРИШЛИ ХИЩНИКИ')}
function startChase(){chase=true;holding=null;phaseText.textContent='БЕГИ!';showMessage('ВОЛК ИДЁТ ЗА ТОБОЙ',1300);document.getElementById('cafe').classList.add('shake');let wolfX=500;let wolfY=115;const chaseLoop=()=>{if(gameEnded)return;let dx=player.x-wolfX,dy=player.y-wolfY,d=Math.hypot(dx,dy);if(d>55){wolfX+=dx/d*2.2;wolfY+=dy/d*2.2}else{chase=false;document.getElementById('cafe').classList.remove('shake');startBasement();return}drawCafe();requestAnimationFrame(chaseLoop)};chaseLoop()}
function showMessage(t,ms=900){message.textContent=t;message.style.opacity=1;clearTimeout(showMessage.t);showMessage.t=setTimeout(()=>message.style.opacity=0,ms)}
function cafeLoop(){if(gameEnded||chase)return;let dx=0,dy=0;if(keys.arrowleft)dx--;if(keys.arrowright)dx++;if(keys.arrowup)dy--;if(keys.arrowdown)dy++;if(dx||dy){const l=Math.hypot(dx,dy);player.x+=dx/l*player.speed;player.y+=dy/l*player.speed}player.x=Math.max(40,Math.min(960,player.x));player.y=Math.max(125,Math.min(625,player.y));drawCafe();requestAnimationFrame(cafeLoop)}updateOrder();cafeLoop();

// ---------------- 3D BASEMENT ----------------
let scene,camera,renderer,flashlight,wolf3D,basementKeys=[],closets=[],exitDoor;let bRunning=false,hidden=false,flashOn=true,collected=0,stamina=100;let yaw=0,pitch=0;const bPlayer={x:0,y:1.6,z:14};const bKeys={};let lastTime=0;let mazeWalls=[];
function startBasement(){if(bRunning)return;cafe.style.display='none';basement.style.display='block';bRunning=true;initBasement();showMessage('ТЫ В ПОДВАЛЕ',1400)}
function initBasement(){scene=new THREE.Scene();scene.background=new THREE.Color(0x030405);scene.fog=new THREE.FogExp2(0x050608,.075);camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.05,100);camera.position.set(bPlayer.x,bPlayer.y,bPlayer.z);renderer=new THREE.WebGLRenderer({antialias:false});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));basement.appendChild(renderer.domElement);scene.add(new THREE.AmbientLight(0x20202a,.2));flashlight=new THREE.SpotLight(0xffffff,5,18,Math.PI/7,.45,1);scene.add(flashlight,flashlight.target);buildBasement();createExit3D();createKeys3D();createClosets3D();createWolf3D();window.addEventListener('resize',resize3D);document.addEventListener('keydown',basementDown);document.addEventListener('keyup',basementUp);basement.addEventListener('click',()=>renderer.domElement.requestPointerLock());document.addEventListener('mousemove',mouseLook);requestAnimationFrame(basementLoop)}
function wall(x,y,z,sx,sy,sz){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshStandardMaterial({color:0x292a2f,roughness:1}));m.position.set(x,y,z);scene.add(m);mazeWalls.push({x,z,sx,sz});return m}
function buildBasement(){const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:0x111216,roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);wall(0,3.2,0,40,.2,40);wall(0,2,-18,40,4,.5);wall(0,2,18,40,4,.5);wall(-20,2,0,.5,4,36);wall(20,2,0,.5,4,36);[[0,2,7,30,4,.5],[-11,2,-2,.5,4,16],[8,2,-3,24,4,.5],[12,2,7,.5,4,18],[-4,2,12,18,4,.5],[-14,2,10,.5,4,12],[0,2,-10,18,4,.5],[5,2,-14,.5,4,8],[-7,2,-14,.5,4,8],[15,2,-9,10,4,.5]].forEach(w=>wall(...w))}
function createExit3D(){exitDoor=new THREE.Mesh(new THREE.BoxGeometry(2.4,3,.3),new THREE.MeshStandardMaterial({color:0x551111,emissive:0x220000}));exitDoor.position.set(0,1.5,-17.5);scene.add(exitDoor)}
function createKeys3D(){[[-15,1,-13],[14,1,-7],[-15,1,14],[14,1,13]].forEach((p,i)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(.22,.07,8,16),new THREE.MeshStandardMaterial({color:0xd9d69a,emissive:0x555522}));m.position.set(...p);m.rotation.x=Math.PI/2;m.userData.index=i;scene.add(m);basementKeys.push(m)})}
function createClosets3D(){[[-16,1.5,0],[16,1.5,3],[-2,1.5,-16],[5,1.5,15]].forEach(p=>{const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(1.8,3,.9),new THREE.MeshStandardMaterial({color:0x30262a}));body.position.set(...p);g.add(body);g.position.set(0,0,0);scene.add(g);closets.push({group:g,x:p[0],z:p[2]})})}
function createWolf3D(){
  wolf3D=new THREE.Group();
  const dark=new THREE.MeshStandardMaterial({color:0x202126,roughness:.9});
  const headMat=new THREE.MeshStandardMaterial({color:0x303139,roughness:.9});
  const eyeMat=new THREE.MeshStandardMaterial({color:0xff3030,emissive:0xff0000,emissiveIntensity:2});
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.25,1.55,.9),dark); body.position.y=1;
  const head=new THREE.Mesh(new THREE.BoxGeometry(1.05,.9,.9),headMat); head.position.set(0,2,0);
  const earL=new THREE.Mesh(new THREE.ConeGeometry(.25,.65,4),headMat); earL.position.set(-.35,2.65,0); earL.rotation.z=-.15;
  const earR=earL.clone(); earR.position.x=.35; earR.rotation.z=.15;
  const eyeL=new THREE.Mesh(new THREE.SphereGeometry(.075,8,8),eyeMat); eyeL.position.set(-.22,2.08,-.46);
  const eyeR=eyeL.clone(); eyeR.position.x=.22;
  wolf3D.add(body,head,earL,earR,eyeL,eyeR);
  wolf3D.position.set(0,0,11.5);
  scene.add(wolf3D);
}
function basementDown(e){
  if(!bRunning)return;
  const code=e.code;
  if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','KeyQ','KeyE','Space'].includes(code)) e.preventDefault();
  if(code==='KeyW') bKeys.w=true;
  if(code==='KeyA') bKeys.a=true;
  if(code==='KeyS') bKeys.s=true;
  if(code==='KeyD') bKeys.d=true;
  if(code==='ShiftLeft'||code==='ShiftRight') bKeys.shift=true;
  if(code==='KeyQ'&&!e.repeat){
    flashOn=!flashOn;
    flashlight.intensity=flashOn?5:0;
    flashlight.visible=flashOn;
    document.getElementById('flashlightText').textContent=flashOn?'ON [Q]':'OFF [Q]';
  }
  if(code==='KeyE'&&!e.repeat) toggleCloset3D();
}
function basementUp(e){
  const code=e.code;
  if(code==='KeyW') bKeys.w=false;
  if(code==='KeyA') bKeys.a=false;
  if(code==='KeyS') bKeys.s=false;
  if(code==='KeyD') bKeys.d=false;
  if(code==='ShiftLeft'||code==='ShiftRight') bKeys.shift=false;
}
function mouseLook(e){if(!bRunning||document.pointerLockElement!==renderer?.domElement)return;yaw-=e.movementX*.002;pitch-=e.movementY*.002;pitch=Math.max(-1.25,Math.min(1.25,pitch))}
function collides(x,z){const r=.35;for(const w of mazeWalls){if(x+r>w.x-w.sx/2&&x-r<w.x+w.sx/2&&z+r>w.z-w.sz/2&&z-r<w.z+w.sz/2)return true}return false}
function moveBasement(dt){if(hidden)return;let dx=0,dz=0;if(bKeys.w)dz-=1;if(bKeys.s)dz+=1;if(bKeys.a)dx-=1;if(bKeys.d)dx+=1;if(!dx&&!dz){stamina=Math.min(100,stamina+20*dt);return}const len=Math.hypot(dx,dz);dx/=len;dz/=len;const run=bKeys.shift&&stamina>0;const speed=run?5.2:2.8;if(run)stamina-=28*dt;else stamina+=14*dt;stamina=Math.max(0,Math.min(100,stamina));const sin=Math.sin(yaw),cos=Math.cos(yaw);const nx=bPlayer.x+(dx*cos-dz*sin)*speed*dt,nz=bPlayer.z+(dx*sin+dz*cos)*speed*dt;if(!collides(nx,bPlayer.z))bPlayer.x=nx;if(!collides(bPlayer.x,nz))bPlayer.z=nz;bPlayer.x=Math.max(-18.5,Math.min(18.5,bPlayer.x));bPlayer.z=Math.max(-17,Math.min(17,bPlayer.z))}
function collectKeys3D(){basementKeys.forEach(k=>{if(!k.visible)return;const d=Math.hypot(bPlayer.x-k.position.x,bPlayer.z-k.position.z);if(d<1.2){k.visible=false;collected++;document.getElementById('keysText').textContent=collected+' / 4';if(collected===4)exitDoor.material.color.set(0x185d20)}})}
function toggleCloset3D(){if(hidden){hidden=false;document.getElementById('hiddenMessage').style.opacity=0;return}let best=null,bd=999;for(const c of closets){const d=Math.hypot(bPlayer.x-c.x,bPlayer.z-c.z);if(d<bd){bd=d;best=c}}if(best&&bd<2.4){hidden=true;document.getElementById('hiddenMessage').style.opacity=1}}
function moveWolf3D(dt){if(hidden)return;const dx=bPlayer.x-wolf3D.position.x,dz=bPlayer.z-wolf3D.position.z,d=Math.hypot(dx,dz);if(d>1.25){wolf3D.position.x+=dx/d*1.9*dt;wolf3D.position.z+=dz/d*1.9*dt;wolf3D.lookAt(bPlayer.x,1,bPlayer.z)}if(d<1.1)finish('ТЫ ПОПАЛАСЬ','Волк догнал тебя в подвале.')}
function checkExit3D(){if(collected<4)return;const d=Math.hypot(bPlayer.x,bPlayer.z+17);if(d<2.2)finish('ТЫ СБЕЖАЛА','Ты нашла все четыре ключа и выбралась из подвала.')}
function basementLoop(now){if(!bRunning)return;const dt=Math.min(.05,(now-lastTime)/1000||.016);lastTime=now;moveBasement(dt);collectKeys3D();moveWolf3D(dt);checkExit3D();camera.position.set(bPlayer.x,bPlayer.y,bPlayer.z);camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;flashlight.position.copy(camera.position);flashlight.target.position.set(bPlayer.x-Math.sin(yaw)*5,bPlayer.y-Math.sin(pitch)*2,bPlayer.z-Math.cos(yaw)*5);document.getElementById('staminaBar').style.width=stamina+'%';renderer.render(scene,camera);requestAnimationFrame(basementLoop)}
function resize3D(){if(!camera||!renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
function finish(title,text){if(gameEnded)return;gameEnded=true;bRunning=false;if(renderer)renderer.setAnimationLoop(null);document.exitPointerLock?.();document.getElementById('endingTitle').textContent=title;document.getElementById('endingText').textContent=text;document.getElementById('ending').style.display='flex'}
