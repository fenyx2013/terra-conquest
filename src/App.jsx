import { useState, useEffect, useRef } from "react";

const SB_URL="https://yvgwtzjlchcjxoiquetg.supabase.co";
const SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z3d0empsY2hjanhvaXF1ZXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTM2NjgsImV4cCI6MjA4ODM2OTY2OH0.cglCteLErmG23ryVVwVvYir_s4OroeRg9GdmNiurQ8c";
const sb={
  from:(table)=>({
    select:(cols)=>({
      eq:(col,val)=>({
        single:()=>fetch(SB_URL+"/rest/v1/"+table+"?"+col+"=eq."+val+"&select="+(cols||"*"),{headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY}}).then(r=>r.json()).then(d=>({data:Array.isArray(d)?d[0]:d,error:null})).catch(e=>({data:null,error:e}))
      })
    }),
    upsert:(data,opts)=>fetch(SB_URL+"/rest/v1/"+table,{method:"POST",headers:{"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(data)}).then(r=>({error:r.ok?null:{message:"HTTP "+r.status}})).catch(e=>({error:e}))
  })
};

const CLRS=[
  {bg:"#dc2626",light:"#fca5a5",name:"Red"},
  {bg:"#2563eb",light:"#93c5fd",name:"Blue"},
  {bg:"#16a34a",light:"#86efac",name:"Green"},
  {bg:"#d97706",light:"#fcd34d",name:"Gold"},
  {bg:"#7c3aed",light:"#c4b5fd",name:"Purple"},
  {bg:"#0891b2",light:"#67e8f9",name:"Cyan"},
  {bg:"#db2777",light:"#f9a8d4",name:"Pink"},
  {bg:"#65a30d",light:"#bef264",name:"Lime"},
];

const DMG={tank:0.5,bomb:2,plane:3,missile:6,bomber:10};
const DAILY_REWARD=3000;
const COIN_FACTORY_YIELD=5;
const COIN_FACTORY_INTERVAL_MS=1000;
const BOT_NAMES=["BotAlpha","BotBeta","BotGamma","BotDelta"];

const SHOP_ITEMS=[
  {id:"tank",    label:"Tank",    desc:"Basic ground unit. Cheap & reliable.",  price:120,  dmg:DMG.tank,    color:"#f59e0b"},
  {id:"bomb",    label:"Bomb",    desc:"Explosive. High damage.",               price:200,  dmg:DMG.bomb,    color:"#ef4444"},
  {id:"plane",   label:"Plane",   desc:"Air unit. Extends attack radius to 3.", price:350,  dmg:DMG.plane,   color:"#3b82f6"},
  {id:"missile", label:"Missile", desc:"Ballistic strike. Very high damage.",   price:500,  dmg:DMG.missile, color:"#f97316"},
  {id:"bomber",  label:"Bomber",  desc:"Carpet bomb. Highest damage.",          price:1200, dmg:DMG.bomber,  color:"#dc2626"},
  {id:"air_def", label:"Air Def", desc:"Reduces enemy win chance by 5% each.", price:300,  dmg:0,           color:"#6366f1"},
  {id:"spy",     label:"Spy",     desc:"Adds +1% win chance to next attack.",   price:400,  dmg:0,           color:"#10b981"},
];

const MATERIALS=[
  {id:"wood",  label:"Wood",  color:"#84cc16"},
  {id:"stone", label:"Stone", color:"#94a3b8"},
  {id:"iron",  label:"Iron",  color:"#6b7280"},
  {id:"gold",  label:"Gold",  color:"#f59e0b"},
];

const BUILDINGS=[
  {id:"barracks",    label:"Barracks",    desc:"Discounts Tanks by 20% per barracks.",    max:3, cost:{wood:3,stone:2},      color:"#f59e0b"},
  {id:"airbase",     label:"Air Base",    desc:"Discounts Planes by 15% per airbase.",    max:2, cost:{stone:3,iron:2},      color:"#3b82f6"},
  {id:"coin_factory",label:"Coin Factory",desc:"Earns "+COIN_FACTORY_YIELD+" coins/sec.", max:5, cost:{iron:3,stone:2},      color:"#10b981"},
  {id:"vault",       label:"Gold Vault",  desc:"+500 daily reward. +2 coins/sec/factory.",max:3, cost:{gold:2,iron:3},       color:"#f59e0b"},
  {id:"spy_academy", label:"Spy Academy", desc:"Trains 1 spy every 20 min.",              max:1, cost:{wood:4,gold:1},       color:"#10b981"},
  {id:"watchtower",  label:"Watchtower",  desc:"See attacker weapon counts.",             max:1, cost:{wood:5,stone:3},      color:"#6366f1"},
  {id:"embassy",     label:"Embassy",     desc:"+5% win chance when attacking.",          max:1, cost:{gold:3,stone:4},      color:"#f97316"},
];

const ALL_MISSIONS=[
  {id:"m_win",     stat:"wins",         goal:1,  label:"Win 1 battle",          xp:50,  coins:500},
  {id:"m_conq5",   stat:"conquests",    goal:5,  label:"Conquer 5 territories", xp:75,  coins:800},
  {id:"m_coins",   stat:"coinsEarned",  goal:5000,label:"Earn 5,000 coins",     xp:60,  coins:600},
  {id:"m_build",   stat:"builds",       goal:2,  label:"Build 2 structures",    xp:80,  coins:700},
  {id:"m_buy3",    stat:"weaponsBought",goal:3,  label:"Buy 3 weapons",         xp:50,  coins:500},
  {id:"m_bomber",  stat:"bombersUsed",  goal:1,  label:"Use a Bomber",          xp:100, coins:1000},
  {id:"m_spy",     stat:"spiesUsed",    goal:1,  label:"Use a Spy",             xp:80,  coins:800},
];

const TERRA_PASS=[
  {level:1,  xpNeeded:0,    label:"Rookie",      reward:null},
  {level:2,  xpNeeded:100,  label:"Scout",       reward:{type:"coins",  amount:500}},
  {level:3,  xpNeeded:250,  label:"Soldier",     reward:{type:"bomb",   amount:3}},
  {level:4,  xpNeeded:500,  label:"Sergeant",    reward:{type:"coins",  amount:1000}},
  {level:5,  xpNeeded:900,  label:"Lieutenant",  reward:{type:"missile",amount:2}},
  {level:6,  xpNeeded:1400, label:"Captain",     reward:{type:"gold",   amount:2}},
  {level:7,  xpNeeded:2000, label:"Major",       reward:{type:"coins",  amount:3000}},
  {level:8,  xpNeeded:2800, label:"Colonel",     reward:{type:"bomber", amount:1}},
  {level:9,  xpNeeded:3800, label:"General",     reward:{type:"iron",   amount:5}},
  {level:10, xpNeeded:5000, label:"Commander",   reward:{type:"coins",  amount:10000}},
];

const ACHIEVEMENTS=[
  {id:"first_blood", name:"First Blood",   desc:"Win your first battle",         xp:100,  emoji:"\uD83C\uDF96"},
  {id:"conqueror5",  name:"Expansionist",  desc:"Own 5 territories",             xp:75,   emoji:"\uD83C\uDFAF"},
  {id:"conqueror20", name:"Conqueror",     desc:"Own 20 territories",            xp:150,  emoji:"\uD83C\uDDEE\uD83C\uDDF9"},
  {id:"conqueror50", name:"World Dominator",desc:"Own 50 territories",           xp:400,  emoji:"\uD83C\uDF0D"},
  {id:"rich",        name:"Filthy Rich",   desc:"Have 10,000 coins",             xp:100,  emoji:"\uD83D\uDCB0"},
  {id:"weapons10",   name:"Arms Dealer",   desc:"Buy 10 weapons",                xp:75,   emoji:"\uD83D\uDD2B"},
  {id:"builder",     name:"Builder",       desc:"Build any structure",           xp:75,   emoji:"\uD83C\uDFD7"},
  {id:"factory3",    name:"Industrialist", desc:"Own 3 Coin Factories",          xp:150,  emoji:"\uD83C\uDFED"},
  {id:"spy_used",    name:"Shadow Ops",    desc:"Use a spy in battle",           xp:100,  emoji:"\uD83D\uDD75"},
  {id:"bomber_used", name:"Carpet Bomb",   desc:"Use a bomber in battle",        xp:150,  emoji:"\uD83D\uDCA5"},
  {id:"daily7",      name:"Loyal Player",  desc:"Claim 7 daily rewards",        xp:200,  emoji:"\uD83D\uDCC5"},
  {id:"survived",    name:"Survivor",      desc:"Own territories after 1 hour",  xp:200,  emoji:"\uD83D\uDC9A"},
];

function todayStr(){return new Date().toISOString().slice(0,10);}

function getTodayMissions(){
  const day=Math.floor(Date.now()/86400000);
  const a=day%ALL_MISSIONS.length;
  const b=(day+1)%ALL_MISSIONS.length;
  const c=(day+2)%ALL_MISSIONS.length;
  return [ALL_MISSIONS[a],ALL_MISSIONS[b],ALL_MISSIONS[c]];
}

function rndName(){
  const adj=["Bold","Swift","Iron","Brave","Dark","Gold","Storm","Fire"];
  const noun=["Wolf","Eagle","Bear","Lion","Fox","Hawk","Tiger","Drake"];
  return adj[Math.floor(Math.random()*8)]+noun[Math.floor(Math.random()*8)]+Math.floor(Math.random()*99+1);
}

function calcDamage(tank,bomb,plane,missile,bomber){
  return Math.round((tank*DMG.tank+bomb*DMG.bomb+plane*DMG.plane+missile*DMG.missile+bomber*DMG.bomber)*10)/10;
}

function calcWinChance(area,damage,spyCount,academySpies,airDef){
  const base=Math.min(0.95,damage/(area*0.8));
  const spyBonus=(spyCount+academySpies)*0.01;
  const defPenalty=airDef*0.05;
  return Math.max(0.02,Math.min(0.97,base+spyBonus-defPenalty));
}

const COUNTRIES=[
  {id:"usa",name:"USA",area:98,lx:215,ly:285,borders:["canada","mexico","cuba"],d:"M72,188 L285,185 L298,222 L290,268 L255,295 L198,308 L148,298 L88,278 L62,245 Z"},
  {id:"canada",name:"Canada",area:128,lx:195,ly:155,borders:["usa","greenland"],d:"M55,88 L322,82 L335,148 L298,175 L72,178 L48,145 Z"},
  {id:"mexico",name:"Mexico",area:28,lx:185,ly:345,borders:["usa","cuba","colombia"],d:"M88,302 L255,298 L265,335 L252,368 L215,382 L165,378 L118,358 L95,328 Z"},
  {id:"cuba",name:"Cuba",area:8,lx:262,ly:355,borders:["usa","mexico","colombia"],d:"M248,338 L298,335 L305,355 L292,372 L255,375 L242,358 Z"},
  {id:"greenland",name:"Greenland",area:38,lx:368,ly:82,borders:["canada","iceland"],d:"M328,38 L435,32 L448,72 L435,108 L388,118 L342,108 L322,78 Z"},
  {id:"iceland",name:"Iceland",area:8,lx:515,ly:88,borders:["greenland","uk"],d:"M495,68 L548,65 L555,88 L542,108 L505,112 L488,92 Z"},
  {id:"colombia",name:"Colombia",area:18,lx:215,ly:425,borders:["mexico","cuba","venezuela","brazil","peru"],d:"M162,398 L268,395 L278,428 L265,458 L228,465 L182,458 L165,432 Z"},
  {id:"venezuela",name:"Venezuela",area:14,lx:278,ly:415,borders:["colombia","brazil","guyana"],d:"M262,392 L322,388 L332,415 L318,442 L282,448 L258,432 Z"},
  {id:"guyana",name:"Guyana",area:10,lx:322,ly:418,borders:["venezuela","brazil"],d:"M318,395 L365,392 L372,418 L358,442 L322,448 L312,428 Z"},
  {id:"brazil",name:"Brazil",area:88,lx:298,ly:498,borders:["colombia","venezuela","guyana","peru","bolivia","paraguay","argentina","uruguay"],d:"M168,452 L382,448 L395,498 L385,558 L348,598 L298,618 L245,612 L195,582 L168,535 Z"},
  {id:"peru",name:"Peru",area:22,lx:205,ly:478,borders:["colombia","brazil","bolivia","chile"],d:"M162,448 L242,445 L252,478 L238,515 L202,522 L168,512 L155,482 Z"},
  {id:"bolivia",name:"Bolivia",area:14,lx:248,ly:528,borders:["peru","brazil","paraguay","chile","argentina"],d:"M228,508 L288,505 L298,535 L285,565 L248,572 L222,558 L215,532 Z"},
  {id:"chile",name:"Chile",area:18,lx:218,ly:588,borders:["peru","bolivia","argentina"],d:"M178,558 L248,555 L255,638 L238,688 L202,698 L175,678 L165,618 Z"},
  {id:"paraguay",name:"Paraguay",area:10,lx:275,ly:575,borders:["brazil","bolivia","argentina"],d:"M255,552 L308,548 L315,575 L302,602 L265,608 L248,582 Z"},
  {id:"argentina",name:"Argentina",area:38,lx:258,ly:648,borders:["chile","bolivia","paraguay","brazil","uruguay"],d:"M188,612 L322,608 L332,648 L318,718 L275,745 L238,748 L198,725 L178,678 Z"},
  {id:"uruguay",name:"Uruguay",area:8,lx:315,ly:638,borders:["brazil","argentina"],d:"M298,618 L348,615 L355,638 L342,658 L305,662 L292,642 Z"},
  {id:"uk",name:"UK",area:10,lx:548,ly:165,borders:["iceland","france","ireland"],d:"M528,145 L578,142 L585,165 L572,188 L535,192 L518,172 Z"},
  {id:"ireland",name:"Ireland",area:6,lx:508,ly:162,borders:["uk"],d:"M492,145 L532,142 L538,165 L525,182 L495,185 L482,168 Z"},
  {id:"france",name:"France",area:18,lx:562,ly:218,borders:["uk","spain","germany","italy","switzerland"],d:"M528,195 L605,192 L612,222 L598,252 L562,258 L528,248 L518,225 Z"},
  {id:"spain",name:"Spain",area:18,lx:535,ly:262,borders:["france","portugal","morocco"],d:"M498,248 L608,245 L615,275 L602,305 L558,312 L512,305 L495,278 Z"},
  {id:"portugal",name:"Portugal",area:8,lx:502,ly:282,borders:["spain"],d:"M488,262 L518,258 L525,285 L512,308 L482,312 L472,288 Z"},
  {id:"germany",name:"Germany",area:14,lx:608,ly:192,borders:["france","netherlands","poland","austria","switzerland","denmark"],d:"M595,172 L658,168 L665,198 L652,228 L608,235 L582,225 L578,198 Z"},
  {id:"netherlands",name:"Netherlands",area:6,lx:608,ly:158,borders:["germany","belgium"],d:"M592,148 L638,145 L645,168 L632,182 L598,185 L582,168 Z"},
  {id:"belgium",name:"Belgium",area:6,lx:595,ly:188,borders:["netherlands","france","germany","luxembourg"],d:"M578,172 L628,168 L635,192 L622,208 L588,212 L572,195 Z"},
  {id:"luxembourg",name:"Luxembourg",area:2,lx:615,ly:208,borders:["belgium","france","germany"],d:"M608,198 L628,195 L632,215 L618,225 L602,218 Z"},
  {id:"switzerland",name:"Switzerland",area:6,lx:618,ly:228,borders:["france","germany","austria","italy"],d:"M602,215 L655,212 L662,235 L648,252 L612,255 L595,238 Z"},
  {id:"austria",name:"Austria",area:8,lx:652,ly:215,borders:["germany","switzerland","italy","hungary","czech"],d:"M638,198 L698,195 L705,218 L692,242 L648,248 L625,232 Z"},
  {id:"czech",name:"Czech",area:8,lx:658,ly:188,borders:["germany","austria","poland","slovakia"],d:"M638,172 L702,168 L708,192 L695,212 L652,218 L632,202 Z"},
  {id:"poland",name:"Poland",area:18,lx:672,ly:165,borders:["germany","czech","slovakia","ukraine","belarus","russia"],d:"M648,148 L722,145 L728,175 L715,205 L672,212 L642,202 L638,175 Z"},
  {id:"slovakia",name:"Slovakia",area:6,lx:695,ly:208,borders:["czech","austria","hungary","poland","ukraine"],d:"M678,195 L738,192 L742,215 L728,232 L688,235 L672,218 Z"},
  {id:"hungary",name:"Hungary",area:10,lx:678,ly:235,borders:["austria","slovakia","romania","croatia","serbia"],d:"M648,218 L718,215 L725,242 L712,265 L668,272 L642,258 Z"},
  {id:"romania",name:"Romania",area:18,lx:718,ly:232,borders:["hungary","ukraine","moldova","bulgaria","serbia"],d:"M708,212 L778,208 L785,238 L772,268 L728,275 L705,258 Z"},
  {id:"moldova",name:"Moldova",area:4,lx:755,ly:228,borders:["romania","ukraine"],d:"M742,212 L778,208 L782,232 L768,248 L745,245 Z"},
  {id:"ukraine",name:"Ukraine",area:38,lx:748,ly:188,borders:["poland","belarus","russia","romania","moldova","slovakia","hungary"],d:"M718,155 L808,152 L818,188 L808,228 L768,235 L725,228 L708,198 Z"},
  {id:"belarus",name:"Belarus",area:10,lx:742,ly:158,borders:["poland","ukraine","russia","lithuania","latvia"],d:"M718,138 L798,135 L805,162 L792,182 L748,188 L718,175 Z"},
  {id:"lithuania",name:"Lithuania",area:6,lx:722,ly:138,borders:["belarus","latvia","poland","russia"],d:"M705,122 L758,118 L762,142 L748,158 L715,162 L698,145 Z"},
  {id:"latvia",name:"Latvia",area:6,lx:742,ly:118,borders:["lithuania","belarus","estonia","russia"],d:"M722,102 L778,98 L782,122 L768,138 L725,142 L708,125 Z"},
  {id:"estonia",name:"Estonia",area:4,lx:752,ly:98,borders:["latvia","russia","finland"],d:"M735,82 L782,78 L785,102 L772,118 L738,122 L722,105 Z"},
  {id:"finland",name:"Finland",area:18,lx:742,ly:68,borders:["norway","sweden","russia","estonia"],d:"M708,38 L792,35 L798,78 L782,102 L745,108 L712,95 Z"},
  {id:"norway",name:"Norway",area:18,lx:652,ly:72,borders:["sweden","finland","russia"],d:"M618,38 L718,35 L722,78 L708,95 L662,102 L622,88 Z"},
  {id:"sweden",name:"Sweden",area:18,lx:685,ly:85,borders:["norway","finland","denmark"],d:"M655,52 L728,48 L735,92 L718,108 L675,115 L648,102 L645,72 Z"},
  {id:"denmark",name:"Denmark",area:6,lx:648,ly:148,borders:["germany","sweden","norway"],d:"M628,132 L678,128 L682,152 L668,168 L632,172 L618,155 Z"},
  {id:"italy",name:"Italy",area:18,lx:638,ly:275,borders:["france","switzerland","austria","croatia"],d:"M608,255 L668,252 L672,285 L658,322 L618,345 L585,338 L572,305 L582,268 Z"},
  {id:"croatia",name:"Croatia",area:8,lx:668,ly:268,borders:["italy","hungary","serbia","bosnia"],d:"M648,252 L712,248 L718,272 L705,295 L662,302 L638,285 Z"},
  {id:"bosnia",name:"Bosnia",area:6,lx:672,ly:295,borders:["croatia","serbia","montenegro"],d:"M655,278 L712,275 L718,298 L705,318 L665,322 L648,305 Z"},
  {id:"serbia",name:"Serbia",area:6,lx:700,ly:278,borders:["hungary","romania","bulgaria","north_macedonia","croatia","bosnia","montenegro","kosovo"],d:"M682,258 L738,255 L745,282 L732,308 L692,315 L668,298 Z"},
  {id:"montenegro",name:"Montenegro",area:4,lx:675,ly:318,borders:["bosnia","serbia","albania","kosovo"],d:"M658,305 L712,302 L715,325 L702,342 L665,345 L652,328 Z"},
  {id:"kosovo",name:"Kosovo",area:2,lx:702,ly:315,borders:["serbia","north_macedonia","albania","montenegro"],d:"M688,298 L738,295 L742,318 L728,335 L692,338 L678,322 Z"},
  {id:"albania",name:"Albania",area:4,lx:692,ly:338,borders:["montenegro","kosovo","north_macedonia","greece"],d:"M675,322 L722,318 L728,342 L715,362 L678,365 L665,345 Z"},
  {id:"north_macedonia",name:"N. Macedonia",area:4,lx:712,ly:328,borders:["serbia","bulgaria","greece","albania","kosovo"],d:"M695,312 L748,308 L752,332 L738,352 L698,355 L682,338 Z"},
  {id:"bulgaria",name:"Bulgaria",area:10,lx:742,ly:295,borders:["romania","serbia","north_macedonia","greece","turkey"],d:"M718,275 L792,272 L798,302 L785,332 L742,338 L715,322 Z"},
  {id:"greece",name:"Greece",area:12,lx:712,ly:355,borders:["bulgaria","albania","north_macedonia","turkey"],d:"M678,335 L748,332 L755,362 L742,395 L705,402 L672,392 L662,362 Z"},
  {id:"turkey",name:"Turkey",area:38,lx:798,ly:298,borders:["bulgaria","greece","georgia","armenia","iran","iraq","syria"],d:"M772,272 L878,268 L888,298 L878,328 L798,335 L762,322 Z"},
  {id:"georgia",name:"Georgia",area:8,lx:862,ly:255,borders:["turkey","russia","armenia","azerbaijan"],d:"M842,238 L902,235 L908,258 L895,278 L852,282 L832,265 Z"},
  {id:"armenia",name:"Armenia",area:6,lx:878,ly:278,borders:["turkey","georgia","azerbaijan","iran"],d:"M858,262 L918,258 L922,282 L908,302 L868,305 L852,288 Z"},
  {id:"azerbaijan",name:"Azerbaijan",area:6,lx:902,ly:268,borders:["georgia","armenia","iran","russia"],d:"M882,252 L938,248 L942,272 L928,292 L888,295 L872,278 Z"},
  {id:"russia",name:"Russia",area:248,lx:1002,ly:118,borders:["norway","finland","estonia","latvia","lithuania","belarus","ukraine","georgia","azerbaijan","kazakhstan","china","mongolia","north_korea"],d:"M618,28 L1508,22 L1522,108 L1508,178 L1302,185 L1082,182 L838,178 L728,162 L712,128 L652,108 Z"},
  {id:"syria",name:"Syria",area:10,lx:858,ly:335,borders:["turkey","iraq","jordan","lebanon","israel"],d:"M832,312 L892,308 L898,338 L885,362 L845,368 L825,348 Z"},
  {id:"lebanon",name:"Lebanon",area:4,lx:845,ly:358,borders:["syria","israel"],d:"M828,342 L862,338 L865,362 L852,378 L832,375 Z"},
  {id:"israel",name:"Israel",area:4,lx:838,ly:375,borders:["lebanon","syria","jordan","egypt"],d:"M822,358 L855,355 L858,378 L845,398 L822,402 L808,382 Z"},
  {id:"jordan",name:"Jordan",area:8,lx:862,ly:382,borders:["syria","israel","iraq","saudi_arabia"],d:"M842,358 L898,355 L905,382 L892,408 L852,415 L832,398 Z"},
  {id:"iraq",name:"Iraq",area:18,lx:892,ly:348,borders:["turkey","syria","jordan","saudi_arabia","kuwait","iran"],d:"M872,312 L948,308 L955,348 L942,382 L902,388 L865,375 L858,348 Z"},
  {id:"kuwait",name:"Kuwait",area:4,lx:940,ly:378,borders:["iraq","saudi_arabia"],d:"M922,358 L958,355 L962,378 L948,395 L925,398 Z"},
  {id:"iran",name:"Iran",area:58,lx:958,ly:318,borders:["turkey","iraq","kuwait","saudi_arabia","azerbaijan","armenia","georgia","russia","afghanistan","pakistan"],d:"M912,278 L1042,275 L1052,318 L1038,368 L998,388 L955,382 L928,348 Z"},
  {id:"saudi_arabia",name:"Saudi Arabia",area:58,lx:908,ly:415,borders:["jordan","iraq","kuwait","iran","uae","oman","yemen"],d:"M842,388 L1018,385 L1028,432 L1015,478 L975,495 L908,498 L858,488 L835,448 Z"},
  {id:"uae",name:"UAE",area:8,lx:1018,ly:442,borders:["saudi_arabia","oman"],d:"M1002,418 L1052,415 L1058,442 L1045,462 L1008,465 L992,448 Z"},
  {id:"oman",name:"Oman",area:14,lx:1042,ly:468,borders:["saudi_arabia","uae","yemen"],d:"M1008,448 L1072,445 L1078,478 L1065,508 L1025,515 L1002,498 Z"},
  {id:"yemen",name:"Yemen",area:18,lx:965,ly:478,borders:["saudi_arabia","oman"],d:"M928,458 L1042,455 L1048,488 L1035,515 L988,522 L942,515 L925,492 Z"},
  {id:"kazakhstan",name:"Kazakhstan",area:68,lx:1082,ly:195,borders:["russia","china","kyrgyzstan","uzbekistan","turkmenistan","azerbaijan"],d:"M928,162 L1282,158 L1292,205 L1278,248 L1088,252 L932,245 Z"},
  {id:"uzbekistan",name:"Uzbekistan",area:14,lx:1072,ly:258,borders:["kazakhstan","kyrgyzstan","tajikistan","afghanistan","turkmenistan"],d:"M1018,242 L1138,238 L1145,268 L1132,298 L1088,305 L1022,298 Z"},
  {id:"turkmenistan",name:"Turkmenistan",area:18,lx:1032,ly:288,borders:["iran","afghanistan","uzbekistan","kazakhstan"],d:"M978,268 L1112,265 L1118,298 L1105,332 L1062,338 L982,332 Z"},
  {id:"kyrgyzstan",name:"Kyrgyzstan",area:8,lx:1142,ly:248,borders:["kazakhstan","uzbekistan","tajikistan","china"],d:"M1122,232 L1198,228 L1202,252 L1188,272 L1145,278 L1128,258 Z"},
  {id:"tajikistan",name:"Tajikistan",area:6,lx:1102,ly:298,borders:["uzbekistan","kyrgyzstan","afghanistan","china"],d:"M1082,278 L1158,275 L1162,302 L1148,322 L1105,328 L1088,308 Z"},
  {id:"afghanistan",name:"Afghanistan",area:22,lx:1072,ly:328,borders:["iran","pakistan","uzbekistan","turkmenistan","tajikistan","china"],d:"M1032,305 L1162,302 L1168,338 L1155,372 L1108,378 L1038,372 Z"},
  {id:"pakistan",name:"Pakistan",area:28,lx:1108,ly:368,borders:["iran","afghanistan","india","china"],d:"M1042,348 L1178,345 L1185,382 L1172,418 L1125,425 L1048,418 Z"},
  {id:"india",name:"India",area:68,lx:1182,ly:418,borders:["pakistan","china","nepal","bhutan","bangladesh","myanmar"],d:"M1155,385 L1298,382 L1308,432 L1295,498 L1258,535 L1215,548 L1172,542 L1142,508 L1132,462 Z"},
  {id:"nepal",name:"Nepal",area:8,lx:1255,ly:365,borders:["india","china"],d:"M1225,348 L1302,345 L1308,368 L1295,385 L1228,388 Z"},
  {id:"bhutan",name:"Bhutan",area:4,lx:1312,ly:362,borders:["india","china"],d:"M1295,345 L1342,342 L1345,365 L1332,378 L1298,382 Z"},
  {id:"bangladesh",name:"Bangladesh",area:6,lx:1312,ly:398,borders:["india","myanmar"],d:"M1295,382 L1342,378 L1345,402 L1332,422 L1298,425 Z"},
  {id:"sri_lanka",name:"Sri Lanka",area:4,lx:1242,ly:515,borders:["india"],d:"M1225,498 L1262,495 L1265,518 L1252,538 L1228,542 Z"},
  {id:"mongolia",name:"Mongolia",area:48,lx:1382,ly:185,borders:["russia","china"],d:"M1298,155 L1515,152 L1522,195 L1508,238 L1298,242 L1285,205 Z"},
  {id:"china",name:"China",area:118,lx:1398,ly:305,borders:["russia","mongolia","kazakhstan","afghanistan","pakistan","india","nepal","bhutan","myanmar","vietnam","north_korea"],d:"M1278,195 L1528,192 L1538,242 L1525,305 L1495,358 L1455,378 L1398,385 L1342,378 L1298,348 L1282,305 Z"},
  {id:"north_korea",name:"N. Korea",area:10,lx:1548,ly:248,borders:["china","russia","south_korea"],d:"M1515,228 L1562,225 L1568,248 L1555,272 L1518,278 L1505,258 Z"},
  {id:"south_korea",name:"S. Korea",area:8,lx:1552,ly:278,borders:["north_korea"],d:"M1512,262 L1558,258 L1565,282 L1552,302 L1518,305 Z"},
  {id:"japan",name:"Japan",area:22,lx:1590,ly:248,borders:["south_korea","china"],d:"M1565,222 L1618,218 L1625,248 L1612,278 L1578,285 L1555,268 Z"},
  {id:"myanmar",name:"Myanmar",area:22,lx:1412,ly:378,borders:["china","india","bangladesh","thailand"],d:"M1382,342 L1452,338 L1458,372 L1445,408 L1412,422 L1375,415 L1362,385 Z"},
  {id:"thailand",name:"Thailand",area:22,lx:1448,ly:415,borders:["myanmar","cambodia","malaysia","vietnam"],d:"M1412,398 L1472,395 L1478,428 L1465,458 L1432,465 L1398,458 L1395,428 Z"},
  {id:"vietnam",name:"Vietnam",area:18,lx:1488,ly:408,borders:["china","cambodia","thailand"],d:"M1465,368 L1522,365 L1528,398 L1515,435 L1485,448 L1458,435 L1452,408 Z"},
  {id:"cambodia",name:"Cambodia",area:10,lx:1465,ly:448,borders:["thailand","vietnam"],d:"M1432,428 L1488,425 L1492,452 L1478,472 L1445,475 L1428,455 Z"},
  {id:"malaysia",name:"Malaysia",area:14,lx:1458,ly:472,borders:["thailand","indonesia"],d:"M1412,455 L1495,452 L1498,475 L1485,492 L1425,495 L1408,478 Z"},
  {id:"philippines",name:"Philippines",area:18,lx:1545,ly:425,borders:["indonesia","malaysia"],d:"M1518,392 L1572,388 L1578,418 L1565,452 L1532,458 L1505,445 L1502,418 Z"},
  {id:"indonesia",name:"Indonesia",area:68,lx:1508,ly:498,borders:["malaysia","papua"],d:"M1412,472 L1655,468 L1662,492 L1648,515 L1415,518 L1398,495 Z"},
  {id:"papua",name:"Papua N.G.",area:28,lx:1672,ly:492,borders:["indonesia","australia"],d:"M1648,465 L1718,462 L1725,488 L1712,512 L1672,518 L1642,508 Z"},
  {id:"australia",name:"Australia",area:128,lx:1618,ly:578,borders:["indonesia","papua","new_zealand"],d:"M1455,508 L1728,502 L1738,542 L1732,582 L1705,622 L1655,648 L1590,658 L1520,652 L1462,625 L1432,582 L1435,542 Z"},
  {id:"new_zealand",name:"New Zealand",area:16,lx:1758,ly:618,borders:["australia"],d:"M1728,588 L1778,582 L1788,612 L1775,648 L1742,662 L1718,645 L1715,618 Z"},
  {id:"morocco",name:"Morocco",area:18,lx:545,ly:355,borders:["spain","algeria"],d:"M508,328 L615,325 L622,358 L608,392 L565,398 L522,392 L508,362 Z"},
  {id:"algeria",name:"Algeria",area:48,lx:602,ly:392,borders:["morocco","tunisia","libya","mali","mauritania"],d:"M508,365 L718,362 L725,408 L712,458 L668,478 L565,482 L512,472 L505,428 Z"},
  {id:"tunisia",name:"Tunisia",area:8,lx:648,ly:335,borders:["algeria","libya"],d:"M628,312 L685,308 L692,338 L678,368 L642,372 L622,348 Z"},
  {id:"libya",name:"Libya",area:48,lx:682,ly:388,borders:["tunisia","algeria","egypt","sudan","niger","chad"],d:"M658,358 L808,355 L815,402 L802,458 L758,478 L692,482 L668,465 L662,418 Z"},
  {id:"egypt",name:"Egypt",area:28,lx:788,ly:368,borders:["libya","israel","jordan","sudan"],d:"M768,342 L868,338 L875,378 L862,425 L818,432 L775,425 L762,385 Z"},
  {id:"mauritania",name:"Mauritania",area:28,lx:528,ly:438,borders:["morocco","algeria","mali","senegal"],d:"M492,408 L618,405 L625,448 L612,492 L568,498 L512,492 L495,458 Z"},
  {id:"mali",name:"Mali",area:38,lx:588,ly:462,borders:["mauritania","algeria","niger","burkina","senegal","guinea"],d:"M552,428 L718,425 L725,472 L712,518 L668,528 L588,532 L548,522 L545,482 Z"},
  {id:"senegal",name:"Senegal",area:8,lx:502,ly:472,borders:["mauritania","mali","guinea"],d:"M478,452 L548,448 L552,478 L538,502 L502,508 L482,488 Z"},
  {id:"guinea",name:"Guinea",area:10,lx:515,ly:508,borders:["senegal","mali","sierra_leone","ivory_coast"],d:"M482,488 L568,485 L572,515 L558,542 L518,548 L492,532 Z"},
  {id:"sierra_leone",name:"Sierra Leone",area:6,lx:497,ly:532,borders:["guinea","liberia"],d:"M478,518 L532,515 L535,542 L522,558 L492,562 Z"},
  {id:"liberia",name:"Liberia",area:6,lx:522,ly:545,borders:["sierra_leone","ivory_coast"],d:"M508,528 L565,525 L568,552 L555,572 L518,575 Z"},
  {id:"ivory_coast",name:"Ivory Coast",area:10,lx:558,ly:538,borders:["guinea","liberia","ghana","burkina"],d:"M538,518 L612,515 L618,548 L605,578 L562,582 L532,568 Z"},
  {id:"burkina",name:"Burkina Faso",area:10,lx:585,ly:498,borders:["mali","ivory_coast","ghana","togo","benin","niger"],d:"M552,478 L648,475 L652,508 L638,538 L592,542 L558,532 Z"},
  {id:"ghana",name:"Ghana",area:10,lx:598,ly:538,borders:["ivory_coast","burkina","togo"],d:"M578,518 L648,515 L652,548 L638,578 L598,582 L578,558 Z"},
  {id:"togo",name:"Togo",area:4,lx:632,ly:540,borders:["ghana","burkina","benin"],d:"M615,518 L655,515 L658,542 L645,562 L618,565 Z"},
  {id:"benin",name:"Benin",area:6,lx:645,ly:532,borders:["togo","burkina","nigeria","niger"],d:"M628,512 L672,508 L675,538 L662,562 L632,565 Z"},
  {id:"niger",name:"Niger",area:38,lx:648,ly:462,borders:["algeria","mali","burkina","benin","nigeria","chad","libya"],d:"M618,428 L778,425 L785,468 L772,518 L728,528 L638,532 L615,518 L612,478 Z"},
  {id:"nigeria",name:"Nigeria",area:38,lx:668,ly:528,borders:["benin","niger","chad","cameroon"],d:"M638,508 L752,505 L758,548 L745,588 L698,598 L652,592 L635,555 Z"},
  {id:"chad",name:"Chad",area:38,lx:722,ly:478,borders:["libya","niger","nigeria","cameroon","central_africa","sudan"],d:"M698,448 L818,445 L825,492 L812,548 L768,558 L718,552 L698,518 Z"},
  {id:"sudan",name:"Sudan",area:48,lx:798,ly:442,borders:["egypt","libya","chad","central_africa","south_sudan","ethiopia","eritrea"],d:"M768,408 L878,405 L885,458 L872,518 L828,528 L782,522 L758,488 Z"},
  {id:"eritrea",name:"Eritrea",area:6,lx:875,ly:432,borders:["sudan","ethiopia"],d:"M852,408 L908,405 L912,432 L898,458 L858,462 L842,438 Z"},
  {id:"ethiopia",name:"Ethiopia",area:38,lx:875,ly:488,borders:["eritrea","sudan","south_sudan","kenya","somalia"],d:"M842,458 L958,455 L962,508 L948,558 L905,568 L858,562 L838,522 Z"},
  {id:"somalia",name:"Somalia",area:22,lx:955,ly:508,borders:["ethiopia","kenya"],d:"M928,478 L992,475 L998,525 L985,578 L942,588 L912,568 L908,528 Z"},
  {id:"cameroon",name:"Cameroon",area:14,lx:682,ly:562,borders:["nigeria","niger","chad","central_africa","congo","gabon"],d:"M658,538 L752,535 L758,572 L745,605 L702,612 L658,605 Z"},
  {id:"central_africa",name:"C.A.R.",area:22,lx:748,ly:568,borders:["chad","sudan","south_sudan","congo","cameroon"],d:"M718,538 L848,535 L855,572 L842,608 L798,618 L722,612 Z"},
  {id:"south_sudan",name:"S. Sudan",area:22,lx:812,ly:528,borders:["sudan","ethiopia","kenya","uganda","congo","central_africa"],d:"M782,498 L882,495 L888,535 L875,568 L832,578 L782,572 Z"},
  {id:"gabon",name:"Gabon",area:10,lx:682,ly:598,borders:["cameroon","congo"],d:"M658,578 L722,575 L728,608 L715,638 L675,642 L658,618 Z"},
  {id:"congo",name:"Congo",area:14,lx:725,ly:605,borders:["cameroon","central_africa","south_sudan","drc","gabon","angola"],d:"M692,578 L808,575 L815,618 L802,658 L758,668 L698,662 L688,628 Z"},
  {id:"drc",name:"DR Congo",area:68,lx:778,ly:618,borders:["congo","south_sudan","kenya","uganda","tanzania","angola","zambia","central_africa"],d:"M742,588 L892,585 L898,648 L885,718 L838,738 L778,742 L722,728 L705,678 Z"},
  {id:"uganda",name:"Uganda",area:10,lx:862,ly:568,borders:["south_sudan","kenya","tanzania","drc"],d:"M838,548 L908,545 L912,578 L898,608 L858,618 L832,602 Z"},
  {id:"kenya",name:"Kenya",area:18,lx:908,ly:568,borders:["ethiopia","somalia","uganda","tanzania","south_sudan"],d:"M878,538 L978,535 L982,578 L968,622 L925,632 L882,625 Z"},
  {id:"rwanda",name:"Rwanda",area:4,lx:838,ly:632,borders:["uganda","drc","tanzania","burundi"],d:"M822,615 L862,612 L865,638 L852,655 L825,658 Z"},
  {id:"burundi",name:"Burundi",area:4,lx:838,ly:655,borders:["rwanda","drc","tanzania"],d:"M822,638 L862,635 L865,662 L852,678 L825,682 Z"},
  {id:"tanzania",name:"Tanzania",area:28,lx:892,ly:638,borders:["kenya","uganda","drc","rwanda","burundi","mozambique","zambia","malawi"],d:"M858,608 L972,605 L978,648 L965,705 L918,715 L872,708 L852,668 Z"},
  {id:"angola",name:"Angola",area:28,lx:718,ly:688,borders:["congo","drc","zambia","namibia"],d:"M688,658 L822,655 L828,702 L815,752 L768,762 L718,755 L692,718 Z"},
  {id:"zambia",name:"Zambia",area:28,lx:818,ly:705,borders:["angola","drc","tanzania","malawi","mozambique","zimbabwe","namibia","botswana"],d:"M792,668 L922,665 L928,712 L915,762 L868,772 L808,765 L788,728 Z"},
  {id:"malawi",name:"Malawi",area:6,lx:908,ly:712,borders:["zambia","tanzania","mozambique"],d:"M888,688 L935,685 L938,718 L925,748 L892,752 Z"},
  {id:"mozambique",name:"Mozambique",area:22,lx:900,ly:762,borders:["tanzania","malawi","zambia","zimbabwe","south_africa","eswatini"],d:"M868,718 L948,715 L952,768 L938,828 L898,838 L858,832 L842,782 Z"},
  {id:"namibia",name:"Namibia",area:22,lx:762,ly:762,borders:["angola","zambia","botswana","south_africa"],d:"M722,728 L848,725 L852,778 L838,832 L792,842 L738,835 L718,788 Z"},
  {id:"botswana",name:"Botswana",area:18,lx:822,ly:792,borders:["namibia","zambia","zimbabwe","south_africa"],d:"M792,758 L892,755 L898,802 L885,852 L838,862 L798,855 Z"},
  {id:"zimbabwe",name:"Zimbabwe",area:14,lx:878,ly:775,borders:["zambia","mozambique","botswana","south_africa"],d:"M852,748 L938,745 L942,792 L928,838 L885,848 L848,842 Z"},
  {id:"south_africa",name:"South Africa",area:38,lx:832,ly:858,borders:["namibia","botswana","zimbabwe","mozambique","eswatini","lesotho"],d:"M738,828 L958,825 L965,878 L952,932 L895,948 L828,952 L762,938 L738,892 Z"},
  {id:"eswatini",name:"Eswatini",area:2,lx:942,ly:832,borders:["south_africa","mozambique"],d:"M928,818 L962,815 L965,838 L952,852 L928,855 Z"},
  {id:"lesotho",name:"Lesotho",area:2,lx:862,ly:908,borders:["south_africa"],d:"M845,892 L882,888 L885,912 L872,928 L848,932 Z"},
];

function buildAdj(){
  const m={};
  COUNTRIES.forEach(c=>{m[c.id]=new Set(c.borders||[]);});
  COUNTRIES.forEach(c=>(c.borders||[]).forEach(b=>{if(m[b])m[b].add(c.id);}));
  return m;
}
const ADJ=buildAdj();

function getReachable(owned,hops=2){
  const vis=new Set(owned);let front=new Set(owned);
  for(let h=0;h<hops;h++){
    const nxt=new Set();
    front.forEach(id=>ADJ[id]?.forEach(n=>{if(!vis.has(n)){vis.add(n);nxt.add(n);}}));
    front=nxt;
  }
  return vis;
}

function startTerr(existing){
  const owned=new Set(Object.keys(existing));
  const free=COUNTRIES.filter(c=>!owned.has(c.id)).sort(()=>Math.random()-.5);
  if(!free.length)return[];
  const first=free[0];
  const nb=[...(ADJ[first.id]||[])].find(id=>!owned.has(id));
  return nb?[first.id,nb]:[first.id];
}

function todayStr(){return new Date().toISOString().slice(0,10);}

function rndName(){
  const adj=["Bold","Swift","Iron","Brave","Dark","Gold","Storm","Fire"];
  const noun=["Wolf","Eagle","Bear","Lion","Fox","Hawk","Tiger","Drake"];
  return adj[Math.floor(Math.random()*8)]+noun[Math.floor(Math.random()*8)]+Math.floor(Math.random()*99+1);
}

function calcDamage(tank,bomb,plane,missile,bomber){
  return Math.round((tank*DMG.tank+bomb*DMG.bomb+plane*DMG.plane+missile*DMG.missile+bomber*DMG.bomber)*10)/10;
}

function calcWinChance(area,damage,spyCount,academySpies,airDef){
  const base=Math.min(0.95,damage/(area*0.8));
  const spyBonus=(spyCount+academySpies)*0.01;
  const defPenalty=airDef*0.05;
  return Math.max(0.02,Math.min(0.97,base+spyBonus-defPenalty));
}

const STAR_DATA=Array.from({length:60},(_,i)=>({
  top:(i*17+i*i*3)%100,
  left:(i*23+i*i*7)%100,
  size:i%4===0?2.5:i%3===0?2:1.5,
  opacity:0.2+((i*13)%10)*0.06,
  dur:3+((i*7)%8),
}));

function Stars(){
  return(
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
      {STAR_DATA.map((s,i)=>(
        <div key={i} style={{position:"absolute",top:s.top+"%",left:s.left+"%",
          width:s.size+"px",height:s.size+"px",borderRadius:"50%",
          background:"white",opacity:s.opacity,
          animation:"twinkle "+s.dur+"s ease-in-out infinite"}}/>
      ))}
    </div>
  );
}

const starCss="@keyframes twinkle{0%,100%{opacity:.15}50%{opacity:.7}} @keyframes pu{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}} @keyframes si{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes digitPop{0%{transform:scale(1)}50%{transform:scale(1.2)}100%{transform:scale(1)}} .digit-box{transition:all .15s;border:1.5px solid rgba(255,255,255,.15);border-radius:10px;width:40px;height:52px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;color:white;background:rgba(255,255,255,.05);font-family:Georgia,serif} .digit-box.active{border-color:#f5c842;box-shadow:0 0 12px rgba(245,200,66,.3)} .digit-box.filled{border-color:rgba(255,255,255,.35);background:rgba(255,255,255,.1);animation:digitPop .2s ease} .frbtn{transition:all .15s} .frbtn:hover{filter:brightness(1.15)} .cp{transition:filter .12s,opacity .12s} .cp:hover{filter:brightness(1.2)}";

const bgStyle={minHeight:"100vh",background:"radial-gradient(ellipse at 50% 30%,#0d1f3c,#060d1a)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",position:"relative"};
const card={background:"linear-gradient(135deg,#0a1628,#0d1f38)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"20px",padding:"36px",width:"420px",position:"relative",zIndex:1};

export default function EarthConquest(){
  const [screen,setScreen]=useState("home");
  const [menuTab,setMenuTab]=useState("main");
  const [username,setUsername]=useState("");
  const [inputName,setInputName]=useState("");
  const [inputPassword,setInputPassword]=useState("");
  const [loginError,setLoginError]=useState("");
  const [cidx,setCidx]=useState(0);
  const [ownership,setOwnership]=useState({});
  const [players,setPlayers]=useState({});
  const [roomCode,setRoomCode]=useState("");
  const [roomInput,setRoomInput]=useState("");
  const [roomError,setRoomError]=useState("");
  const [recentRooms,setRecentRooms]=useState([]);
  const [myInventory,setMyInventory]=useState({coins:500,tank:5,bomb:3,plane:1,missile:1,bomber:0,air_def:0,spy:0,lastDaily:"",wood:0,stone:0,iron:0,gold:0,buildings:[],lastFactory:0,factoryCount:0,academySpies:0,lastAcademy:0});
  const [hovered,setHovered]=useState(null);
  const [tip,setTip]=useState({show:false,x:0,y:0,c:null,owner:null,inReach:false});
  const [notif,setNotif]=useState(null);
  const [attackMode,setAttackMode]=useState(false);
  const [reachable,setReachable]=useState(new Set());
  const [showShop,setShowShop]=useState(false);
  const [showBuildShop,setShowBuildShop]=useState(false);
  const [showDaily,setShowDaily]=useState(false);
  const [showTerraPass,setShowTerraPass]=useState(false);
  const [attackPlan,setAttackPlan]=useState(null);
  const [deploy,setDeploy]=useState({tank:0,bomb:0,plane:0,missile:0,bomber:0});
  const [tutStep,setTutStep]=useState(0);
  const [isSingleplayer,setIsSingleplayer]=useState(false);
  const [botInventories,setBotInventories]=useState({});
  const [playerXP,setPlayerXP]=useState(0);
  const [achievements,setAchievements]=useState([]);
  const [missionProgress,setMissionProgress]=useState({});
  const [claimedMissions,setClaimedMissions]=useState([]);
  const [claimedPassLevels,setClaimedPassLevels]=useState([]);
  const svgRef=useRef(null);
  const ownershipRef=useRef({});
  const botInvRef=useRef({});

  const saveWorld=async(o,p)=>{
    if(isSingleplayer)return;
    try{await sb.from("world").upsert({room_code:roomCode,ownership:o,players:p},{onConflict:"room_code"});}catch(e){}
  };

  const saveInv=async(inv,name)=>{
    const n=name||username;
    if(!n||isSingleplayer)return;
    try{await sb.from("inventory").upsert({username:n,data:inv},{onConflict:"username"});}catch(e){}
  };

  const flash=(msg,type="info")=>{setNotif({msg,type});setTimeout(()=>setNotif(null),3500);};

  useEffect(()=>{
    if(!attackMode||!username){setReachable(new Set());return;}
    const mine=Object.keys(ownership).filter(id=>ownership[id]===username);
    const hops=myInventory.plane>0?3:2;
    setReachable(getReachable(mine,hops));
  },[attackMode,ownership,username,myInventory.plane]);

  useEffect(()=>{
    if(!roomCode||screen!=="map")return;
    const poll=setInterval(async()=>{
      try{
        const {data}=await sb.from("world").select("ownership,players").eq("room_code",roomCode).single();
        if(data){
          setOwnership(prev=>{const inc=data.ownership||{};if(JSON.stringify(prev)===JSON.stringify(inc))return prev;return inc;});
          setPlayers(prev=>{const inc=data.players||{};if(JSON.stringify(prev)===JSON.stringify(inc))return prev;return inc;});
        }
      }catch(e){}
    },3000);
    return()=>clearInterval(poll);
  },[roomCode,screen]);

  useEffect(()=>{
    if(!username||screen!=="map")return;
    const tick=setInterval(()=>{
      setMyInventory(inv=>{
        const fc=(inv.buildings||[]).filter(b=>b==="coin_factory").length;
        if(fc===0)return inv;
        const vc=(inv.buildings||[]).filter(b=>b==="vault").length;
        const perF=COIN_FACTORY_YIELD+(vc*2);
        const earned=perF*fc;
        const newInv={...inv,coins:inv.coins+earned,lastFactory:Date.now()};
        if(!isSingleplayer)(async()=>{try{await sb.from("inventory").upsert({username:inv._name||"",data:newInv},{onConflict:"username"});}catch(e){}})();
        return newInv;
      });
    },COIN_FACTORY_INTERVAL_MS);
    return()=>clearInterval(tick);
  },[username,screen]);

  useEffect(()=>{
    if(!username||screen!=="map")return;
    const tick=setInterval(()=>{
      setMyInventory(inv=>{
        const hasAcademy=(inv.buildings||[]).includes("spy_academy");
        if(!hasAcademy)return inv;
        const now=Date.now();
        const last=inv.lastAcademy||0;
        if(now-last<1200000)return inv;
        const newInv={...inv,academySpies:(inv.academySpies||0)+1,lastAcademy:now};
        if(!isSingleplayer)(async()=>{try{await sb.from("inventory").upsert({username:inv._name||"",data:newInv},{onConflict:"username"});}catch(e){}})();
        return newInv;
      });
    },60000);
    return()=>clearInterval(tick);
  },[username,screen]);

  useEffect(()=>{
    if(!isSingleplayer||screen!=="map")return;
    const tick=setInterval(()=>{
      const o=ownershipRef.current;
      const bInv=botInvRef.current;
      BOT_NAMES.forEach(bot=>{
        const bMine=Object.keys(o).filter(id=>o[id]===bot);
        if(bMine.length===0)return;
        const reach=getReachable(bMine,2);
        const targets=[...reach].filter(id=>o[id]!==bot);
        if(targets.length===0)return;
        const target=targets.sort((a,b)=>{const ca=COUNTRIES.find(c=>c.id===a);const cb=COUNTRIES.find(c=>c.id===b);return (ca?.area||99)-(cb?.area||99);})[0];
        const newO={...o,[target]:bot};
        ownershipRef.current=newO;
        setOwnership(newO);
        const inv=bInv[bot]||{coins:800,tank:5,bomb:3,plane:1,missile:1,bomber:0};
        const newInv={...inv,coins:inv.coins+50};
        const newBInv={...bInv,[bot]:newInv};
        botInvRef.current=newBInv;
        setBotInventories(newBInv);
      });
    },2000);
    return()=>clearInterval(tick);
  },[isSingleplayer,screen]);

  const addXP=async(amount)=>{
    setPlayerXP(prev=>{
      const next=prev+amount;
      setMyInventory(inv=>{
        const newInv={...inv,_xp:next};
        (async()=>{try{await saveInv(newInv);}catch(e){}})();
        return newInv;
      });
      return next;
    });
  };

  const unlockAchievement=async(id)=>{
    setAchievements(prev=>{
      if(prev.includes(id))return prev;
      const next=[...prev,id];
      const a=ACHIEVEMENTS.find(x=>x.id===id);
      flash("[Trophy] Achievement: "+( a?.name||id),"success");
      addXP(a?.xp||50);
      setMyInventory(inv=>{
        const newInv={...inv,_achievements:next};
        (async()=>{try{await saveInv(newInv);}catch(e){}})();
        return newInv;
      });
      return next;
    });
  };

  const progressMission=(stat,amount)=>{
    setMissionProgress(prev=>{
      const next={...prev,[stat]:(prev[stat]||0)+amount};
      const today=getTodayMissions();
      today.forEach(m=>{
        if(next[m.stat]>=m.goal&&!claimedMissions.includes(m.id)){
          flash("[Trophy] Mission complete: "+m.label,"success");
          addXP(m.xp);
        }
      });
      setMyInventory(inv=>{
        const newInv={...inv,_missionProgress:next,_missionDate:todayStr()};
        (async()=>{try{await saveInv(newInv);}catch(e){}})();
        return newInv;
      });
      return next;
    });
  };

  const checkAchievements=(inv,own)=>{
    const mine=Object.keys(own).filter(id=>own[id]===username);
    if(mine.length>=1&&!achievements.includes("first_blood"))unlockAchievement("first_blood");
    if(mine.length>=5&&!achievements.includes("conqueror5"))unlockAchievement("conqueror5");
    if(mine.length>=20&&!achievements.includes("conqueror20"))unlockAchievement("conqueror20");
    if(mine.length>=50&&!achievements.includes("conqueror50"))unlockAchievement("conqueror50");
    if((inv.coins||0)>=10000&&!achievements.includes("rich"))unlockAchievement("rich");
    const buildings=inv.buildings||[];
    if(buildings.length>=1&&!achievements.includes("builder"))unlockAchievement("builder");
    if(buildings.filter(b=>b==="coin_factory").length>=3&&!achievements.includes("factory3"))unlockAchievement("factory3");
  };

  const handleLogin=async()=>{
    const name=inputName.trim()||rndName();
    const pwd=inputPassword.trim();
    if(!pwd){setLoginError("Password required");return;}
    setLoginError("");
    let inv={coins:500,tank:5,bomb:3,plane:1,missile:1,bomber:0,air_def:0,spy:0,lastDaily:"",wood:0,stone:0,iron:0,gold:0,buildings:[],lastFactory:0,factoryCount:0,academySpies:0,lastAcademy:0,_name:name,_pwd:pwd,_xp:0,_achievements:[],_dailyCount:0,_missionProgress:{},_missionDate:"",_claimedMissions:[],_claimedPassLevels:[]};
    try{
      const {data}=await sb.from("inventory").select("data").eq("username",name).single();
      if(data?.data){
        const saved=data.data;
        if(saved._pwd&&saved._pwd!==pwd){setLoginError("Wrong password");return;}
        inv={...inv,...saved,_name:name,_pwd:pwd};
      }
    }catch(e){}
    setUsername(name);
    setMyInventory(inv);
    await saveInv(inv,name);
    setPlayerXP(inv._xp||0);
    setAchievements(inv._achievements||[]);
    if((inv._missionDate||"")===todayStr()){
      setMissionProgress(inv._missionProgress||{});
      setClaimedMissions(inv._claimedMissions||[]);
    }else{setMissionProgress({});setClaimedMissions([]);}
    setClaimedPassLevels(inv._claimedPassLevels||[]);
    setScreen("menu");
  };

  const handleRoom=async()=>{
    const code=roomInput;
    setRoomError("");
    try{
      const {data}=await sb.from("world").select("ownership,players").eq("room_code",code).single();
      let o={},p={};
      if(data){o=data.ownership||{};p=data.players||{};}
      setOwnership(o);setPlayers(p);
      setRoomCode(code);
      setRecentRooms(prev=>[code,...prev.filter(r=>r!==code)].slice(0,5));
      setScreen("login");
    }catch(e){setRoomError("Error connecting: "+e.message);}
  };

  const startGame=async()=>{
    const newO={...ownership};
    const terr=startTerr(newO);
    terr.forEach(id=>{newO[id]=username;});
    const newP={...players,[username]:{cidx,joinedAt:Date.now()}};
    await saveWorld(newO,newP);
    setOwnership(newO);setPlayers(newP);
    if(myInventory.lastDaily!==todayStr())setShowDaily(true);
    setScreen("map");
  };

  const startSingleplayer=()=>{
    const o={};
    const startForPlayer=(name,colorIdx,isBot)=>{
      const terr=startTerr(o);
      terr.forEach(id=>{o[id]=name;});
      return{cidx:colorIdx,joinedAt:Date.now()};
    };
    const p={};
    p[username]=startForPlayer(username,0,false);
    const botInvs={};
    BOT_NAMES.forEach((bot,i)=>{
      p[bot]=startForPlayer(bot,i+1,true);
      botInvs[bot]={coins:800,tank:5,bomb:3,plane:1,missile:1,bomber:0};
    });
    setBotInventories(botInvs);
    botInvRef.current=botInvs;
    ownershipRef.current=o;
    setOwnership(o);setPlayers(p);
    setIsSingleplayer(true);
    setScreen("map");
  };

  const claimDaily=async()=>{
    const vaultCount=(myInventory.buildings||[]).filter(b=>b==="vault").length;
    const vaultBonus=vaultCount*500;
    const total=DAILY_REWARD+vaultBonus;
    const newInv={...myInventory,coins:myInventory.coins+total,lastDaily:todayStr(),_dailyCount:(myInventory._dailyCount||0)+1};
    setMyInventory(newInv);
    await saveInv(newInv);
    setShowDaily(false);
    flash("[Gift] Daily reward: +"+(total.toLocaleString())+" coins"+(vaultBonus>0?" (+"+vaultBonus+" vault bonus!)":"")+"!","success");
    progressMission("coinsEarned",total);
    checkAchievements(newInv,ownership);
    if((newInv._dailyCount||0)>=7)unlockAchievement("daily7");
  };

  const claimPassLevel=async(level)=>{
    if(claimedPassLevels.includes(level))return;
    const pass=TERRA_PASS.find(p=>p.level===level);
    if(!pass||!pass.reward)return;
    const r=pass.reward;
    let newInv={...myInventory};
    if(r.type==="coins")newInv={...newInv,coins:newInv.coins+r.amount};
    else newInv={...newInv,[r.type]:(newInv[r.type]||0)+r.amount};
    const next=[...claimedPassLevels,level];
    newInv={...newInv,_claimedPassLevels:next};
    setMyInventory(newInv);
    setClaimedPassLevels(next);
    await saveInv(newInv);
    flash("[Gift] Terra Pass Level "+level+": "+pass.label+" claimed!","success");
  };

  const buyItem=async(item)=>{
    const buildings=myInventory.buildings||[];
    let price=item.price;
    if(item.id==="tank"){const bc=buildings.filter(b=>b==="barracks").length;price=Math.floor(price*Math.pow(0.8,bc));}
    if(item.id==="plane"){const ac=buildings.filter(b=>b==="airbase").length;price=Math.floor(price*Math.pow(0.85,ac));}
    if(item.id==="bomber"&&buildings.includes("embassy"))price=Math.floor(price*0.9);
    if(myInventory.coins<price){flash("Not enough coins!","error");return;}
    const qty=item.id==="air_def"?1:1;
    const newInv={...myInventory,coins:myInventory.coins-price,[item.id]:(myInventory[item.id]||0)+qty};
    setMyInventory(newInv);
    await saveInv(newInv);
    flash("Bought "+item.label+"!","success");
    progressMission("weaponsBought",1);
    if(item.id==="bomber")progressMission("bombersUsed",0);
    checkAchievements(newInv,ownership);
    if(achievements.filter(a=>SHOP_ITEMS.find(s=>s.id===a)).length>=10||Object.values(newInv).reduce((s,v)=>typeof v==="number"?s+v:s,0)>10)unlockAchievement("weapons10");
  };

  const buildBuilding=async(bld)=>{
    const buildings=myInventory.buildings||[];
    const owned=buildings.filter(b=>b===bld.id).length;
    if(owned>=bld.max){flash("Already at max "+bld.label+"!","error");return;}
    const cost=bld.cost;
    for(const[mat,qty]of Object.entries(cost)){
      if((myInventory[mat]||0)<qty){flash("Not enough "+mat+"!","error");return;}
    }
    const newInv={...myInventory};
    for(const[mat,qty]of Object.entries(cost))newInv[mat]=(newInv[mat]||0)-qty;
    newInv.buildings=[...buildings,bld.id];
    setMyInventory(newInv);
    await saveInv(newInv);
    flash("Built "+bld.label+"!","success");
    progressMission("builds",1);
    checkAchievements(newInv,ownership);
  };

  const startAttack=(country)=>{
    if(!attackMode)return;
    const mine=Object.keys(ownership).filter(id=>ownership[id]===username);
    const reach=getReachable(mine,myInventory.plane>0?3:2);
    if(!reach.has(country.id)||ownership[country.id]===username)return;
    setAttackPlan({country});
    setDeploy({tank:0,bomb:0,plane:0,missile:0,bomber:0});
  };

  const confirmAttack=async()=>{
    if(!attackPlan)return;
    const country=attackPlan.country;
    const damage=calcDamage(deploy.tank||0,deploy.bomb||0,deploy.plane||0,deploy.missile||0,deploy.bomber||0);
    const embassyBonus=((myInventory.buildings||[]).includes("embassy"))?0.05:0;
    const defenderAirDef=0;
    const chance=calcWinChance(country.area||20,damage,myInventory.spy||0,myInventory.academySpies||0,defenderAirDef)+embassyBonus;
    const pct=Math.round(Math.min(0.97,chance)*100);
    const usedSpy=(myInventory.spy||0)>0||(myInventory.academySpies||0)>0;
    const newInv={...myInventory};
    for(const[id,qty]of Object.entries(deploy)){if(qty>0)newInv[id]=(newInv[id]||0)-qty;}
    if(usedSpy){newInv.spy=0;newInv.academySpies=0;}
    const won=Math.random()<chance;
    if(won){
      const newO={...ownership,[country.id]:username};
      ownershipRef.current=newO;
      setOwnership(newO);
      await saveWorld(newO,players);
      flash("[Win] Conquered "+country.name+"! "+damage+" dmg, "+pct+"% chance"+(usedSpy?" [Spy]":""),"success");
      progressMission("wins",1);
      progressMission("conquests",1);
      addXP(20);
      checkAchievements(newInv,newO);
    }else{
      flash("[Loss] Failed attack on "+country.name+". "+damage+" dmg, "+pct+"% chance - try more firepower!","error");
      addXP(5);
    }
    if(usedSpy)unlockAchievement("spy_used");
    if((deploy.bomber||0)>0)unlockAchievement("bomber_used");
    setMyInventory(newInv);
    await saveInv(newInv);
    setAttackPlan(null);
    setAttackMode(false);
  };

  const mine=Object.keys(ownership).filter(id=>ownership[id]===username);
  const myC=CLRS[cidx%CLRS.length];
  const lb=Object.entries(Object.values(ownership).reduce((a,o)=>{a[o]=(a[o]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const canClaimDaily=myInventory.lastDaily!==todayStr();
  const vaultCount=(myInventory.buildings||[]).filter(b=>b==="vault").length;
  const vaultBonus=vaultCount*500;
  const totalDaily=DAILY_REWARD+vaultBonus;
  const curLevel=Math.max(0,TERRA_PASS.findLastIndex(p=>playerXP>=p.xpNeeded));
  const nextLevelData=TERRA_PASS[curLevel+1]||null;
  const prevXP=TERRA_PASS[curLevel]?.xpNeeded||0;
  const xpPct=nextLevelData?Math.round(((playerXP-prevXP)/(nextLevelData.xpNeeded-prevXP))*100):100;
  const todayMissions=getTodayMissions();
  const hasWeapons=(deploy.tank||0)+(deploy.bomb||0)+(deploy.plane||0)+(deploy.missile||0)+(deploy.bomber||0)>0;
  const atkDamage=attackPlan?calcDamage(deploy.tank||0,deploy.bomb||0,deploy.plane||0,deploy.missile||0,deploy.bomber||0):0;
  const atkChance=attackPlan?calcWinChance(attackPlan.country.area||20,atkDamage,myInventory.spy||0,myInventory.academySpies||0,0):0;
  const atkPct=Math.round(atkChance*100);
  const atkBarColor=atkPct>=70?"#22c55e":atkPct>=40?"#f59e0b":"#ef4444";

  if(screen==="eliminated"){
    return(
      <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 50%,#1a0000,#000)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
        <style>{"@keyframes elimIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}} @keyframes skull{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}"}</style>
        <div style={{textAlign:"center",animation:"elimIn .5s ease",padding:"40px"}}>
          <div style={{fontSize:"100px",animation:"skull 2s ease infinite",marginBottom:"16px"}}>X</div>
          <h1 style={{color:"#ef4444",fontSize:"36px",letterSpacing:"4px",margin:"0 0 8px",textTransform:"uppercase"}}>Eliminated</h1>
          <p style={{color:"rgba(255,255,255,.5)",fontSize:"14px",margin:"0 0 8px"}}>You have lost all your territories.</p>
          <p style={{color:"rgba(255,255,255,.3)",fontSize:"12px",margin:"0 0 32px"}}>Room <span style={{color:"#f5c842"}}>{roomCode}</span> continues without you.</p>
          <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"14px",padding:"20px 32px",marginBottom:"28px",display:"inline-block"}}>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:"10px",letterSpacing:"2px",marginBottom:"12px",textTransform:"uppercase"}}>Your Final Stats</div>
            <div style={{color:"#f5c842",fontSize:"18px",fontWeight:"bold",marginBottom:"6px"}}>$ {myInventory.coins.toLocaleString()} coins remaining</div>
          </div>
          <br/>
          <button onClick={()=>{setScreen("menu");setMenuTab("multiplayer");setOwnership({});setPlayers({});setRoomCode("");}}
            style={{padding:"13px 32px",background:"linear-gradient(135deg,#1e3a5f,#2563eb)",border:"none",borderRadius:"12px",color:"white",fontSize:"14px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif"}}>
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if(screen==="home"){
    return(
      <div style={bgStyle}>
        <Stars/><style>{starCss}</style>
        <div style={{...card,width:"380px",textAlign:"center"}}>
          <div style={{fontSize:"52px",marginBottom:"8px",animation:"pu 3s infinite"}}>Globe</div>
          <h1 style={{color:"#fff",fontSize:"24px",margin:"0 0 4px",letterSpacing:"4px",textTransform:"uppercase"}}>TERRA CONQUEST</h1>
          <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:"0 0 28px",letterSpacing:"2px"}}>World domination awaits</p>
          <input value={inputName} onChange={e=>setInputName(e.target.value)} placeholder="Username (leave blank for random)"
            style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"10px",color:"white",fontSize:"13px",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:"10px"}}/>
          <input value={inputPassword} onChange={e=>setInputPassword(e.target.value)} placeholder="Password" type="password"
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"10px",color:"white",fontSize:"13px",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:"10px"}}/>
          {loginError&&<div style={{color:"#fca5a5",fontSize:"11px",marginBottom:"10px"}}>{loginError}</div>}
          <button onClick={handleLogin}
            style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",borderRadius:"12px",color:"#000",fontSize:"14px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif",boxShadow:"0 8px 24px rgba(212,160,23,.4)"}}>
            LOGIN / REGISTER
          </button>
        </div>
      </div>
    );
  }

  if(screen==="menu"){
    const TUTORIAL_STEPS=[
      {title:"The Map",text:"The world is divided into countries. Each country has a size. Bigger countries are harder to conquer. Your territories are shown in your color."},
      {title:"Attacking",text:"Click the sword button to enter Attack Mode. Highlighted countries are within your reach (2 borders away, 3 if you own a Plane). Click one to attack."},
      {title:"Weapons",text:"In the War Shop, buy Tanks (0.5dmg), Bombs (2dmg), Planes (3dmg), Missiles (6dmg), or Bombers (10dmg). Deploy them in the attack modal."},
      {title:"Air Defence",text:"Buy Air Defence units from the War Shop. Each one reduces the enemy win chance by 5% when they attack you."},
      {title:"Economy",text:"Build a Coin Factory in the Build Shop to earn 5 coins/sec. Build Gold Vaults for +500 daily reward. Claim your Daily Reward every day."},
      {title:"Buildings",text:"The Build Shop lets you build structures using Wood, Stone, Iron and Gold materials. Barracks discount Tanks, Air Bases discount Planes."},
      {title:"Spies",text:"Build a Spy Academy and wait 20 min. Pay 300 coins to claim a spy. Each spy adds +1% win chance to your next attack."},
      {title:"Elimination",text:"If all your territories are conquered, you are eliminated. Protect your lands! The last player standing wins."},
    ];
    const step=TUTORIAL_STEPS[tutStep]||TUTORIAL_STEPS[0];
    const digits=roomInput.split("").concat(Array(6).fill("")).slice(0,6);
    return(
      <div style={bgStyle}>
        <Stars/><style>{starCss}</style>
        <div style={{...card,padding:"0",width:"480px",overflow:"hidden"}}>
          <div style={{padding:"28px 32px 0",textAlign:"center"}}>
            <div style={{fontSize:"48px",animation:"pu 3s infinite"}}>Globe</div>
            <h1 style={{color:"#fff",fontSize:"22px",margin:"6px 0 2px",letterSpacing:"4px",textTransform:"uppercase"}}>TERRA CONQUEST</h1>
            <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:"0 0 20px",letterSpacing:"2px"}}>
              Welcome, <span style={{color:"#f5c842",fontWeight:"bold"}}>{username}</span>
            </p>
            <div style={{display:"flex",gap:"4px",marginBottom:"0",background:"rgba(0,0,0,.3)",borderRadius:"10px",padding:"4px"}}>
              {[["main","Home"],["multiplayer","Multiplayer"],["tutorial","Tutorial"]].map(([t,l])=>(
                <button key={t} onClick={()=>setMenuTab(t)}
                  style={{flex:1,padding:"8px",background:menuTab===t?"linear-gradient(135deg,#1e3a5f,#2563eb)":"transparent",
                    border:"none",borderRadius:"7px",color:menuTab===t?"white":"rgba(255,255,255,.45)",
                    fontSize:"11px",fontWeight:menuTab===t?"bold":"normal",cursor:"pointer",fontFamily:"Georgia,serif",transition:"all .2s"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={{padding:"24px 32px 28px",maxHeight:"480px",overflowY:"auto"}}>
            {menuTab==="main"&&(
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <button onClick={startSingleplayer}
                  style={{padding:"14px",background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:"12px",color:"white",fontSize:"14px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif"}}>
                  SINGLEPLAYER
                </button>
                <button onClick={()=>setMenuTab("multiplayer")}
                  style={{padding:"14px",background:"linear-gradient(135deg,#1e3a5f,#2563eb)",border:"none",borderRadius:"12px",color:"white",fontSize:"14px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif"}}>
                  MULTIPLAYER
                </button>
                <button onClick={()=>setMenuTab("tutorial")}
                  style={{padding:"12px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"12px",color:"rgba(255,255,255,.7)",fontSize:"13px",cursor:"pointer",fontFamily:"Georgia,serif"}}>
                  Tutorial
                </button>
                <button onClick={()=>{setUsername("");setScreen("home");setMenuTab("main");}}
                  style={{padding:"10px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"10px",color:"rgba(255,255,255,.35)",fontSize:"12px",cursor:"pointer",fontFamily:"Georgia,serif"}}>
                  Log Out
                </button>
              </div>
            )}
            {menuTab==="multiplayer"&&(
              <div>
                <p style={{color:"rgba(255,255,255,.4)",fontSize:"11px",margin:"0 0 16px",textAlign:"center"}}>Enter a 6-digit room code to join a game.</p>
                <div style={{display:"flex",gap:"6px",justifyContent:"center",marginBottom:"14px"}}>
                  {digits.map((d,i)=>(
                    <div key={i} className={"digit-box"+(d?" filled":i===roomInput.length?" active":"")}>{d||""}</div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px",marginBottom:"14px"}}>
                  {[1,2,3,4,5,6,7,8,9,"",0,"DEL"].map((k,i)=>(
                    <button key={i} className="frbtn" onClick={()=>{
                      if(k==="DEL"){setRoomInput(r=>r.slice(0,-1));setRoomError("");}
                      else if(k!==""&&roomInput.length<6){setRoomInput(r=>r+k);setRoomError("");}
                    }} style={{padding:"12px",borderRadius:"9px",fontSize:"18px",fontWeight:"bold",
                      background:k===""?"transparent":"rgba(255,255,255,.07)",
                      border:k===""?"none":"1px solid rgba(255,255,255,.1)",
                      color:k==="DEL"?"#f87171":"white",cursor:k===""?"default":"pointer",fontFamily:"Georgia,serif"}}>
                      {k}
                    </button>
                  ))}
                </div>
                {roomError&&<div style={{color:"#f87171",fontSize:"11px",marginBottom:"10px",padding:"7px 12px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:"8px"}}>{roomError}</div>}
                <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
                  <button className="frbtn" onClick={()=>{const r=String(Math.floor(100000+Math.random()*900000));setRoomInput(r);setRoomError("");}}
                    style={{flex:1,padding:"10px",background:"rgba(59,130,246,.15)",border:"1px solid rgba(59,130,246,.4)",borderRadius:"8px",color:"#93c5fd",fontSize:"11px",cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    Random Code
                  </button>
                  <button className="frbtn" onClick={handleRoom} disabled={roomInput.length!==6}
                    style={{flex:2,padding:"10px",background:roomInput.length===6?"linear-gradient(135deg,#d4a017,#f5c842)":"rgba(255,255,255,.06)",border:"none",borderRadius:"8px",color:roomInput.length===6?"#000":"rgba(255,255,255,.2)",fontSize:"13px",fontWeight:"bold",cursor:roomInput.length===6?"pointer":"not-allowed",fontFamily:"Georgia,serif",letterSpacing:"2px"}}>
                    {roomInput.length===6?"Enter Room":"Enter Code"}
                  </button>
                </div>
                {recentRooms.length>0&&(
                  <div>
                    <div style={{color:"rgba(255,255,255,.25)",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"8px"}}>Recent Rooms</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                      {recentRooms.map(r=>(
                        <button key={r} className="frbtn" onClick={()=>setRoomInput(r)}
                          style={{padding:"5px 12px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"7px",color:"#f5c842",fontSize:"12px",cursor:"pointer",fontFamily:"Georgia,serif"}}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {menuTab==="tutorial"&&(
              <div style={{textAlign:"center"}}>
                <h3 style={{color:"#f5c842",fontSize:"16px",margin:"0 0 10px",letterSpacing:"2px",textTransform:"uppercase"}}>{step.title}</h3>
                <p style={{color:"rgba(255,255,255,.6)",fontSize:"13px",lineHeight:"1.7",margin:"0 0 24px",minHeight:"80px"}}>{step.text}</p>
                <div style={{display:"flex",justifyContent:"center",gap:"6px",marginBottom:"20px"}}>
                  {TUTORIAL_STEPS.map((_,i)=>(
                    <div key={i} onClick={()=>setTutStep(i)} style={{width:i===tutStep?"20px":"8px",height:"8px",borderRadius:"4px",background:i===tutStep?"#f5c842":"rgba(255,255,255,.2)",cursor:"pointer",transition:"all .2s"}}/>
                  ))}
                </div>
                <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
                  {tutStep>0&&<button className="frbtn" onClick={()=>setTutStep(t=>t-1)}
                    style={{padding:"9px 20px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"8px",color:"rgba(255,255,255,.6)",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:"12px"}}>
                    Prev
                  </button>}
                  {tutStep<TUTORIAL_STEPS.length-1&&<button className="frbtn" onClick={()=>setTutStep(t=>t+1)}
                    style={{padding:"9px 20px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",borderRadius:"8px",color:"#000",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:"12px",fontWeight:"bold"}}>
                    Next
                  </button>}
                  {tutStep===TUTORIAL_STEPS.length-1&&<button className="frbtn" onClick={()=>setMenuTab("main")}
                    style={{padding:"9px 20px",background:"linear-gradient(135deg,#16a34a,#22c55e)",border:"none",borderRadius:"8px",color:"white",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:"12px",fontWeight:"bold"}}>
                    Play Now
                  </button>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if(screen==="login"){
    return(
      <div style={bgStyle}>
        <Stars/><style>{starCss}</style>
        <div style={{...card,textAlign:"center"}}>
          <h2 style={{color:"#f5c842",fontSize:"20px",margin:"0 0 6px",letterSpacing:"3px"}}>PICK YOUR COLOR</h2>
          <p style={{color:"rgba(255,255,255,.4)",fontSize:"11px",margin:"0 0 24px"}}>Choose your empire color</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"10px",justifyContent:"center",marginBottom:"28px"}}>
            {CLRS.map((c,i)=>(
              <div key={i} className="cp" onClick={()=>setCidx(i)}
                style={{width:"52px",height:"52px",borderRadius:"12px",background:c.bg,
                  cursor:"pointer",border:cidx===i?"3px solid white":"3px solid transparent",
                  boxShadow:cidx===i?"0 0 16px "+c.bg:"none",opacity:cidx===i?1:0.6}}>
                {cidx===i&&<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"18px",fontWeight:"bold"}}>*</div>}
              </div>
            ))}
          </div>
          <button onClick={startGame}
            style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",borderRadius:"12px",color:"#000",fontSize:"15px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif",boxShadow:"0 8px 24px rgba(212,160,23,.4)"}}>
            ENTER THE WORLD
          </button>
        </div>
      </div>
    );
  }

  return(
    <div style={{width:"100vw",height:"100vh",background:"#060d1a",display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"Georgia,serif",userSelect:"none"}}>
      <style>{"@keyframes pr{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}} @keyframes gl{0%,100%{opacity:.7}50%{opacity:1}} @keyframes coinIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}} @keyframes modalIn{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}} .cp{transition:filter .12s,opacity .12s} .cp:hover{filter:brightness(1.2)}"}</style>

      {notif&&(
        <div style={{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",zIndex:9999,
          padding:"10px 20px",borderRadius:"10px",fontSize:"13px",fontWeight:"bold",fontFamily:"Georgia,serif",
          background:notif.type==="success"?"#16a34a":notif.type==="error"?"#dc2626":"#2563eb",
          color:"white",boxShadow:"0 4px 20px rgba(0,0,0,.5)",animation:"coinIn .3s ease",whiteSpace:"nowrap"}}>
          {notif.msg}
        </div>
      )}

      {showDaily&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"linear-gradient(135deg,#0a1628,#0f2040)",border:"1px solid rgba(212,160,23,.5)",borderRadius:"20px",padding:"48px 44px",textAlign:"center",maxWidth:"360px",boxShadow:"0 0 60px rgba(212,160,23,.25)",animation:"modalIn .4s ease"}}>
            <div style={{fontSize:"64px",marginBottom:"12px"}}>Gift</div>
            <h2 style={{color:"#f5c842",fontSize:"22px",margin:"0 0 8px",letterSpacing:"2px"}}>DAILY REWARD</h2>
            <p style={{color:"rgba(255,255,255,.5)",fontSize:"12px",margin:"0 0 16px"}}>Come back every day to claim your coins!</p>
            <div style={{fontSize:"42px",color:"#f5c842",fontWeight:"bold",marginBottom:"8px"}}>
              +{totalDaily.toLocaleString()} coins
            </div>
            {vaultBonus>0&&<p style={{color:"#fcd34d",fontSize:"12px",margin:"0 0 20px"}}>Includes +{vaultBonus} from {vaultCount} Gold Vault{vaultCount>1?"s":""}</p>}
            {vaultBonus===0&&<p style={{color:"rgba(255,255,255,.3)",fontSize:"11px",margin:"0 0 20px"}}>Build Gold Vaults to earn +500 extra per vault per day</p>}
            <button onClick={claimDaily} style={{padding:"14px 40px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",borderRadius:"12px",color:"#000",fontSize:"15px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif",boxShadow:"0 8px 24px rgba(212,160,23,.5)"}}>
              CLAIM REWARD
            </button>
          </div>
        </div>
      )}

      {showTerraPass&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowTerraPass(false);}}>
          <div style={{background:"linear-gradient(135deg,#0d0a1f,#1a0d38)",border:"1px solid rgba(139,92,246,.4)",borderRadius:"20px",padding:"28px",width:"520px",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 40px 80px rgba(139,92,246,.2)",animation:"modalIn .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <div>
                <h2 style={{color:"#c4b5fd",fontSize:"20px",margin:"0 0 3px",letterSpacing:"2px"}}>* TERRA PASS</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Complete missions and earn XP to level up</p>
              </div>
              <button onClick={()=>setShowTerraPass(false)}
                style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"5px 10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>X</button>
            </div>
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(139,92,246,.2)",borderRadius:"12px",padding:"14px",marginBottom:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                <span style={{color:"#c4b5fd",fontWeight:"bold",fontSize:"13px"}}>Level {curLevel+1} - {TERRA_PASS[curLevel]?.label}</span>
                <span style={{color:"rgba(255,255,255,.4)",fontSize:"11px"}}>{playerXP.toLocaleString()} XP</span>
              </div>
              <div style={{height:"10px",background:"rgba(255,255,255,.08)",borderRadius:"5px",overflow:"hidden"}}>
                <div style={{height:"100%",width:xpPct+"%",background:"linear-gradient(90deg,#7c3aed,#c4b5fd)",borderRadius:"5px",transition:"width .5s"}}/>
              </div>
              {nextLevelData&&<p style={{color:"rgba(255,255,255,.25)",fontSize:"9px",margin:"5px 0 0"}}>{xpPct}% to Level {curLevel+2}</p>}
            </div>
            <div style={{marginBottom:"22px"}}>
              <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"10px"}}>Daily Missions</div>
              {todayMissions.map(m=>{
                const prog=Math.min(m.goal,missionProgress[m.stat]||0);
                const done=prog>=m.goal;
                const claimed=claimedMissions.includes(m.id);
                const pctM=Math.round((prog/m.goal)*100);
                return(
                  <div key={m.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"10px",padding:"12px 14px",marginBottom:"8px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                      <span style={{color:done?"#f5c842":"white",fontSize:"12px",fontWeight:"bold"}}>{m.label}</span>
                      <span style={{color:"rgba(255,255,255,.4)",fontSize:"10px"}}>{prog}/{m.goal}</span>
                    </div>
                    <div style={{height:"5px",background:"rgba(255,255,255,.08)",borderRadius:"3px",overflow:"hidden",marginBottom:"8px"}}>
                      <div style={{height:"100%",width:pctM+"%",background:done?"#f5c842":"#7c3aed",borderRadius:"3px"}}/>
                    </div>
                    {done&&!claimed&&(
                      <button onClick={async()=>{
                        const next=[...claimedMissions,m.id];
                        setClaimedMissions(next);
                        setMyInventory(inv=>{const ni={...inv,coins:inv.coins+m.coins,_claimedMissions:next};(async()=>{try{await saveInv(ni);}catch(e){}})();return ni;});
                        flash("Mission claimed: +"+m.coins+" coins!","success");
                      }} style={{width:"100%",padding:"6px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",borderRadius:"7px",color:"#000",fontSize:"11px",fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>
                        Claim +{m.coins} coins
                      </button>
                    )}
                    {claimed&&<div style={{color:"#22c55e",fontSize:"10px",textAlign:"center"}}>Claimed</div>}
                    {!done&&<div style={{color:"rgba(255,255,255,.25)",fontSize:"10px"}}>+{m.xp} XP + {m.coins} coins on completion</div>}
                  </div>
                );
              })}
            </div>
            <div style={{marginBottom:"22px"}}>
              <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"10px"}}>Terra Pass Levels</div>
              {TERRA_PASS.filter(p=>p.reward).map(p=>{
                const reached=playerXP>=p.xpNeeded;
                const claimed=claimedPassLevels.includes(p.level);
                return(
                  <div key={p.level} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:reached?"rgba(139,92,246,.1)":"rgba(255,255,255,.02)",border:"1px solid "+(reached?"rgba(139,92,246,.3)":"rgba(255,255,255,.06)"),borderRadius:"10px",padding:"10px 14px",marginBottom:"6px",opacity:reached?1:0.5}}>
                    <div>
                      <div style={{color:reached?"#c4b5fd":"rgba(255,255,255,.4)",fontSize:"12px",fontWeight:"bold"}}>Lv {p.level} - {p.label}</div>
                      <div style={{color:"rgba(255,255,255,.3)",fontSize:"10px"}}>{p.reward.amount} {p.reward.type} - need {p.xpNeeded} XP</div>
                    </div>
                    {reached&&!claimed&&<button onClick={()=>claimPassLevel(p.level)} style={{padding:"6px 12px",background:"linear-gradient(135deg,#7c3aed,#c4b5fd)",border:"none",borderRadius:"7px",color:"white",fontSize:"11px",fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>Claim</button>}
                    {claimed&&<div style={{color:"#22c55e",fontSize:"11px"}}>Claimed</div>}
                    {!reached&&<div style={{color:"rgba(255,255,255,.25)",fontSize:"10px"}}>{p.xpNeeded} XP</div>}
                  </div>
                );
              })}
            </div>
            <div>
              <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"10px"}}>Achievements</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {ACHIEVEMENTS.map(a=>{
                  const unlocked=achievements.includes(a.id);
                  return(
                    <div key={a.id} style={{display:"flex",alignItems:"center",gap:"8px",background:unlocked?"rgba(212,160,23,.1)":"rgba(255,255,255,.02)",border:"1px solid "+(unlocked?"rgba(212,160,23,.3)":"rgba(255,255,255,.06)"),borderRadius:"8px",padding:"8px 10px",opacity:unlocked?1:0.5}}>
                      <span style={{fontSize:"18px",filter:unlocked?"none":"grayscale(1)"}}>{a.emoji}</span>
                      <div>
                        <div style={{color:unlocked?"#fcd34d":"rgba(255,255,255,.3)",fontSize:"10px",fontWeight:"bold"}}>{a.name}</div>
                        <div style={{color:"rgba(255,255,255,.25)",fontSize:"8px"}}>{unlocked?"+"+a.xp+" XP earned":a.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {showShop&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowShop(false);}}>
          <div style={{background:"linear-gradient(135deg,#0a1628,#0d1f38)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"20px",padding:"32px",width:"480px",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 40px 80px rgba(0,0,0,.6)",animation:"modalIn .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <div>
                <h2 style={{color:"white",fontSize:"18px",margin:"0 0 3px",letterSpacing:"1px"}}>War Shop</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Coins: <span style={{color:"#f5c842",fontWeight:"bold"}}>{myInventory.coins.toLocaleString()}</span></p>
              </div>
              <button onClick={()=>setShowShop(false)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"5px 10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>X</button>
            </div>
            {SHOP_ITEMS.map(item=>{
              const buildings=myInventory.buildings||[];
              let price=item.price;
              if(item.id==="tank"){const bc=buildings.filter(b=>b==="barracks").length;price=Math.floor(price*Math.pow(0.8,bc));}
              if(item.id==="plane"){const ac=buildings.filter(b=>b==="airbase").length;price=Math.floor(price*Math.pow(0.85,ac));}
              if(item.id==="bomber"&&buildings.includes("embassy"))price=Math.floor(price*0.9);
              const can=myInventory.coins>=price;
              const owned=myInventory[item.id]||0;
              return(
                <div key={item.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"12px",marginBottom:"8px"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
                      <span style={{color:item.color,fontWeight:"bold",fontSize:"13px"}}>{item.label}</span>
                      <span style={{background:"rgba(255,255,255,.08)",borderRadius:"6px",padding:"1px 7px",color:"rgba(255,255,255,.5)",fontSize:"10px"}}>x{owned}</span>
                      {item.dmg>0&&<span style={{background:"rgba(239,68,68,.12)",borderRadius:"6px",padding:"1px 7px",color:"#fca5a5",fontSize:"10px"}}>{item.dmg} dmg</span>}
                    </div>
                    <p style={{color:"rgba(255,255,255,.4)",fontSize:"10px",margin:0}}>{item.desc}</p>
                  </div>
                  <button onClick={()=>buyItem(item)} disabled={!can}
                    style={{padding:"8px 16px",marginLeft:"12px",background:can?"linear-gradient(135deg,"+item.color+"99,"+item.color+")":"rgba(255,255,255,.05)",border:"none",borderRadius:"8px",color:can?"white":"rgba(255,255,255,.2)",cursor:can?"pointer":"not-allowed",fontSize:"12px",fontWeight:"bold",fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>
                    {price.toLocaleString()} coins
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showBuildShop&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowBuildShop(false);}}>
          <div style={{background:"linear-gradient(135deg,#0a1628,#0d1f38)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"20px",padding:"32px",width:"520px",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 40px 80px rgba(0,0,0,.6)",animation:"modalIn .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
              <div>
                <h2 style={{color:"white",fontSize:"18px",margin:"0 0 3px",letterSpacing:"1px"}}>Build Shop</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Materials: {MATERIALS.map(m=><span key={m.id} style={{color:m.color,marginRight:"8px"}}>{m.label}: {myInventory[m.id]||0}</span>)}</p>
              </div>
              <button onClick={()=>setShowBuildShop(false)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"5px 10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>X</button>
            </div>
            <div style={{background:"rgba(255,255,255,.03)",borderRadius:"10px",padding:"10px 14px",marginBottom:"16px"}}>
              <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"6px"}}>Buildings Owned</div>
              {(myInventory.buildings||[]).length===0
                ?<div style={{color:"rgba(255,255,255,.2)",fontSize:"11px"}}>No buildings yet</div>
                :<div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                  {Object.entries((myInventory.buildings||[]).reduce((a,b)=>{a[b]=(a[b]||0)+1;return a;},{})).map(([id,qty])=>{
                    const bld=BUILDINGS.find(b=>b.id===id);
                    const isFactory=id==="coin_factory";
                    const vc=(myInventory.buildings||[]).filter(b=>b==="vault").length;
                    return<span key={id} style={{background:"rgba(255,255,255,.08)",borderRadius:"6px",padding:"2px 8px",color:bld?.color||"white",fontSize:"10px"}}>{bld?.label||id} x{qty}{isFactory&&qty>0?" (+"+((COIN_FACTORY_YIELD+vc*2)*qty)+"/s)":""}</span>;
                  })}
                </div>
              }
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {BUILDINGS.map(bld=>{
                const buildings=myInventory.buildings||[];
                const owned=buildings.filter(b=>b===bld.id).length;
                const atLimit=owned>=bld.max;
                const canBuild=!atLimit&&Object.entries(bld.cost).every(([m,q])=>(myInventory[m]||0)>=q);
                const isFactory=bld.id==="coin_factory";
                const vc=(myInventory.buildings||[]).filter(b=>b==="vault").length;
                return(
                  <div key={bld.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"12px"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                        <span style={{color:bld.color,fontWeight:"bold",fontSize:"13px"}}>{bld.label}</span>
                        <span style={{background:"rgba(255,255,255,.08)",borderRadius:"6px",padding:"1px 7px",color:"rgba(255,255,255,.5)",fontSize:"10px"}}>{owned}/{bld.max}</span>
                        {atLimit&&<span style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:"4px",padding:"1px 6px",color:"#fca5a5",fontSize:"9px"}}>MAX</span>}
                        {isFactory&&owned>0&&<span style={{background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.3)",borderRadius:"4px",padding:"1px 6px",color:"#6ee7b7",fontSize:"9px"}}>+{(COIN_FACTORY_YIELD+vc*2)*owned}/s</span>}
                      </div>
                      <p style={{color:"rgba(255,255,255,.4)",fontSize:"10px",margin:"0 0 5px"}}>{bld.desc}</p>
                      <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                        {Object.entries(bld.cost).map(([mat,qty])=>{
                          const matDef=MATERIALS.find(m=>m.id===mat);
                          const have=myInventory[mat]||0;
                          const ok=have>=qty;
                          return<span key={mat} style={{background:ok?"rgba(16,185,129,.12)":"rgba(239,68,68,.12)",border:"1px solid "+(ok?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"),borderRadius:"4px",padding:"1px 7px",color:ok?"#6ee7b7":"#fca5a5",fontSize:"9px"}}>{matDef?.label||mat}: {have}/{qty}</span>;
                        })}
                      </div>
                    </div>
                    <button onClick={()=>buildBuilding(bld)} disabled={!canBuild}
                      style={{padding:"8px 14px",flexShrink:0,marginLeft:"12px",background:canBuild?"linear-gradient(135deg,"+bld.color+"99,"+bld.color+")":"rgba(255,255,255,.05)",border:"none",borderRadius:"8px",color:canBuild?"white":"rgba(255,255,255,.2)",cursor:canBuild?"pointer":"not-allowed",fontSize:"11px",fontWeight:"bold",fontFamily:"Georgia,serif"}}>
                      {atLimit?"MAX":"Build"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {attackPlan&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.80)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)setAttackPlan(null);}}>
          <div style={{background:"linear-gradient(135deg,#0a1628,#0d1f38)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"20px",padding:"28px",width:"420px",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 40px 80px rgba(0,0,0,.6)",animation:"modalIn .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
              <div>
                <h2 style={{color:"white",fontSize:"17px",margin:"0 0 3px",letterSpacing:"1px"}}>Deploy Forces</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Attacking: <span style={{color:"#f5c842"}}>{attackPlan.country.name}</span></p>
              </div>
              <button onClick={()=>setAttackPlan(null)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"5px 10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>X</button>
            </div>
            {[
              {id:"tank",    label:"Tanks",    dmg:DMG.tank,    color:"#f59e0b"},
              {id:"bomb",    label:"Bombs",    dmg:DMG.bomb,    color:"#ef4444"},
              {id:"plane",   label:"Planes",   dmg:DMG.plane,   color:"#3b82f6"},
              {id:"missile", label:"Missiles", dmg:DMG.missile, color:"#f97316"},
              {id:"bomber",  label:"Bombers",  dmg:DMG.bomber,  color:"#dc2626"},
            ].map(({id,label,dmg,color})=>{
              const max=myInventory[id]||0;
              const val=deploy[id]||0;
              return(
                <div key={id} style={{marginBottom:"14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                    <div>
                      <span style={{color:"white",fontWeight:"bold",fontSize:"13px"}}>{label}</span>
                      <span style={{color:"rgba(255,255,255,.35)",fontSize:"10px",marginLeft:"6px"}}>{dmg} dmg each</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <button onClick={()=>setDeploy(d=>({...d,[id]:Math.max(0,(d[id]||0)-1)}))} style={{width:"26px",height:"26px",borderRadius:"6px",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"white",fontSize:"16px",cursor:"pointer",lineHeight:"1"}}>-</button>
                      <span style={{color:color,fontWeight:"bold",fontSize:"18px",minWidth:"24px",textAlign:"center"}}>{val}</span>
                      <button onClick={()=>setDeploy(d=>({...d,[id]:Math.min(max,(d[id]||0)+1)}))} style={{width:"26px",height:"26px",borderRadius:"6px",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.15)",color:"white",fontSize:"16px",cursor:"pointer",lineHeight:"1"}}>+</button>
                    </div>
                  </div>
                  <div style={{position:"relative",height:"6px",background:"rgba(255,255,255,.08)",borderRadius:"3px",cursor:"pointer"}}
                    onClick={e=>{const r=e.currentTarget.getBoundingClientRect();setDeploy(d=>({...d,[id]:Math.round(((e.clientX-r.left)/r.width)*max)}));}}>
                    <div style={{height:"100%",width:max>0?((val/max)*100)+"%":"0%",background:"linear-gradient(90deg,"+color+"88,"+color+")",borderRadius:"3px",transition:"width .1s"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:"3px"}}>
                    <span style={{color:"rgba(255,255,255,.25)",fontSize:"9px"}}>0</span>
                    <span style={{color:"rgba(255,255,255,.35)",fontSize:"9px"}}>Have: {max}</span>
                  </div>
                </div>
              );
            })}
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"12px",padding:"14px 16px",marginBottom:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <span style={{color:"rgba(255,255,255,.5)",fontSize:"11px"}}>Total Firepower</span>
                <span style={{color:"white",fontWeight:"bold",fontSize:"18px"}}>{atkDamage} dmg</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <span style={{color:"rgba(255,255,255,.5)",fontSize:"11px"}}>Win Chance</span>
                <span style={{color:atkBarColor,fontWeight:"bold",fontSize:"22px"}}>{atkPct}%</span>
              </div>
              <div style={{height:"8px",background:"rgba(255,255,255,.08)",borderRadius:"4px",overflow:"hidden"}}>
                <div style={{height:"100%",width:atkPct+"%",background:"linear-gradient(90deg,"+atkBarColor+"88,"+atkBarColor+")",transition:"width .3s"}}/>
              </div>
            </div>
            <button onClick={confirmAttack} disabled={!hasWeapons}
              style={{width:"100%",padding:"13px",background:hasWeapons?"linear-gradient(135deg,#dc2626,#ef4444)":"rgba(255,255,255,.06)",border:"none",borderRadius:"12px",color:hasWeapons?"white":"rgba(255,255,255,.2)",fontSize:"14px",fontWeight:"bold",cursor:hasWeapons?"pointer":"not-allowed",letterSpacing:"2px",fontFamily:"Georgia,serif"}}>
              {hasWeapons?"LAUNCH ATTACK":"Select Weapons First"}
            </button>
          </div>
        </div>
      )}

      <div style={{background:"rgba(0,0,0,.92)",borderBottom:"1px solid rgba(255,255,255,.07)",padding:"7px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:"8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:myC.bg,boxShadow:"0 0 5px "+myC.bg}}/>
          <span style={{color:"white",fontSize:"11px"}}>{username}</span>
          <span style={{color:myC.light,fontSize:"10px",fontWeight:"bold"}}>{mine.length} terr</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <span style={{color:"#f5c842",fontWeight:"bold",fontSize:"13px"}}>{myInventory.coins.toLocaleString()} coins</span>
          {canClaimDaily&&<button onClick={()=>setShowDaily(true)} style={{padding:"4px 8px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",borderRadius:"6px",color:"#000",fontSize:"10px",fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>DAILY</button>}
          <button onClick={()=>setShowShop(true)} style={{padding:"4px 9px",background:"rgba(239,68,68,.2)",border:"1px solid rgba(239,68,68,.4)",borderRadius:"6px",color:"#fca5a5",cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif"}}>SHOP</button>
          <button onClick={()=>setShowBuildShop(true)} style={{padding:"4px 9px",background:"rgba(16,185,129,.2)",border:"1px solid rgba(16,185,129,.4)",borderRadius:"6px",color:"#6ee7b7",cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif"}}>BUILD</button>
          <button onClick={()=>setShowTerraPass(true)} style={{padding:"4px 9px",background:"rgba(139,92,246,.2)",border:"1px solid rgba(139,92,246,.4)",borderRadius:"6px",color:"#c4b5fd",cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif"}}>PASS</button>
          <button onClick={()=>setAttackMode(m=>!m)}
            style={{padding:"4px 9px",background:attackMode?"linear-gradient(135deg,#dc2626,#ef4444)":"rgba(255,255,255,.08)",border:attackMode?"none":"1px solid rgba(255,255,255,.15)",borderRadius:"6px",color:attackMode?"white":"rgba(255,255,255,.6)",cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif",animation:attackMode?"pr 1.5s infinite":undefined}}>
            {attackMode?"CANCEL ATK":"ATTACK"}
          </button>
          <button onClick={()=>{setAttackMode(false);setScreen("menu");setRoomInput("");setRoomCode("");setOwnership({});setPlayers({});setMenuTab("multiplayer");setIsSingleplayer(false);setBotInventories({});}}
            style={{padding:"4px 9px",background:"transparent",border:"1px solid rgba(255,255,255,.12)",borderRadius:"6px",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif"}}>
            Exit
          </button>
        </div>
      </div>

      <div style={{flex:1,overflow:"hidden",position:"relative"}}>
        <svg ref={svgRef} viewBox="0 0 1800 950" style={{width:"100%",height:"100%"}}
          onMouseMove={e=>{
            const r=svgRef.current?.getBoundingClientRect();
            if(r)setTip(t=>({...t,x:e.clientX-r.left,y:e.clientY-r.top}));
          }}
          onMouseLeave={()=>{setHovered(null);setTip(t=>({...t,show:false}));}}>
          <rect width="1800" height="950" fill="#0a1628"/>
          <rect width="1800" height="950" fill="url(#ocean)"/>
          <defs>
            <radialGradient id="ocean" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0d2444"/>
              <stop offset="100%" stopColor="#060d1a"/>
            </radialGradient>
          </defs>
          {COUNTRIES.map(c=>{
            const owner=ownership[c.id];
            const isMe=owner===username;
            const ownerIdx=owner&&players[owner]?players[owner].cidx:null;
            const fillColor=owner?(CLRS[ownerIdx%CLRS.length]?.bg||"#555"):"#1e3a5f";
            const inReach=reachable.has(c.id);
            const isHovered=hovered===c.id;
            let stroke="rgba(255,255,255,.12)";
            let sw=0.5;
            let fill=fillColor;
            if(isMe){stroke="#ffffff";sw=1;}
            if(attackMode&&inReach&&!isMe){stroke="#ff4444";sw=2;fill=isHovered?"#ff2222":fillColor;}
            if(isHovered&&!attackMode){fill=isMe?"#ffffff22":fillColor+"dd";}
            return(
              <path key={c.id} d={c.d} fill={fill} stroke={stroke} strokeWidth={sw}
                style={{cursor:attackMode&&inReach&&!isMe?"crosshair":"default",transition:"fill .15s"}}
                onMouseEnter={e=>{
                  setHovered(c.id);
                  const r=svgRef.current?.getBoundingClientRect();
                  if(r)setTip({show:true,x:e.clientX-r.left,y:e.clientY-r.top,c,owner:owner||null,inReach:attackMode&&inReach&&!isMe});
                }}
                onMouseLeave={()=>{setHovered(null);setTip(t=>({...t,show:false}));}}
                onClick={()=>startAttack(c)}
              />
            );
          })}
        </svg>

        {tip.show&&tip.c&&(
          <div style={{position:"absolute",left:tip.x+12,top:tip.y-8,pointerEvents:"none",zIndex:100,
            background:"rgba(6,13,26,.96)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"10px",padding:"10px 14px",minWidth:"140px"}}>
            <div style={{color:"white",fontWeight:"bold",fontSize:"12px",marginBottom:"3px"}}>{tip.c.name}</div>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:"10px",marginBottom:"4px"}}>Area: {tip.c.area}</div>
            {tip.owner
              ?<div style={{color:CLRS[(players[tip.owner]?.cidx||0)%CLRS.length].light,fontSize:"11px",marginBottom:"4px"}}>{tip.owner}</div>
              :<div style={{color:"rgba(255,255,255,.35)",fontSize:"11px",marginBottom:"4px"}}>Unclaimed</div>
            }
            {tip.inReach&&(
              <div style={{color:"#ff6666",fontSize:"10px",fontWeight:"bold"}}>Click to Attack</div>
            )}
          </div>
        )}

        <div style={{position:"absolute",top:"12px",right:"12px",background:"rgba(0,0,0,.82)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"12px",padding:"10px 14px",minWidth:"160px"}}>
          <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"8px"}}>Leaderboard</div>
          {lb.map(([name,cnt],i)=>{
            const p=players[name];
            const color=p?CLRS[p.cidx%CLRS.length].bg:"#555";
            const isMe=name===username;
            return(
              <div key={name} style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"5px"}}>
                <span style={{color:"rgba(255,255,255,.3)",fontSize:"9px",width:"10px"}}>{i+1}</span>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:color,flexShrink:0}}/>
                <span style={{color:isMe?"#f5c842":"rgba(255,255,255,.7)",fontSize:"10px",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</span>
                <span style={{color:"rgba(255,255,255,.5)",fontSize:"10px"}}>{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
