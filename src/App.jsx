import { useState, useEffect, useRef } from "react";

// All DB calls go through /api/db - no keys in the client
const sb={
  from:(table)=>({
    select:(cols)=>({
      eq:(col,val)=>({
        single:()=>fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({op:"select",table,cols:cols||"*",filter:{col,val}})}).then(r=>r.json()).catch(e=>({data:null,error:e}))
      })
    }),
    upsert:(data)=>fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({op:"upsert",table,data})}).then(r=>r.json()).catch(e=>({error:e}))
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

const DMG={tank:0.5,bomb:2,plane:3,missile:6,bomber:10,artillery:4,drone:8};
const DAILY_REWARD=3000;
const COIN_FACTORY_YIELD=5;
const COIN_FACTORY_INTERVAL_MS=1000;
const BOT_NAMES=["BotAlpha","BotBeta","BotGamma","BotDelta"];

const SHOP_ITEMS=[
  {id:"tank",      label:"Tank",      desc:"Basic ground unit. Cheap & reliable.",        price:120,  dmg:DMG.tank,      color:"#f59e0b"},
  {id:"bomb",      label:"Bomb",      desc:"Explosive. High damage.",                     price:200,  dmg:DMG.bomb,      color:"#ef4444"},
  {id:"plane",     label:"Plane",     desc:"Air unit. Extends attack radius to 3.",       price:350,  dmg:DMG.plane,     color:"#3b82f6"},
  {id:"missile",   label:"Missile",   desc:"Ballistic strike. Very high damage.",         price:500,  dmg:DMG.missile,   color:"#f97316"},
  {id:"artillery", label:"Artillery", desc:"Heavy cannon. 4 dmg, area suppression.",     price:450,  dmg:DMG.artillery, color:"#a78bfa"},
  {id:"drone",     label:"Drone",     desc:"Precision strike. 8 dmg, hard to intercept.",price:800,  dmg:DMG.drone,     color:"#06b6d4"},
  {id:"bomber",    label:"Bomber",    desc:"Carpet bomb. Highest damage.",                price:1200, dmg:DMG.bomber,    color:"#dc2626"},
  {id:"air_def",   label:"Air Def",   desc:"Reduces enemy win chance by 5% each.",       price:900,  dmg:0,             color:"#6366f1"},
];

const MATERIALS=[
  {id:"wood",    label:"Wood",    color:"#84cc16"},
  {id:"stone",   label:"Stone",   color:"#94a3b8"},
  {id:"iron",    label:"Iron",    color:"#6b7280"},
  {id:"gold",    label:"Gold",    color:"#f59e0b"},
  {id:"uranium", label:"Uranium", color:"#4ade80"},
];

const BUILDINGS=[
  {id:"barracks",    label:"Barracks",    desc:"Discounts Tanks by 20% per barracks.",    max:3, cost:{wood:3,stone:2},      color:"#f59e0b"},
  {id:"airbase",     label:"Air Base",    desc:"Discounts Planes by 15% per airbase.",    max:2, cost:{stone:3,iron:2},      color:"#3b82f6"},
  {id:"coin_factory",label:"Coin Factory",desc:"Earns "+COIN_FACTORY_YIELD+" coins/sec.", max:5, cost:{iron:3,stone:2},      color:"#10b981"},
  {id:"vault",       label:"Gold Vault",  desc:"+500 daily reward. +2 coins/sec/factory.",max:3, cost:{gold:2,iron:3},       color:"#f59e0b"},
  {id:"spy_academy", label:"Spy Academy", desc:"Trains 1 spy every 20 min.",              max:1, cost:{wood:4,gold:1},       color:"#10b981"},
  {id:"watchtower",  label:"Watchtower",  desc:"Unlocks the Satellite recipe in Weapons Lab. Also lets you see attacker weapon counts.", max:1, cost:{wood:5,stone:3},      color:"#6366f1"},
  {id:"embassy",     label:"Embassy",     desc:"+5% win chance when attacking.",          max:1, cost:{gold:3,stone:4},      color:"#f97316"},
  {id:"port",        label:"Port",        desc:"+1 attack range (coastal countries only).",max:1, cost:{wood:4,iron:2},      color:"#06b6d4"},
  {id:"mine",        label:"Mine",        desc:"+1 Iron & Stone per bonus tick.",          max:2, cost:{wood:2,stone:4},     color:"#78716c"},
  {id:"uranium_ext", label:"Uranium Extractor",desc:"Converts 1 Gold into 1 Uranium/min.",max:1, cost:{iron:4,stone:3},    color:"#4ade80"},
  {id:"nuclear_reactor",label:"Nuclear Reactor",desc:"Boosts ALL weapon damage by 50%.", max:1, cost:{iron:5,uranium:3,stone:7}, color:"#a78bfa"},
  {id:"fortress",    label:"Fortress",    desc:"Fortifies all your territories. Reduces enemy win chance by 10%.", max:1, cost:{stone:8,iron:5},  color:"#f43f5e"},
  {id:"black_market",label:"Black Market",desc:"Unlocks the Black Market for rare deals.", max:1, cost:{gold:4,iron:3},     color:"#8b5cf6"},
];

