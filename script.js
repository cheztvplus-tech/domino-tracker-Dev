// ================= GAME STATE =================
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

// Board chain (ordered tiles)
let boardChain = [];

// ================= ELEMENTS =================
const handDropdownsDiv = document.getElementById("hand-dropdowns");
const setHandBtn = document.getElementById("set-hand-btn");
const handSelectionDiv = document.getElementById("hand-selection");
const myHandButtonsDiv = document.getElementById("my-hand-buttons");
const playedDropdown = document.getElementById("played-domino");
const playerSelect = document.getElementById("player-select");
const addPlayBtn = document.getElementById("add-play-btn");
const passBtn = document.getElementById("pass-btn");
const passNumber1Select = document.getElementById("pass-number1");
const passNumber2Select = document.getElementById("pass-number2");
const rpTilesSpan = document.getElementById("rp-tiles");
const mpTilesSpan = document.getElementById("mp-tiles");
const lpTilesSpan = document.getElementById("lp-tiles");
const playedLogUl = document.getElementById("played-log");
const passesLogUl = document.getElementById("passes-log");
const bgSelect = document.getElementById("bg-theme");
const dominoSelect = document.getElementById("domino-theme");
const clearHandBtn = document.getElementById("clear-hand-btn");
const boardDiv = document.getElementById("domino-board");

playerSelect.addEventListener("change", syncRotationWithSelect);

// ================= FETCH SETS =================
fetch("sets.json")
.then(res => res.json())
.then(data => {
  allDominoes = data.dominoes;
  themes = data.themes;
  defaultBackground = data.defaultBackground;
  currentTileFolder = data.defaultDomino;

  Object.keys(themes).forEach(t=>{
    const opt=document.createElement("option");
    opt.value=t;
    opt.text=t;
    bgSelect.appendChild(opt);
  });

  bgSelect.value = defaultBackground;

  [
    "tiles-white b",
    "tiles-black",
    "tiles-white",
    "tiles-green",
    "tiles-purple",
    "tiles-red",
    "tiles-neon"
  ].forEach(t=>{
    const opt=document.createElement("option");
    opt.value=t;
    opt.text=t;
    dominoSelect.appendChild(opt);
  });

  currentTileFolder="tiles-white b";
  dominoSelect.value=currentTileFolder;

  [passNumber1Select,passNumber2Select].forEach(sel=>{
    sel.innerHTML="";
    const blank=document.createElement("option");
    blank.value="";
    blank.text="—";
    sel.appendChild(blank);

    for(let i=0;i<=6;i++){
      const o=document.createElement("option");
      o.value=i;
      o.text=i;
      sel.appendChild(o);
    }
  });

  initHandDropdowns();
});

// ================= THEMES =================
bgSelect.addEventListener("change",e=>{});
dominoSelect.addEventListener("change",e=>{
  currentTileFolder=e.target.value;
  renderMyHandButtons();
  updatePlayedLog();
  updatePassesLog();
  renderBoard();
  if(handIsSet) updatePredictions();
});

// ================= HAND SETUP =================
function initHandDropdowns(){
  handDropdownsDiv.innerHTML="";
  for(let i=0;i<7;i++){
    const sel=document.createElement("select");
    sel.id=`hand-select-${i}`;
    sel.addEventListener("change",updateHandDropdowns);

    const def=document.createElement("option");
    def.value="";
    def.text=`Select Tile ${i+1}`;
    sel.appendChild(def);

    allDominoes.forEach(t=>{
      const o=document.createElement("option");
      o.value=t;
      o.text=t;
      sel.appendChild(o);
    });

    handDropdownsDiv.appendChild(sel);
    handDropdownsDiv.appendChild(document.createElement("br"));
  }
}

function updateHandDropdowns(){
  const chosen=new Set();
  for(let i=0;i<7;i++){
    const v=document.getElementById(`hand-select-${i}`).value;
    if(v) chosen.add(v);
  }

  for(let i=0;i<7;i++){
    const sel=document.getElementById(`hand-select-${i}`);
    const current=sel.value;
    sel.innerHTML=`<option value="">Select Tile ${i+1}</option>`;

    allDominoes.forEach(t=>{
      if(!chosen.has(t)||t===current){
        const o=document.createElement("option");
        o.value=t;
        o.text=t;
        if(t===current) o.selected=true;
        sel.appendChild(o);
      }
    });
  }
}

// ================= SET HAND =================
setHandBtn.onclick=()=>{
  myHand=[];
  const seen=new Set();

  for(let i=0;i<7;i++){
    const v=document.getElementById(`hand-select-${i}`).value;
    if(!v){ alert("Select all 7 tiles"); return; }
    if(seen.has(v)){ alert("Duplicate tile"); return; }
    seen.add(v);
    myHand.push(v);
  }

  handIsSet=true;
  handSelectionDiv.style.display="none";

  renderMyHandButtons();
  refreshPlayedDropdown();
  updatePredictions();
  syncRotationWithSelect();
};

// ================= CLEAR =================
clearHandBtn.onclick=()=>{
  myHand=[];
  playedDominoes=[];
  boardChain=[];
  passes={RP:new Set(),MP:new Set(),LP:new Set()};
  handIsSet=false;

  handSelectionDiv.style.display="block";
  initHandDropdowns();
  myHandButtonsDiv.innerHTML="";
  boardDiv.innerHTML="";
  playedLogUl.innerHTML="";
  passesLogUl.innerHTML="";
};

