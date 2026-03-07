import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = "https://yvgwtzjlchcjxoiquetg.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z3d0empsY2hjanhvaXF1ZXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTM2NjgsImV4cCI6MjA4ODM2OTY2OH0.cglCteLErmG23ryVVwVvYir_s4OroeRg9GdmNiurQ8c";
const sb = createClient(SUPA_URL, SUPA_KEY);

// ─── War Shop items ───────────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { id:"tank",     name:"Tank",             emoji:"🪖", price:400,   desc:"0.5 dmg. Basic ground unit. Stack many to boost attack.",         color:"#f59e0b" },
  { id:"bomb",     name:"Bomb",             emoji:"💣", price:600,   desc:"2 dmg. Explosive ordnance. More dmg than tanks per coin.",        color:"#ef4444" },
  { id:"plane",    name:"Plane",            emoji:"✈️", price:800,   desc:"3 dmg. Also extends your attack range from 2 to 3 borders.",     color:"#3b82f6" },
  { id:"missile",  name:"Ballistic Missile",emoji:"🚀", price:1200,  desc:"6 dmg. Must still be within border range to fire.",              color:"#f97316" },
  { id:"bomber",   name:"Bomber",           emoji:"💥", price:1800,  desc:"10 dmg. Most powerful weapon. Great for heavily defended areas.", color:"#dc2626" },
  { id:"air_def",  name:"Air Defence",      emoji:"🛡️", price:500,   desc:"Each unit reduces enemy win chance by 5% when attacking you.",   color:"#10b981" },
];

// ─── Materials (bought with coins in Build Shop) ──────────────────────────────
const MATERIALS = [
  { id:"wood",   name:"Wood",   emoji:"🪵", price:200,  color:"#92400e" },
  { id:"stone",  name:"Stone",  emoji:"🪨", price:350,  color:"#6b7280" },
  { id:"iron",   name:"Iron",   emoji:"⚙️", price:500,  color:"#9ca3af" },
  { id:"gold",   name:"Gold",   emoji:"🥇", price:900,  color:"#d4a017" },
];

// ─── Buildings ────────────────────────────────────────────────────────────────
const BUILDINGS = [
  {
    id:"coin_factory", name:"Coin Factory", emoji:"🏭",
    desc:"Generates +5 coins/sec. Each Gold Vault you own adds +2 coins/sec bonus to every factory. Max 5.",
    color:"#f59e0b",
    cost:{ wood:3, stone:2 },
  },
  {
    id:"vault", name:"Gold Vault", emoji:"🏦",
    desc:"Each vault adds +2 coins/sec to every Coin Factory you own. Also adds +500 to daily reward. Max 3.",
    color:"#d4a017",
    cost:{ stone:3, iron:2, gold:1 },
  },
  {
    id:"spy_academy", name:"Spy Academy", emoji:"🕵️",
    desc:"Trains 1 spy every 20 min. Claim each spy for 300 coins. Each spy adds +1% win chance on attacks. Max 2.",
    color:"#8b5cf6",
    cost:{ wood:4, stone:3, gold:1 },
  },
  {
    id:"barracks", name:"Barracks", emoji:"🏯",
    desc:"Each Barracks gives 20% discount on Tanks — stackable. 3 Barracks = 48% off. Max 3.",
    color:"#ef4444",
    cost:{ wood:5, stone:3, iron:1 },
  },
  {
    id:"airbase", name:"Air Base", emoji:"🛫",
    desc:"Each Air Base gives 20% discount on Planes — stackable. 3 Air Bases = 48% off. Max 3.",
    color:"#3b82f6",
    cost:{ stone:4, iron:3 },
  },
  {
    id:"watchtower", name:"Watchtower", emoji:"🗼",
    desc:"Shows a warning notification when an enemy attacks one of your territories.",
    color:"#10b981",
    cost:{ wood:4, iron:2 },
  },
  {
    id:"embassy", name:"Embassy", emoji:"🏛️",
    desc:"Reduces enemy attack range against you by 1 hop. Forces enemies to get closer before attacking.",
    color:"#6366f1",
    cost:{ wood:6, stone:4, gold:2 },
  },
];

const COIN_FACTORY_INTERVAL_MS = 1000; // 1 second
const COIN_FACTORY_YIELD = 5;          // 5 coins per second per factory (+ 2 per vault)
const SPY_ACADEMY_INTERVAL_MS = 20 * 60 * 1000;
const SPY_CLAIM_COST = 300;
const DAILY_REWARD = 3000;

// Building limits
const BUILDING_LIMITS = {
  coin_factory: 5,
  vault: 3,
  spy_academy: 2,
  airbase: 3,
  barracks: 3,
  watchtower: 99,
  embassy: 99,
};

// ─── Win chance ───────────────────────────────────────────────────────────────
function baseWinChance(area) {
  return Math.max(0.05, Math.min(0.68, 0.68 - ((area - 5) / 215) * 0.63));
}

// ─── Weapon damage constants ──────────────────────────────────────────────────
const DMG = { tank: 0.5, bomb: 2, plane: 3, missile: 6, bomber: 10 };
function calcDamage(t, b, p, m, bm){ return t*DMG.tank + b*DMG.bomb + p*DMG.plane + (m||0)*DMG.missile + (bm||0)*DMG.bomber; }
function calcWinChance(area, damage, spyCount, spyAcademySpies, defenderAirDef){
  const base = baseWinChance(area);
  const spyBonus = (spyCount>0?0.20:0) + (spyAcademySpies||0)*0.01;
  const rawChance = base + damage * 0.004; // halved scaling so damage matters less
  const reducedByDef = rawChance * (1 - Math.min(0.75, (defenderAirDef||0)*0.05));
  return Math.min(0.97, Math.max(0.02, reducedByDef + spyBonus));
}

const CLRS = [
  {bg:"#ef4444",light:"#fca5a5"},{bg:"#3b82f6",light:"#93c5fd"},
  {bg:"#10b981",light:"#6ee7b7"},{bg:"#f59e0b",light:"#fcd34d"},
  {bg:"#8b5cf6",light:"#c4b5fd"},{bg:"#ec4899",light:"#f9a8d4"},
  {bg:"#06b6d4",light:"#67e8f9"},{bg:"#84cc16",light:"#bef264"},
];

function rndName() {
  const a=["Swift","Bold","Iron","Dark","Storm","Frost","Flame","Shadow"];
  const n=["Wolf","Eagle","Lion","Bear","Fox","Hawk","Drake","Knight"];
  return `${a[Math.random()*8|0]}${n[Math.random()*8|0]}${Math.random()*999|0}`;
}

// ─── Today's date string for daily reward ────────────────────────────────────
function todayStr(){return new Date().toISOString().slice(0,10);}