// Black market pool - 3 random items shown per session
const BLACK_MARKET_POOL=[
  {id:"bm_drone3",  label:"3 Drones",        desc:"Rare precision weapons",                  cost:{coins:1500,gold:1}, reward:{drone:3}},
  {id:"bm_uranium3",label:"3 Uranium",       desc:"Rare radioactive material",               cost:{coins:2000},        reward:{uranium:3}},
  {id:"bm_gold2",   label:"2 Gold Bars",     desc:"Precious metal, hard to find",            cost:{coins:1800,iron:3}, reward:{gold:2}},
  {id:"bm_spy3",    label:"3 Spies",         desc:"Trained operatives, ready to deploy",     cost:{coins:2500},        reward:{spy:3}},
  {id:"bm_missile5",label:"5 Missiles",      desc:"Bulk missile shipment",                   cost:{coins:1200,iron:2}, reward:{missile:5}},
  {id:"bm_stealth", label:"Stealth Kit",     desc:"Next attack: +15% win chance bonus",      cost:{coins:2000,gold:1}, reward:{stealth_kit:1}},
  {id:"bm_shield",  label:"Attack Shield",   desc:"Blocks the next enemy attack on you",     cost:{coins:3500,iron:4}, reward:{shield:1}},
  {id:"bm_bomber2", label:"2 Bombers",       desc:"Devastating carpet bombers",              cost:{coins:2000,iron:3}, reward:{bomber:2}},
  {id:"bm_xp500",   label:"XP Boost",        desc:"Instantly gain 500 Terra Pass XP",       cost:{coins:4000},        reward:{xp:500}},
  {id:"bm_artillery3",label:"3 Artillery",   desc:"Heavy cannon units",                      cost:{coins:1000,iron:2}, reward:{artillery:3}},
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

function calcDamage(tank,bomb,plane,missile,bomber,artillery=0,drone=0){
  return Math.round((
    tank*DMG.tank+
    bomb*DMG.bomb+
    plane*DMG.plane+
    missile*DMG.missile+
    bomber*DMG.bomber+
    artillery*DMG.artillery+
    drone*DMG.drone
  )*10)/10;
}

function calcWinChance(area,damage,spyCount,academySpies,airDef,hasFortress=false,stealthKit=false){
  const base=Math.min(0.95,damage/(area*0.8));
  const spyBonus=(spyCount+academySpies)*0.01;
  const defPenalty=airDef*0.05+(hasFortress?0.10:0);
  const stealthBonus=stealthKit?0.15:0;
  return Math.max(0.02,Math.min(0.97,base+spyBonus-defPenalty+stealthBonus));
}

const COUNTRIES = [
  { id:"russia", name:"Russia", area:220, lx:1100, ly:95,
    bonus:{troops:3, label:"+3 tanks/min"},
    borders:["norway","finland","estonia","latvia","lithuania","belarus","ukraine","georgia","azerbaijan","kazakhstan","china","mongolia","north_korea"],
    d:"M830,60 L860,55 L900,50 L950,55 L1000,48 L1060,52 L1120,45 L1180,50 L1240,45 L1300,52 L1360,48 L1420,55 L1480,50 L1540,58 L1580,52 L1620,60 L1660,55 L1700,65 L1720,80 L1700,100 L1680,115 L1650,120 L1620,110 L1580,125 L1550,115 L1510,130 L1470,120 L1430,135 L1390,125 L1350,138 L1310,128 L1270,142 L1230,132 L1190,145 L1150,135 L1110,148 L1070,138 L1030,150 L990,140 L950,152 L910,142 L880,155 L850,145 L830,158 L810,148 L790,160 L780,148 L800,135 L795,120 L810,105 L800,90 L810,75 Z"
  },
  { id:"canada", name:"Canada", area:180, lx:310, ly:180,
    bonus:{wood:2, label:"+2 wood/min"},
    borders:["usa"],
    d:"M60,80 L120,72 L180,68 L240,62 L300,58 L360,55 L420,58 L460,52 L500,58 L520,70 L510,90 L530,105 L515,125 L530,140 L515,158 L530,172 L510,185 L490,178 L470,190 L445,183 L420,195 L395,188 L370,198 L340,190 L310,200 L280,192 L250,202 L220,194 L190,204 L160,196 L130,206 L100,198 L75,210 L60,198 L50,182 L60,165 L45,148 L58,132 L45,115 L60,98 Z"
  },
  { id:"usa", name:"United States", area:150, lx:280, ly:280,
    bonus:{coins:50, label:"+50 coins/sec"},
    borders:["canada","mexico"],
    d:"M68,210 L520,210 L524,218 L518,232 L528,248 L514,265 L524,280 L510,295 L495,288 L478,300 L460,292 L440,305 L418,297 L395,310 L368,300 L340,312 L308,302 L278,315 L245,304 L212,318 L178,308 L145,320 L110,310 L78,322 L60,310 L52,295 L62,278 L50,260 L64,242 L50,225 Z"
  },
  { id:"alaska", name:"Alaska", area:40, lx:95, ly:130,
    borders:["canada","russia"],
    d:"M30,95 L130,88 L145,100 L138,118 L148,132 L134,145 L118,138 L100,150 L82,142 L65,154 L48,145 L35,155 L22,142 L18,125 L28,110 Z"
  },
  { id:"greenland", name:"Greenland", area:35, lx:560, ly:85,
    borders:["canada"],
    d:"M525,55 L595,50 L615,65 L608,85 L618,100 L605,118 L588,112 L570,125 L550,118 L535,130 L518,120 L508,105 L515,88 L508,72 Z"
  },
  { id:"mexico", name:"Mexico", area:55, lx:195, ly:340,
    borders:["usa","guatemala","belize"],
    d:"M68,320 L240,318 L248,332 L238,348 L248,362 L235,375 L218,368 L200,380 L180,372 L160,385 L140,376 L120,388 L100,378 L80,390 L65,380 L58,365 L68,348 L55,332 Z"
  },
  { id:"cuba", name:"Cuba", area:12, lx:340, ly:348,
    borders:["usa","mexico"],
    d:"M298,338 L385,336 L390,345 L378,354 L360,352 L338,358 L312,354 L295,346 Z"
  },
  { id:"guatemala", name:"Guatemala", area:8, lx:178, ly:395,
    borders:["mexico","belize","honduras","colombia"],
    d:"M120,382 L218,380 L222,392 L212,402 L195,405 L175,402 L155,408 L135,402 L118,394 Z"
  },
  { id:"colombia", name:"Colombia", area:38, lx:290, ly:430,
    borders:["venezuela","ecuador","peru","brazil","panama","guatemala"],
    d:"M220,405 L352,402 L358,418 L350,432 L358,448 L342,460 L320,452 L298,465 L274,456 L250,468 L225,458 L208,445 L215,428 L205,415 Z"
  },
  { id:"venezuela", name:"Venezuela", area:35, lx:368, ly:428,
    borders:["colombia","brazil","guyana","trinidad"],
    d:"M350,402 L445,400 L452,415 L444,428 L452,442 L436,454 L412,446 L388,458 L362,448 L350,435 L358,420 Z"
  },
  { id:"ecuador", name:"Ecuador", area:14, lx:222, ly:470,
    borders:["colombia","peru"],
    d:"M200,458 L258,455 L262,468 L254,482 L238,488 L218,482 L198,472 Z"
  },
  { id:"peru", name:"Peru", area:55, lx:255, ly:510,
    borders:["ecuador","colombia","brazil","bolivia","chile"],
    d:"M195,475 L318,470 L325,488 L316,510 L322,532 L306,552 L280,560 L252,548 L225,555 L200,542 L185,522 L192,502 Z"
  },
  { id:"brazil", name:"Brazil", area:148, lx:400, ly:510,
    borders:["venezuela","colombia","peru","bolivia","paraguay","argentina","uruguay"],
    d:"M350,440 L530,438 L545,458 L555,480 L548,505 L555,528 L542,552 L520,568 L492,580 L462,592 L430,598 L398,590 L365,598 L335,585 L315,565 L308,542 L318,518 L312,492 L320,468 L338,452 Z"
  },
  { id:"bolivia", name:"Bolivia", area:38, lx:318, ly:570,
    borders:["peru","brazil","paraguay","argentina","chile"],
    d:"M250,550 L378,545 L382,562 L372,580 L378,598 L360,612 L335,618 L308,610 L280,618 L258,605 L245,588 L252,570 Z"
  },
  { id:"paraguay", name:"Paraguay", area:18, lx:368, ly:610,
    borders:["bolivia","brazil","argentina"],
    d:"M318,600 L420,596 L424,612 L415,628 L395,632 L370,628 L345,635 L322,622 L315,608 Z"
  },
  { id:"chile", name:"Chile", area:32, lx:248, ly:625,
    borders:["peru","bolivia","argentina"],
    d:"M215,600 L265,596 L268,618 L260,642 L250,668 L238,695 L224,720 L208,735 L195,725 L198,700 L210,672 L218,645 L212,618 Z"
  },
  { id:"argentina", name:"Argentina", area:80, lx:330, ly:660,
    borders:["chile","bolivia","paraguay","brazil","uruguay"],
    d:"M264,618 L445,612 L450,632 L442,655 L448,678 L435,702 L415,718 L390,725 L360,720 L330,728 L298,720 L268,728 L248,715 L238,695 L250,668 L260,642 L268,618 Z"
  },
  { id:"uruguay", name:"Uruguay", area:12, lx:405, ly:638,
    borders:["brazil","argentina"],
    d:"M380,628 L448,624 L452,640 L442,655 L418,660 L390,655 L375,642 Z"
  },
  // \u2500\u2500\u2500 Europe \u2500\u2500\u2500
  { id:"iceland", name:"Iceland", area:12, lx:638, ly:118,
    borders:["uk","norway"],
    d:"M608,102 L672,98 L678,112 L668,128 L648,134 L625,128 L605,118 Z"
  },
  { id:"norway", name:"Norway", area:25, lx:862, ly:160,
    borders:["russia","finland","sweden","iceland","uk"],
    d:"M828,108 L875,102 L888,118 L878,138 L888,155 L872,170 L855,162 L838,174 L820,165 L810,150 L818,135 L808,118 Z"
  },
  { id:"sweden", name:"Sweden", area:22, lx:892, ly:178,
    borders:["norway","finland","russia"],
    d:"M875,108 L912,105 L918,122 L910,142 L916,160 L900,175 L882,168 L872,152 L880,135 L878,118 Z"
  },
  { id:"finland", name:"Finland", area:20, lx:928, ly:165,
    borders:["norway","sweden","russia"],
    d:"M910,108 L948,105 L952,122 L945,142 L950,162 L935,175 L918,168 L910,152 L916,135 L912,118 Z"
  },
  { id:"uk", name:"UK", area:14, lx:812, ly:205,
    borders:["ireland","france","norway","iceland"],
    d:"M790,188 L835,185 L840,200 L832,218 L818,225 L800,218 L788,205 Z"
  },
  { id:"ireland", name:"Ireland", area:10, lx:770, ly:208,
    borders:["uk"],
    d:"M748,195 L788,192 L792,208 L784,222 L765,225 L748,215 Z"
  },
  { id:"portugal", name:"Portugal", area:10, lx:755, ly:270,
    borders:["spain"],
    d:"M738,250 L772,248 L776,265 L768,282 L750,285 L736,272 Z"
  },
  { id:"spain", name:"Spain", area:28, lx:795, ly:262,
    borders:["portugal","france","andorra","morocco"],
    d:"M770,242 L858,240 L864,255 L856,272 L840,280 L815,285 L785,282 L768,268 Z"
  },
  { id:"france", name:"France", area:22, lx:832, ly:232,
    borders:["spain","andorra","monaco","italy","switzerland","germany","luxembourg","belgium","uk"],
    d:"M798,215 L868,212 L874,228 L866,248 L848,255 L820,258 L798,248 L792,232 Z"
  },
  { id:"germany", name:"Germany", area:18, lx:880, ly:218,
    borders:["france","belgium","netherlands","denmark","poland","czechia","austria","switzerland"],
    d:"M865,200 L912,198 L918,215 L910,232 L895,238 L872,235 L862,220 Z"
  },
  { id:"poland", name:"Poland", area:18, lx:920, ly:215,
    borders:["germany","russia","belarus","ukraine","czechia","slovakia"],
    d:"M910,198 L958,196 L962,212 L954,230 L938,236 L912,232 L906,218 Z"
  },
  { id:"czechia", name:"Czechia", area:10, lx:900, ly:232,
    borders:["germany","poland","austria","slovakia"],
    d:"M866,225 L920,222 L924,235 L916,245 L890,248 L865,242 Z"
  },
  { id:"austria", name:"Austria", area:10, lx:900, ly:248,
    borders:["germany","czechia","slovakia","hungary","slovenia","italy","switzerland","liechtenstein"],
    d:"M865,240 L935,237 L938,250 L928,260 L898,262 L866,255 Z"
  },
  { id:"switzerland", name:"Switzerland", area:8, lx:862, ly:245,
    borders:["france","germany","austria","italy","liechtenstein"],
    d:"M840,238 L876,235 L880,248 L870,258 L842,255 L836,245 Z"
  },
  { id:"italy", name:"Italy", area:20, lx:898, ly:270,
    borders:["france","switzerland","austria","slovenia","san_marino","vatican"],
    d:"M862,252 L920,250 L925,265 L918,282 L905,298 L888,312 L872,320 L858,308 L850,290 L855,272 Z"
  },
  { id:"greece", name:"Greece", area:12, lx:938, ly:295,
    borders:["albania","north_macedonia","bulgaria","turkey"],
    d:"M912,278 L958,275 L962,292 L954,310 L936,318 L915,312 L908,295 Z"
  },
  { id:"romania", name:"Romania", area:16, lx:958, ly:248,
    borders:["ukraine","moldova","bulgaria","serbia","hungary"],
    d:"M934,232 L985,230 L990,248 L982,265 L962,268 L936,262 L930,248 Z"
  },
  { id:"ukraine", name:"Ukraine", area:28, lx:978, ly:228,
    borders:["russia","belarus","poland","slovakia","hungary","romania","moldova"],
    d:"M955,210 L1040,208 L1046,225 L1038,242 L1010,248 L978,245 L952,240 L948,225 Z"
  },
  { id:"belarus", name:"Belarus", area:14, lx:968, ly:198,
    borders:["russia","ukraine","poland","latvia","lithuania"],
    d:"M946,182 L1002,180 L1008,198 L1000,215 L970,218 L944,212 Z"
  },
  { id:"turkey", name:"Turkey", area:32, lx:1010, ly:280,
    borders:["greece","bulgaria","georgia","armenia","iran","iraq","syria"],
    d:"M960,262 L1072,258 L1080,275 L1070,292 L1042,298 L1008,302 L975,298 L958,282 Z"
  },
  { id:"bulgaria", name:"Bulgaria", area:10, lx:960, ly:265,
    borders:["romania","serbia","north_macedonia","greece","turkey"],
    d:"M932,255 L985,252 L988,268 L978,280 L950,282 L930,272 Z"
  },
  { id:"hungary", name:"Hungary", area:10, lx:930, ly:252,
    borders:["austria","slovakia","ukraine","romania","serbia","croatia","slovenia"],
    d:"M902,242 L958,240 L962,255 L952,268 L922,270 L900,262 Z"
  },
  // \u2500\u2500\u2500 Africa \u2500\u2500\u2500
  { id:"morocco", name:"Morocco", area:22, lx:790, ly:310,
    borders:["spain","algeria","mauritania","western_sahara"],
    d:"M760,290 L820,288 L826,308 L818,328 L795,335 L770,328 L756,312 Z"
  },
  { id:"algeria", name:"Algeria", area:55, lx:848, ly:325,
    borders:["morocco","tunisia","libya","niger","mali","mauritania"],
    d:"M818,285 L925,282 L932,310 L924,342 L895,358 L858,362 L820,355 L808,325 Z"
  },
  { id:"libya", name:"Libya", area:45, lx:928, ly:315,
    borders:["algeria","tunisia","egypt","niger","chad","sudan"],
    d:"M922,280 L1010,278 L1018,308 L1010,342 L982,358 L945,362 L920,348 L912,318 Z"
  },
  { id:"egypt", name:"Egypt", area:40, lx:1014, ly:308,
    borders:["libya","sudan","israel","jordan","saudi"],
    d:"M1008,278 L1082,275 L1090,305 L1082,335 L1052,348 L1018,345 L1005,320 Z"
  },
  { id:"mauritania", name:"Mauritania", area:30, lx:782, ly:358,
    borders:["morocco","algeria","mali","senegal"],
    d:"M750,332 L830,328 L835,355 L826,380 L795,385 L762,378 L746,358 Z"
  },
  { id:"mali", name:"Mali", area:42, lx:840, ly:370,
    borders:["mauritania","algeria","niger","burkina","guinea","senegal"],
    d:"M828,330 L922,328 L928,358 L920,390 L888,398 L850,402 L818,395 L808,362 Z"
  },
  { id:"niger", name:"Niger", area:42, lx:912, ly:368,
    borders:["mali","algeria","libya","chad","nigeria","burkina","benin"],
    d:"M920,330 L1008,328 L1014,360 L1006,392 L972,400 L935,405 L910,395 L905,362 Z"
  },
  { id:"chad", name:"Chad", area:40, lx:992, ly:368,
    borders:["niger","libya","sudan","cameroon","nigeria","car"],
    d:"M1005,328 L1078,325 L1085,358 L1076,392 L1044,402 L1008,405 L992,392 L990,360 Z"
  },
  { id:"sudan", name:"Sudan", area:42, lx:1065, ly:358,
    borders:["egypt","libya","chad","car","south_sudan","ethiopia","eritrea"],
    d:"M1080,305 L1148,302 L1155,335 L1148,370 L1118,385 L1082,388 L1058,375 L1052,342 Z"
  },
  { id:"senegal", name:"Senegal", area:10, lx:752, ly:402,
    borders:["mauritania","mali","guinea","gambia"],
    d:"M730,380 L778,378 L782,395 L774,412 L752,415 L730,408 Z"
  },
  { id:"guinea", name:"Guinea", area:12, lx:768, ly:420,
    borders:["senegal","mali","sierra_leone","liberia","ivory_coast"],
    d:"M742,408 L805,405 L810,422 L800,438 L775,442 L745,435 Z"
  },
  { id:"nigeria", name:"Nigeria", area:42, lx:878, ly:408,
    borders:["niger","chad","cameroon","benin"],
    d:"M842,395 L948,392 L954,415 L945,442 L912,450 L872,452 L840,442 L832,418 Z"
  },
  { id:"cameroon", name:"Cameroon", area:22, lx:968, ly:418,
    borders:["nigeria","chad","car","congo","gabon","eq_guinea"],
    d:"M945,392 L1010,390 L1016,415 L1008,442 L978,450 L948,448 L940,425 Z"
  },
  { id:"ethiopia", name:"Ethiopia", area:40, lx:1108, ly:408,
    borders:["sudan","eritrea","djibouti","somalia","kenya","south_sudan"],
    d:"M1072,385 L1155,382 L1162,408 L1152,435 L1120,448 L1085,452 L1060,438 L1052,412 Z"
  },
  { id:"somalia", name:"Somalia", area:28, lx:1165, ly:420,
    borders:["ethiopia","kenya","djibouti"],
    d:"M1150,378 L1205,375 L1215,405 L1205,442 L1178,462 L1152,458 L1140,435 L1142,408 Z"
  },
  { id:"south_sudan", name:"S. Sudan", area:28, lx:1065, ly:418,
    borders:["sudan","ethiopia","car","drc","uganda","kenya"],
    d:"M1040,385 L1120,382 L1126,408 L1116,432 L1082,438 L1048,432 L1035,412 Z"
  },
  { id:"kenya", name:"Kenya", area:24, lx:1122, ly:455,
    borders:["ethiopia","somalia","tanzania","uganda","south_sudan"],
    d:"M1085,435 L1152,432 L1158,455 L1148,478 L1115,485 L1082,478 L1072,455 Z"
  },
  { id:"drc", name:"D.R. Congo", area:65, lx:1002, ly:458,
    borders:["cameroon","car","south_sudan","uganda","rwanda","burundi","tanzania","zambia","angola","congo"],
    d:"M968,430 L1080,428 L1088,458 L1078,495 L1045,510 L1005,515 L968,508 L950,478 L955,452 Z"
  },
  { id:"angola", name:"Angola", area:38, lx:968, ly:515,
    borders:["drc","zambia","namibia"],
    d:"M942,498 L1060,495 L1065,522 L1055,552 L1020,562 L980,565 L945,555 L932,528 Z"
  },
  { id:"tanzania", name:"Tanzania", area:32, lx:1098, ly:490,
    borders:["kenya","uganda","rwanda","burundi","drc","zambia","mozambique","malawi"],
    d:"M1080,470 L1158,468 L1165,492 L1155,518 L1122,528 L1085,522 L1068,498 Z"
  },
  { id:"zambia", name:"Zambia", area:30, lx:1042, ly:532,
    borders:["angola","drc","tanzania","malawi","mozambique","zimbabwe","botswana","namibia"],
    d:"M1002,508 L1092,505 L1098,530 L1088,558 L1052,565 L1012,558 L998,535 Z"
  },
  { id:"mozambique", name:"Mozambique", area:25, lx:1098, ly:548,
    borders:["tanzania","malawi","zambia","zimbabwe","south_africa","swaziland"],
    d:"M1068,518 L1135,515 L1142,542 L1132,572 L1098,582 L1065,572 L1055,545 Z"
  },
  { id:"zimbabwe", name:"Zimbabwe", area:18, lx:1040, ly:555,
    borders:["zambia","mozambique","south_africa","botswana"],
    d:"M1008,535 L1082,532 L1088,558 L1078,578 L1042,582 L1008,575 Z"
  },
  { id:"namibia", name:"Namibia", area:22, lx:970, ly:558,
    borders:["angola","zambia","botswana","south_africa"],
    d:"M940,528 L1012,525 L1018,552 L1008,578 L975,585 L942,578 Z"
  },
  { id:"botswana", name:"Botswana", area:18, lx:1018, ly:578,
    borders:["namibia","zambia","zimbabwe","south_africa"],
    d:"M1008,555 L1075,552 L1080,575 L1068,598 L1030,602 L1000,595 Z"
  },
  { id:"south_africa", name:"S. Africa", area:42, bonus:{gold:1, label:"+1 gold/min"}, lx:1012, ly:608,
    borders:["namibia","botswana","zimbabwe","mozambique","swaziland","lesotho"],
    d:"M940,578 L1098,575 L1106,605 L1095,638 L1055,652 L1010,655 L965,648 L935,618 Z"
  },
  { id:"madagascar", name:"Madagascar", area:22, lx:1182, ly:545,
    borders:["mozambique"],
    d:"M1158,502 L1205,500 L1212,528 L1202,562 L1178,578 L1155,565 L1148,538 Z"
  },
  // \u2500\u2500\u2500 Middle East \u2500\u2500\u2500
  { id:"saudi", name:"Saudi Arabia", area:55, bonus:{gold:1, label:"+1 gold/min"}, lx:1088, ly:355,
    borders:["jordan","iraq","iran","uae","oman","qatar","bahrain","yemen"],
    d:"M1055,310 L1148,305 L1155,332 L1148,368 L1118,388 L1078,395 L1042,385 L1025,355 L1032,325 Z"
  },
  { id:"iraq", name:"Iraq", area:22, lx:1075, ly:292,
    borders:["turkey","iran","saudi","jordan","syria","kuwait"],
    d:"M1045,262 L1112,258 L1120,278 L1112,302 L1085,315 L1052,312 L1038,292 Z"
  },
  { id:"syria", name:"Syria", area:14, lx:1045, ly:270,
    borders:["turkey","iraq","jordan","lebanon","israel"],
    d:"M1018,252 L1080,250 L1086,268 L1076,285 L1045,288 L1018,280 Z"
  },
  { id:"jordan", name:"Jordan", area:12, lx:1038, ly:298,
    borders:["syria","iraq","saudi","israel"],
    d:"M1012,275 L1055,272 L1062,292 L1052,312 L1025,318 L1008,302 Z"
  },
  { id:"iran", name:"Iran", area:55, lx:1135, ly:288,
    borders:["turkey","iraq","saudi","uae","oman","pakistan","afghanistan","turkmenistan","armenia","azerbaijan"],
    d:"M1082,252 L1195,248 L1205,275 L1198,308 L1165,328 L1122,335 L1082,325 L1068,298 Z"
  },
  { id:"yemen", name:"Yemen", area:22, lx:1098, ly:388,
    borders:["saudi","oman"],
    d:"M1058,375 L1148,372 L1155,392 L1145,415 L1108,422 L1068,415 L1050,395 Z"
  },
  { id:"oman", name:"Oman", area:18, lx:1172, ly:368,
    borders:["uae","saudi","iran","yemen"],
    d:"M1145,342 L1198,338 L1205,362 L1196,392 L1165,402 L1138,392 L1130,368 Z"
  },
  { id:"uae", name:"UAE", area:8, lx:1175, ly:342,
    borders:["saudi","oman","iran"],
    d:"M1148,325 L1195,322 L1200,340 L1188,352 L1155,355 L1142,342 Z"
  },
  // \u2500\u2500\u2500 Central/South Asia \u2500\u2500\u2500
  { id:"kazakhstan", name:"Kazakhstan", area:62, lx:1250, ly:215,
    borders:["russia","china","kyrgyzstan","tajikistan","uzbekistan","turkmenistan"],
    d:"M1165,182 L1330,178 L1338,205 L1328,235 L1295,248 L1248,252 L1200,248 L1162,232 Z"
  },
  { id:"uzbekistan", name:"Uzbekistan", area:16, lx:1218, ly:268,
    borders:["kazakhstan","tajikistan","kyrgyzstan","afghanistan","turkmenistan"],
    d:"M1185,248 L1260,245 L1268,265 L1258,285 L1222,288 L1185,280 Z"
  },
  { id:"afghanistan", name:"Afghanistan", area:28, lx:1228, ly:298,
    borders:["iran","pakistan","tajikistan","uzbekistan","turkmenistan","china"],
    d:"M1195,272 L1292,268 L1300,292 L1288,318 L1250,325 L1205,322 L1188,302 Z"
  },
  { id:"pakistan", name:"Pakistan", area:38, lx:1262, ly:328,
    borders:["iran","afghanistan","china","india"],
    d:"M1200,315 L1308,312 L1318,338 L1308,368 L1268,378 L1225,372 L1198,352 Z"
  },
  { id:"india", name:"India", area:72, lx:1305, ly:388,
    borders:["pakistan","china","nepal","bhutan","bangladesh","myanmar","srilanka"],
    d:"M1262,362 L1375,358 L1385,390 L1375,425 L1348,452 L1308,465 L1265,458 L1240,428 L1238,395 Z"
  },
  { id:"nepal", name:"Nepal", area:10, lx:1335, ly:355,
    borders:["india","china"],
    d:"M1272,340 L1368,337 L1374,355 L1362,365 L1280,368 L1268,355 Z"
  },
  { id:"bangladesh", name:"Bangladesh", area:8, lx:1368, ly:388,
    borders:["india","myanmar"],
    d:"M1355,365 L1395,362 L1400,382 L1390,402 L1362,405 L1348,388 Z"
  },
  { id:"srilanka", name:"Sri Lanka", area:6, lx:1318, ly:468,
    borders:["india"],
    d:"M1295,452 L1332,448 L1338,468 L1325,485 L1300,482 Z"
  },
  // \u2500\u2500\u2500 East/SE Asia \u2500\u2500\u2500
  { id:"mongolia", name:"Mongolia", area:55, lx:1388, ly:218,
    borders:["russia","china"],
    d:"M1315,182 L1498,178 L1506,205 L1495,232 L1438,242 L1372,245 L1315,238 Z"
  },
  { id:"china", name:"China", area:118, bonus:{troops:2, label:"+2 tanks/min"}, lx:1445, ly:295,
    borders:["russia","mongolia","kazakhstan","kyrgyzstan","tajikistan","afghanistan","pakistan","india","nepal","bhutan","myanmar","laos","vietnam","north_korea"],
    d:"M1302,232 L1512,228 L1525,262 L1518,305 L1495,338 L1455,352 L1398,358 L1345,350 L1302,325 L1288,295 Z"
  },
  { id:"north_korea", name:"N. Korea", area:10, lx:1548, ly:265,
    borders:["china","russia","south_korea"],
    d:"M1515,242 L1560,238 L1568,258 L1558,278 L1522,282 L1508,265 Z"
  },
  { id:"south_korea", name:"S. Korea", area:8, lx:1550, ly:285,
    borders:["north_korea"],
    d:"M1512,275 L1555,272 L1562,292 L1550,308 L1515,308 Z"
  },
  { id:"japan", name:"Japan", area:22, bonus:{coins:35, label:"+35 coins/sec"}, lx:1588, ly:262,
    borders:["south_korea","china"],
    d:"M1565,232 L1612,228 L1620,252 L1610,278 L1578,288 L1558,272 Z"
  },
  { id:"myanmar", name:"Myanmar", area:22, lx:1415, ly:378,
    borders:["china","india","bangladesh","laos","thailand"],
    d:"M1385,342 L1448,338 L1458,365 L1448,398 L1415,412 L1378,405 L1365,378 Z"
  },
  { id:"thailand", name:"Thailand", area:22, lx:1445, ly:412,
    borders:["myanmar","laos","cambodia","malaysia"],
    d:"M1415,392 L1472,388 L1482,415 L1471,445 L1438,452 L1405,445 L1398,418 Z"
  },
  { id:"vietnam", name:"Vietnam", area:18, lx:1492, ly:405,
    borders:["china","laos","cambodia"],
    d:"M1468,368 L1518,365 L1528,395 L1518,432 L1488,442 L1462,432 L1452,405 Z"
  },
  { id:"cambodia", name:"Cambodia", area:10, lx:1468, ly:445,
    borders:["thailand","vietnam","laos"],
    d:"M1435,428 L1488,425 L1494,448 L1482,465 L1448,468 L1428,452 Z"
  },
  { id:"laos", name:"Laos", area:12, lx:1470, ly:388,
    borders:["china","vietnam","cambodia","thailand","myanmar"],
    d:"M1445,358 L1490,355 L1498,382 L1488,408 L1458,412 L1440,392 Z"
  },
  { id:"malaysia", name:"Malaysia", area:14, lx:1462, ly:468,
    borders:["thailand","indonesia","singapore","brunei"],
    d:"M1415,452 L1495,448 L1502,468 L1490,485 L1428,488 L1408,472 Z"
  },
  { id:"philippines", name:"Philippines", area:18, lx:1545, ly:420,
    borders:["indonesia","malaysia"],
    d:"M1518,390 L1572,386 L1580,415 L1568,448 L1535,455 L1508,442 L1502,415 Z"
  },
  { id:"indonesia", name:"Indonesia", area:68, lx:1505, ly:498,
    borders:["malaysia","timor","papua"],
    d:"M1412,470 L1650,465 L1660,488 L1648,510 L1415,515 L1400,492 Z"
  },
  // \u2500\u2500\u2500 Oceania \u2500\u2500\u2500
  { id:"papua", name:"Papua N.G.", area:28, lx:1672, ly:490,
    borders:["indonesia","australia"],
    d:"M1645,462 L1715,458 L1722,482 L1710,508 L1672,515 L1642,505 Z"
  },
  { id:"australia", name:"Australia", area:128, lx:1615, ly:580,
    borders:["indonesia","papua","new_zealand"],
    d:"M1452,505 L1725,500 L1738,538 L1732,582 L1705,622 L1655,645 L1590,655 L1520,648 L1462,622 L1432,580 L1435,542 Z"
  },
  { id:"new_zealand", name:"New Zealand", area:16, lx:1755, ly:618,
    borders:["australia"],
    d:"M1728,588 L1775,582 L1785,610 L1772,645 L1742,658 L1718,642 L1715,618 Z"
  },
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

const starCss="@keyframes twinkle{0%,100%{opacity:.1}50%{opacity:.65}} @keyframes pu{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}} @keyframes si{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes digitPop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}} .digit-box{transition:all .18s cubic-bezier(.34,1.56,.64,1);border:1.5px solid rgba(255,255,255,.12);border-radius:10px;width:42px;height:54px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;color:white;background:rgba(255,255,255,.04);font-family:Georgia,serif} .digit-box.active{border-color:#f5c842;box-shadow:0 0 16px rgba(245,200,66,.25);background:rgba(245,200,66,.06)} .digit-box.filled{border-color:rgba(255,255,255,.3);background:rgba(255,255,255,.09);animation:digitPop .25s cubic-bezier(.34,1.56,.64,1)} .frbtn{transition:all .15s ease} .frbtn:hover{filter:brightness(1.12);transform:translateY(-1px)} .frbtn:active{transform:translateY(0)} .cp{transition:all .15s ease} .cp:hover{filter:brightness(1.18);transform:scale(1.05)} input:focus{outline:none!important;border-color:rgba(245,200,66,.5)!important;box-shadow:0 0 0 2px rgba(245,200,66,.12)!important}";

const bgStyle={minHeight:"100vh",background:"radial-gradient(ellipse at 40% 20%,#0d1f3c 0%,#081428 50%,#030810 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",position:"relative",overflow:"hidden"};
const card={background:"linear-gradient(160deg,#0c1e35,#0a1628)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"22px",padding:"36px",width:"420px",position:"relative",zIndex:1,boxShadow:"0 32px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.06)"};

function OnlineCount(){
  const [count,setCount]=useState(null);
  useEffect(()=>{
    const fetch_=async()=>{
      try{
        const {data}=await sb.from("world").select("players").eq("room_code","__lobby__").single();
        if(data&&data.players){
          const now=Date.now();
          const active=Object.entries(data.players).filter(([k,v])=>!k.startsWith("_")&&v.ts&&(now-v.ts)<120000).length;
          setCount(active);
        }else{setCount(0);}
      }catch(e){setCount(null);}
    };
    fetch_();
    const t=setInterval(fetch_,15000);
    return()=>clearInterval(t);
  },[]);
  if(count===null)return null;
  return(
    <div style={{position:"absolute",top:"16px",left:"16px",display:"flex",alignItems:"center",gap:"7px",padding:"6px 12px",background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"20px",backdropFilter:"blur(4px)"}}>
      <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 8px #22c55e",animation:"pu 2s infinite"}}/>
      <span style={{color:"rgba(255,255,255,.6)",fontSize:"11px",letterSpacing:"1px"}}>{count} online</span>
    </div>
  );
}

export default function EarthConquest(){
  const [screen,setScreen]=useState("home");
  const [menuTab,setMenuTab]=useState("main");
  const [username,setUsername]=useState("");
  const usernameRef=useRef("");
  const [inputName,setInputName]=useState("");
  const [inputPassword,setInputPassword]=useState("");
  const [loginError,setLoginError]=useState("");
  const [cidx,setCidx]=useState(0);
  const [ownership,setOwnership]=useState({});
  const [players,setPlayers]=useState({});
  const [roomCode,setRoomCode]=useState("");
  const roomCodeRef=useRef("");
  const [roomInput,setRoomInput]=useState("");
  const [roomError,setRoomError]=useState("");
  const [recentRooms,setRecentRooms]=useState([]);
  const [myInventory,setMyInventory]=useState({coins:500,tank:5,bomb:3,plane:1,missile:1,bomber:0,artillery:0,drone:0,air_def:0,spy:0,satellite:0,lastDaily:"",wood:0,stone:0,iron:0,gold:0,uranium:0,nuke_bomb:0,stealth_kit:0,shield:0,buildings:[],lastFactory:0,factoryCount:0,academySpies:0,lastAcademy:0});
  const [hovered,setHovered]=useState(null);
  const [tip,setTip]=useState({show:false,x:0,y:0,c:null,owner:null,inReach:false});
  const [notif,setNotif]=useState(null);
  const [attackMode,setAttackMode]=useState(false);
  const [reachable,setReachable]=useState(new Set());
  const [showShop,setShowShop]=useState(false);
  const [showBuildShop,setShowBuildShop]=useState(false);
  const [showMatShop,setShowMatShop]=useState(false);
  const [showDaily,setShowDaily]=useState(false);
  const [showTerraPass,setShowTerraPass]=useState(false);
  const [showBlackMarket,setShowBlackMarket]=useState(false);
  const [blackMarketItems,setBlackMarketItems]=useState([]);
  const [attackPlan,setAttackPlan]=useState(null);
  const [deploy,setDeploy]=useState({tank:0,bomb:0,plane:0,missile:0,bomber:0,artillery:0,drone:0});
  const [tutStep,setTutStep]=useState(0);
  const [isSingleplayer,setIsSingleplayer]=useState(false);
  const [difficulty,setDifficulty]=useState("normal");
  const [botInventories,setBotInventories]=useState({});
  const [playerXP,setPlayerXP]=useState(0);
  const [achievements,setAchievements]=useState([]);
  const [missionProgress,setMissionProgress]=useState({});
  const [claimedMissions,setClaimedMissions]=useState([]);
  const [claimedPassLevels,setClaimedPassLevels]=useState([]);
  const svgRef=useRef(null);
  const ownershipRef=useRef({});
  const botInvRef=useRef({});
  const menuAudioRef=useRef(null);
  const mapAudioRef=useRef(null);

  // Sound effects using Web Audio API
  const sfx=useRef(null);
  useEffect(()=>{
    try{sfx.current=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}
  },[]);
  const playSound=(type)=>{
    if(musicMuted)return;
    const ctx=sfx.current;
    if(!ctx)return;
    const g=ctx.createGain();
    g.connect(ctx.destination);
    const o=ctx.createOscillator();
    o.connect(g);
    const sounds={
      win:    ()=>{g.gain.setValueAtTime(0.3,ctx.currentTime);o.type="sine";o.frequency.setValueAtTime(440,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+0.3);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.5);o.start();o.stop(ctx.currentTime+0.5);},
      lose:   ()=>{g.gain.setValueAtTime(0.3,ctx.currentTime);o.type="sawtooth";o.frequency.setValueAtTime(300,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(80,ctx.currentTime+0.4);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.5);o.start();o.stop(ctx.currentTime+0.5);},
      buy:    ()=>{g.gain.setValueAtTime(0.2,ctx.currentTime);o.type="sine";o.frequency.setValueAtTime(600,ctx.currentTime);o.frequency.setValueAtTime(800,ctx.currentTime+0.05);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.2);o.start();o.stop(ctx.currentTime+0.2);},
      build:  ()=>{g.gain.setValueAtTime(0.2,ctx.currentTime);o.type="square";o.frequency.setValueAtTime(200,ctx.currentTime);o.frequency.setValueAtTime(400,ctx.currentTime+0.1);o.frequency.setValueAtTime(600,ctx.currentTime+0.2);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35);o.start();o.stop(ctx.currentTime+0.35);},
      attack: ()=>{g.gain.setValueAtTime(0.25,ctx.currentTime);o.type="sawtooth";o.frequency.setValueAtTime(150,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(50,ctx.currentTime+0.3);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3);o.start();o.stop(ctx.currentTime+0.3);},
      nuke:   ()=>{const g2=ctx.createGain();g2.connect(ctx.destination);g2.gain.setValueAtTime(0.5,ctx.currentTime);o.type="sawtooth";o.frequency.setValueAtTime(80,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(20,ctx.currentTime+1);g2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+1.2);o.connect(g2);o.start();o.stop(ctx.currentTime+1.2);},
      daily:  ()=>{[0,0.1,0.2].forEach((t,i)=>{const o2=ctx.createOscillator();const g2=ctx.createGain();o2.connect(g2);g2.connect(ctx.destination);o2.type="sine";o2.frequency.value=[523,659,784][i];g2.gain.setValueAtTime(0.2,ctx.currentTime+t);g2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t+0.3);o2.start(ctx.currentTime+t);o2.stop(ctx.currentTime+t+0.3);});},
      steal:  ()=>{g.gain.setValueAtTime(0.2,ctx.currentTime);o.type="sine";o.frequency.setValueAtTime(1000,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(200,ctx.currentTime+0.3);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.3);o.start();o.stop(ctx.currentTime+0.3);},
      upgrade:()=>{[0,0.08,0.16,0.24].forEach((t,i)=>{const o2=ctx.createOscillator();const g2=ctx.createGain();o2.connect(g2);g2.connect(ctx.destination);o2.type="sine";o2.frequency.value=[400,500,600,800][i];g2.gain.setValueAtTime(0.15,ctx.currentTime+t);g2.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+t+0.2);o2.start(ctx.currentTime+t);o2.stop(ctx.currentTime+t+0.2);});},
    };
    try{sounds[type]&&sounds[type]();}catch(e){}
  };
  const [musicMuted,setMusicMuted]=useState(false);
  const [musicVol,setMusicVol]=useState(0.5);
  const [chatMsgs,setChatMsgs]=useState([]);
  const [showChat,setShowChat]=useState(true);
  const [attackEffects,setAttackEffects]=useState([]);
  const [hoveredCountry,setHoveredCountry]=useState(null);
  const [showCraftShop,setShowCraftShop]=useState(false);

  const [nukedCountries,setNukedCountries]=useState({});
  const nukedRef=useRef({});
  const saveWorld=async(o,p,nuked)=>{
    if(isSingleplayer)return;
    const nk=nuked!==undefined?nuked:nukedRef.current;
    try{await sb.from("world").upsert({room_code:roomCodeRef.current||roomCode,ownership:o,players:p,nuked:nk},{onConflict:"room_code"});}catch(e){}
  };

  const saveInv=async(inv,name)=>{
    const n=name||username;
    if(!n||isSingleplayer)return;
    try{await sb.from("inventory").upsert({username:n,data:inv},{onConflict:"username"});}catch(e){}
  };

  const flash=(msg,type="info")=>{setNotif({msg,type});setTimeout(()=>setNotif(null),3500);};

  useEffect(()=>{
    const menu=menuAudioRef.current;
    const map=mapAudioRef.current;
    const isMenuScreen=screen==="home"||screen==="menu"||screen==="login";
    const isMapScreen=screen==="map";
    if(isMenuScreen){
      if(menu){menu.volume=musicMuted?0:musicVol;menu.play().catch(()=>{});}
      if(map){map.pause();map.currentTime=0;}
    }else if(isMapScreen){
      if(menu){menu.pause();menu.currentTime=0;}
      if(map){map.volume=musicMuted?0:musicVol;map.play().catch(()=>{});}
    }else{
      if(menu){menu.pause();menu.currentTime=0;}
      if(map){map.pause();map.currentTime=0;}
    }
  },[screen]);

  useEffect(()=>{
    if(menuAudioRef.current)menuAudioRef.current.volume=musicMuted?0:musicVol;
    if(mapAudioRef.current)mapAudioRef.current.volume=musicMuted?0:musicVol;
  },[musicVol,musicMuted]);

  const CHAT_PROMPTS=[
    {id:"gg",    label:"GG",           msg:"Good game!"},
    {id:"wp",    label:"Well played",  msg:"Well played!"},
    {id:"ez",    label:"EZ",           msg:"EZ lol"},
    {id:"rip",   label:"RIP",          msg:"RIP"},
    {id:"noob",  label:"Noob",         msg:"What a noob"},
    {id:"rush",  label:"Stop rushing", msg:"Stop rushing me!"},
    {id:"letsgo",label:"LET'S GO!",    msg:"LETS GOOO"},
    {id:"truce", label:"Truce?",       msg:"Can we have a truce?"},
    {id:"nice",  label:"Nice attack",  msg:"Nice attack!"},
  ];


  const NUKE_RECIPE={uranium:10,iron:7,gold:2,coins:2000};
  const craftNuke=async()=>{
    if((myInventory.uranium||0)<NUKE_RECIPE.uranium){flash("Need 10 Uranium!","error");return;}
    if((myInventory.iron||0)<NUKE_RECIPE.iron){flash("Need 7 Iron!","error");return;}
    if((myInventory.gold||0)<NUKE_RECIPE.gold){flash("Need 2 Gold!","error");return;}
    if((myInventory.coins||0)<NUKE_RECIPE.coins){flash("Need 2000 coins!","error");return;}
    const newInv={...myInventory,
      uranium:(myInventory.uranium||0)-10,
      iron:(myInventory.iron||0)-7,
      gold:(myInventory.gold||0)-2,
      coins:(myInventory.coins||0)-2000,
      nuke_bomb:(myInventory.nuke_bomb||0)+1,
    };
    setMyInventory(newInv);
    await saveInv(newInv);
    flash("Nuclear Bomb crafted!","success");
  };

  const SAT_RECIPE={uranium:5,iron:10,gold:2};
  const craftSatellite=async()=>{
    if(!(myInventory.buildings||[]).includes("watchtower")){flash("Need a Watchtower first!","error");return;}
    if((myInventory.uranium||0)<SAT_RECIPE.uranium){flash("Need 5 Uranium!","error");return;}
    if((myInventory.iron||0)<SAT_RECIPE.iron){flash("Need 10 Iron!","error");return;}
    if((myInventory.gold||0)<SAT_RECIPE.gold){flash("Need 2 Gold!","error");return;}
    const newInv={...myInventory,
      uranium:(myInventory.uranium||0)-5,
      iron:(myInventory.iron||0)-10,
      gold:(myInventory.gold||0)-2,
      satellite:(myInventory.satellite||0)+1,
    };
    setMyInventory(newInv);
    await saveInv(newInv);
    playSound("build");
    flash("Satellite crafted! Launch it at any enemy country.","success");
  };

  const [satelliteMode,setSatelliteMode]=useState(false);
  const [shockedCountries,setShockedCountries]=useState({}); // {countryId: expiresAt timestamp}

  // Clean up expired shocks
  useEffect(()=>{
    const t=setInterval(()=>{
      const now=Date.now();
      setShockedCountries(prev=>{
        const updated={};
        for(const[id,exp] of Object.entries(prev)){if(exp>now)updated[id]=exp;}
        return Object.keys(updated).length===Object.keys(prev).length?prev:updated;
      });
    },5000);
    return()=>clearInterval(t);
  },[]);

  const launchSatellite=async(country)=>{
    if((myInventory.satellite||0)<1){flash("No satellites!","error");return;}
    const targetOwner=ownership[country.id];
    if(!targetOwner||targetOwner===username){flash("Must target an enemy country!","error");return;}
    const newInv={...myInventory,satellite:Math.max(0,(myInventory.satellite||0)-1)};
    setMyInventory(newInv);
    await saveInv(newInv);
    triggerAttackEffect(country);
    playSound("nuke");
    // Shock the country for 5 minutes
    const expiresAt=Date.now()+5*60*1000;
    setShockedCountries(prev=>({...prev,[country.id]:expiresAt}));
    flash("SATELLITE STRIKE on "+country.name+"! Country paralyzed for 5 minutes - "+targetOwner+" cannot use it!","success");
    addXP(15);
    setSatelliteMode(false);
    setAttackMode(false);
  };

  const triggerAttackEffect=(country)=>{
    const effect={id:Date.now(),x:country.lx,y:country.ly,name:country.name};
    setAttackEffects(prev=>[...prev,effect]);
    setTimeout(()=>setAttackEffects(prev=>prev.filter(e=>e.id!==effect.id)),900);
  };

  const sendChat=async(prompt)=>{
    if(isSingleplayer)return;
    const msg={u:username,t:prompt.msg,ts:Date.now()};
    setPlayers(prev=>{
      const next={...prev,_chat:[...(prev._chat||[]).slice(-19),msg]};
      setChatMsgs(next._chat);
      (async()=>{
        try{
          const {data:cur}=await sb.from("world").select("ownership,players,nuked").eq("room_code",roomCode).single();
          if(cur)await sb.from("world").upsert({room_code:roomCode,ownership:cur.ownership,players:next,nuked:cur.nuked||{}},{onConflict:"room_code"});
        }catch(e){}
      })();
      return next;
    });
  };

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
        const {data}=await sb.from("world").select("ownership,players,nuked").eq("room_code",roomCode).single();
        if(data){
          setOwnership(prev=>{const inc=data.ownership||{};if(JSON.stringify(prev)===JSON.stringify(inc))return prev;ownershipRef.current=inc;return inc;});
          const inc=data.players||{};
          setPlayers(prev=>{if(JSON.stringify(prev)===JSON.stringify(inc))return prev;return inc;});
          const msgs=inc._chat||[];
          setChatMsgs(prev=>{if(JSON.stringify(prev)===JSON.stringify(msgs))return prev;return msgs;});
          const nk=data.nuked||{};
          setNukedCountries(prev=>{if(JSON.stringify(prev)===JSON.stringify(nk))return prev;nukedRef.current=nk;return nk;});
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
        const curSpies=(inv.academySpies||0);
if(curSpies>=15)return inv;
const newInv={...inv,academySpies:curSpies+1,lastAcademy:now};
        if(!isSingleplayer)(async()=>{try{await sb.from("inventory").upsert({username:inv._name||"",data:newInv},{onConflict:"username"});}catch(e){}})();
        return newInv;
      });
    },60000);
    return()=>clearInterval(tick);
  },[username,screen]);

  useEffect(()=>{
    if(!isSingleplayer||screen!=="map")return;
    const cfg=DIFF[difficulty]||DIFF.normal;
    const tick=setInterval(()=>{
      const o=ownershipRef.current;
      const bInv=botInvRef.current;

      // check if player has been eliminated
      const playerTerr=Object.keys(o).filter(id=>o[id]===username);
      if(playerTerr.length===0){
        setScreen("eliminated");
        return;
      }

      BOT_NAMES.forEach(bot=>{
        const bMine=Object.keys(o).filter(id=>o[id]===bot);
        if(bMine.length===0)return;
        if(Math.random()>cfg.attackChance)return;
        const reach=getReachable(bMine,2);
        const targets=[...reach].filter(id=>o[id]!==bot);
        if(targets.length===0)return;
        // hard bots prefer player territories; easy bots pick randomly
        let target;
        if(difficulty==="hard"){
          const playerTargets=targets.filter(id=>o[id]===username);
          target=(playerTargets.length>0&&Math.random()<0.6)?playerTargets[Math.floor(Math.random()*playerTargets.length)]:targets[Math.floor(Math.random()*targets.length)];
        }else if(difficulty==="easy"){
          target=targets[Math.floor(Math.random()*targets.length)];
        }else{
          target=targets.sort((a,b)=>{const ca=COUNTRIES.find(c=>c.id===a);const cb=COUNTRIES.find(c=>c.id===b);return (ca?.area||99)-(cb?.area||99);})[0];
        }
        const newO={...o,[target]:bot};
        ownershipRef.current=newO;
        setOwnership(newO);
        const inv=bInv[bot]||{coins:cfg.startCoins,tank:cfg.startTank,bomb:cfg.startBomb,plane:1,missile:cfg.startMissile,bomber:cfg.startBomber};
        const newInv={...inv,coins:inv.coins+cfg.coinsPerTick};
        const newBInv={...bInv,[bot]:newInv};
        botInvRef.current=newBInv;
        setBotInventories(newBInv);
      });
    },cfg.tickMs);
    return()=>clearInterval(tick);
  },[isSingleplayer,screen,difficulty]);

  // Spy Thief: steals 500 coins from the owner of a target country
  const sendSpyThief=async(country)=>{
    if((myInventory.spy||0)<1){flash("Need at least 1 spy!","error");return;}
    const targetOwner=ownership[country.id];
    if(!targetOwner||targetOwner===username){flash("No enemy to steal from!","error");return;}
    const newInv={...myInventory,spy:(myInventory.spy||0)-1};
    setMyInventory(newInv);
    await saveInv(newInv);
    // Add stolen coins to attacker
    const stolenCoins=500;
    setMyInventory(inv=>{
      const updated={...inv,coins:(inv.coins||0)+stolenCoins};
      setTimeout(()=>saveInv(updated),0);
      return updated;
    });
    playSound("steal");
    flash("[Spy Thief] Stole "+stolenCoins+" coins from "+targetOwner+"!","success");
    addXP(10);
    setAttackPlan(null);
    setAttackMode(false);
  };

  // Buy from black market
  const buyBlackMarket=async(item)=>{
    const inv=myInventory;
    // Check cost
    for(const[res,amt] of Object.entries(item.cost)){
      if((inv[res]||0)<amt){flash("Not enough "+res+"!","error");return;}
    }
    const newInv={...inv};
    for(const[res,amt] of Object.entries(item.cost)) newInv[res]=(newInv[res]||0)-amt;
    for(const[res,amt] of Object.entries(item.reward)){
      if(res==="xp"){addXP(amt);}
      else newInv[res]=(newInv[res]||0)+amt;
    }
    setMyInventory(newInv);
    await saveInv(newInv);
    playSound("buy");
    flash("[Black Market] Bought: "+item.label+"!","success");
    // Remove from market so it can't be bought again this session
    setBlackMarketItems(prev=>prev.filter(i=>i.id!==item.id));
  };

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
    if(amount===0)return;
    setMissionProgress(prev=>{
      const next={...prev,[stat]:(prev[stat]||0)+amount};
      const today=getTodayMissions();
      setClaimedMissions(claimed=>{
        today.forEach(m=>{
          if(next[m.stat]>=m.goal&&!claimed.includes(m.id)){
            flash("[Trophy] Mission complete: "+m.label+" - open Daily to claim!","success");
            addXP(m.xp);
          }
        });
        return claimed;
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

  const pingLobby=async(name)=>{
    if(!name)return;
    try{
      const {data}=await sb.from("world").select("players").eq("room_code","__lobby__").single();
      const cur=data?.players||{};
      cur[name]={ts:Date.now()};
      await sb.from("world").upsert({room_code:"__lobby__",ownership:{},players:cur},{onConflict:"room_code"});
    }catch(e){}
  };

  // Country bonus tick - coins every 1s, materials/troops every 60s
  useEffect(()=>{
    if(!username||screen!=="map")return;
    // Coins tick every second
    const coinTick=setInterval(()=>{
      setMyInventory(inv=>{
        const now=Date.now();
        const owned=Object.keys(ownership).filter(id=>ownership[id]===username);
        let coins=0;
        owned.forEach(id=>{
          if(shockedCountries[id]&&shockedCountries[id]>now)return; // paralyzed
          const c=COUNTRIES.find(x=>x.id===id);
          if(c?.bonus?.coins) coins+=c.bonus.coins;
        });
        if(coins===0)return inv;
        return{...inv,coins:(inv.coins||0)+coins};
      });
    },1000);
    // Materials + troops tick every 60s
    const matTick=setInterval(async()=>{
      setMyInventory(inv=>{
        const owned=Object.keys(ownership).filter(id=>ownership[id]===username);
        let wood=0,stone=0,iron=0,gold=0,troops=0,uranium=0,goldCost=0;
        owned.forEach(id=>{
          const c=COUNTRIES.find(x=>x.id===id);
          if(!c?.bonus)return;
          if(c.bonus.wood)wood+=c.bonus.wood;
          if(c.bonus.stone)stone+=c.bonus.stone;
          if(c.bonus.iron)iron+=c.bonus.iron;
          if(c.bonus.gold)gold+=c.bonus.gold;
          if(c.bonus.troops)troops+=c.bonus.troops;
          const mines=(inv.buildings||[]).filter(b=>b==="mine").length;
          if(mines>0){iron+=mines;stone+=mines;}
        });
        // Uranium Extractor: spend 1 gold -> gain 1 uranium
        if((inv.buildings||[]).includes("uranium_ext")){
          const availableGold=(inv.gold||0)+gold;
          if(availableGold>=1){goldCost=1;uranium=1;}
        }
        if(wood===0&&stone===0&&iron===0&&gold===0&&troops===0&&uranium===0)return inv;
        const next={...inv,
          wood:(inv.wood||0)+wood,
          stone:(inv.stone||0)+stone,
          iron:(inv.iron||0)+iron,
          gold:(inv.gold||0)+gold-goldCost,
          tank:(inv.tank||0)+troops,
          uranium:(inv.uranium||0)+uranium,
        };
        // Save to DB immediately inside the updater via a microtask
        setTimeout(()=>saveInv(next),0);
        return next;
      });
    },60000);
    return()=>{clearInterval(coinTick);clearInterval(matTick);};
  },[username,screen,ownership]);

  useEffect(()=>{
    if(!username||screen==="map")return;
    pingLobby(username);
    const t=setInterval(()=>pingLobby(username),30000);
    return()=>clearInterval(t);
  },[username,screen]);

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
    usernameRef.current=name;setUsername(name);
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
      const {data}=await sb.from("world").select("ownership,players,nuked").eq("room_code",code).single();
      let o={},p={},nk={};
      if(data){o=data.ownership||{};p=data.players||{};nk=data.nuked||{};}
      ownershipRef.current=o;setOwnership(o);setPlayers(p);nukedRef.current=nk;setNukedCountries(nk);
      roomCodeRef.current=code;setRoomCode(code);
      setRecentRooms(prev=>[code,...prev.filter(r=>r!==code)].slice(0,5));
      setScreen("login");
    }catch(e){setRoomError("Error connecting: "+e.message);}
  };

  const startGame=async()=>{
    // Always fetch fresh world state from DB right before saving to avoid race conditions
    let baseO={};
    let basePlayers={};
    let baseNuked={};
    try{
      const {data:fresh}=await sb.from("world").select("ownership,players,nuked").eq("room_code",roomCodeRef.current).single();
      if(fresh){
        baseO=fresh.ownership||{};
        basePlayers=fresh.players||{};
        baseNuked=fresh.nuked||{};
        ownershipRef.current=baseO;
        nukedRef.current=baseNuked;
        setOwnership(baseO);
        setNukedCountries(baseNuked);
      }
    }catch(e){}
    const newO={...baseO};
    // Only assign new territory if player doesn't already own any countries
    const uname=usernameRef.current||username;
    const alreadyOwns=Object.values(newO).some(v=>v===uname);
    if(!alreadyOwns){
      const terr=startTerr(newO);
      terr.forEach(id=>{newO[id]=uname;});
    }
    ownershipRef.current=newO;
    const newP={...basePlayers,[uname]:{cidx,joinedAt:Date.now()}};
    await saveWorld(newO,newP,baseNuked);  // roomCodeRef used inside saveWorld
    setOwnership(newO);setPlayers(newP);
    if(myInventory.lastDaily!==todayStr())setShowDaily(true);
    // Randomize black market items
    const shuffled=[...BLACK_MARKET_POOL].sort(()=>Math.random()-0.5).slice(0,3);
    setBlackMarketItems(shuffled);
    setScreen("map");
  };

  const DIFF={
    easy:  {tickMs:3500, startCoins:400,  startTank:3,  startBomb:1, startMissile:0, startBomber:0, coinsPerTick:20, attackChance:0.5},
    normal:{tickMs:2000, startCoins:800,  startTank:5,  startBomb:3, startMissile:1, startBomber:0, coinsPerTick:50, attackChance:0.75},
    hard:  {tickMs:1000, startCoins:1500, startTank:10, startBomb:6, startMissile:3, startBomber:1, coinsPerTick:100,attackChance:1.0},
  };

  const startSingleplayer=(diff)=>{
    setDifficulty(diff);
    const cfg=DIFF[diff];
    const o={};
    const startForPlayer=(name)=>{
      const terr=startTerr(o);
      terr.forEach(id=>{o[id]=name;});
    };
    const p={};
    startForPlayer(username);
    p[username]={cidx,joinedAt:Date.now()};
    const botInvs={};
    BOT_NAMES.forEach((bot,i)=>{
      startForPlayer(bot);
      p[bot]={cidx:i+1,joinedAt:Date.now()};
      botInvs[bot]={coins:cfg.startCoins,tank:cfg.startTank,bomb:cfg.startBomb,plane:1,missile:cfg.startMissile,bomber:cfg.startBomber};
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
    playSound("daily");
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

  const getItemPrice=(item,buildings)=>{
    let price=item.price;
    if(item.id==="tank"){const bc=buildings.filter(b=>b==="barracks").length;price=Math.floor(price*Math.pow(0.8,bc));}
    if(item.id==="plane"){const ac=buildings.filter(b=>b==="airbase").length;price=Math.floor(price*Math.pow(0.85,ac));}
    if(item.id==="bomber"&&buildings.includes("embassy"))price=Math.floor(price*0.9);
    return price;
  };

  const buyItem=async(item)=>{
    const buildings=myInventory.buildings||[];
    const price=getItemPrice(item,buildings);
    if(myInventory.coins<price){flash("Not enough coins!","error");return;}
    if(item.id==="air_def"&&(myInventory.air_def||0)>=5){flash("Air Defence is maxed at 5!","error");return;}
    const newInv={...myInventory,coins:myInventory.coins-price,[item.id]:(myInventory[item.id]||0)+1};
    setMyInventory(newInv);
    await saveInv(newInv);
    playSound("buy");
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
    playSound("build");
    flash("Built "+bld.label+"!","success");
    progressMission("builds",1);
    checkAchievements(newInv,ownership);
  };

  const MAT_SHOP=[
    {id:"wood",  label:"Wood",  color:"#84cc16", prices:[{qty:1,cost:200},{qty:5,cost:900},{qty:10,cost:1600}]},
    {id:"stone", label:"Stone", color:"#94a3b8", prices:[{qty:1,cost:250},{qty:5,cost:1100},{qty:10,cost:2000}]},
    {id:"iron",  label:"Iron",  color:"#6b7280", prices:[{qty:1,cost:400},{qty:5,cost:1800},{qty:10,cost:3200}]},
    {id:"gold",  label:"Gold",  color:"#f59e0b", prices:[{qty:1,cost:800},{qty:5,cost:3500},{qty:10,cost:6500}]},

  ];

  const buyMaterial=async(matId,qty,cost)=>{
    if(myInventory.coins<cost){flash("Not enough coins!","error");return;}
    const newInv={...myInventory,coins:myInventory.coins-cost,[matId]:(myInventory[matId]||0)+qty};
    setMyInventory(newInv);
    await saveInv(newInv);
    flash("Bought "+qty+"x "+matId+"!","success");
    progressMission("coinsEarned",0);
    checkAchievements(newInv,ownership);
  };

  const startAttack=(country)=>{
    if(!attackMode)return;
    if(nukedCountries[country.id]){flash(country.name+" is irradiated - permanently uninhabitable!","error");return;}
    if(shockedCountries[country.id]&&shockedCountries[country.id]>Date.now()){flash(country.name+" is paralyzed by satellite strike!","error");return;}
    const mine=Object.keys(ownership).filter(id=>ownership[id]===username);
    const reach=getReachable(mine,myInventory.plane>0?3:2);
    if(!reach.has(country.id)||ownership[country.id]===username)return;
    setAttackPlan({country});
    setDeploy({tank:0,bomb:0,plane:0,missile:0,bomber:0,artillery:0,drone:0});
  };

  const confirmAttack=async()=>{
    if(!attackPlan)return;
    const country=attackPlan.country;
    // Validate: can't deploy more than owned
    for(const[id,qty]of Object.entries(deploy)){
      if(qty>0&&qty>(myInventory[id]||0)){
        flash("You don't have enough "+id+"!","error");
        setDeploy(d=>({...d,[id]:myInventory[id]||0}));
        return;
      }
    }
    playSound("attack");
    if((deploy.nuke_bomb||0)>0){
      const newInv={...myInventory,nuke_bomb:(myInventory.nuke_bomb||0)-1};
      setMyInventory(newInv);
      await saveInv(newInv);
      const newO={...ownership};
      delete newO[country.id];
      setOwnership(newO);
      ownershipRef.current=newO;
      const newNuked={...nukedRef.current,[country.id]:true};
      nukedRef.current=newNuked;
      setNukedCountries(newNuked);
      await saveWorld(newO,players,newNuked);
      triggerAttackEffect(country);
      playSound("nuke");
      flash("NUCLEAR STRIKE on "+country.name+"! Territory irradiated - permanently uninhabitable.","success");
      setAttackPlan(null);
      setAttackMode(false);
      return;
    }
    const hasReactor=(myInventory.buildings||[]).includes("nuclear_reactor");
      const rawDamage=calcDamage(deploy.tank||0,deploy.bomb||0,deploy.plane||0,deploy.missile||0,deploy.bomber||0,deploy.artillery||0,deploy.drone||0);
    const damage=hasReactor?Math.round(rawDamage*1.5*10)/10:rawDamage;
    const embassyBonus=((myInventory.buildings||[]).includes("embassy"))?0.05:0;
    const defenderOwnerKey=ownership[country.id];
    const defenderHasFortress=false; // can't read opponent buildings in multiplayer
    const stealthKit=(myInventory.stealth_kit||0)>0;
    const chance=calcWinChance(country.area||20,damage,myInventory.spy||0,myInventory.academySpies||0,0,defenderHasFortress,stealthKit)+embassyBonus;
    const pct=Math.round(Math.min(0.97,chance)*100);
    const usedSpy=(myInventory.spy||0)>0||(myInventory.academySpies||0)>0;
    const newInv={...myInventory};
    for(const[id,qty]of Object.entries(deploy)){if(qty>0)newInv[id]=Math.max(0,(newInv[id]||0)-qty);}
    if(stealthKit)newInv.stealth_kit=Math.max(0,(newInv.stealth_kit||0)-1);
    const won=Math.random()<chance;
    triggerAttackEffect(country);
    if(won){
      playSound("win");
      const newO={...ownership,[country.id]:username};
      ownershipRef.current=newO;
      setOwnership(newO);
      await saveWorld(newO,players);
      flash("[Win] Conquered "+country.name+"! "+damage+" dmg, "+pct+"% chance"+(usedSpy?" [Spy]":"")+(stealthKit?" [Stealth]":""),"success");
      progressMission("wins",1);
      progressMission("conquests",1);
      addXP(20);
      checkAchievements(newInv,newO);
    }else{
      playSound("lose");
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
  const hasWeapons=(deploy.tank||0)+(deploy.bomb||0)+(deploy.plane||0)+(deploy.missile||0)+(deploy.bomber||0)+(deploy.artillery||0)+(deploy.drone||0)>0;
  const hasReactor=(myInventory.buildings||[]).includes("nuclear_reactor");
  const hasFortress=(myInventory.buildings||[]).includes("fortress");
  const stealthKit=(myInventory.stealth_kit||0)>0;
  const atkDamage=attackPlan?(()=>{const raw=calcDamage(deploy.tank||0,deploy.bomb||0,deploy.plane||0,deploy.missile||0,deploy.bomber||0,deploy.artillery||0,deploy.drone||0);return hasReactor?Math.round(raw*1.5*10)/10:raw;})():0;
  const defenderOwner=attackPlan?ownership[attackPlan.country.id]:null;
  const atkChance=attackPlan?calcWinChance(attackPlan.country.area||20,atkDamage,myInventory.spy||0,myInventory.academySpies||0,0,false,stealthKit):0;
  const atkPct=Math.round(atkChance*100);
  const atkBarColor=atkPct>=70?"#22c55e":atkPct>=40?"#f59e0b":"#ef4444";

  if(screen==="eliminated"){
    return(
      <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 50%,#1a0000,#000)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
        <style>{"@keyframes elimIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}} @keyframes skull{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}"}</style>
        <div style={{textAlign:"center",animation:"elimIn .5s ease",padding:"40px"}}>
          <svg width="100" height="100" viewBox="0 0 100 100" style={{marginBottom:"16px",animation:"skull 2s ease infinite",filter:"drop-shadow(0 0 20px rgba(239,68,68,.5))"}}><circle cx="50" cy="50" r="45" fill="rgba(239,68,68,.15)" stroke="#ef4444" strokeWidth="2"/><line x1="30" y1="30" x2="70" y2="70" stroke="#ef4444" strokeWidth="5" strokeLinecap="round"/><line x1="70" y1="30" x2="30" y2="70" stroke="#ef4444" strokeWidth="5" strokeLinecap="round"/></svg>
          <h1 style={{color:"#ef4444",fontSize:"36px",letterSpacing:"4px",margin:"0 0 8px",textTransform:"uppercase"}}>Eliminated</h1>
          <p style={{color:"rgba(255,255,255,.5)",fontSize:"14px",margin:"0 0 8px"}}>You have lost all your territories.</p>
          <p style={{color:"rgba(255,255,255,.3)",fontSize:"12px",margin:"0 0 32px"}}>Room <span style={{color:"#f5c842"}}>{roomCode}</span> continues without you.</p>
          <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"14px",padding:"20px 32px",marginBottom:"28px",display:"inline-block"}}>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:"10px",letterSpacing:"2px",marginBottom:"12px",textTransform:"uppercase"}}>Your Final Stats</div>
            <div style={{color:"#f5c842",fontSize:"18px",fontWeight:"bold",marginBottom:"6px"}}>{myInventory.coins.toLocaleString()} coins remaining</div>
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
        <audio ref={menuAudioRef} src="/menu.mp3" loop preload="auto"/>
        <Stars/><style>{starCss}</style>
        <OnlineCount/>
        <div style={{...card,width:"380px",textAlign:"center"}}>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{marginBottom:"12px",filter:"drop-shadow(0 0 18px rgba(245,200,66,.4))",animation:"pu 3s infinite"}}><circle cx="32" cy="32" r="28" fill="none" stroke="#f5c842" strokeWidth="2.5"/><ellipse cx="32" cy="32" rx="14" ry="28" fill="none" stroke="#f5c842" strokeWidth="1.5" opacity=".6"/><line x1="4" y1="32" x2="60" y2="32" stroke="#f5c842" strokeWidth="1.5" opacity=".6"/><line x1="32" y1="4" x2="32" y2="60" stroke="#f5c842" strokeWidth="1.5" opacity=".4"/><ellipse cx="32" cy="32" rx="28" ry="10" fill="none" stroke="#f5c842" strokeWidth="1" opacity=".3"/></svg>
          <h1 style={{color:"#fff",fontSize:"26px",margin:"0 0 5px",letterSpacing:"5px",textTransform:"uppercase",textShadow:"0 0 30px rgba(245,200,66,.3)"}}>TERRA CONQUEST</h1>
          <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:"0 0 28px",letterSpacing:"3px"}}>CONQUER THE WORLD</p>
          <input value={inputName} onChange={e=>setInputName(e.target.value)} placeholder="Username (leave blank for random)"
            style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"10px",color:"white",fontSize:"13px",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:"10px"}}/>
          <input value={inputPassword} onChange={e=>setInputPassword(e.target.value)} placeholder="Password" type="password"
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.15)",borderRadius:"10px",color:"white",fontSize:"13px",fontFamily:"Georgia,serif",boxSizing:"border-box",marginBottom:"10px"}}/>
          {loginError&&<div style={{color:"#fca5a5",fontSize:"11px",marginBottom:"10px"}}>{loginError}</div>}
          <button onClick={()=>{menuAudioRef.current?.play().catch(()=>{});handleLogin();}}
            style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",borderRadius:"12px",color:"#000",fontSize:"14px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif",boxShadow:"0 8px 28px rgba(212,160,23,.45)",transition:"all .2s ease"}}>
            LOGIN / REGISTER
          </button>
        </div>
      </div>
    );
  }

  if(screen==="menu"){
    const TUTORIAL_STEPS=[
  {title:"Welcome to Terra Conquest",text:"Conquer the world by capturing countries on the map. You start with 1-2 territories and grow your empire through combat, economy, and strategy."},
  {title:"The Map",text:"The map has 100 countries. Your countries glow white. Enemy countries are colored by their owner. Unowned countries are dark blue."},
  {title:"Attacking",text:"Click 'Attack Mode' in the sidebar, then click an enemy or neutral country adjacent to yours. Pick your weapons and confirm the attack. Win chance depends on your firepower vs their defence."},
  {title:"Weapons",text:"Buy weapons in the Shop: Tanks (0.5 dmg), Bombs (2), Planes (3), Missiles (6), Artillery (4), Drones (8), Bombers (10). More damage = higher win chance."},
  {title:"Weapons Lab",text:"Click 'W LAB' in the top bar to craft advanced weapons. Build a Nuclear Bomb (10 Uranium, 7 Iron, 2 Gold, 2000 coins) to irradiate a country permanently - it turns dark green with ☢ RAD and becomes uninhabitable. Build a Satellite (5 Uranium, 10 Iron, 2 Gold) to paralyze an enemy country for 5 minutes."},
  {title:"Satellite Strike",text:"Craft a Satellite in the W LAB (requires Watchtower building). Once crafted, a 'SAT STRIKE' button appears in the top bar. Click it then click any enemy country - it goes dark and paralyzed for 5 minutes. The owner cannot attack from it or gain its bonuses."},
  {title:"Materials",text:"Build a Mine to gather Wood, Stone, Iron and Gold over time. Materials are needed for buildings, crafting, and advanced weapons."},
  {title:"Buildings",text:"Open the Build Shop in the sidebar to construct buildings. Barracks give extra troops, Coin Factory generates coins, Watchtower unlocks the Satellite recipe, Fortress reduces enemy win chance, Black Market unlocks special items, and more."},
  {title:"Nuclear Reactor",text:"Build a Nuclear Reactor (requires Uranium Extractor) to boost all your attack damage by 50%. Very powerful late-game upgrade."},
  {title:"Country Bonuses",text:"Owning certain countries gives passive bonuses every second or minute. USA gives +50 coins/sec, Japan +35 coins/sec, Russia +3 tanks/min, China +2 tanks/min, Canada +2 wood/min, Saudi Arabia and South Africa +1 gold/min."},
  {title:"Economy",text:"Coins are earned from the Coin Factory building, country bonuses, and the daily reward. Use coins to buy weapons, build structures, and craft items."},
  {title:"Spies & Defence",text:"Buy Air Defence in the shop to intercept enemy planes and missiles. Train Spies via the Spy Academy building - use them to steal 500 coins from enemies or send them on spy missions."},
  {title:"Terra Pass",text:"Complete daily missions to earn XP and level up your Terra Pass for exclusive rewards. Claim your daily reward each day for bonus coins and resources."},
];
    const step=TUTORIAL_STEPS[tutStep]||TUTORIAL_STEPS[0];
    const digits=roomInput.split("").concat(Array(6).fill("")).slice(0,6);
    return(
      <div style={bgStyle}>
        <audio ref={menuAudioRef} src="/menu.mp3" loop preload="auto"/>
        <Stars/><style>{starCss}</style>
        <OnlineCount/>
        <div style={{...card,padding:"0",width:"480px",overflow:"hidden"}}>
          <div style={{padding:"28px 32px 0",textAlign:"center"}}>
            <svg width="48" height="48" viewBox="0 0 64 64" style={{marginBottom:"6px",filter:"drop-shadow(0 0 12px rgba(245,200,66,.3))",animation:"pu 3s infinite"}}><circle cx="32" cy="32" r="28" fill="none" stroke="#f5c842" strokeWidth="2.5"/><ellipse cx="32" cy="32" rx="14" ry="28" fill="none" stroke="#f5c842" strokeWidth="1.5" opacity=".6"/><line x1="4" y1="32" x2="60" y2="32" stroke="#f5c842" strokeWidth="1.5" opacity=".6"/><ellipse cx="32" cy="32" rx="28" ry="10" fill="none" stroke="#f5c842" strokeWidth="1" opacity=".3"/></svg>
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
                <button onClick={()=>setMenuTab("singleplayer")}
                  style={{padding:"14px",background:"linear-gradient(135deg,#166534,#16a34a)",border:"none",borderRadius:"12px",color:"white",fontSize:"14px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif",boxShadow:"0 6px 20px rgba(22,163,74,.35)"}}>
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
                <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",background:"rgba(0,0,0,.25)",borderRadius:"10px",border:"1px solid rgba(255,255,255,.07)"}}>
                  <span style={{color:"rgba(255,255,255,.35)",fontSize:"10px",letterSpacing:"1px",minWidth:"36px"}}>MUSIC</span>
                  <input type="range" min="0" max="1" step="0.01" value={musicVol}
                    onChange={e=>setMusicVol(parseFloat(e.target.value))}
                    disabled={musicMuted}
                    style={{flex:1,accentColor:"#f5c842",opacity:musicMuted?0.25:1,cursor:musicMuted?"not-allowed":"pointer"}}/>
                  <button onClick={()=>setMusicMuted(m=>!m)}
                    style={{padding:"4px 10px",background:musicMuted?"rgba(255,255,255,.05)":"rgba(245,200,66,.12)",border:"1px solid "+(musicMuted?"rgba(255,255,255,.1)":"rgba(245,200,66,.3)"),borderRadius:"6px",color:musicMuted?"rgba(255,255,255,.25)":"#f5c842",cursor:"pointer",fontSize:"10px",fontWeight:"bold",fontFamily:"Georgia,serif",letterSpacing:"1px",transition:"all .2s",minWidth:"46px"}}>
                    {musicMuted?"OFF":"ON"}
                  </button>
                </div>
              </div>
            )}
            {menuTab==="singleplayer"&&(
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <button onClick={()=>setMenuTab("main")} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:"11px",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",padding:"0 0 4px",display:"flex",alignItems:"center",gap:"4px"}}>
                  Back
                </button>
                <div style={{textAlign:"center",marginBottom:"4px"}}>
                  <div style={{color:"white",fontSize:"14px",fontWeight:"bold",letterSpacing:"2px",marginBottom:"4px"}}>CHOOSE DIFFICULTY</div>
                  <div style={{color:"rgba(255,255,255,.35)",fontSize:"10px"}}>4 AI opponents</div>
                </div>
                {[
                  {diff:"easy",   label:"EASY",   sub:"Slow bots - Small army",       grad:"linear-gradient(135deg,#166534,#16a34a)", glow:"rgba(22,163,74,.4)",   desc:"Attack every 3.5s, 50% skip chance"},
                  {diff:"normal", label:"NORMAL", sub:"Balanced challenge",               grad:"linear-gradient(135deg,#1e3a5f,#2563eb)", glow:"rgba(37,99,235,.4)",   desc:"Attack every 2s, prefers small countries"},
                  {diff:"hard",   label:"HARD",   sub:"Aggressive - Targets you",      grad:"linear-gradient(135deg,#7f1d1d,#dc2626)", glow:"rgba(220,38,38,.4)",   desc:"Attack every 1s, hunts your territories"},
                ].map(({diff,label,sub,grad,glow,desc})=>(
                  <button key={diff} onClick={()=>startSingleplayer(diff)}
                    style={{padding:"14px 16px",background:grad,border:"none",borderRadius:"12px",color:"white",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",boxShadow:"0 6px 24px "+glow,display:"flex",flexDirection:"column",gap:"4px",transition:"transform .15s"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:"15px",fontWeight:"bold",letterSpacing:"2px"}}>{label}</span>
                      <span style={{fontSize:"10px",color:"rgba(255,255,255,.7)"}}>{sub}</span>
                    </div>
                    <span style={{fontSize:"10px",color:"rgba(255,255,255,.5)"}}>{desc}</span>
                  </button>
                ))}
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
                {cidx===i&&<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="22" height="22" viewBox="0 0 22 22"><polyline points="4,12 9,17 18,6" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
              </div>
            ))}
          </div>
          <button onClick={startGame}
            style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",borderRadius:"12px",color:"#000",fontSize:"15px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif",boxShadow:"0 8px 28px rgba(212,160,23,.45)",transition:"all .2s ease"}}>
            ENTER THE WORLD
          </button>
        </div>
      </div>
    );
  }

  return(
    <div style={{position:"fixed",inset:0,width:"100%",height:"100%",background:"#060d1a",display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"Georgia,serif",userSelect:"none"}}>
      <audio ref={menuAudioRef} src="/menu.mp3" loop preload="auto"/>
      <audio ref={mapAudioRef} src="/map.mp3" loop preload="auto"/>
      <style>{"@keyframes pr{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0),0 0 0 0 rgba(239,68,68,0)}50%{box-shadow:0 0 0 6px rgba(239,68,68,.15),0 0 16px rgba(239,68,68,.3)}} @keyframes coinIn{from{opacity:0;transform:translateY(-8px) scale(.9)}to{opacity:1;transform:translateY(0) scale(1)}} @keyframes modalIn{from{opacity:0;transform:translateY(-14px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}} .cp{transition:all .15s ease} .cp:hover{filter:brightness(1.18);transform:scale(1.04)} button{transition:all .15s ease}"}</style>

      {notif&&(
        <div style={{position:"fixed",top:"16px",left:"50%",transform:"translateX(-50%)",zIndex:9999,
          padding:"10px 20px",borderRadius:"10px",fontSize:"13px",fontWeight:"bold",fontFamily:"Georgia,serif",
          background:notif.type==="success"?"#16a34a":notif.type==="error"?"#dc2626":"#2563eb",
          color:"white",boxShadow:"0 8px 32px rgba(0,0,0,.6)",animation:"coinIn .3s ease",whiteSpace:"nowrap",letterSpacing:".3px"}}>
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
                  <div key={m.id} style={{background:"rgba(255,255,255,.04)",border:"1px solid "+(done&&!claimed?"rgba(245,200,66,.3)":claimed?"rgba(34,197,94,.2)":"rgba(255,255,255,.08)"),borderRadius:"10px",padding:"12px 14px",marginBottom:"8px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                      <span style={{color:claimed?"#86efac":done?"#f5c842":"white",fontSize:"12px",fontWeight:"bold"}}>{m.label}</span>
                      <span style={{color:"rgba(255,255,255,.4)",fontSize:"10px"}}>{prog}/{m.goal}</span>
                    </div>
                    <div style={{height:"5px",background:"rgba(255,255,255,.08)",borderRadius:"3px",overflow:"hidden",marginBottom:"8px"}}>
                      <div style={{height:"100%",width:pctM+"%",background:claimed?"#22c55e":done?"#f5c842":"#7c3aed",borderRadius:"3px",transition:"width .4s"}}/>
                    </div>
                    {done&&!claimed&&(
                      <button onClick={async()=>{
                        const next=[...claimedMissions,m.id];
                        setClaimedMissions(next);
                        setMissionProgress(p=>({...p}));
                        setMyInventory(inv=>{const ni={...inv,coins:inv.coins+m.coins,_claimedMissions:next,_missionProgress:missionProgress};(async()=>{try{await saveInv(ni);}catch(e){}})();return ni;});
                        flash("Mission claimed: +"+m.coins+" coins!","success");
                      }} style={{width:"100%",padding:"6px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",borderRadius:"7px",color:"#000",fontSize:"11px",fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif"}}>
                        Claim +{m.coins} coins
                      </button>
                    )}
                    {claimed&&<div style={{color:"#22c55e",fontSize:"11px",textAlign:"center",fontWeight:"bold"}}>Claimed</div>}
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

      {showMatShop&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowMatShop(false);}}>
          <div style={{background:"linear-gradient(135deg,#0a1628,#0d1f38)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"20px",padding:"32px",width:"460px",maxHeight:"80vh",overflowY:"auto",boxShadow:"0 40px 80px rgba(0,0,0,.6)",animation:"modalIn .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <div>
                <h2 style={{color:"white",fontSize:"18px",margin:"0 0 3px",letterSpacing:"1px"}}>Material Shop</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Coins: <span style={{color:"#f5c842",fontWeight:"bold"}}>{myInventory.coins.toLocaleString()}</span></p>
              </div>
              <button onClick={()=>setShowMatShop(false)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"5px 10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>X</button>
            </div>
            <div style={{background:"rgba(255,255,255,.03)",borderRadius:"10px",padding:"10px 14px",marginBottom:"18px"}}>
              <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"8px"}}>Your Stock</div>
              <div style={{display:"flex",gap:"14px"}}>
                {MATERIALS.map(m=>(
                  <div key={m.id} style={{textAlign:"center"}}>
                    <div style={{color:m.color,fontWeight:"bold",fontSize:"16px"}}>{myInventory[m.id]||0}</div>
                    <div style={{color:"rgba(255,255,255,.35)",fontSize:"9px"}}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
            {MAT_SHOP.map(mat=>(
              <div key={mat.id} style={{marginBottom:"14px",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:"12px",padding:"14px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                  <div style={{width:"10px",height:"10px",borderRadius:"3px",background:mat.color,flexShrink:0}}/>
                  <span style={{color:mat.color,fontWeight:"bold",fontSize:"14px"}}>{mat.label}</span>
                  <span style={{color:"rgba(255,255,255,.3)",fontSize:"10px",marginLeft:"auto"}}>have: {myInventory[mat.id]||0}</span>
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  {mat.prices.map(p=>{
                    const can=myInventory.coins>=p.cost;
                    return(
                      <button key={p.qty} onClick={()=>buyMaterial(mat.id,p.qty,p.cost)} disabled={!can}
                        style={{flex:1,padding:"8px 4px",background:can?"linear-gradient(135deg,"+mat.color+"33,"+mat.color+"55)":"rgba(255,255,255,.04)",border:"1px solid "+(can?mat.color+"66":"rgba(255,255,255,.08)"),borderRadius:"8px",color:can?mat.color:"rgba(255,255,255,.2)",cursor:can?"pointer":"not-allowed",fontFamily:"Georgia,serif",textAlign:"center"}}>
                        <div style={{fontWeight:"bold",fontSize:"13px"}}>x{p.qty}</div>
                        <div style={{fontSize:"10px",marginTop:"2px"}}>{p.cost.toLocaleString()}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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
              const price=getItemPrice(item,buildings);
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

      {/* Black Market Modal */}
      {showBlackMarket&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowBlackMarket(false);}}>
          <div style={{background:"linear-gradient(135deg,#0d0520,#1a0a38)",border:"1px solid rgba(139,92,246,.3)",borderRadius:"20px",padding:"32px",width:"460px",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 40px 80px rgba(0,0,0,.6)",animation:"modalIn .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
              <div>
                <h2 style={{color:"#8b5cf6",fontSize:"18px",margin:"0 0 3px",letterSpacing:"1px"}}>Black Market</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Rare deals - limited stock each session</p>
              </div>
              <button onClick={()=>setShowBlackMarket(false)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"5px 10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>X</button>
            </div>
            {blackMarketItems.length===0
              ?<div style={{color:"rgba(255,255,255,.3)",textAlign:"center",padding:"24px",fontSize:"13px"}}>Stock depleted. Come back next session!</div>
              :<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                {blackMarketItems.map(item=>{
                  const canAfford=Object.entries(item.cost).every(([r,a])=>(myInventory[r]||0)>=a);
                  return(
                    <div key={item.id} style={{background:"rgba(139,92,246,.08)",border:"1px solid rgba(139,92,246,.2)",borderRadius:"12px",padding:"14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"6px"}}>
                        <div>
                          <div style={{color:"#a78bfa",fontWeight:"bold",fontSize:"13px"}}>{item.label}</div>
                          <div style={{color:"rgba(255,255,255,.4)",fontSize:"11px",marginTop:"2px"}}>{item.desc}</div>
                        </div>
                        <button onClick={()=>buyBlackMarket(item)} disabled={!canAfford}
                          style={{padding:"6px 14px",background:canAfford?"linear-gradient(135deg,#7c3aed,#8b5cf6)":"rgba(255,255,255,.05)",border:"none",borderRadius:"8px",color:canAfford?"white":"rgba(255,255,255,.2)",fontSize:"11px",fontWeight:"bold",cursor:canAfford?"pointer":"not-allowed",fontFamily:"Georgia,serif",flexShrink:0}}>
                          BUY
                        </button>
                      </div>
                      <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                        {Object.entries(item.cost).map(([res,amt])=>(
                          <span key={res} style={{fontSize:"10px",color:(myInventory[res]||0)>=amt?"#a78bfa":"#ef4444",background:"rgba(139,92,246,.1)",padding:"2px 8px",borderRadius:"4px"}}>
                            {res}: {amt}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        </div>
      )}


      {showCraftShop&&(
        <div style={{position:"absolute",top:"50px",right:"210px",zIndex:1000,background:"rgba(4,10,22,.97)",border:"1px solid rgba(34,197,94,.25)",borderRadius:"14px",padding:"20px",width:"280px",boxShadow:"0 20px 60px rgba(0,0,0,.7)",animation:"modalIn .2s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
            <div>
              <div style={{color:"#22c55e",fontSize:"13px",fontWeight:"bold",letterSpacing:"1px"}}>Weapons Lab</div>
              <div style={{color:"rgba(255,255,255,.3)",fontSize:"10px",marginTop:"2px"}}>Craft advanced weapons</div>
            </div>
            <button onClick={()=>setShowCraftShop(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",cursor:"pointer",fontSize:"18px",lineHeight:"1"}}>X</button>
          </div>
          {/* Nuclear Bomb recipe card */}
          <div style={{background:"rgba(34,197,94,.05)",border:"1px solid rgba(34,197,94,.2)",borderRadius:"12px",padding:"14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <span style={{fontSize:"22px"}}>N</span>
              <div>
                <div style={{color:"white",fontSize:"13px",fontWeight:"bold"}}>Nuclear Bomb</div>
                <div style={{color:"rgba(255,255,255,.4)",fontSize:"10px"}}>Irradiates target  -  permanently uninhabitable</div>
              </div>
              <div style={{marginLeft:"auto",background:"rgba(34,197,94,.15)",border:"1px solid rgba(34,197,94,.3)",borderRadius:"8px",padding:"3px 10px",textAlign:"center"}}>
                <div style={{color:"#22c55e",fontWeight:"bold",fontSize:"14px"}}>{myInventory.nuke_bomb||0}</div>
                <div style={{color:"rgba(255,255,255,.3)",fontSize:"8px"}}>owned</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px",marginBottom:"12px"}}>
              {[["uranium","Uranium",10,"#4ade80"],["iron","Iron",7,"#6b7280"],["gold","Gold",2,"#f59e0b"],["coins","Coins",2000,"#f5c842"]].map(([id,label,req,color])=>{
                const have=myInventory[id]||0;
                const ok=have>=req;
                return(
                  <div key={id} style={{background:ok?"rgba(34,197,94,.08)":"rgba(239,68,68,.08)",border:"1px solid "+(ok?"rgba(34,197,94,.25)":"rgba(239,68,68,.25)"),borderRadius:"6px",padding:"5px 8px"}}>
                    <div style={{color:color,fontSize:"9px",fontWeight:"bold"}}>{label}</div>
                    <div style={{color:ok?"#86efac":"#fca5a5",fontSize:"11px",fontWeight:"bold"}}>{have}/{req}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={craftNuke}
              disabled={(myInventory.uranium||0)<10||(myInventory.iron||0)<7||(myInventory.gold||0)<2||(myInventory.coins||0)<2000}
              style={{width:"100%",padding:"10px",background:(myInventory.uranium||0)>=10&&(myInventory.iron||0)>=7&&(myInventory.gold||0)>=2&&(myInventory.coins||0)>=2000?"linear-gradient(135deg,#052010,#166534)":"rgba(255,255,255,.04)",border:"1px solid "+((myInventory.uranium||0)>=10&&(myInventory.iron||0)>=7&&(myInventory.gold||0)>=2&&(myInventory.coins||0)>=2000?"rgba(34,197,94,.5)":"rgba(255,255,255,.08)"),borderRadius:"8px",color:(myInventory.uranium||0)>=10&&(myInventory.iron||0)>=7&&(myInventory.gold||0)>=2&&(myInventory.coins||0)>=2000?"#22c55e":"rgba(255,255,255,.2)",cursor:(myInventory.uranium||0)>=10&&(myInventory.iron||0)>=7&&(myInventory.gold||0)>=2&&(myInventory.coins||0)>=2000?"pointer":"not-allowed",fontWeight:"bold",fontSize:"12px",fontFamily:"Georgia,serif",letterSpacing:"1px"}}>
              CRAFT NUCLEAR BOMB
            </button>
          </div>

          {/* Satellite recipe card */}
          <div style={{marginTop:"12px",background:"rgba(99,102,241,.05)",border:"1px solid rgba(99,102,241,.2)",borderRadius:"12px",padding:"14px",opacity:(myInventory.buildings||[]).includes("watchtower")?1:0.5}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
              <span style={{fontSize:"20px"}}>*</span>
              <div style={{flex:1}}>
                <div style={{color:"white",fontSize:"13px",fontWeight:"bold"}}>Satellite</div>
                <div style={{color:"rgba(255,255,255,.4)",fontSize:"10px"}}>Shockwave steals 30% of enemy coins</div>
              </div>
              <div style={{background:"rgba(99,102,241,.15)",border:"1px solid rgba(99,102,241,.3)",borderRadius:"8px",padding:"3px 10px",textAlign:"center"}}>
                <div style={{color:"#a5b4fc",fontWeight:"bold",fontSize:"14px"}}>{myInventory.satellite||0}</div>
                <div style={{color:"rgba(255,255,255,.3)",fontSize:"8px"}}>owned</div>
              </div>
            </div>
            {!(myInventory.buildings||[]).includes("watchtower")&&(
              <div style={{color:"#f97316",fontSize:"10px",marginBottom:"8px",textAlign:"center"}}>Requires Watchtower building</div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"10px"}}>
              {[["uranium","Uranium",5,"#4ade80"],["iron","Iron",10,"#6b7280"],["gold","Gold",2,"#f59e0b"]].map(([id,label,req,color])=>{
                const have=myInventory[id]||0;
                const ok=have>=req;
                return(
                  <div key={id} style={{background:ok?"rgba(99,102,241,.08)":"rgba(239,68,68,.08)",border:"1px solid "+(ok?"rgba(99,102,241,.25)":"rgba(239,68,68,.25)"),borderRadius:"6px",padding:"5px 8px"}}>
                    <div style={{color:color,fontSize:"9px",fontWeight:"bold"}}>{label}</div>
                    <div style={{color:ok?"#c7d2fe":"#fca5a5",fontSize:"11px",fontWeight:"bold"}}>{have}/{req}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={craftSatellite}
              disabled={!(myInventory.buildings||[]).includes("watchtower")||(myInventory.uranium||0)<5||(myInventory.iron||0)<10||(myInventory.gold||0)<2}
              style={{width:"100%",padding:"10px",background:(myInventory.buildings||[]).includes("watchtower")&&(myInventory.uranium||0)>=5&&(myInventory.iron||0)>=10&&(myInventory.gold||0)>=2?"linear-gradient(135deg,#1e1b4b,#3730a3)":"rgba(255,255,255,.04)",border:"1px solid rgba(99,102,241,.3)",borderRadius:"8px",color:(myInventory.buildings||[]).includes("watchtower")&&(myInventory.uranium||0)>=5&&(myInventory.iron||0)>=10&&(myInventory.gold||0)>=2?"#a5b4fc":"rgba(255,255,255,.2)",cursor:(myInventory.buildings||[]).includes("watchtower")&&(myInventory.uranium||0)>=5&&(myInventory.iron||0)>=10&&(myInventory.gold||0)>=2?"pointer":"not-allowed",fontWeight:"bold",fontSize:"12px",fontFamily:"Georgia,serif",letterSpacing:"1px"}}>
              CRAFT SATELLITE
            </button>
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
              {id:"tank",      label:"Tanks",      dmg:DMG.tank,      color:"#f59e0b"},
              {id:"bomb",      label:"Bombs",      dmg:DMG.bomb,      color:"#ef4444"},
              {id:"plane",     label:"Planes",     dmg:DMG.plane,     color:"#3b82f6"},
              {id:"missile",   label:"Missiles",   dmg:DMG.missile,   color:"#f97316"},
              {id:"artillery", label:"Artillery",  dmg:DMG.artillery, color:"#a78bfa"},
              {id:"drone",     label:"Drones",     dmg:DMG.drone,     color:"#06b6d4"},
              {id:"bomber",    label:"Bombers",    dmg:DMG.bomber,    color:"#dc2626"},
              {id:"nuke_bomb", label:"Nuke",       dmg:999,           color:"#22c55e"},
            ].map(({id,label,dmg,color})=>{
              const max=myInventory[id]||0;
              const val=deploy[id]||0;
              return(
                <div key={id} style={{marginBottom:"14px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                      <span style={{color:"white",fontWeight:"bold",fontSize:"13px"}}>{label}</span>
                      <span style={{color:"rgba(255,255,255,.35)",fontSize:"10px"}}>{dmg} dmg each</span>
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
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                <span style={{color:"rgba(255,255,255,.5)",fontSize:"11px"}}>Total Firepower</span>
                <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                  {hasReactor&&<span style={{background:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.4)",borderRadius:"5px",padding:"1px 7px",color:"#a78bfa",fontSize:"9px",fontWeight:"bold",letterSpacing:"1px"}}>NUCLEAR x1.5</span>}
                  {stealthKit&&<span style={{background:"rgba(6,182,212,.15)",border:"1px solid rgba(6,182,212,.4)",borderRadius:"5px",padding:"1px 7px",color:"#06b6d4",fontSize:"9px",fontWeight:"bold",letterSpacing:"1px"}}>STEALTH +15%</span>}
                  <span style={{color:"white",fontWeight:"bold",fontSize:"18px"}}>{atkDamage} dmg</span>
                </div>
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
            {(myInventory.spy||0)>0&&ownership[attackPlan?.country?.id]&&ownership[attackPlan?.country?.id]!==username&&(
              <button onClick={()=>sendSpyThief(attackPlan.country)}
                style={{width:"100%",padding:"10px",background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.35)",borderRadius:"10px",color:"#10b981",fontSize:"12px",fontWeight:"bold",cursor:"pointer",letterSpacing:"1px",fontFamily:"Georgia,serif",marginTop:"6px"}}>
                SEND SPY THIEF (-1 spy, steal 500 coins)
              </button>
            )}
          </div>
        </div>
      )}

      {/* layout: topbar + map area */}
      <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,overflow:"hidden"}}>
      {/* top bar */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:"44px",background:"rgba(4,10,22,.95)",borderBottom:"1px solid rgba(255,255,255,.1)",padding:"0 16px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:100}}>
        {/* left: player info */}
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"9px",height:"9px",borderRadius:"50%",background:myC.bg,boxShadow:"0 0 6px "+myC.bg}}/>
          <span style={{color:"white",fontSize:"12px",fontWeight:"bold"}}>{username}</span>
          <span style={{color:myC.light,fontSize:"11px"}}>{mine.length} terr</span>
          <span style={{color:"#f5c842",fontWeight:"bold",fontSize:"13px",marginLeft:"4px"}}>{myInventory.coins.toLocaleString()} coins</span>
        </div>

        {/* center: weapons + buildings inventory strip */}
        <div style={{display:"flex",alignItems:"center",gap:"2px",flex:1,justifyContent:"center",flexWrap:"nowrap",overflow:"hidden",padding:"0 12px"}}>
          {[
            {id:"tank",    label:"Tank",    color:"#f59e0b"},
            {id:"bomb",    label:"Bomb",    color:"#ef4444"},
            {id:"plane",   label:"Plane",   color:"#3b82f6"},
            {id:"missile", label:"Missile", color:"#f97316"},
            {id:"bomber",  label:"Bomber",  color:"#dc2626"},
            {id:"air_def",    label:"Air Def",  color:"#6366f1"},
            {id:"academySpies",label:"Spies",    color:"#10b981"},
          ].map(w=>{
            const qty=myInventory[w.id]||0;
            return(
              <div key={w.id} style={{display:"flex",alignItems:"center",gap:"3px",padding:"3px 7px",background:qty>0?"rgba(255,255,255,.06)":"rgba(255,255,255,.02)",borderRadius:"6px",border:"1px solid "+(qty>0?w.color+"44":"rgba(255,255,255,.06)"),minWidth:"52px",justifyContent:"center"}}>
                <span style={{color:qty>0?w.color:"rgba(255,255,255,.2)",fontSize:"9px",letterSpacing:".3px"}}>{w.label}</span>
                <span style={{color:qty>0?"white":"rgba(255,255,255,.2)",fontWeight:"bold",fontSize:"11px",marginLeft:"2px"}}>{qty}</span>
              </div>
            );
          })}
          {(myInventory.buildings||[]).length>0&&(
            <>
              <div style={{width:"1px",height:"18px",background:"rgba(255,255,255,.1)",margin:"0 4px"}}/>
              {Object.entries((myInventory.buildings||[]).reduce((a,b)=>{a[b]=(a[b]||0)+1;return a;},{})).map(([id,cnt])=>{
                const bld=BUILDINGS.find(b=>b.id===id);
                return(
                  <div key={id} style={{display:"flex",alignItems:"center",gap:"3px",padding:"3px 7px",background:"rgba(34,197,94,.06)",borderRadius:"6px",border:"1px solid rgba(34,197,94,.25)",minWidth:"52px",justifyContent:"center"}}>
                    <span style={{color:"#86efac",fontSize:"9px"}}>{bld?bld.label:id}</span>
                    <span style={{color:"white",fontWeight:"bold",fontSize:"11px",marginLeft:"2px"}}>{cnt}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* right: attack + exit */}
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>

          <button onClick={()=>setShowCraftShop(s=>!s)}
            style={{padding:"5px 10px",background:showCraftShop?"rgba(34,197,94,.2)":"rgba(255,255,255,.06)",border:"1px solid "+(showCraftShop?"rgba(34,197,94,.4)":"rgba(255,255,255,.12)"),borderRadius:"7px",color:showCraftShop?"#22c55e":"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif",letterSpacing:"1px"}}>
            W LAB
          </button>
          {(myInventory.satellite||0)>0&&(
            <button onClick={()=>{setSatelliteMode(s=>!s);setAttackMode(false);setAttackPlan(null);}}
              style={{padding:"5px 10px",background:satelliteMode?"rgba(99,102,241,.35)":"rgba(99,102,241,.1)",border:"1px solid "+(satelliteMode?"rgba(99,102,241,.7)":"rgba(99,102,241,.3)"),borderRadius:"7px",color:satelliteMode?"#a5b4fc":"rgba(99,102,241,.7)",cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif",letterSpacing:"1px",animation:satelliteMode?"pr 1.5s infinite":undefined}}>
              SAT STRIKE ({myInventory.satellite})
            </button>
          )}
          <button onClick={()=>setAttackMode(m=>!m)}
            style={{padding:"5px 14px",background:attackMode?"linear-gradient(135deg,#dc2626,#ef4444)":"rgba(255,255,255,.08)",border:attackMode?"none":"1px solid rgba(255,255,255,.15)",borderRadius:"7px",color:attackMode?"white":"rgba(255,255,255,.7)",cursor:"pointer",fontSize:"11px",fontWeight:"bold",fontFamily:"Georgia,serif",animation:attackMode?"pr 1.5s infinite":undefined}}>
            {attackMode?"CANCEL ATTACK":"ENTER ATTACK MODE"}
          </button>
          <button onClick={()=>{setAttackMode(false);setScreen("menu");setRoomInput("");setRoomCode("");setOwnership({});setPlayers({});setMenuTab("multiplayer");setIsSingleplayer(false);setBotInventories({});}}
            style={{padding:"5px 12px",background:"transparent",border:"1px solid rgba(255,255,255,.12)",borderRadius:"7px",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:"11px",fontFamily:"Georgia,serif"}}>
            Exit
          </button>
        </div>
      </div>

      {/* main area: map + right sidebar */}
      <div style={{flex:1,display:"flex",flexDirection:"row",overflow:"hidden",minHeight:0}}>

        {/* map */}
        <div style={{position:"fixed",top:"44px",left:0,right:"220px",bottom:0,overflow:"hidden"}}>

          {/* Attack flash effects */}
          {satelliteMode&&(
            <div style={{position:"absolute",top:"10px",left:"50%",transform:"translateX(-50%)",zIndex:500,background:"rgba(99,102,241,.9)",border:"1px solid #6366f1",borderRadius:"10px",padding:"8px 20px",color:"white",fontSize:"12px",fontWeight:"bold",letterSpacing:"1px",pointerEvents:"none",animation:"pr 1.5s infinite"}}>
              SATELLITE TARGETING - Click any enemy country
            </div>
          )}
          <style>{"@keyframes boom{0%{opacity:1;transform:scale(0.5)}60%{opacity:0.8;transform:scale(1.4)}100%{opacity:0;transform:scale(1.8)}}"}</style>
          {attackEffects.map(e=>(
            <div key={e.id} style={{position:"absolute",left:e.x+"%",top:e.y+"%",transform:"translate(-50%,-50%)",pointerEvents:"none",zIndex:200,animation:"boom .9s ease-out forwards"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,120,0,.9),rgba(255,0,0,.3),transparent)",boxShadow:"0 0 20px rgba(255,100,0,.8)"}}/>
            </div>
          ))}



          </div>

          {/* Chat - bottom left */}
          {!isSingleplayer&&(
            <div style={{position:"fixed",bottom:"10px",left:"10px",zIndex:9000,width:"230px"}}>
              {showChat&&(
                <div style={{background:"rgba(4,10,22,.88)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"12px",marginBottom:"6px",overflow:"hidden",backdropFilter:"blur(6px)"}}>
                  <div style={{maxHeight:"120px",overflowY:"auto",padding:"8px 10px",display:"flex",flexDirection:"column",gap:"4px"}}>
                    {chatMsgs.length===0&&<div style={{color:"rgba(255,255,255,.2)",fontSize:"10px",textAlign:"center",padding:"6px 0"}}>No messages yet</div>}
                    {chatMsgs.map((m,i)=>{
                      const c=CLRS[(players[m.u]?.cidx||0)%CLRS.length];
                      return(
                        <div key={i} style={{display:"flex",gap:"5px",alignItems:"flex-start"}}>
                          <span style={{color:c.light,fontSize:"10px",fontWeight:"bold",flexShrink:0,maxWidth:"65px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.u}:</span>
                          <span style={{color:"rgba(255,255,255,.75)",fontSize:"10px"}}>{m.t}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{borderTop:"1px solid rgba(255,255,255,.07)",padding:"6px 8px",display:"flex",flexWrap:"wrap",gap:"4px"}}>
                    {CHAT_PROMPTS.map(p=>(
                      <button key={p.id} onClick={()=>sendChat(p)}
                        style={{padding:"3px 8px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"5px",color:"rgba(255,255,255,.7)",fontSize:"9px",cursor:"pointer",fontFamily:"Georgia,serif",transition:"all .15s",whiteSpace:"nowrap"}}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={()=>setShowChat(c=>!c)}
                style={{padding:"4px 10px",background:"rgba(4,10,22,.88)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"7px",color:"rgba(255,255,255,.4)",fontSize:"9px",cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"1px"}}>
                {showChat?"HIDE CHAT":"SHOW CHAT"}
              </button>
            </div>
          )}
          <svg ref={svgRef} viewBox="0 0 1800 950" preserveAspectRatio="xMinYMin meet" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",display:"block"}}
            onMouseMove={e=>{
              const r=svgRef.current?.getBoundingClientRect();
              if(r)setTip(t=>({...t,x:e.clientX-r.left,y:e.clientY-r.top}));
            }}
            onMouseLeave={()=>{setHovered(null);setTip(t=>({...t,show:false}));}}>
            <rect width="1800" height="950" fill="#05101f"/>
            <rect width="1800" height="950" fill="url(#ocean)"/>
            <defs>
              <radialGradient id="ocean" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#0e2848"/>
                <stop offset="100%" stopColor="#060d1a"/>
              </radialGradient>
            </defs>
            {[...COUNTRIES].sort((a,b)=>b.area-a.area).map(c=>{
              const owner=ownership[c.id];
              const isMe=owner===username;
              const ownerIdx=owner&&players[owner]?players[owner].cidx:null;
              const fillColor=owner?(CLRS[ownerIdx%CLRS.length]?.bg||"#555"):"#1e3a5f";
              const inReach=reachable.has(c.id);
              const isHovered=hovered===c.id;
              const isShocked=shockedCountries[c.id]&&shockedCountries[c.id]>Date.now();
              const shockSecsLeft=isShocked?Math.ceil((shockedCountries[c.id]-Date.now())/1000):0;
              const isNuked=nukedCountries[c.id];
              let stroke="rgba(255,255,255,.18)";
              let sw=0.6;
              let fill=isNuked?"#0a1a0a":isShocked?"#0a0a0a":fillColor;
              let opacity=isNuked?0.82:isShocked?0.45:owner?0.72:0.55;
              if(!isShocked&&!isNuked&&isMe){stroke="#ffffff";sw=1.2;opacity=0.82;}
              if(!isShocked&&!isNuked&&attackMode&&inReach&&!isMe){stroke="#ff4444";sw=2;fill=isHovered?"#ff2222":fillColor;opacity=0.85;}
              if(isShocked){stroke="#6366f1";sw=1.5;}
              if(isNuked){stroke="#00ff44";sw=1.2;}
              if(!isShocked&&!isNuked&&isHovered){opacity=0.95;}
              const showLabel=c.area>=8;
              const fontSize=c.area>=120?12:c.area>=50?11:c.area>=20?10:c.area>=10?9:8;
              return(
                <g key={c.id}>
                  <path d={c.d} fill={fill} stroke={stroke} strokeWidth={sw} opacity={opacity}
                    style={{cursor:isNuked?"not-allowed":(satelliteMode&&owner&&owner!==username&&!isShocked)?"cell":(!isShocked&&!isNuked&&attackMode&&inReach&&!isMe)?"crosshair":"default",transition:"fill .15s,opacity .15s"}}
                    onMouseEnter={e=>{
                      setHovered(c.id);
                      const r=svgRef.current?.getBoundingClientRect();
                      if(r)setTip({show:true,x:e.clientX-r.left,y:e.clientY-r.top,c,owner:owner||null,inReach:!isShocked&&attackMode&&inReach&&!isMe});
                    }}
                    onMouseLeave={()=>{setHovered(null);setTip(t=>({...t,show:false}));}}
                    onClick={()=>{
                      if(isNuked){flash(c.name+" is irradiated!","error");return;}
                      if(isShocked)return;
                      if(satelliteMode)launchSatellite(c);
                      else startAttack(c);
                    }}
                  />
                  {isShocked&&(
                    <text x={c.lx} y={c.ly} textAnchor="middle" dominantBaseline="middle"
                      fontSize={c.area>=50?11:9} fill="#6366f1" fontFamily="monospace"
                      fontWeight="bold" pointerEvents="none" opacity="0.9">
                      {shockSecsLeft}s
                    </text>
                  )}
                  {isNuked&&(
                    <g pointerEvents="none">
                      <text x={c.lx} y={c.ly-3} textAnchor="middle" dominantBaseline="middle"
                        fontSize={c.area>=50?11:c.area>=20?9:7} fill="#00ff44" fontFamily="monospace"
                        fontWeight="bold" opacity="0.95"
                        paintOrder="stroke" stroke="rgba(0,0,0,.8)" strokeWidth="2.5" strokeLinejoin="round">
                        ☢ RAD
                      </text>
                    </g>
                  )}
                  {showLabel&&!isShocked&&!isNuked&&(
                    <text x={c.lx} y={c.ly} textAnchor="middle" dominantBaseline="middle"
                      fontSize={fontSize} fill="rgba(255,255,255,.85)" fontFamily="Georgia,serif"
                      fontWeight="bold" pointerEvents="none" paintOrder="stroke"
                      stroke="rgba(0,0,0,.6)" strokeWidth="2.5" strokeLinejoin="round">
                      {c.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {tip.show&&tip.c&&(
            <div style={{position:"absolute",left:tip.x+14,top:tip.y-10,pointerEvents:"none",zIndex:100,
              background:"rgba(6,13,26,.97)",border:"1px solid rgba(255,255,255,.18)",borderRadius:"10px",padding:"10px 14px",minWidth:"170px",boxShadow:"0 4px 20px rgba(0,0,0,.5)"}}>
              <div style={{color:"white",fontWeight:"bold",fontSize:"13px",marginBottom:"2px"}}>{tip.c.name}</div>
              {tip.c.continent&&<div style={{color:"rgba(255,255,255,.35)",fontSize:"9px",letterSpacing:"1px",marginBottom:"4px",textTransform:"uppercase"}}>{tip.c.continent}</div>}
              <div style={{display:"flex",gap:"8px",marginBottom:"4px"}}>
                <div style={{color:"rgba(255,255,255,.4)",fontSize:"10px"}}>Area: <span style={{color:"rgba(255,255,255,.7)"}}>{tip.c.area}</span></div>
                {tip.c.pop&&<div style={{color:"rgba(255,255,255,.4)",fontSize:"10px"}}>Pop: <span style={{color:"rgba(255,255,255,.7)"}}>{tip.c.pop}</span></div>}
              </div>
              {tip.c.bonus&&(
                <div style={{background:"rgba(245,200,66,.08)",border:"1px solid rgba(245,200,66,.2)",borderRadius:"6px",padding:"3px 7px",marginBottom:"4px"}}>
                  <span style={{color:"#f5c842",fontSize:"9px",fontWeight:"bold"}}>{tip.c.bonus.label}</span>
                </div>
              )}
              {tip.owner
                ?<div style={{color:CLRS[(players[tip.owner]?.cidx||0)%CLRS.length].light,fontSize:"11px",marginBottom:"4px"}}>{tip.owner}</div>
                :<div style={{color:"rgba(255,255,255,.35)",fontSize:"11px",marginBottom:"4px"}}>Unclaimed</div>
              }
              {tip.inReach&&<div style={{color:"#ff6666",fontSize:"10px",fontWeight:"bold"}}>Click to Attack</div>}
            </div>
          )}
        </div>

        {/* right sidebar */}
        <div style={{position:"fixed",top:"44px",right:0,bottom:0,width:"220px",background:"rgba(4,10,22,.98)",borderLeft:"1px solid rgba(255,255,255,.1)",display:"flex",flexDirection:"column",overflowY:"auto",padding:"10px 8px",gap:"6px",zIndex:50}}>

          {/* player card */}
          <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"10px",padding:"10px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"5px"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:myC.bg,boxShadow:"0 0 6px "+myC.bg,flexShrink:0}}/>
              <span style={{color:"white",fontSize:"11px",fontWeight:"bold",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{username}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"}}><span style={{color:myC.light,fontSize:"10px"}}>{mine.length} territories</span><span style={{color:"rgba(255,255,255,.25)",fontSize:"9px"}}>|</span><span style={{color:myC.light,fontSize:"9px",opacity:.7}}>{myC.name}</span></div>
            <div style={{color:"#f5c842",fontWeight:"bold",fontSize:"13px"}}>{myInventory.coins.toLocaleString()}</div>
            <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px"}}>coins</div>
            <div style={{marginTop:"8px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                <span style={{color:"rgba(255,255,255,.3)",fontSize:"8px",letterSpacing:"1px",textTransform:"uppercase"}}>Terra Pass Lv {curLevel+1}</span>
                <span style={{color:"#c4b5fd",fontSize:"8px"}}>{playerXP} XP</span>
              </div>
              <div style={{height:"4px",background:"rgba(255,255,255,.08)",borderRadius:"2px",overflow:"hidden"}}>
                <div style={{height:"100%",width:xpPct+"%",background:"linear-gradient(90deg,#7c3aed,#c4b5fd)",borderRadius:"2px",transition:"width .5s"}}/>
              </div>
            </div>
          </div>

          {/* daily reward */}
          {canClaimDaily&&(
            <button onClick={()=>setShowDaily(true)}
              style={{width:"100%",padding:"9px",background:"linear-gradient(135deg,#92400e,#d4a017)",border:"none",borderRadius:"9px",color:"#fff8dc",fontSize:"11px",fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"1px"}}>
              DAILY REWARD
            </button>
          )}

          {/* action buttons */}
          {[
            {label:"War Shop",       color:"#ef4444", bg:"rgba(239,68,68,.15)",  border:"rgba(239,68,68,.35)",  action:()=>setShowShop(true)},
            {label:"Material Shop",  color:"#84cc16", bg:"rgba(132,204,22,.15)", border:"rgba(132,204,22,.35)", action:()=>setShowMatShop(true)},
            {label:"Build Shop",     color:"#22c55e", bg:"rgba(34,197,94,.15)",  border:"rgba(34,197,94,.35)",  action:()=>setShowBuildShop(true)},
            {label:"Black Market",   color:"#8b5cf6", bg:"rgba(139,92,246,.15)", border:"rgba(139,92,246,.35)", action:()=>setShowBlackMarket(true), disabled:!(myInventory.buildings||[]).includes("black_market")},
            {label:"Terra Pass",     color:"#a78bfa", bg:"rgba(139,92,246,.15)", border:"rgba(139,92,246,.35)", action:()=>setShowTerraPass(true)},
          ].map(btn=>(
            <button key={btn.label} onClick={btn.disabled?undefined:btn.action}
              style={{width:"100%",padding:"9px",background:btn.bg,border:"1px solid "+btn.border,borderRadius:"9px",color:btn.disabled?"rgba(255,255,255,.2)":btn.color,fontSize:"11px",fontWeight:"bold",cursor:btn.disabled?"not-allowed":"pointer",fontFamily:"Georgia,serif",textAlign:"left",letterSpacing:"0.5px",opacity:btn.disabled?0.5:1}}>
              {btn.label}{btn.disabled?" locked":""}
            </button>
          ))}

          {/* divider */}
          <div style={{borderTop:"1px solid rgba(255,255,255,.07)",margin:"2px 0"}}/>

          {/* leaderboard */}
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"10px",padding:"10px 12px",flex:1}}>
            <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"10px"}}>Leaderboard</div>
            {lb.map(([name,cnt],i)=>{
              const pl=players[name];
              const color=pl?CLRS[pl.cidx%CLRS.length].bg:"#555";
              const isMe=name===username;
              const pct=Math.round((cnt/COUNTRIES.length)*100);
              return(
                <div key={name} style={{marginBottom:"8px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"3px"}}>
                    <span style={{color:"rgba(255,255,255,.25)",fontSize:"9px",width:"12px"}}>{i+1}</span>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:color,flexShrink:0}}/>
                    <span style={{color:isMe?"#f5c842":"rgba(255,255,255,.7)",fontSize:"10px",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:isMe?"bold":"normal"}}>{name}</span>
                    <span style={{color:"rgba(255,255,255,.5)",fontSize:"10px"}}>{cnt}</span>
                  </div>
                  <div style={{height:"3px",background:"rgba(255,255,255,.06)",borderRadius:"2px",overflow:"hidden",marginLeft:"17px"}}>
                    <div style={{height:"100%",width:pct+"%",background:color,opacity:0.7,borderRadius:"2px"}}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* materials */}
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"10px",padding:"10px 12px"}}>
            <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"8px"}}>Materials</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
              {MATERIALS.map(m=>(
                <div key={m.id} style={{display:"flex",alignItems:"center",gap:"4px"}}>
                  <div style={{width:"6px",height:"6px",borderRadius:"2px",background:m.color,flexShrink:0}}/>
                  <span style={{color:"rgba(255,255,255,.5)",fontSize:"9px"}}>{m.label}</span>
                  <span style={{color:m.color,fontSize:"10px",fontWeight:"bold",marginLeft:"auto"}}>{myInventory[m.id]||0}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      </div>
  );
}