// ================= MY HAND =================
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
  updatePredictions();
  updatePlayedLog();
}

// ================= BOARD LOGIC =================
function pushToBoard(tile){
  const [a,b]=tile.split("|").map(Number);
  boardChain.push({left:a,right:b});
  renderBoard();
}

function renderBoard(){
  boardDiv.innerHTML="";
  boardChain.forEach(d=>{
    const img=document.createElement("img");
    img.src=`${currentTileFolder}/${d.left}-${d.right}.png`;
    img.className="board-domino";

    // Only doubles vertical
    if(d.left===d.right){
      img.style.transform="rotate(90deg)";
    }else{
      img.style.transform="rotate(0deg)";
    }

    boardDiv.appendChild(img);
  });
}

// ================= PLAYED DROPDOWN =================
function refreshPlayedDropdown(){
  const used=new Set([...myHand,...playedDominoes.map(d=>d.domino)]);
  playedDropdown.innerHTML="<option value=''>Select Tile</option>";

  allDominoes.forEach(t=>{
    if(!used.has(t)){
      const o=document.createElement("option");
      o.value=t;
      o.text=t;
      playedDropdown.appendChild(o);
    }
  });
}

// ================= OPPONENT PLAY =================
addPlayBtn.onclick=()=>{
  if(!playedDropdown.value){alert("Select tile");return;}
  const tile=playedDropdown.value;
  playedDominoes.push({domino:tile,player:playerSelect.value});
  pushToBoard(tile);
  refreshPlayedDropdown();
  updatePredictions();
  updatePlayedLog();
  nextTurn();
};

// ================= PASSES =================
passBtn.onclick=()=>{
  const p=playerSelect.value;
  const nums=[];

  if(passNumber1Select.value){
    const n=+passNumber1Select.value;
    passes[p].add(n);
    nums.push(n);
  }
  if(passNumber2Select.value){
    const n=+passNumber2Select.value;
    passes[p].add(n);
    nums.push(n);
  }

  passesLogUl.dataset.log=passesLogUl.dataset.log||"[]";
  const log=JSON.parse(passesLogUl.dataset.log);
  log.push({player:p,nums});
  passesLogUl.dataset.log=JSON.stringify(log);

  updatePassesLog();
  passNumber1Select.value="";
  passNumber2Select.value="";
  updatePredictions();
  nextTurn();
};

function updatePassesLog(){
  passesLogUl.innerHTML="";
  const log=JSON.parse(passesLogUl.dataset.log||"[]");
  log.forEach((e,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`${i+1}. ${e.player} passed ${e.nums.join(", ")}`;
    passesLogUl.appendChild(li);
  });
}

// ================= PREDICTIONS =================
function updatePredictions(){
  if(!handIsSet) return;
  const used=new Set([...myHand,...playedDominoes.map(d=>d.domino)]);
  let available=allDominoes.filter(t=>!used.has(t));

  const tilesLeft={RP:7,MP:7,LP:7};
  playedDominoes.forEach(d=>{
    if(d.player!=="ME") tilesLeft[d.player]--;
  });

  const pred={RP:[],MP:[],LP:[]};
  ["RP","MP","LP"].forEach(p=>{
    let pool=[...available].sort(()=>Math.random()-0.5);
    while(pred[p].length<tilesLeft[p]&&pool.length){
      const t=pool.shift();
      pred[p].push(t);
      available=available.filter(x=>x!==t);
    }
  });

  rpTilesSpan.innerHTML=pred.RP.map(img).join("");
  mpTilesSpan.innerHTML=pred.MP.map(img).join("");
  lpTilesSpan.innerHTML=pred.LP.map(img).join("");
}

const img=t=>`<img src="${currentTileFolder}/${t.replace("|","-")}.png" width="40">`;

// ================= PLAYED LOG =================
function updatePlayedLog(){
  playedLogUl.innerHTML="";
  playedDominoes.forEach((d,i)=>{
    const li=document.createElement("li");
    li.innerHTML=`${i+1}. ${d.player} <img src="${currentTileFolder}/${d.domino.replace("|","-")}.png" height="40">`;
    playedLogUl.appendChild(li);
  });
}

// ================= ROTATION =================
function syncRotationWithSelect(){
  currentRotationIndex=playerRotation.indexOf(playerSelect.value);
}
function nextTurn(){
  currentRotationIndex=(currentRotationIndex+1)%3;
  playerSelect.value=playerRotation[currentRotationIndex];
}

// ================= SERVICE WORKER =================
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("service-worker.js");
}

// ================= INSTALL =================
let deferredPrompt;
const installBtn=document.getElementById("install-btn");
const iosHint=document.getElementById("ios-hint");

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();
  deferredPrompt=e;
  installBtn.style.display="inline-block";
});

installBtn.onclick=async()=>{
  if(deferredPrompt){
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null;
    installBtn.style.display="none";
  }
};

const isIos=()=>/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
const isStandalone=()=>window.navigator.standalone;
if(isIos()&&!isStandalone()) iosHint.style.display="block";