// ─── Country data ─────────────────────────────────────────────────────────────
const COUNTRIES = [
  { id:"russia", name:"Russia", area:220, lx:1250, ly:220,
    borders:["norway","finland","belarus","ukraine","kazakhstan","china","mongolia","north_korea"],
    d:"M830,60 L860,55 L900,50 L950,55 L1000,48 L1060,52 L1120,45 L1180,50 L1240,45 L1300,52 L1360,48 L1420,55 L1480,50 L1540,58 L1580,52 L1620,60 L1660,55 L1700,65 L1720,80 L1700,100 L1680,115 L1650,120 L1620,110 L1580,125 L1550,115 L1510,130 L1470,120 L1430,135 L1390,125 L1350,138 L1310,128 L1270,142 L1230,132 L1190,145 L1150,135 L1110,148 L1070,138 L1030,150 L990,140 L950,152 L910,142 L880,155 L850,145 L830,158 L810,148 L790,160 L780,148 L800,135 L795,120 L810,105 L800,90 L810,75 Z"
  },
  { id:"canada", name:"Canada", area:180, lx:310, ly:180,
    borders:["usa","alaska"],
    d:"M60,80 L120,72 L180,68 L240,62 L300,58 L360,55 L420,58 L460,52 L500,58 L520,70 L510,90 L530,105 L515,125 L530,140 L515,158 L530,172 L510,185 L490,178 L470,190 L445,183 L420,195 L395,188 L370,198 L340,190 L310,200 L280,192 L250,202 L220,194 L190,204 L160,196 L130,206 L100,198 L75,210 L60,198 L50,182 L60,165 L45,148 L58,132 L45,115 L60,98 Z"
  },
  { id:"usa", name:"United States", area:150, lx:280, ly:280,
    borders:["canada","mexico","alaska"],
    d:"M68,210 L520,210 L524,218 L518,232 L528,248 L514,265 L524,280 L510,295 L495,288 L478,300 L460,292 L440,305 L418,297 L395,310 L368,300 L340,312 L308,302 L278,315 L245,304 L212,318 L178,308 L145,320 L110,310 L78,322 L60,310 L52,295 L62,278 L50,260 L64,242 L50,225 Z"
  },
  { id:"alaska", name:"Alaska", area:40, lx:95, ly:130,
    borders:["canada","usa","russia"],
    d:"M30,95 L130,88 L145,100 L138,118 L148,132 L134,145 L118,138 L100,150 L82,142 L65,154 L48,145 L35,155 L22,142 L18,125 L28,110 Z"
  },
  { id:"greenland", name:"Greenland", area:35, lx:560, ly:85,
    borders:["canada","iceland"],
    d:"M525,55 L595,50 L615,65 L608,85 L618,100 L605,118 L588,112 L570,125 L550,118 L535,130 L518,120 L508,105 L515,88 L508,72 Z"
  },
  { id:"mexico", name:"Mexico", area:55, lx:195, ly:340,
    borders:["usa","guatemala"],
    d:"M68,320 L240,318 L248,332 L238,348 L248,362 L235,375 L218,368 L200,380 L180,372 L160,385 L140,376 L120,388 L100,378 L80,390 L65,380 L58,365 L68,348 L55,332 Z"
  },
  { id:"cuba", name:"Cuba", area:12, lx:340, ly:348,
    borders:["usa","mexico"],
    d:"M298,338 L385,336 L390,345 L378,354 L360,352 L338,358 L312,354 L295,346 Z"
  },
  { id:"guatemala", name:"Guatemala", area:8, lx:178, ly:395,
    borders:["mexico","colombia"],
    d:"M120,382 L218,380 L222,392 L212,402 L195,405 L175,402 L155,408 L135,402 L118,394 Z"
  },
  { id:"colombia", name:"Colombia", area:38, lx:290, ly:430,
    borders:["venezuela","ecuador","peru","brazil","guatemala"],
    d:"M220,405 L352,402 L358,418 L350,432 L358,448 L342,460 L320,452 L298,465 L274,456 L250,468 L225,458 L208,445 L215,428 L205,415 Z"
  },
  { id:"venezuela", name:"Venezuela", area:35, lx:368, ly:428,
    borders:["colombia","brazil"],
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
  { id:"iceland", name:"Iceland", area:12, lx:638, ly:118,
    borders:["uk","norway","greenland"],
    d:"M608,102 L672,98 L678,112 L668,128 L648,134 L625,128 L605,118 Z"
  },
  { id:"norway", name:"Norway", area:25, lx:862, ly:160,
    borders:["russia","finland","sweden","iceland","uk"],
    d:"M828,108 L875,102 L888,118 L878,138 L888,155 L872,170 L855,162 L838,174 L820,165 L810,150 L818,135 L808,118 Z"
  },
  { id:"sweden", name:"Sweden", area:22, lx:892, ly:178,
    borders:["norway","finland"],
    d:"M875,108 L912,105 L918,122 L910,142 L916,160 L900,175 L882,168 L872,152 L880,135 L878,118 Z"
  },
  { id:"finland", name:"Finland", area:20, lx:928, ly:165,
    borders:["norway","sweden","russia","belarus"],
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
    borders:["portugal","france","morocco"],
    d:"M770,242 L858,240 L864,255 L856,272 L840,280 L815,285 L785,282 L768,268 Z"
  },
  { id:"france", name:"France", area:22, lx:832, ly:232,
    borders:["spain","italy","germany","uk","belgium"],
    d:"M798,215 L868,212 L874,228 L866,248 L848,255 L820,258 L798,248 L792,232 Z"
  },
  { id:"germany", name:"Germany", area:18, lx:880, ly:218,
    borders:["france","poland","czechia","austria","netherlands"],
    d:"M865,200 L912,198 L918,215 L910,232 L895,238 L872,235 L862,220 Z"
  },
  { id:"poland", name:"Poland", area:18, lx:920, ly:215,
    borders:["germany","russia","belarus","ukraine","czechia"],
    d:"M910,198 L958,196 L962,212 L954,230 L938,236 L912,232 L906,218 Z"
  },
  { id:"czechia", name:"Czechia", area:10, lx:900, ly:232,
    borders:["germany","poland","austria"],
    d:"M866,225 L920,222 L924,235 L916,245 L890,248 L865,242 Z"
  },
  { id:"austria", name:"Austria", area:10, lx:900, ly:248,
    borders:["germany","czechia","italy","hungary"],
    d:"M865,240 L935,237 L938,250 L928,260 L898,262 L866,255 Z"
  },
  { id:"italy", name:"Italy", area:20, lx:898, ly:270,
    borders:["france","germany","austria","greece"],
    d:"M862,252 L920,250 L925,265 L918,282 L905,298 L888,312 L872,320 L858,308 L850,290 L855,272 Z"
  },
  { id:"greece", name:"Greece", area:12, lx:938, ly:295,
    borders:["italy","romania","bulgaria","turkey"],
    d:"M912,278 L958,275 L962,292 L954,310 L936,318 L915,312 L908,295 Z"
  },
  { id:"romania", name:"Romania", area:16, lx:958, ly:248,
    borders:["ukraine","bulgaria","hungary"],
    d:"M934,232 L985,230 L990,248 L982,265 L962,268 L936,262 L930,248 Z"
  },
  { id:"ukraine", name:"Ukraine", area:28, lx:978, ly:228,
    borders:["russia","belarus","poland","romania"],
    d:"M955,210 L1040,208 L1046,225 L1038,242 L1010,248 L978,245 L952,240 L948,225 Z"
  },
  { id:"belarus", name:"Belarus", area:14, lx:968, ly:198,
    borders:["russia","ukraine","poland","finland"],
    d:"M946,182 L1002,180 L1008,198 L1000,215 L970,218 L944,212 Z"
  },
  { id:"turkey", name:"Turkey", area:32, lx:1010, ly:280,
    borders:["greece","bulgaria","ukraine","iran","iraq","syria"],
    d:"M960,262 L1072,258 L1080,275 L1070,292 L1042,298 L1008,302 L975,298 L958,282 Z"
  },
  { id:"bulgaria", name:"Bulgaria", area:10, lx:960, ly:265,
    borders:["romania","greece","turkey"],
    d:"M932,255 L985,252 L988,268 L978,280 L950,282 L930,272 Z"
  },
  { id:"hungary", name:"Hungary", area:10, lx:930, ly:252,
    borders:["austria","ukraine","romania"],
    d:"M902,242 L958,240 L962,255 L952,268 L922,270 L900,262 Z"
  },
  { id:"morocco", name:"Morocco", area:22, lx:790, ly:310,
    borders:["spain","algeria"],
    d:"M760,290 L820,288 L826,308 L818,328 L795,335 L770,328 L756,312 Z"
  },
  { id:"algeria", name:"Algeria", area:55, lx:848, ly:325,
    borders:["morocco","libya","mali","niger"],
    d:"M818,285 L925,282 L932,310 L924,342 L895,358 L858,362 L820,355 L808,325 Z"
  },
  { id:"libya", name:"Libya", area:45, lx:928, ly:315,
    borders:["algeria","egypt","niger","chad"],
    d:"M922,280 L1010,278 L1018,308 L1010,342 L982,358 L945,362 L920,348 L912,318 Z"
  },
  { id:"egypt", name:"Egypt", area:40, lx:1014, ly:308,
    borders:["libya","sudan","saudi"],
    d:"M1008,278 L1082,275 L1090,305 L1082,335 L1052,348 L1018,345 L1005,320 Z"
  },
  { id:"mali", name:"Mali", area:42, lx:840, ly:370,
    borders:["algeria","niger","nigeria","senegal"],
    d:"M828,330 L922,328 L928,358 L920,390 L888,398 L850,402 L818,395 L808,362 Z"
  },
  { id:"niger", name:"Niger", area:42, lx:912, ly:368,
    borders:["mali","algeria","libya","chad","nigeria"],
    d:"M920,330 L1008,328 L1014,360 L1006,392 L972,400 L935,405 L910,395 L905,362 Z"
  },
  { id:"chad", name:"Chad", area:40, lx:992, ly:368,
    borders:["niger","libya","sudan","nigeria","cameroon"],
    d:"M1005,328 L1078,325 L1085,358 L1076,392 L1044,402 L1008,405 L992,392 L990,360 Z"
  },
  { id:"sudan", name:"Sudan", area:42, lx:1065, ly:358,
    borders:["egypt","chad","ethiopia","south_sudan"],
    d:"M1080,305 L1148,302 L1155,335 L1148,370 L1118,385 L1082,388 L1058,375 L1052,342 Z"
  },
  { id:"senegal", name:"Senegal", area:10, lx:752, ly:402,
    borders:["mali"],
    d:"M730,380 L778,378 L782,395 L774,412 L752,415 L730,408 Z"
  },
  { id:"nigeria", name:"Nigeria", area:42, lx:878, ly:408,
    borders:["niger","chad","cameroon","mali"],
    d:"M842,395 L948,392 L954,415 L945,442 L912,450 L872,452 L840,442 L832,418 Z"
  },
  { id:"cameroon", name:"Cameroon", area:22, lx:968, ly:418,
    borders:["nigeria","chad","drc"],
    d:"M945,392 L1010,390 L1016,415 L1008,442 L978,450 L948,448 L940,425 Z"
  },
  { id:"ethiopia", name:"Ethiopia", area:40, lx:1108, ly:408,
    borders:["sudan","south_sudan","somalia","kenya"],
    d:"M1072,385 L1155,382 L1162,408 L1152,435 L1120,448 L1085,452 L1060,438 L1052,412 Z"
  },
  { id:"somalia", name:"Somalia", area:28, lx:1165, ly:420,
    borders:["ethiopia","kenya"],
    d:"M1150,378 L1205,375 L1215,405 L1205,442 L1178,462 L1152,458 L1140,435 L1142,408 Z"
  },
  { id:"south_sudan", name:"S. Sudan", area:28, lx:1065, ly:418,
    borders:["sudan","ethiopia","drc","kenya"],
    d:"M1040,385 L1120,382 L1126,408 L1116,432 L1082,438 L1048,432 L1035,412 Z"
  },
  { id:"kenya", name:"Kenya", area:24, lx:1122, ly:455,
    borders:["ethiopia","somalia","tanzania","south_sudan"],
    d:"M1085,435 L1152,432 L1158,455 L1148,478 L1115,485 L1082,478 L1072,455 Z"
  },
  { id:"drc", name:"D.R. Congo", area:65, lx:1002, ly:458,
    borders:["cameroon","south_sudan","kenya","tanzania","zambia","angola"],
    d:"M968,430 L1080,428 L1088,458 L1078,495 L1045,510 L1005,515 L968,508 L950,478 L955,452 Z"
  },
  { id:"angola", name:"Angola", area:38, lx:968, ly:515,
    borders:["drc","zambia","namibia"],
    d:"M942,498 L1060,495 L1065,522 L1055,552 L1020,562 L980,565 L945,555 L932,528 Z"
  },
  { id:"tanzania", name:"Tanzania", area:32, lx:1098, ly:490,
    borders:["kenya","drc","zambia","mozambique"],
    d:"M1080,470 L1158,468 L1165,492 L1155,518 L1122,528 L1085,522 L1068,498 Z"
  },
  { id:"zambia", name:"Zambia", area:30, lx:1042, ly:532,
    borders:["angola","drc","tanzania","mozambique","zimbabwe","south_africa"],
    d:"M1002,508 L1092,505 L1098,530 L1088,558 L1052,565 L1012,558 L998,535 Z"
  },
  { id:"mozambique", name:"Mozambique", area:25, lx:1098, ly:548,
    borders:["tanzania","zambia","zimbabwe","south_africa"],
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
    borders:["namibia","zimbabwe","south_africa"],
    d:"M1008,555 L1075,552 L1080,575 L1068,598 L1030,602 L1000,595 Z"
  },
  { id:"south_africa", name:"S. Africa", area:42, lx:1012, ly:608,
    borders:["namibia","botswana","zimbabwe","mozambique"],
    d:"M940,578 L1098,575 L1106,605 L1095,638 L1055,652 L1010,655 L965,648 L935,618 Z"
  },
  { id:"madagascar", name:"Madagascar", area:22, lx:1182, ly:545,
    borders:["mozambique"],
    d:"M1158,502 L1205,500 L1212,528 L1202,562 L1178,578 L1155,565 L1148,538 Z"
  },
  { id:"saudi", name:"Saudi Arabia", area:55, lx:1072, ly:338,
    borders:["egypt","iraq","iran","uae","oman","yemen"],
    d:"M1048,295 L1148,292 L1155,322 L1148,358 L1118,378 L1078,385 L1042,378 L1025,348 L1032,318 Z"
  },
  { id:"iraq", name:"Iraq", area:22, lx:1075, ly:292,
    borders:["turkey","iran","saudi","syria"],
    d:"M1045,262 L1112,258 L1120,278 L1112,302 L1085,315 L1052,312 L1038,292 Z"
  },
  { id:"syria", name:"Syria", area:14, lx:1045, ly:270,
    borders:["turkey","iraq"],
    d:"M1018,252 L1080,250 L1086,268 L1076,285 L1045,288 L1018,280 Z"
  },
  { id:"iran", name:"Iran", area:55, lx:1135, ly:288,
    borders:["turkey","iraq","saudi","pakistan","afghanistan","kazakhstan"],
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
  { id:"kazakhstan", name:"Kazakhstan", area:62, lx:1215, ly:232,
    borders:["russia","china","iran","afghanistan","uzbekistan"],
    d:"M1165,182 L1330,178 L1338,205 L1328,235 L1295,248 L1248,252 L1200,248 L1162,232 Z"
  },
  { id:"uzbekistan", name:"Uzbekistan", area:16, lx:1218, ly:268,
    borders:["kazakhstan","afghanistan","iran"],
    d:"M1185,248 L1260,245 L1268,265 L1258,285 L1222,288 L1185,280 Z"
  },
  { id:"afghanistan", name:"Afghanistan", area:28, lx:1228, ly:298,
    borders:["iran","pakistan","uzbekistan","kazakhstan","china"],
    d:"M1195,272 L1292,268 L1300,292 L1288,318 L1250,325 L1205,322 L1188,302 Z"
  },
  { id:"pakistan", name:"Pakistan", area:38, lx:1262, ly:328,
    borders:["iran","afghanistan","china","india"],
    d:"M1200,315 L1308,312 L1318,338 L1308,368 L1268,378 L1225,372 L1198,352 Z"
  },
  { id:"india", name:"India", area:72, lx:1305, ly:388,
    borders:["pakistan","china","nepal","bangladesh","myanmar"],
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
  { id:"mongolia", name:"Mongolia", area:55, lx:1388, ly:218,
    borders:["russia","china"],
    d:"M1315,182 L1498,178 L1506,205 L1495,232 L1438,242 L1372,245 L1315,238 Z"
  },
  { id:"china", name:"China", area:118, lx:1445, ly:295,
    borders:["russia","mongolia","kazakhstan","afghanistan","pakistan","india","nepal","myanmar","vietnam","north_korea"],
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
  { id:"japan", name:"Japan", area:22, lx:1588, ly:262,
    borders:["south_korea","china"],
    d:"M1565,232 L1612,228 L1620,252 L1610,278 L1578,288 L1558,272 Z"
  },
  { id:"myanmar", name:"Myanmar", area:22, lx:1415, ly:378,
    borders:["china","india","bangladesh","thailand"],
    d:"M1385,342 L1448,338 L1458,365 L1448,398 L1415,412 L1378,405 L1365,378 Z"
  },
  { id:"thailand", name:"Thailand", area:22, lx:1445, ly:412,
    borders:["myanmar","cambodia","malaysia","vietnam"],
    d:"M1415,392 L1472,388 L1482,415 L1471,445 L1438,452 L1405,445 L1398,418 Z"
  },
  { id:"vietnam", name:"Vietnam", area:18, lx:1492, ly:405,
    borders:["china","cambodia","thailand"],
    d:"M1468,368 L1518,365 L1528,395 L1518,432 L1488,442 L1462,432 L1452,405 Z"
  },
  { id:"cambodia", name:"Cambodia", area:10, lx:1468, ly:445,
    borders:["thailand","vietnam"],
    d:"M1435,428 L1488,425 L1494,448 L1482,465 L1448,468 L1428,452 Z"
  },
  { id:"malaysia", name:"Malaysia", area:14, lx:1462, ly:468,
    borders:["thailand","indonesia"],
    d:"M1415,452 L1495,448 L1502,468 L1490,485 L1428,488 L1408,472 Z"
  },
  { id:"philippines", name:"Philippines", area:18, lx:1545, ly:420,
    borders:["indonesia","malaysia"],
    d:"M1518,390 L1572,386 L1580,415 L1568,448 L1535,455 L1508,442 L1502,415 Z"
  },
  { id:"indonesia", name:"Indonesia", area:68, lx:1505, ly:498,
    borders:["malaysia","papua"],
    d:"M1412,470 L1650,465 L1660,488 L1648,510 L1415,515 L1400,492 Z"
  },
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

function buildAdj() {
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


export default function EarthConquest(){
  const [screen,setScreen]=useState("room");
  const [roomCode,setRoomCode]=useState("");
  const [roomInput,setRoomInput]=useState("");
  const [roomError,setRoomError]=useState("");
  const [username,setUsername]=useState("");
  const [inputName,setInputName]=useState("");
  const [inputPassword,setInputPassword]=useState("");
  const [cidx,setCidx]=useState(0);
  const [ownership,setOwnership]=useState({});
  const [players,setPlayers]=useState({});
  const [myInventory,setMyInventory]=useState({
    coins:500, tank:0, bomb:0, plane:0, missile:0, bomber:0, air_def:0, spy:0, lastDaily:"",
    wood:0, stone:0, iron:0, gold:0,
    buildings:[], lastFactory:0, factoryCount:0,
    academySpies:0, lastAcademy:0, // spy academy
  });
  const [hovered,setHovered]=useState(null);
  const [tip,setTip]=useState({show:false,x:0,y:0,c:null,owner:null,inReach:false});
  const [notif,setNotif]=useState(null);
  const [attackMode,setAttackMode]=useState(false);
  const [reachable,setReachable]=useState(new Set());
  const [showShop,setShowShop]=useState(false);
  const [showBuildShop,setShowBuildShop]=useState(false);
  const [showDaily,setShowDaily]=useState(false);
  const [attackPlan,setAttackPlan]=useState(null);
  const [deploy,setDeploy]=useState({tank:0,bomb:0,plane:0,missile:0,bomber:0});
  const [factoryTimer,setFactoryTimer]=useState(0); // ms until next payout
  const svgRef=useRef(null);

  // All storage keys are scoped to the room code
  // storage scoped per player username (Supabase)

  // Load shared world state (called after room code is set)
  const loadWorld=async(code)=>{
    try{
      const {data}=await sb.from("world").select("ownership,players").eq("room_code",code).single();
      if(data){
        setOwnership(data.ownership||{});
        setPlayers(data.players||{});
      }
    }catch(e){}
  };

  const saveWorld=async(o,p)=>{
    try{
      await sb.from("world").upsert({room_code:roomCode,ownership:o,players:p},{onConflict:"room_code"});
    }catch(e){}
  };

  // Save inventory (personal, not shared)
  const saveInv=async(inv,name)=>{
    try{
      const key=(name||username);
      await sb.from("inventory").upsert({username:key,data:inv},{onConflict:"username"});
    }catch(e){}
  };

  // ── Live sync: poll Supabase every 3 seconds while in game ──────────────────
  useEffect(()=>{
    if(!roomCode||screen!=="map")return;
    const poll=setInterval(async()=>{
      try{
        const {data}=await sb.from("world").select("ownership,players").eq("room_code",roomCode).single();
        if(data){
          setOwnership(prev=>{
            const incoming=data.ownership||{};
            // only update if something actually changed
            if(JSON.stringify(prev)===JSON.stringify(incoming))return prev;
            return incoming;
          });
          setPlayers(prev=>{
            const incoming=data.players||{};
            if(JSON.stringify(prev)===JSON.stringify(incoming))return prev;
            return incoming;
          });
        }
      }catch(e){}
    },3000);
    return()=>clearInterval(poll);
  },[roomCode,screen]);

  const flash=(msg,type="info")=>{setNotif({msg,type});setTimeout(()=>setNotif(null),3500);};

  useEffect(()=>{
    if(!attackMode||!username){setReachable(new Set());return;}
    const mine=Object.keys(ownership).filter(id=>ownership[id]===username);
    const hops=myInventory.plane>0?3:2;
    setReachable(getReachable(mine,hops));
  },[attackMode,ownership,username,myInventory.plane]);

  // ── Coin Factory: +5 coins/second (+2 bonus per Gold Vault) ────────────────
  useEffect(()=>{
    if(!username||screen!=="map")return;
    const tick=setInterval(()=>{
      setMyInventory(inv=>{
        const factoryCount=(inv.buildings||[]).filter(b=>b==="coin_factory").length;
        if(factoryCount===0)return inv;
        const vaultCount=(inv.buildings||[]).filter(b=>b==="vault").length;
        const perFactory=COIN_FACTORY_YIELD+(vaultCount*2);
        const earned=perFactory*factoryCount;
        const newInv={...inv,coins:inv.coins+earned,lastFactory:Date.now()};
        (async()=>{try{await sb.from("inventory").upsert({username:inv._name||"",data:newInv},{onConflict:"username"});}catch(e){}})();
        return newInv;
      });
    },COIN_FACTORY_INTERVAL_MS);
    return()=>clearInterval(tick);
  },[username,screen]);

  // ── Spy Academy: 1 spy ready every 20 min ───────────────────────────────────
  useEffect(()=>{
    if(!username||screen!=="map")return;
    const tick=setInterval(()=>{
      setMyInventory(inv=>{
        const hasAcademy=(inv.buildings||[]).includes("spy_academy");
        if(!hasAcademy)return inv;
        const now=Date.now();
        const last=inv.lastAcademy||now;
        if(now-last<SPY_ACADEMY_INTERVAL_MS)return inv;
        const newInv={...inv,academySpies:(inv.academySpies||0)+1,lastAcademy:now};
        (async()=>{try{await sb.from("inventory").upsert({username:inv._name||"",data:newInv},{onConflict:"username"});}catch(e){}})();
        setTimeout(()=>flash("🕵️ Spy Academy: A new spy is ready! Claim in Build Shop.","info"),0);
        return newInv;
      });
    },10000);
    return()=>clearInterval(tick);
  },[username,screen]);

  // ── Academy countdown ───────────────────────────────────────────────────────
  useEffect(()=>{
    const t=setInterval(()=>{
      if(!(myInventory.buildings||[]).includes("spy_academy"))return;
      const last=myInventory.lastAcademy||Date.now();
      setFactoryTimer(Math.max(0,last+SPY_ACADEMY_INTERVAL_MS-Date.now()));
    },1000);
    return()=>clearInterval(t);
  },[myInventory.lastAcademy,myInventory.buildings]);

  // ── Elimination check ───────────────────────────────────────────────────────
  useEffect(()=>{
    if(!username||screen!=="map")return;
    const mine=Object.keys(ownership).filter(id=>ownership[id]===username);
    if(mine.length===0&&Object.keys(ownership).length>0){
      setScreen("eliminated");
    }
  },[ownership,username,screen]);

  const handleRoom=async()=>{
    const code=roomInput.trim();
    if(!/^\d{6}$/.test(code)){setRoomError("Please enter exactly 6 digits.");return;}
    setRoomCode(code);
    await loadWorld(code);
    setRoomError("");
    setScreen("login");
  };

  const handleLogin=async()=>{
    const name=inputName.trim()||rndName();
    const pwd=inputPassword.trim();
    if(!pwd){flash("Please enter a password!","warn");return;}
    let o={},p={};
    try{
      const {data}=await sb.from("world").select("ownership,players").eq("room_code",roomCode).single();
      if(data){o=data.ownership||{};p=data.players||{};}
    }catch(e){}

    const defaultInv={coins:500,tank:0,bomb:0,plane:0,missile:0,bomber:0,air_def:0,spy:0,lastDaily:"",wood:0,stone:0,iron:0,gold:0,buildings:[],lastFactory:0,factoryCount:0,academySpies:0,lastAcademy:0,_name:name,_pwd:pwd};
    let inv=defaultInv;
    try{
      const {data}=await sb.from("inventory").select("data").eq("username",name).single();
      if(data){
        // account exists — check password
        const saved=data.data;
        if(saved._pwd && saved._pwd!==pwd){
          flash("❌ Wrong password for that name!","error");return;
        }
        inv={...defaultInv,...saved,_name:name,_pwd:pwd};
      }
    }catch(e){}

    if(p[name]){
      const cnt=Object.keys(o).filter(id=>o[id]===name).length;
      setOwnership(o);setPlayers(p);setCidx(p[name].cidx||0);
      setMyInventory(inv);
      if(inv.lastDaily!==todayStr()){setShowDaily(true);}
      flash(`Welcome back, ${name}! Room ${roomCode} · ${cnt} territories.`,"success");
    }else{
      const terr=startTerr(o);
      const newO={...o};terr.forEach(id=>{newO[id]=name;});
      const newP={...p,[name]:{cidx,joinedAt:Date.now()}};
      await saveWorld(newO,newP);
      setOwnership(newO);setPlayers(newP);
      setMyInventory(inv);
      flash(`🌍 Welcome, ${name}! Room ${roomCode} · ${terr.length} starting territory!`,"success");
    }
    setUsername(name);setScreen("map");
  };

  const claimDaily=async()=>{
    const vaultBonus=(myInventory.buildings||[]).filter(b=>b==="vault").length*500;
    const total=DAILY_REWARD+vaultBonus;
    const newInv={...myInventory,coins:myInventory.coins+total,lastDaily:todayStr()};
    setMyInventory(newInv);
    await saveInv(newInv);
    setShowDaily(false);
    flash(`🎁 Daily reward: +${total.toLocaleString()} coins${vaultBonus>0?` (🏦 +${vaultBonus} vault bonus!)`:""}!`,"success");
  };

  const buyItem=async(item)=>{
    const buildings=myInventory.buildings||[];
    let price=item.price;
    if(item.id==="tank"){
      const barrackCount=buildings.filter(b=>b==="barracks").length;
      price=Math.floor(price*Math.pow(0.8,barrackCount));
    }
    if(item.id==="plane"){
      const airbaseCount=buildings.filter(b=>b==="airbase").length;
      price=Math.floor(price*Math.pow(0.8,airbaseCount));
    }
    if(myInventory.coins<price){flash("Not enough coins!","warn");return;}
    const newInv={...myInventory,coins:myInventory.coins-price,[item.id]:(myInventory[item.id]||0)+1};
    setMyInventory(newInv);
    await saveInv(newInv);
    flash(`✅ Bought 1 ${item.name} for ${price.toLocaleString()} coins!`,"success");
  };

  const buyMaterial=async(mat)=>{
    if(myInventory.coins<mat.price){flash("Not enough coins!","warn");return;}
    const newInv={...myInventory,coins:myInventory.coins-mat.price,[mat.id]:(myInventory[mat.id]||0)+1};
    setMyInventory(newInv);
    await saveInv(newInv);
    flash(`✅ Bought 1 ${mat.name} for ${mat.price} coins!`,"success");
  };

  const buildBuilding=async(bld)=>{
    // Check building limit
    const currentCount=(myInventory.buildings||[]).filter(b=>b===bld.id).length;
    const limit=BUILDING_LIMITS[bld.id]||99;
    if(currentCount>=limit){flash(`Max ${limit} ${bld.name}(s) allowed!`,"warn");return;}
    // Check materials
    for(const [mat,qty] of Object.entries(bld.cost)){
      if((myInventory[mat]||0)<qty){flash(`Not enough ${mat}! Need ${qty} ${mat}.`,"warn");return;}
    }
    const newInv={...myInventory};
    for(const [mat,qty] of Object.entries(bld.cost)) newInv[mat]=(newInv[mat]||0)-qty;
    const buildings=[...(newInv.buildings||[])];
    buildings.push(bld.id);
    newInv.buildings=buildings;
    if(bld.id==="coin_factory") newInv.lastFactory=Date.now();
    setMyInventory(newInv);
    await saveInv(newInv);
    flash(`🏗️ Built ${bld.name}!${bld.id==="coin_factory"?" +5 coins/sec (more with Gold Vaults)!":bld.id==="spy_academy"?" Spy ready every 20 min, claim for 300 coins!":bld.id==="vault"?" +2 coins/sec to all factories + +500 daily reward!":""}`, "success");
  };

  const claimAcademySpy=async()=>{
    if((myInventory.academySpies||0)<1){flash("No spies ready yet!","warn");return;}
    if(myInventory.coins<SPY_CLAIM_COST){flash(`Need ${SPY_CLAIM_COST} coins to claim spy!`,"warn");return;}
    const newInv={...myInventory,coins:myInventory.coins-SPY_CLAIM_COST,spy:(myInventory.spy||0)+1,academySpies:myInventory.academySpies-1};
    setMyInventory(newInv);
    await saveInv(newInv);
    flash(`🕵️ Claimed academy spy for ${SPY_CLAIM_COST} coins! +1% win chance on next attack.`,"success");
  };

  const handleClick=async(country)=>{
    if(!attackMode)return;
    const owner=ownership[country.id];
    if(owner===username){flash("Already yours!","warn");return;}
    const mine=Object.keys(ownership).filter(id=>ownership[id]===username);
    const hops=myInventory.plane>0?3:2;
    const reach=getReachable(mine,hops);
    if(!reach.has(country.id)){flash("Out of range! Expand your borders first.","warn");return;}
    if(myInventory.tank===0&&myInventory.bomb===0&&myInventory.plane===0&&(myInventory.missile||0)===0&&(myInventory.bomber||0)===0){
      flash("You have no weapons! Buy some in the Shop first.","warn");return;
    }
    setDeploy({tank:0,bomb:0,plane:0,missile:0,bomber:0});
    setAttackPlan({country,owner});
    setAttackMode(false);
  };

  const confirmAttack=async()=>{
    if(!attackPlan)return;
    const {country,owner}=attackPlan;
    const {tank,bomb,plane,missile,bomber}=deploy;
    if(tank===0&&bomb===0&&plane===0&&missile===0&&bomber===0){flash("Deploy at least 1 weapon!","warn");return;}
    if(tank>myInventory.tank||bomb>myInventory.bomb||plane>myInventory.plane||
       (missile||0)>myInventory.missile||(bomber||0)>myInventory.bomber){
      flash("Not enough weapons in arsenal!","warn");return;
    }

    // Get defender's air defence count from shared players data (stored in world)
    // We approximate by checking ownership — real air_def is in their inventory (not shared)
    // so we just use 0 for now unless we can check; use academySpies from own inventory
    const damage=calcDamage(tank,bomb,plane,missile,bomber);
    const chance=calcWinChance(country.area||20, damage, myInventory.spy||0, myInventory.academySpies||0, 0);
    const won=Math.random()<chance;
    const pct=Math.round(chance*100);
    const usedSpy=myInventory.spy>0;

    const newInv={
      ...myInventory,
      tank:myInventory.tank-tank,
      bomb:myInventory.bomb-bomb,
      plane:myInventory.plane-plane,
      missile:myInventory.missile-(missile||0),
      bomber:myInventory.bomber-(bomber||0),
      spy:usedSpy?myInventory.spy-1:myInventory.spy,
    };
    setMyInventory(newInv);
    await saveInv(newInv);
    setAttackPlan(null);

    if(won){
      const newO={...ownership,[country.id]:username};
      await saveWorld(newO,players);setOwnership(newO);
      flash(`⚔️ Conquered ${country.name}! ${damage} dmg → ${pct}%${usedSpy?" 🕵️":""}. Won!`,"success");
    }else{
      flash(`💀 Attack on ${country.name} failed. ${damage} dmg → ${pct}% — try more firepower!`,"error");
    }
  };

  const mine=Object.keys(ownership).filter(id=>ownership[id]===username);
  const myC=CLRS[cidx%CLRS.length];
  const lb=Object.entries(Object.values(ownership).reduce((a,o)=>{a[o]=(a[o]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const canClaimDaily=myInventory.lastDaily!==todayStr();

  // ── ELIMINATED SCREEN ─────────────────────────────────────────────────────
  if(screen==="eliminated"){
    const totalTerr=Object.keys(ownership).length;
    return(
      <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 50% 50%,#1a0000,#000)",
        display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif"}}>
        <style>{`@keyframes elimIn{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
          @keyframes skull{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}`}</style>
        <div style={{textAlign:"center",animation:"elimIn .5s ease",padding:"40px"}}>
          <div style={{fontSize:"100px",animation:"skull 2s ease infinite",marginBottom:"16px"}}>💀</div>
          <h1 style={{color:"#ef4444",fontSize:"36px",letterSpacing:"4px",margin:"0 0 8px",textTransform:"uppercase"}}>Eliminated</h1>
          <p style={{color:"rgba(255,255,255,.5)",fontSize:"14px",margin:"0 0 8px"}}>You have lost all your territories.</p>
          <p style={{color:"rgba(255,255,255,.3)",fontSize:"12px",margin:"0 0 32px"}}>Room <span style={{color:"#f5c842"}}>{roomCode}</span> continues without you.</p>
          <div style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:"14px",padding:"20px 32px",marginBottom:"28px",display:"inline-block"}}>
            <div style={{color:"rgba(255,255,255,.4)",fontSize:"10px",letterSpacing:"2px",marginBottom:"12px",textTransform:"uppercase"}}>Your Final Stats</div>
            <div style={{color:"#f5c842",fontSize:"18px",fontWeight:"bold",marginBottom:"6px"}}>🪙 {myInventory.coins.toLocaleString()} coins remaining</div>
            <div style={{color:"rgba(255,255,255,.5)",fontSize:"13px"}}>{totalTerr} territories claimed by others</div>
          </div>
          <br/>
          <button onClick={()=>{setScreen("room");setRoomCode("");setRoomInput("");setOwnership({});setPlayers({});setUsername("");}}
            style={{padding:"14px 36px",background:"linear-gradient(135deg,#7f1d1d,#ef4444)",border:"none",
              borderRadius:"12px",color:"white",fontSize:"14px",fontWeight:"bold",cursor:"pointer",
              letterSpacing:"2px",fontFamily:"Georgia,serif",boxShadow:"0 8px 24px rgba(239,68,68,.4)"}}>
            ← Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ── ROOM CODE SCREEN ───────────────────────────────────────────────────────
  if(screen==="room"){
    const digits=roomInput.split("").concat(Array(6).fill("")).slice(0,6);
    return(
      <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 20% 50%,#0a1628,#050d1a 50%,#000)",
        display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",overflow:"hidden",position:"relative"}}>
        {Array.from({length:70}).map((_,i)=>(
          <div key={i} style={{position:"absolute",width:Math.random()*2+1+"px",height:Math.random()*2+1+"px",
            background:"white",borderRadius:"50%",left:Math.random()*100+"%",top:Math.random()*100+"%",
            opacity:Math.random()*.6+.1,animation:`twR${i%3} ${Math.random()*3+2}s ease-in-out infinite alternate`}}/>
        ))}
        <style>{`
          @keyframes twR0{from{opacity:.1}to{opacity:.8}}
          @keyframes twR1{from{opacity:.15}to{opacity:.7}}
          @keyframes twR2{from{opacity:.05}to{opacity:.9}}
          @keyframes puR{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
          @keyframes siR{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
          @keyframes digitPop{0%{transform:scale(1)}40%{transform:scale(1.2)}100%{transform:scale(1)}}
          .digit-box{transition:all .15s;border:2px solid rgba(255,255,255,.15);border-radius:12px;
            width:52px;height:64px;display:flex;align-items:center;justify-content:center;
            font-size:28px;font-weight:bold;color:white;background:rgba(255,255,255,.06);}
          .digit-box.filled{border-color:rgba(212,160,23,.7);background:rgba(212,160,23,.12);
            box-shadow:0 0 12px rgba(212,160,23,.3);animation:digitPop .2s ease;}
          .digit-box.active{border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.08);}
        `}</style>
        <div style={{background:"linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.02))",
          border:"1px solid rgba(255,255,255,.15)",borderRadius:"22px",padding:"52px 48px",width:"420px",
          backdropFilter:"blur(20px)",boxShadow:"0 40px 80px rgba(0,0,0,.6)",animation:"siR .5s ease",zIndex:10,textAlign:"center"}}>

          <div style={{fontSize:"60px",animation:"puR 3s infinite",marginBottom:"8px"}}>🌍</div>
          <h1 style={{color:"#fff",fontSize:"28px",margin:"0 0 4px",letterSpacing:"4px",textTransform:"uppercase"}}>TERRA</h1>
          <p style={{color:"rgba(255,255,255,.32)",margin:"0 0 10px",fontSize:"11px",letterSpacing:"5px"}}>CONQUEST</p>
          <p style={{color:"rgba(255,255,255,.45)",fontSize:"13px",margin:"0 0 32px",lineHeight:"1.6"}}>
            Enter or share a <span style={{color:"#f5c842",fontWeight:"bold"}}>6-digit room code</span><br/>
            to play on the same map as your friends
          </p>

          {/* 6 digit boxes */}
          <div style={{display:"flex",gap:"8px",justifyContent:"center",marginBottom:"20px"}}>
            {digits.map((d,i)=>(
              <div key={i} className={`digit-box${d?"  filled":i===roomInput.length?" active":""}`}>{d||""}</div>
            ))}
          </div>

          {/* Hidden real input for typing */}
          <input
            autoFocus
            value={roomInput}
            onChange={e=>{
              const v=e.target.value.replace(/\D/g,"").slice(0,6);
              setRoomInput(v);setRoomError("");
            }}
            onKeyDown={e=>e.key==="Enter"&&handleRoom()}
            style={{position:"absolute",opacity:0,pointerEvents:"none",width:"1px",height:"1px"}}
          />

          {/* Clickable number pad */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"20px"}}>
            {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
              <button key={i} onClick={()=>{
                if(k==="⌫"){setRoomInput(r=>r.slice(0,-1));setRoomError("");}
                else if(k!==""&&roomInput.length<6){setRoomInput(r=>r+k);setRoomError("");}
              }} style={{
                padding:"14px",borderRadius:"10px",fontSize:k==="⌫"?"18px":"20px",fontWeight:"bold",
                background:k===""?"transparent":"rgba(255,255,255,.07)",
                border:k===""?"none":"1px solid rgba(255,255,255,.12)",
                color:k==="⌫"?"#f87171":"white",cursor:k===""?"default":"pointer",
                transition:"all .12s",fontFamily:"Georgia,serif",
              }}
              onMouseOver={e=>{if(k!=="")e.currentTarget.style.background="rgba(255,255,255,.14)";}}
              onMouseOut={e=>{if(k!=="")e.currentTarget.style.background="rgba(255,255,255,.07)";}}>
                {k}
              </button>
            ))}
          </div>

          {roomError&&(
            <div style={{color:"#f87171",fontSize:"11px",marginBottom:"12px",padding:"8px 12px",
              background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:"8px"}}>
              {roomError}
            </div>
          )}

          <button onClick={handleRoom}
            style={{width:"100%",padding:"14px",
              background:roomInput.length===6?"linear-gradient(135deg,#d4a017,#f5c842)":"rgba(255,255,255,.06)",
              border:roomInput.length===6?"none":"1px solid rgba(255,255,255,.1)",
              borderRadius:"10px",color:roomInput.length===6?"#000":"rgba(255,255,255,.25)",
              fontSize:"13px",fontWeight:"bold",cursor:roomInput.length===6?"pointer":"not-allowed",
              letterSpacing:"3px",textTransform:"uppercase",fontFamily:"Georgia,serif",
              boxShadow:roomInput.length===6?"0 8px 22px rgba(212,160,23,.4)":"none",transition:"all .2s"}}>
            {roomInput.length===6?"Enter Room →":"Enter 6-digit Code"}
          </button>

          <div style={{marginTop:"20px",padding:"12px 16px",background:"rgba(255,255,255,.03)",
            border:"1px solid rgba(255,255,255,.07)",borderRadius:"10px"}}>
            <p style={{color:"rgba(255,255,255,.3)",fontSize:"10px",margin:"0 0 8px",letterSpacing:"1px",textTransform:"uppercase"}}>Want your own room?</p>
            <button onClick={()=>{
              const r=String(Math.floor(100000+Math.random()*900000));
              setRoomInput(r);setRoomError("");
            }} style={{background:"rgba(59,130,246,.15)",border:"1px solid rgba(59,130,246,.4)",
              borderRadius:"8px",padding:"7px 16px",color:"#93c5fd",fontSize:"11px",cursor:"pointer",fontFamily:"Georgia,serif"}}>
              🎲 Generate Random Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if(screen==="login")return(
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 20% 50%,#0a1628,#050d1a 50%,#000)",
      display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",overflow:"hidden",position:"relative"}}>
      {Array.from({length:70}).map((_,i)=>(
        <div key={i} style={{position:"absolute",width:Math.random()*2+1+"px",height:Math.random()*2+1+"px",
          background:"white",borderRadius:"50%",left:Math.random()*100+"%",top:Math.random()*100+"%",
          opacity:Math.random()*.6+.1,animation:`tw${i%3} ${Math.random()*3+2}s ease-in-out infinite alternate`}}/>
      ))}
      <style>{`@keyframes tw0{from{opacity:.1}to{opacity:.8}}@keyframes tw1{from{opacity:.15}to{opacity:.7}}@keyframes tw2{from{opacity:.05}to{opacity:.9}}@keyframes pu{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes si{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{background:"linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.02))",border:"1px solid rgba(255,255,255,.15)",
        borderRadius:"22px",padding:"52px 48px",width:"400px",backdropFilter:"blur(20px)",
        boxShadow:"0 40px 80px rgba(0,0,0,.6)",animation:"si .5s ease",zIndex:10,textAlign:"center"}}>
        <div style={{fontSize:"64px",animation:"pu 3s infinite"}}>🌍</div>
        <h1 style={{color:"#fff",fontSize:"28px",margin:"8px 0 4px",letterSpacing:"4px",textTransform:"uppercase"}}>TERRA</h1>
        <p style={{color:"rgba(255,255,255,.32)",margin:"0 0 34px",fontSize:"11px",letterSpacing:"5px"}}>CONQUEST</p>
        <div style={{textAlign:"left",marginBottom:"18px"}}>
          <label style={{color:"rgba(255,255,255,.42)",fontSize:"10px",letterSpacing:"2px",textTransform:"uppercase",display:"block",marginBottom:"7px"}}>Commander Name</label>
          <input value={inputName} onChange={e=>setInputName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            placeholder="Leave blank for random…"
            style={{width:"100%",padding:"12px 14px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.13)",
              borderRadius:"9px",color:"#fff",fontSize:"14px",fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box"}}/>
        </div>
        <div style={{textAlign:"left",marginBottom:"18px"}}>
          <label style={{color:"rgba(255,255,255,.42)",fontSize:"10px",letterSpacing:"2px",textTransform:"uppercase",display:"block",marginBottom:"7px"}}>🔒 Password</label>
          <input type="password" value={inputPassword} onChange={e=>setInputPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            placeholder="Set a password to protect your account"
            style={{width:"100%",padding:"12px 14px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.13)",
              borderRadius:"9px",color:"#fff",fontSize:"14px",fontFamily:"Georgia,serif",outline:"none",boxSizing:"border-box"}}/>
          <p style={{color:"rgba(255,255,255,.25)",fontSize:"9px",margin:"5px 0 0",lineHeight:"1.5"}}>Remember this! Anyone who knows your name needs this password to log in as you.</p>
        </div>
        <div style={{marginBottom:"26px"}}>
          <label style={{color:"rgba(255,255,255,.42)",fontSize:"10px",letterSpacing:"2px",textTransform:"uppercase",display:"block",marginBottom:"9px"}}>Choose Color</label>
          <div style={{display:"flex",gap:"9px",justifyContent:"center",flexWrap:"wrap"}}>
            {CLRS.map((c,i)=>(<button key={i} onClick={()=>setCidx(i)} style={{width:"30px",height:"30px",borderRadius:"50%",background:c.bg,cursor:"pointer",
              border:cidx===i?"3px solid white":"3px solid transparent",transform:cidx===i?"scale(1.25)":"scale(1)",
              transition:"all .2s",boxShadow:cidx===i?`0 0 10px ${c.bg}`:"none"}}/>))}
          </div>
        </div>
        <button onClick={handleLogin} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",
          borderRadius:"10px",color:"#000",fontSize:"13px",fontWeight:"bold",cursor:"pointer",letterSpacing:"3px",
          textTransform:"uppercase",fontFamily:"Georgia,serif",boxShadow:"0 8px 22px rgba(212,160,23,.4)",transition:"transform .2s"}}
          onMouseOver={e=>e.target.style.transform="translateY(-2px)"} onMouseOut={e=>e.target.style.transform="translateY(0)"}>
          Enter the World
        </button>
        <p style={{color:"rgba(255,255,255,.18)",fontSize:"10px",marginTop:"18px"}}>🔑 Room <span style={{color:"#f5c842",letterSpacing:"2px"}}>{roomCode}</span> · Start with 500 coins</p>
      </div>
    </div>
  );

  // ── MAP ────────────────────────────────────────────────────────────────────
  return(
    <div style={{height:"100vh",background:"#040c18",fontFamily:"Georgia,serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        @keyframes ni{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes pr{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
        @keyframes gl{0%,100%{opacity:.6}50%{opacity:1}}
        @keyframes coinPop{0%{transform:scale(1)}40%{transform:scale(1.3)}100%{transform:scale(1)}}
        @keyframes modalIn{from{opacity:0;transform:translateY(20px)scale(.95)}to{opacity:1;transform:translateY(0)scale(1)}}
        .cp{transition:filter .12s,opacity .12s;}.cp:hover{filter:brightness(1.5)!important;cursor:pointer;}
        .cp.att:hover{cursor:crosshair!important;}
        .shopbtn:hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(0,0,0,.4);}
        .shopbtn{transition:all .15s;}
      `}</style>

      {/* Notification */}
      {notif&&(
        <div style={{position:"fixed",top:"64px",right:"14px",zIndex:2000,padding:"11px 16px",
          background:notif.type==="success"?"rgba(16,185,129,.97)":notif.type==="error"?"rgba(239,68,68,.97)":notif.type==="warn"?"rgba(245,158,11,.97)":"rgba(59,130,246,.97)",
          borderRadius:"10px",color:"white",fontSize:"13px",animation:"ni .3s ease",maxWidth:"290px",boxShadow:"0 8px 28px rgba(0,0,0,.5)"}}>
          {notif.msg}
        </div>
      )}

      {/* Daily Reward Modal */}
      {showDaily&&(()=>{
        const vaultCount=(myInventory.buildings||[]).filter(b=>b==="vault").length;
        const vaultBonus=vaultCount*500;
        const total=DAILY_REWARD+vaultBonus;
        return(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"linear-gradient(135deg,#0a1628,#0f2040)",border:"1px solid rgba(212,160,23,.5)",
            borderRadius:"20px",padding:"48px 44px",textAlign:"center",maxWidth:"360px",
            boxShadow:"0 0 60px rgba(212,160,23,.25)",animation:"modalIn .4s ease"}}>
            <div style={{fontSize:"64px",marginBottom:"12px"}}>🎁</div>
            <h2 style={{color:"#f5c842",fontSize:"22px",margin:"0 0 8px",letterSpacing:"2px"}}>DAILY REWARD</h2>
            <p style={{color:"rgba(255,255,255,.5)",fontSize:"12px",margin:"0 0 16px"}}>Come back every day to claim your coins!</p>
            <div style={{fontSize:"42px",color:"#f5c842",fontWeight:"bold",marginBottom:"8px",animation:"coinPop .5s ease"}}>
              +{total.toLocaleString()} 🪙
            </div>
            {vaultBonus>0&&(
              <p style={{color:"#fcd34d",fontSize:"12px",margin:"0 0 20px"}}>
                🏦 Includes +{vaultBonus} from {vaultCount} Gold Vault{vaultCount>1?"s":""}
              </p>
            )}
            {vaultBonus===0&&(
              <p style={{color:"rgba(255,255,255,.3)",fontSize:"11px",margin:"0 0 20px"}}>
                💡 Build Gold Vaults to earn +500 extra per vault per day
              </p>
            )}
            <button onClick={claimDaily} style={{padding:"14px 40px",background:"linear-gradient(135deg,#d4a017,#f5c842)",border:"none",
              borderRadius:"12px",color:"#000",fontSize:"15px",fontWeight:"bold",cursor:"pointer",
              letterSpacing:"2px",fontFamily:"Georgia,serif",boxShadow:"0 8px 24px rgba(212,160,23,.5)"}}>
              CLAIM REWARD
            </button>
          </div>
        </div>
        );
      })()}

      {/* Shop Modal */}
      {showShop&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowShop(false);}}>
          <div style={{background:"linear-gradient(135deg,#0a1628,#0d1f38)",border:"1px solid rgba(255,255,255,.12)",
            borderRadius:"20px",padding:"32px",width:"480px",maxHeight:"80vh",overflowY:"auto",
            boxShadow:"0 40px 80px rgba(0,0,0,.6)",animation:"modalIn .3s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px"}}>
              <div>
                <h2 style={{color:"white",fontSize:"20px",margin:"0 0 4px",letterSpacing:"2px"}}>🏪 WAR SHOP</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Weapons are consumed win or lose. Air Defence protects you.</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"4px"}}>
                <div style={{background:"rgba(212,160,23,.15)",border:"1px solid rgba(212,160,23,.4)",
                  borderRadius:"8px",padding:"6px 14px",color:"#f5c842",fontWeight:"bold",fontSize:"16px"}}>
                  🪙 {myInventory.coins.toLocaleString()}
                </div>
                {canClaimDaily&&(
                  <button onClick={()=>{setShowShop(false);setShowDaily(true);}} style={{
                    background:"rgba(16,185,129,.2)",border:"1px solid rgba(16,185,129,.5)",borderRadius:"6px",
                    padding:"4px 10px",color:"#6ee7b7",fontSize:"10px",cursor:"pointer",fontFamily:"Georgia,serif"}}>
                    🎁 Claim Daily Reward!
                  </button>
                )}
              </div>
            </div>

            {/* Current arsenal */}
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",
              borderRadius:"12px",padding:"14px",marginBottom:"20px"}}>
              <div style={{color:"rgba(255,255,255,.35)",fontSize:"9px",letterSpacing:"2px",marginBottom:"10px",textTransform:"uppercase"}}>Your Arsenal</div>
              <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                {SHOP_ITEMS.map(item=>(
                  <div key={item.id} style={{display:"flex",alignItems:"center",gap:"5px",
                    background:`${item.color}18`,border:`1px solid ${item.color}40`,
                    borderRadius:"8px",padding:"6px 10px"}}>
                    <span style={{fontSize:"16px"}}>{item.emoji}</span>
                    <span style={{color:"white",fontWeight:"bold",fontSize:"13px"}}>{myInventory[item.id]||0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shop items */}
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {SHOP_ITEMS.map(item=>{
                const buildings=myInventory.buildings||[];
                let price=item.price;
                let discountTag=null;
                if(item.id==="tank"){
                  const n=buildings.filter(b=>b==="barracks").length;
                  if(n>0){price=Math.floor(price*Math.pow(0.8,n));discountTag=`🏯 -${Math.round((1-Math.pow(0.8,n))*100)}%`;}
                }
                if(item.id==="plane"){
                  const n=buildings.filter(b=>b==="airbase").length;
                  if(n>0){price=Math.floor(price*Math.pow(0.8,n));discountTag=`🛫 -${Math.round((1-Math.pow(0.8,n))*100)}%`;}
                }
                const canBuy=myInventory.coins>=price;
                return(
                  <div key={item.id} style={{display:"flex",alignItems:"center",gap:"14px",
                    background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",
                    borderRadius:"12px",padding:"14px 16px"}}>
                    <div style={{fontSize:"32px",flexShrink:0}}>{item.emoji}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
                        <span style={{color:"white",fontWeight:"bold",fontSize:"14px"}}>{item.name}</span>
                        <span style={{background:`${item.color}22`,border:`1px solid ${item.color}44`,
                          borderRadius:"4px",padding:"1px 6px",color:item.color,fontSize:"9px",letterSpacing:"1px"}}>
                          ×{myInventory[item.id]||0}
                        </span>
                        {discountTag&&<span style={{background:"rgba(16,185,129,.2)",border:"1px solid rgba(16,185,129,.4)",borderRadius:"4px",padding:"1px 6px",color:"#6ee7b7",fontSize:"9px"}}>{discountTag}</span>}
                      </div>
                      <p style={{color:"rgba(255,255,255,.4)",fontSize:"10px",margin:0}}>{item.desc}</p>
                    </div>
                    <button className="shopbtn" onClick={()=>buyItem(item)} disabled={!canBuy}
                      style={{padding:"8px 16px",background:canBuy?`linear-gradient(135deg,${item.color}cc,${item.color})`:"rgba(255,255,255,.05)",
                        border:"none",borderRadius:"8px",color:canBuy?"#000":"rgba(255,255,255,.2)",
                        cursor:canBuy?"pointer":"not-allowed",
                        fontSize:"12px",fontWeight:"bold",fontFamily:"Georgia,serif",flexShrink:0,whiteSpace:"nowrap"}}>
                      🪙 {price.toLocaleString()}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{marginTop:"20px",padding:"12px",background:"rgba(255,200,50,.06)",border:"1px solid rgba(255,200,50,.15)",borderRadius:"10px"}}>
              <p style={{color:"rgba(255,200,80,.7)",fontSize:"10px",margin:0,lineHeight:"1.6"}}>
                ⚠️ <strong>Attack rules:</strong> Deploy tanks (1pt), bombs (5pt), planes (7pt). More damage = higher win chance. Resources consumed win or lose. 🕵️ Spy now costs 6,000 coins but gives +20% win chance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Build Shop Modal */}
      {showBuildShop&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowBuildShop(false);}}>
          <div style={{background:"linear-gradient(135deg,#0a1a10,#0d2010)",border:"1px solid rgba(16,185,129,.2)",
            borderRadius:"20px",padding:"32px",width:"520px",maxHeight:"85vh",overflowY:"auto",
            boxShadow:"0 40px 80px rgba(0,0,0,.6)",animation:"modalIn .3s ease"}}>

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"22px"}}>
              <div>
                <h2 style={{color:"white",fontSize:"20px",margin:"0 0 4px",letterSpacing:"2px"}}>🏗️ BUILD SHOP</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Buy materials, construct buildings</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"6px"}}>
                <div style={{background:"rgba(212,160,23,.15)",border:"1px solid rgba(212,160,23,.4)",borderRadius:"8px",padding:"6px 14px",color:"#f5c842",fontWeight:"bold",fontSize:"14px"}}>🪙 {myInventory.coins.toLocaleString()}</div>
                <button onClick={()=>setShowBuildShop(false)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"6px",padding:"4px 10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"11px",fontFamily:"Georgia,serif"}}>✕ Close</button>
              </div>
            </div>

            {/* Materials inventory */}
            <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:"12px",padding:"14px",marginBottom:"18px"}}>
              <div style={{color:"rgba(255,255,255,.35)",fontSize:"9px",letterSpacing:"2px",marginBottom:"10px",textTransform:"uppercase"}}>Materials Stockpile</div>
              <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
                {MATERIALS.map(m=>(
                  <div key={m.id} style={{display:"flex",alignItems:"center",gap:"6px",background:`${m.color}18`,border:`1px solid ${m.color}40`,borderRadius:"8px",padding:"7px 11px"}}>
                    <span style={{fontSize:"18px"}}>{m.emoji}</span>
                    <div>
                      <div style={{color:"rgba(255,255,255,.4)",fontSize:"8px"}}>{m.name}</div>
                      <div style={{color:"white",fontWeight:"bold",fontSize:"14px"}}>{myInventory[m.id]||0}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Buy Materials */}
            <div style={{marginBottom:"22px"}}>
              <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",marginBottom:"10px",textTransform:"uppercase"}}>Buy Materials</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                {MATERIALS.map(m=>{
                  const can=myInventory.coins>=m.price;
                  return(
                    <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",
                      background:"rgba(255,255,255,.04)",border:`1px solid ${m.color}28`,borderRadius:"10px",padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <span style={{fontSize:"22px"}}>{m.emoji}</span>
                        <div>
                          <div style={{color:"white",fontWeight:"bold",fontSize:"12px"}}>{m.name}</div>
                          <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px"}}>Have: {myInventory[m.id]||0}</div>
                        </div>
                      </div>
                      <button onClick={()=>buyMaterial(m)} disabled={!can} style={{padding:"6px 12px",
                        background:can?`linear-gradient(135deg,${m.color}cc,${m.color})`:"rgba(255,255,255,.05)",
                        border:"none",borderRadius:"7px",color:can?"white":"rgba(255,255,255,.2)",
                        cursor:can?"pointer":"not-allowed",fontSize:"11px",fontWeight:"bold",fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>
                        🪙{m.price}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Buildings */}
            <div>
              <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",marginBottom:"10px",textTransform:"uppercase"}}>Construct Buildings</div>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                {BUILDINGS.map(bld=>{
                  const owned=(myInventory.buildings||[]).filter(b=>b===bld.id).length;
                  const limit=BUILDING_LIMITS[bld.id]||99;
                  const atLimit=owned>=limit;
                  const canBuild=!atLimit&&Object.entries(bld.cost).every(([mat,qty])=>(myInventory[mat]||0)>=qty);
                  const isFactory=bld.id==="coin_factory";
                  const vaultCount=(myInventory.buildings||[]).filter(b=>b==="vault").length;
                  return(
                    <div key={bld.id} style={{display:"flex",alignItems:"center",gap:"12px",
                      background:"rgba(255,255,255,.04)",border:`1px solid ${bld.color}28`,borderRadius:"12px",padding:"12px 14px"}}>
                      <div style={{fontSize:"30px",flexShrink:0}}>{bld.emoji}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
                          <span style={{color:"white",fontWeight:"bold",fontSize:"13px"}}>{bld.name}</span>
                          {owned>0&&<span style={{background:`${bld.color}22`,border:`1px solid ${bld.color}44`,borderRadius:"4px",padding:"1px 6px",color:bld.color,fontSize:"9px"}}>{owned}/{limit}</span>}
                          {atLimit&&<span style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:"4px",padding:"1px 6px",color:"#fca5a5",fontSize:"9px"}}>MAX</span>}
                          {isFactory&&owned>0&&<span style={{background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.3)",borderRadius:"4px",padding:"1px 6px",color:"#6ee7b7",fontSize:"9px"}}>+{(COIN_FACTORY_YIELD+vaultCount*2)*owned}/s</span>}
                        </div>
                        <p style={{color:"rgba(255,255,255,.4)",fontSize:"10px",margin:"0 0 5px"}}>{bld.desc}</p>
                        <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                          {Object.entries(bld.cost).map(([mat,qty])=>{
                            const matDef=MATERIALS.find(m=>m.id===mat);
                            const have=myInventory[mat]||0;
                            const ok=have>=qty;
                            return <span key={mat} style={{background:ok?"rgba(16,185,129,.12)":"rgba(239,68,68,.12)",border:`1px solid ${ok?"rgba(16,185,129,.3)":"rgba(239,68,68,.3)"}`,borderRadius:"4px",padding:"1px 7px",color:ok?"#6ee7b7":"#fca5a5",fontSize:"9px"}}>
                              {matDef?.emoji}{qty} {mat} ({have}/{qty})
                            </span>;
                          })}
                        </div>
                      </div>
                      <button onClick={()=>buildBuilding(bld)} disabled={!canBuild}
                        style={{padding:"8px 14px",flexShrink:0,
                          background:canBuild?`linear-gradient(135deg,${bld.color}99,${bld.color})`:"rgba(255,255,255,.05)",
                          border:"none",borderRadius:"8px",color:canBuild?"white":"rgba(255,255,255,.2)",
                          cursor:canBuild?"pointer":"not-allowed",fontSize:"11px",fontWeight:"bold",fontFamily:"Georgia,serif"}}>
                        {atLimit?"MAX":"Build"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attack Plan Modal */}
      {attackPlan&&(()=>{
        const {country,owner}=attackPlan;
        const damage=calcDamage(deploy.tank,deploy.bomb,deploy.plane,deploy.missile,deploy.bomber);
        const chance=calcWinChance(country.area||20,damage,myInventory.spy||0,myInventory.academySpies||0,0);
        const pct=Math.round(chance*100);
        const totalWeapons=deploy.tank+deploy.bomb+deploy.plane+(deploy.missile||0)+(deploy.bomber||0);
        const barColor=pct>=70?"#10b981":pct>=40?"#f59e0b":"#ef4444";
        const ownerColor=owner?CLRS[(players[owner]?.cidx||0)%CLRS.length]:null;

        const WeaponRow=({id,emoji,label,dmg,color})=>{
          const max=myInventory[id]||0;
          const val=deploy[id]||0;
          return(
            <div style={{marginBottom:"18px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <span style={{fontSize:"22px"}}>{emoji}</span>
                  <div>
                    <span style={{color:"white",fontWeight:"bold",fontSize:"13px"}}>{label}</span>
                    <span style={{color:"rgba(255,255,255,.35)",fontSize:"10px",marginLeft:"6px"}}>{dmg} dmg each</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                  <button onClick={()=>setDeploy(d=>({...d,[id]:Math.max(0,d[id]-1)}))}
                    style={{width:"26px",height:"26px",borderRadius:"6px",background:"rgba(255,255,255,.08)",
                      border:"1px solid rgba(255,255,255,.15)",color:"white",fontSize:"16px",cursor:"pointer",lineHeight:"1"}}>−</button>
                  <span style={{color:color,fontWeight:"bold",fontSize:"18px",minWidth:"24px",textAlign:"center"}}>{val}</span>
                  <button onClick={()=>setDeploy(d=>({...d,[id]:Math.min(max,d[id]+1)}))}
                    style={{width:"26px",height:"26px",borderRadius:"6px",background:"rgba(255,255,255,.08)",
                      border:"1px solid rgba(255,255,255,.15)",color:"white",fontSize:"16px",cursor:"pointer",lineHeight:"1"}}>+</button>
                </div>
              </div>
              {/* Slider */}
              <div style={{position:"relative",height:"6px",background:"rgba(255,255,255,.08)",borderRadius:"3px",cursor:"pointer"}}
                onClick={e=>{
                  const rect=e.currentTarget.getBoundingClientRect();
                  const ratio=(e.clientX-rect.left)/rect.width;
                  setDeploy(d=>({...d,[id]:Math.round(ratio*max)}));
                }}>
                <div style={{height:"100%",width:max>0?`${(val/max)*100}%`:"0%",
                  background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:"3px",transition:"width .1s"}}/>
                {max>0&&<div style={{position:"absolute",top:"50%",left:max>0?`${(val/max)*100}%`:"0%",
                  transform:"translate(-50%,-50%)",width:"14px",height:"14px",borderRadius:"50%",
                  background:color,border:"2px solid white",boxShadow:`0 0 6px ${color}`}}/>}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
                <span style={{color:"rgba(255,255,255,.25)",fontSize:"9px"}}>0</span>
                <span style={{color:"rgba(255,255,255,.35)",fontSize:"9px"}}>You have: <span style={{color:color}}>{max}</span></span>
                <span style={{color:"rgba(255,255,255,.25)",fontSize:"9px"}}>{max}</span>
              </div>
            </div>
          );
        };

        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.82)",zIndex:3000,
            display:"flex",alignItems:"center",justifyContent:"center"}}
            onClick={e=>{if(e.target===e.currentTarget){setAttackPlan(null);}}}>
            <div style={{background:"linear-gradient(135deg,#0a1628,#0d1f38)",
              border:"1px solid rgba(239,68,68,.3)",borderRadius:"20px",padding:"28px 32px",
              width:"440px",boxShadow:"0 40px 80px rgba(0,0,0,.7), 0 0 40px rgba(239,68,68,.1)",
              animation:"modalIn .3s ease"}}>

              {/* Target header */}
              <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"22px",
                paddingBottom:"16px",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
                <div style={{fontSize:"36px"}}>🎯</div>
                <div style={{flex:1}}>
                  <div style={{color:"white",fontWeight:"bold",fontSize:"18px"}}>{country.name}</div>
                  {owner
                    ?<div style={{color:ownerColor?.light||"#fff",fontSize:"11px",marginTop:"2px"}}>⚑ Controlled by {owner}</div>
                    :<div style={{color:"rgba(255,255,255,.4)",fontSize:"11px",marginTop:"2px"}}>Unclaimed territory</div>}
                  <div style={{color:"rgba(255,255,255,.3)",fontSize:"10px",marginTop:"2px"}}>
                    Base win chance: {Math.round(baseWinChance(country.area||20)*100)}%
                  </div>
                </div>
                <button onClick={()=>setAttackPlan(null)} style={{background:"rgba(255,255,255,.06)",
                  border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"5px 10px",
                  color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>✕</button>
              </div>

              {/* Weapon sliders */}
              <div style={{marginBottom:"18px"}}>
                <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px",letterSpacing:"2px",marginBottom:"14px",textTransform:"uppercase"}}>
                  Deploy Forces
                </div>
                <WeaponRow id="tank"    emoji="🪖" label="Tanks"             dmg={DMG.tank}    color="#f59e0b"/>
                <WeaponRow id="bomb"    emoji="💣" label="Bombs"             dmg={DMG.bomb}    color="#ef4444"/>
                <WeaponRow id="plane"   emoji="✈️" label="Planes"            dmg={DMG.plane}   color="#3b82f6"/>
                <WeaponRow id="missile" emoji="🚀" label="Ballistic Missiles" dmg={DMG.missile} color="#f97316"/>
                <WeaponRow id="bomber"  emoji="💥" label="Bombers"           dmg={DMG.bomber}  color="#dc2626"/>
              </div>

              {/* Live stats */}
              <div style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",
                borderRadius:"12px",padding:"14px 16px",marginBottom:"18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                  <span style={{color:"rgba(255,255,255,.5)",fontSize:"11px"}}>Total Firepower</span>
                  <span style={{color:"white",fontWeight:"bold",fontSize:"18px"}}>
                    {damage} <span style={{color:"rgba(255,255,255,.3)",fontSize:"12px"}}>dmg pts</span>
                  </span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                  <span style={{color:"rgba(255,255,255,.5)",fontSize:"11px"}}>Win Chance</span>
                  <span style={{color:barColor,fontWeight:"bold",fontSize:"22px"}}>{pct}%</span>
                </div>
                {/* Chance bar */}
                <div style={{height:"8px",background:"rgba(255,255,255,.08)",borderRadius:"4px",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,
                    background:`linear-gradient(90deg,${barColor}88,${barColor})`,
                    borderRadius:"4px",transition:"width .2s ease"}}/>
                </div>
                {damage===0&&(
                  <div style={{color:"rgba(255,200,80,.6)",fontSize:"10px",marginTop:"8px",textAlign:"center"}}>
                    ⚠️ Deploy at least 1 weapon to increase your chances!
                  </div>
                )}
                {damage>0&&(
                  <div style={{display:"flex",gap:"6px",marginTop:"10px",flexWrap:"wrap"}}>
                    {deploy.tank>0&&<span style={{background:"rgba(245,158,11,.15)",border:"1px solid rgba(245,158,11,.3)",borderRadius:"5px",padding:"2px 7px",color:"#fcd34d",fontSize:"10px"}}>🪖 ×{deploy.tank} = {deploy.tank*DMG.tank}pts</span>}
                    {deploy.bomb>0&&<span style={{background:"rgba(239,68,68,.15)",border:"1px solid rgba(239,68,68,.3)",borderRadius:"5px",padding:"2px 7px",color:"#fca5a5",fontSize:"10px"}}>💣 ×{deploy.bomb} = {deploy.bomb*DMG.bomb}pts</span>}
                    {deploy.plane>0&&<span style={{background:"rgba(59,130,246,.15)",border:"1px solid rgba(59,130,246,.3)",borderRadius:"5px",padding:"2px 7px",color:"#93c5fd",fontSize:"10px"}}>✈️ ×{deploy.plane} = {deploy.plane*DMG.plane}pts</span>}
                    {(deploy.missile||0)>0&&<span style={{background:"rgba(249,115,22,.15)",border:"1px solid rgba(249,115,22,.3)",borderRadius:"5px",padding:"2px 7px",color:"#fdba74",fontSize:"10px"}}>🚀 ×{deploy.missile} = {deploy.missile*DMG.missile}pts</span>}
                    {(deploy.bomber||0)>0&&<span style={{background:"rgba(220,38,38,.15)",border:"1px solid rgba(220,38,38,.3)",borderRadius:"5px",padding:"2px 7px",color:"#fca5a5",fontSize:"10px"}}>💥 ×{deploy.bomber} = {deploy.bomber*DMG.bomber}pts</span>}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{display:"flex",gap:"10px"}}>
                <button onClick={()=>setAttackPlan(null)}
                  style={{flex:1,padding:"12px",background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",
                    borderRadius:"10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>
                  Cancel
                </button>
                <button onClick={confirmAttack}
                  disabled={totalWeapons===0}
                  style={{flex:2,padding:"12px",
                    background:totalWeapons>0?"linear-gradient(135deg,#c0392b,#e74c3c)":"rgba(255,255,255,.05)",
                    border:totalWeapons>0?"none":"1px solid rgba(255,255,255,.1)",
                    borderRadius:"10px",color:totalWeapons>0?"white":"rgba(255,255,255,.2)",
                    cursor:totalWeapons>0?"pointer":"not-allowed",fontSize:"13px",fontWeight:"bold",
                    fontFamily:"Georgia,serif",letterSpacing:"1px",
                    boxShadow:totalWeapons>0?"0 4px 20px rgba(231,76,60,.4)":"none"}}>
                  ⚔️ LAUNCH ATTACK ({pct}% chance)
                </button>
              </div>
              <p style={{color:"rgba(255,255,255,.2)",fontSize:"9px",textAlign:"center",marginTop:"10px",marginBottom:0}}>
                Deployed weapons are consumed win or lose
              </p>
            </div>
          </div>
        );
      })()}


      <div style={{background:"rgba(0,0,0,.92)",borderBottom:"1px solid rgba(255,255,255,.07)",
        padding:"7px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:"8px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <span style={{fontSize:"18px"}}>🌍</span>
          <div>
            <div style={{color:"#d4a017",fontSize:"13px",fontWeight:"bold",letterSpacing:"2px"}}>TERRA CONQUEST</div>
            <div style={{color:"rgba(255,255,255,.2)",fontSize:"8px",letterSpacing:"2px"}}>MULTIPLAYER WORLD MAP</div>
          </div>
        </div>

        {/* Arsenal bar */}
        <div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
          <div style={{background:"rgba(212,160,23,.12)",border:"1px solid rgba(212,160,23,.35)",
            borderRadius:"7px",padding:"4px 10px",color:"#f5c842",fontWeight:"bold",fontSize:"12px"}}>
            🪙 {myInventory.coins.toLocaleString()}
          </div>
          {SHOP_ITEMS.map(item=>(myInventory[item.id]>0&&(
            <div key={item.id} style={{background:`${item.color}18`,border:`1px solid ${item.color}38`,
              borderRadius:"7px",padding:"4px 8px",color:item.color,fontSize:"11px",fontWeight:"bold"}}>
              {item.emoji} {myInventory[item.id]}
            </div>
          )))}
          {MATERIALS.map(m=>(myInventory[m.id]>0&&(
            <div key={m.id} style={{background:`${m.color}18`,border:`1px solid ${m.color}38`,
              borderRadius:"7px",padding:"4px 8px",color:"rgba(255,255,255,.7)",fontSize:"11px",fontWeight:"bold"}}>
              {m.emoji} {myInventory[m.id]}
            </div>
          )))}
          {(myInventory.buildings||[]).length>0&&(
            <div style={{background:"rgba(16,185,129,.12)",border:"1px solid rgba(16,185,129,.35)",
              borderRadius:"7px",padding:"4px 8px",color:"#6ee7b7",fontSize:"11px",fontWeight:"bold"}}>
              🏗️ {(myInventory.buildings||[]).length}
            </div>
          )}
          {factoryTimer>0&&(myInventory.buildings||[]).includes("coin_factory")&&(
            <div style={{background:"rgba(245,158,11,.12)",border:"1px solid rgba(245,158,11,.35)",
              borderRadius:"7px",padding:"4px 8px",color:"#fcd34d",fontSize:"10px"}}>
              🏭 {Math.ceil(factoryTimer/60000)}m
            </div>
          )}
          {canClaimDaily&&(
            <button onClick={()=>setShowDaily(true)} style={{background:"rgba(16,185,129,.2)",border:"1px solid rgba(16,185,129,.5)",
              borderRadius:"7px",padding:"4px 10px",color:"#6ee7b7",fontSize:"11px",cursor:"pointer",
              fontFamily:"Georgia,serif",animation:"gl 2s infinite"}}>
              🎁 Daily!
            </button>
          )}
        </div>

          <div style={{display:"flex",alignItems:"center",gap:"7px"}}>
          <div style={{background:"rgba(212,160,23,.1)",border:"1px solid rgba(212,160,23,.3)",
            borderRadius:"7px",padding:"3px 9px",color:"#f5c842",fontSize:"10px",letterSpacing:"2px"}}>
            🔑 {roomCode}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(255,255,255,.05)",
            border:"1px solid rgba(255,255,255,.09)",borderRadius:"7px",padding:"4px 10px"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:myC.bg,boxShadow:`0 0 5px ${myC.bg}`}}/>
            <span style={{color:"white",fontSize:"11px"}}>{username}</span>
            <span style={{color:myC.light,fontSize:"10px",fontWeight:"bold"}}>⚑ {mine.length}</span>
          </div>
          <button onClick={()=>setShowShop(true)} style={{padding:"4px 11px",
            background:"rgba(212,160,23,.15)",border:"1px solid rgba(212,160,23,.4)",
            borderRadius:"7px",color:"#f5c842",cursor:"pointer",fontSize:"11px",fontFamily:"Georgia,serif"}}>
            🪖 War Shop
          </button>
          <button onClick={()=>setShowBuildShop(true)} style={{padding:"4px 11px",
            background:"rgba(16,185,129,.15)",border:"1px solid rgba(16,185,129,.4)",
            borderRadius:"7px",color:"#6ee7b7",cursor:"pointer",fontSize:"11px",fontFamily:"Georgia,serif"}}>
            🏗️ Build
          </button>
          <button onClick={()=>setAttackMode(!attackMode)} style={{padding:"4px 11px",
            background:attackMode?"rgba(239,68,68,.22)":"rgba(255,255,255,.05)",
            border:attackMode?"1px solid rgba(239,68,68,.5)":"1px solid rgba(255,255,255,.09)",
            borderRadius:"7px",color:attackMode?"#fca5a5":"rgba(255,255,255,.5)",cursor:"pointer",
            fontSize:"11px",fontFamily:"Georgia,serif",animation:attackMode?"pr 1.5s infinite":"none"}}>
            {attackMode?"⚔️ Cancel":"⚔️ Attack"}
          </button>
          <button onClick={()=>{setAttackMode(false);setScreen("room");setRoomInput("");setRoomCode("");setOwnership({});setPlayers({});}} style={{padding:"4px 9px",background:"transparent",
            border:"1px solid rgba(255,255,255,.09)",borderRadius:"7px",color:"rgba(255,255,255,.28)",
            cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif"}}>Exit</button>
        </div>
      </div>

      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        {/* SVG MAP */}
        <div style={{flex:1,position:"relative",overflow:"hidden",background:"#061830"}}>
          <svg ref={svgRef} viewBox="0 0 1800 950" style={{width:"100%",height:"100%",display:"block"}}
            preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="ocean" cx="50%" cy="45%" r="70%">
                <stop offset="0%" stopColor="#0a2848"/><stop offset="100%" stopColor="#040f20"/>
              </radialGradient>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M60 0L0 0 0 60" fill="none" stroke="#0d3060" strokeWidth="0.5" opacity="0.4"/>
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width="1800" height="950" fill="url(#ocean)"/>
            <rect width="1800" height="950" fill="url(#grid)" opacity="0.6"/>
            <line x1="0" y1="475" x2="1800" y2="475" stroke="#0d4070" strokeWidth="0.8" strokeDasharray="8,8" opacity="0.5"/>
            <line x1="0" y1="365" x2="1800" y2="365" stroke="#0d4070" strokeWidth="0.4" strokeDasharray="4,12" opacity="0.3"/>
            <line x1="0" y1="585" x2="1800" y2="585" stroke="#0d4070" strokeWidth="0.4" strokeDasharray="4,12" opacity="0.3"/>
            <text x="150" y="380" fill="rgba(80,150,255,0.15)" fontSize="28" fontStyle="italic" fontFamily="Georgia,serif" letterSpacing="6">ATLANTIC OCEAN</text>
            <text x="100" y="680" fill="rgba(80,150,255,0.12)" fontSize="20" fontStyle="italic" fontFamily="Georgia,serif" letterSpacing="4">S. ATLANTIC</text>
            <text x="1650" y="400" fill="rgba(80,150,255,0.12)" fontSize="20" fontStyle="italic" fontFamily="Georgia,serif" letterSpacing="3">PACIFIC</text>
            <text x="1250" y="820" fill="rgba(80,150,255,0.14)" fontSize="22" fontStyle="italic" fontFamily="Georgia,serif" letterSpacing="4">INDIAN OCEAN</text>
            <text x="750" y="55" fill="rgba(80,150,255,0.14)" fontSize="22" fontStyle="italic" fontFamily="Georgia,serif" letterSpacing="6">ARCTIC OCEAN</text>

            {COUNTRIES.map(country=>{
              const owner=ownership[country.id];
              const isMine=owner===username;
              const inReach=reachable.has(country.id)&&!isMine;
              const isHov=hovered===country.id;
              const p=owner?players[owner]:null;
              const pc=p?CLRS[p.cidx%CLRS.length]:null;

              let fill="#122840",stroke="#1e4870",sw=0.8;
              if(pc){fill=isMine?pc.bg:pc.bg+"88";stroke=pc.bg;sw=isMine?2:1.2;}
              if(attackMode&&inReach){stroke="#ff4444";sw=2.5;if(!pc)fill="#2a0808";}

              return(
                <g key={country.id} className={`cp${attackMode&&inReach?" att":""}`}
                  onClick={()=>handleClick(country)}
                  onMouseEnter={e=>{
                    setHovered(country.id);
                    const r=svgRef.current?.getBoundingClientRect();
                    if(r)setTip({show:true,x:e.clientX-r.left,y:e.clientY-r.top,c:country,owner,inReach});
                  }}
                  onMouseLeave={()=>{setHovered(null);setTip(t=>({...t,show:false}));}}
                  onMouseMove={e=>{
                    const r=svgRef.current?.getBoundingClientRect();
                    if(r)setTip(t=>({...t,x:e.clientX-r.left,y:e.clientY-r.top}));
                  }}>
                  <path d={country.d} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" opacity={isHov?1:.88}/>
                  {pc&&<path d={country.d} fill="none" stroke={pc.bg} strokeWidth={isMine?4:2} opacity={isMine?.3:.12} strokeLinejoin="round"/>}
                  {attackMode&&inReach&&<path d={country.d} fill="rgba(255,50,50,0.18)" stroke="#ff5555" strokeWidth="2" strokeLinejoin="round"/>}
                  <text x={country.lx} y={country.ly} fill={pc?"rgba(255,255,255,0.92)":"rgba(170,210,255,0.45)"}
                    fontSize={country.area>100?16:country.area>40?13:country.area>15?10:8}
                    fontFamily="Georgia,serif" fontWeight={isMine?"bold":"normal"} textAnchor="middle"
                    style={{pointerEvents:"none"}} filter={pc?"url(#glow)":undefined}>
                    {country.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {tip.show&&tip.c&&(()=>{
            const hasWeapons=(myInventory.tank||0)+(myInventory.bomb||0)+(myInventory.plane||0)>0;
            const baseChance=Math.round(baseWinChance(tip.c.area||20)*100);
            return(
              <div style={{position:"absolute",left:tip.x+12,top:tip.y-12,zIndex:200,pointerEvents:"none",
                background:"rgba(3,9,20,.97)",border:"1px solid rgba(255,255,255,.18)",borderRadius:"10px",padding:"10px 14px",minWidth:"160px"}}>
                <div style={{color:"white",fontWeight:"bold",fontSize:"12px",marginBottom:"3px"}}>{tip.c.name}</div>
                {tip.owner
                  ?<div style={{color:CLRS[(players[tip.owner]?.cidx||0)%CLRS.length].light,fontSize:"11px",marginBottom:"4px"}}>⚑ {tip.owner}</div>
                  :<div style={{color:"rgba(255,255,255,.35)",fontSize:"11px",marginBottom:"4px"}}>Unclaimed</div>}
                {attackMode&&tip.inReach&&tip.owner!==username&&(
                  <div style={{borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:"6px"}}>
                    <div style={{color:"#fca5a5",fontSize:"10px",marginBottom:"3px"}}>Base: {baseChance}% • deploy weapons to boost</div>
                    {!hasWeapons&&<div style={{color:"#f87171",fontSize:"9px",marginTop:"2px"}}>⚠️ Buy weapons in Shop first!</div>}
                    {hasWeapons&&<div style={{color:"rgba(255,200,80,.8)",fontSize:"9px"}}>Click to choose your forces</div>}
                  </div>
                )}
                {attackMode&&!tip.inReach&&tip.owner!==username&&(
                  <div style={{color:"rgba(255,255,255,.22)",fontSize:"10px"}}>🚫 Out of range</div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Sidebar */}
        <div style={{width:"195px",background:"rgba(0,0,0,.82)",borderLeft:"1px solid rgba(255,255,255,.07)",
          padding:"12px 11px",overflowY:"auto",display:"flex",flexDirection:"column",gap:"12px",flexShrink:0}}>

          {/* Empire */}
          <div>
            <div style={{color:"rgba(255,255,255,.25)",fontSize:"9px",letterSpacing:"2px",marginBottom:"7px",textTransform:"uppercase"}}>Your Empire</div>
            <div style={{background:`linear-gradient(135deg,${myC.bg}1e,${myC.bg}0a)`,border:`1px solid ${myC.bg}38`,borderRadius:"8px",padding:"9px"}}>
              {[["Territories",mine.length],["World %",((mine.length/COUNTRIES.length)*100).toFixed(1)+"%"],["Coins","🪙 "+myInventory.coins.toLocaleString()]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                  <span style={{color:"rgba(255,255,255,.4)",fontSize:"9px"}}>{k}</span>
                  <span style={{color:myC.light,fontWeight:"bold",fontSize:"10px"}}>{v}</span>
                </div>
              ))}
              <div style={{height:"2px",background:"rgba(255,255,255,.1)",borderRadius:"1px",overflow:"hidden",marginTop:"4px"}}>
                <div style={{height:"100%",width:`${(mine.length/COUNTRIES.length)*100}%`,background:myC.bg,transition:"width .5s"}}/>
              </div>
            </div>
          </div>

          {/* Arsenal */}
          <div>
            <div style={{color:"rgba(255,255,255,.25)",fontSize:"9px",letterSpacing:"2px",marginBottom:"7px",textTransform:"uppercase"}}>⚔️ Arsenal</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
              {SHOP_ITEMS.map(item=>(
                <div key={item.id} style={{background:`${item.color}14`,border:`1px solid ${item.color}30`,
                  borderRadius:"7px",padding:"7px 8px",display:"flex",alignItems:"center",gap:"5px"}}>
                  <span style={{fontSize:"14px"}}>{item.emoji}</span>
                  <div>
                    <div style={{color:"rgba(255,255,255,.4)",fontSize:"8px"}}>{item.name}</div>
                    <div style={{color:item.color,fontWeight:"bold",fontSize:"13px"}}>{myInventory[item.id]||0}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div>
            <div style={{color:"rgba(255,255,255,.25)",fontSize:"9px",letterSpacing:"2px",marginBottom:"7px",textTransform:"uppercase"}}>🪵 Materials</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
              {MATERIALS.map(m=>(
                <div key={m.id} style={{background:`${m.color}14`,border:`1px solid ${m.color}28`,
                  borderRadius:"7px",padding:"6px 8px",display:"flex",alignItems:"center",gap:"5px"}}>
                  <span style={{fontSize:"13px"}}>{m.emoji}</span>
                  <div>
                    <div style={{color:"rgba(255,255,255,.35)",fontSize:"8px"}}>{m.name}</div>
                    <div style={{color:"rgba(255,255,255,.85)",fontWeight:"bold",fontSize:"12px"}}>{myInventory[m.id]||0}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buildings */}
          {(myInventory.buildings||[]).length>0&&(
            <div>
              <div style={{color:"rgba(255,255,255,.25)",fontSize:"9px",letterSpacing:"2px",marginBottom:"7px",textTransform:"uppercase"}}>🏗️ Buildings</div>
              <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                {BUILDINGS.filter(b=>(myInventory.buildings||[]).includes(b.id)).map(bld=>{
                  const count=(myInventory.buildings||[]).filter(x=>x===bld.id).length;
                  const isFactory=bld.id==="coin_factory";
                  return(
                    <div key={bld.id} style={{display:"flex",alignItems:"center",gap:"6px",
                      background:`${bld.color}12`,border:`1px solid ${bld.color}28`,
                      borderRadius:"7px",padding:"6px 8px"}}>
                      <span style={{fontSize:"14px"}}>{bld.emoji}</span>
                      <div style={{flex:1}}>
                        <div style={{color:"rgba(255,255,255,.7)",fontSize:"9px",fontWeight:"bold"}}>{bld.name} ×{count}</div>
                        {isFactory&&factoryTimer>0&&(
                          <div style={{color:"#fcd34d",fontSize:"8px"}}>⏱ {Math.ceil(factoryTimer/60000)}m to payout</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attack mode info */}
          {attackMode&&(
            <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.25)",borderRadius:"8px",padding:"9px",animation:"gl 2s infinite"}}>
              <div style={{color:"#fca5a5",fontSize:"10px",fontWeight:"bold",marginBottom:"3px"}}>⚔️ Attack Mode</div>
              <div style={{color:"rgba(255,255,255,.36)",fontSize:"9px",lineHeight:"1.5"}}>
                Click a highlighted country to attack.<br/>
                More dmg = higher win chance.<br/>
                All deployed weapons are consumed win or lose.
                {myInventory.plane>0&&<><br/><span style={{color:"#93c5fd"}}>✈️ Planes extend range to 3 borders</span></>}
                {(myInventory.air_def||0)>0&&<><br/><span style={{color:"#6ee7b7"}}>🛡️ You have {myInventory.air_def} Air Defence unit{myInventory.air_def>1?"s":""} protecting you</span></>}
              </div>
            </div>
          )}

          {/* Daily + Shop buttons */}
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {canClaimDaily&&(
              <button onClick={()=>setShowDaily(true)} style={{padding:"8px",background:"linear-gradient(135deg,rgba(16,185,129,.25),rgba(16,185,129,.1))",
                border:"1px solid rgba(16,185,129,.5)",borderRadius:"8px",color:"#6ee7b7",
                cursor:"pointer",fontSize:"11px",fontFamily:"Georgia,serif",animation:"gl 1.5s infinite",fontWeight:"bold"}}>
                🎁 Claim Daily Reward!
              </button>
            )}
            <button onClick={()=>setShowShop(true)} style={{padding:"8px",background:"linear-gradient(135deg,rgba(212,160,23,.2),rgba(212,160,23,.08))",
              border:"1px solid rgba(212,160,23,.4)",borderRadius:"8px",color:"#f5c842",
              cursor:"pointer",fontSize:"11px",fontFamily:"Georgia,serif"}}>
              🪖 War Shop
            </button>
            <button onClick={()=>setShowBuildShop(true)} style={{padding:"8px",background:"linear-gradient(135deg,rgba(16,185,129,.2),rgba(16,185,129,.06))",
              border:"1px solid rgba(16,185,129,.4)",borderRadius:"8px",color:"#6ee7b7",
              cursor:"pointer",fontSize:"11px",fontFamily:"Georgia,serif"}}>
              🏗️ Build Shop
            </button>
          </div>

          {/* Leaderboard */}
          <div style={{flex:1}}>
            <div style={{color:"rgba(255,255,255,.25)",fontSize:"9px",letterSpacing:"2px",marginBottom:"7px",textTransform:"uppercase"}}>🏆 Leaderboard</div>
            {lb.length===0?<div style={{color:"rgba(255,255,255,.18)",fontSize:"10px"}}>No players yet</div>
            :lb.map(([pn,cnt],i)=>{
              const pl=players[pn],pc2=CLRS[(pl?.cidx||0)%CLRS.length],isMe=pn===username;
              return(
                <div key={pn} style={{display:"flex",alignItems:"center",gap:"5px",padding:"5px 7px",marginBottom:"3px",
                  background:isMe?`${pc2.bg}18`:"rgba(255,255,255,.02)",
                  border:isMe?`1px solid ${pc2.bg}35`:"1px solid transparent",borderRadius:"6px"}}>
                  <span style={{color:i<3?["#d4a017","#aaa","#cd7f32"][i]:"rgba(255,255,255,.2)",fontSize:"8px",width:"11px"}}>{i<3?["🥇","🥈","🥉"][i]:`${i+1}.`}</span>
                  <div style={{width:"5px",height:"5px",borderRadius:"50%",background:pc2.bg,flexShrink:0}}/>
                  <span style={{color:isMe?pc2.light:"rgba(255,255,255,.6)",fontSize:"9px",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pn}</span>
                  <span style={{color:pc2.light,fontSize:"9px",fontWeight:"bold"}}>{cnt}</span>
                </div>
              );
            })}
          </div>

          {/* World stats */}
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"7px",padding:"8px"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
              <span style={{color:"rgba(255,255,255,.3)",fontSize:"9px"}}>Claimed</span>
              <span style={{color:"rgba(255,255,255,.5)",fontSize:"9px"}}>{Object.keys(ownership).length}/{COUNTRIES.length}</span>
            </div>
            <div style={{height:"2px",background:"rgba(255,255,255,.08)",borderRadius:"1px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(Object.keys(ownership).length/COUNTRIES.length)*100}%`,background:"linear-gradient(90deg,#3b82f6,#10b981)"}}/>
            </div>
            <div style={{color:"rgba(255,255,255,.2)",fontSize:"8px",marginTop:"4px"}}>
              {Object.keys(players).length} commander{Object.keys(players).length!==1?"s":""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
