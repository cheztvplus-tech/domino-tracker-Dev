// ======= Game State =======
let allDominoes = [];
let themes = {};
let currentTileFolder = "";
let defaultBackground = "";
let myHand = [];
let playedDominoes = [];
let passes = { RP:new Set(), MP:new Set(), LP:new Set() };
const playerRotation = ["RP","MP","LP"];
let currentRotationIndex = 0;
let handIsSet = false;

// 🔥 Board chain stores oriented tiles
let boardChain = [];

// ======= Elements =======
const handDropdownsDiv = document.getElementById('hand-dropdowns');
const setHandBtn = document.getElementById('set-hand-btn');
const handSelectionDiv = document.getElementById('hand-selection');
const myHandButtonsDiv = document.getElementById('my-hand-buttons');
const playedDropdown = document.getElementById('played-domino');
const playerSelect = document.getElementById('player-select');
const addPlayBtn = document.getElementById('add-play-btn');
const passBtn = document.getElementById('pass-btn');
const passNumber1Select = document.getElementById('pass-number1');
const passNumber2Select = document.getElementById('pass-number2');
const rpTilesSpan = document.getElementById('rp-tiles');
const mpTilesSpan = document.getElementById('mp-tiles');
const lpTilesSpan = document.getElementById('lp-tiles');
const playedLogUl = document.getElementById('played-log');
const passesLogUl = document.getElementById('passes-log');
const bgSelect = document.getElementById("bg-theme");
const dominoSelect = document.getElementById("domino-theme");
const clearHandBtn = document.getElementById('clear-hand-btn');
const boardDiv = document.getElementById("domino-board");

// Keep rotation synced
playerSelect.addEventListener("change", syncRotationWithSelect);

// ======= Fetch sets.json =======
fetch("sets.json")
.then(res=>res.json())
.then(data=>{
  allDominoes=data.dominoes;
  themes=data.themes;
  defaultBackground=data.defaultBackground;
  currentTileFolder=data.defaultDomino;

  Object.keys(themes).forEach(t=>{
    const opt=document.createElement("option");
    opt.value=t;
    opt.text=t==="woodbrown"?"Brown":t.charAt(0).toUpperCase()+t.slice(1);
    bgSelect.appendChild(opt);
  });

  bgSelect.value=defaultBackground;
  applyBackground(defaultBackground);

  ["tiles-white b","tiles-black","tiles-white","tiles-green","tiles-purple","tiles-red","tiles-neon"]
  .forEach(t=>{
    const opt=document.createElement("option");
    opt.value=t;
    opt.text=(t==="tiles-white b")?"White W/Border":t.split("-")[1];
    dominoSelect.appendChild(opt);
  });

  dominoSelect.value=currentTileFolder;
  initHandDropdowns();
});

// ======= Themes =======
bgSelect.onchange=e=>applyBackground(e.target.value);
dominoSelect.onchange=e=>{
  currentTileFolder=e.target.value;
  renderMyHandButtons();
  updatePlayedLog();
  updatePassesLog();
  renderBoard();
};

function applyBackground(bg){
  document.body.style.background=themes[bg];
  const c=bg==="white"?"#000":"#fff";
  document.body.style.color=c;
}

// ======= Hand Setup =======
function initHandDropdowns(){
  handDropdownsDiv.innerHTML="";
  for(let i=0;i<7;i++){
    const s=document.createElement("select");
    s.id=`hand-${i}`;
    s.innerHTML=`<option value="">Select Tile ${i+1}</option>`;
    allDominoes.forEach(t=>{
      const o=document.createElement("option");
      o.value=t;o.text=t;
      s.appendChild(o);
    });
    handDropdownsDiv.appendChild(s);
    handDropdownsDiv.appendChild(document.createElement("br"));
  }
}

setHandBtn.onclick=()=>{
  myHand=[];
  for(let i=0;i<7;i++){
    const v=document.getElementById(`hand-${i}`).value;
    if(!v){ alert("Select all 7 tiles"); return; }
    myHand.push(v);
  }
  handSelectionDiv.style.display="none";
  handIsSet=true;
  renderMyHandButtons();
  refreshPlayedDropdown();
};

// ======= My Hand =======
function renderMyHandButtons(){
  myHandButtonsDiv.innerHTML="";
  myHand.forEach(t=>{
    const b=document.createElement("button");
    b.innerHTML=`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="50">`;
    b.onclick=()=>playMyTile(t);
    myHandButtonsDiv.appendChild(b);
  });
}

function playMyTile(tile){
  playedDominoes.push({domino:tile,player:"ME"});
  pushToBoard(tile);
  myHand=myHand.filter(x=>x!==tile);
  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePlayedLog();
}

// ======= Board Logic =======
function pushToBoard(tile){
  const [a,b]=tile.split("|").map(Number);

  if(boardChain.length===0){
    boardChain.push({left:a,right:b});
  }else{
    const last=boardChain[boardChain.length-1];

    if(last.right===a) boardChain.push({left:a,right:b});
    else if(last.right===b) boardChain.push({left:b,right:a});
    else boardChain.push({left:a,right:b});
  }
  renderBoard();
}

function renderBoard(){
  boardDiv.innerHTML="";
  boardChain.forEach(d=>{
    const img=document.createElement("img");
    img.src=`${currentTileFolder}/${d.left}-${d.right}.png`;
    img.className="board-domino";
    if(d.left===d.right) img.style.transform="rotate(90deg)";
    boardDiv.appendChild(img);
  });
}

// ======= Played Dropdown =======
function refreshPlayedDropdown(){
  const used=new Set([...myHand,...playedDominoes.map(d=>d.domino)]);
  playedDropdown.innerHTML="<option value=''>Select Tile</option>";
  allDominoes.forEach(t=>{
    if(!used.has(t)){
      const o=document.createElement("option");
      o.value=t;o.text=t;
      playedDropdown.appendChild(o);
    }
  });
}

// ======= Opponent Play =======
addPlayBtn.onclick=()=>{
  if(!playedDropdown.value) return alert("Select tile");
  const t=playedDropdown.value;
  playedDominoes.push({domino:t,player:playerSelect.value});
  pushToBoard(t);
  refreshPlayedDropdown();
  updatePlayedLog();
  nextTurn();
};

// ======= Played Log =======
function updatePlayedLog(){
  playedLogUl.innerHTML="";
  playedDominoes.forEach((d,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`${i+1}. ${d.player} <img src="${currentTileFolder}/${d.domino.replace("|","-")}.png" height="40">`;
    playedLogUl.appendChild(li);
  });
}

// ======= Rotation =======
function syncRotationWithSelect(){
  currentRotationIndex=playerRotation.indexOf(playerSelect.value);
}
function nextTurn(){
  currentRotationIndex=(currentRotationIndex+1)%3;
  playerSelect.value=playerRotation[currentRotationIndex];
}

// ======= Service Worker =======
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js");
}
