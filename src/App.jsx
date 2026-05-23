import { useState, useEffect, useRef } from "react";

// All DB calls go through /api/db - no keys in the client
const sb={
  from:(table)=>({
    select:(cols)=>({
      eq:(col,val)=>({
        single:()=>fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({op:"select",table,cols:cols||"*",filter:{col,val}})}).then(r=>r.json()).catch(e=>({data:null,error:e}))
      }),
      order:(col)=>fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({op:"select_all",table,cols:cols||"*",order:col})}).then(r=>r.json()).catch(e=>({data:null,error:e}))
    }),
    upsert:(data,opts)=>fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({op:"upsert",table,data,opts})}).then(r=>r.json()).catch(e=>({error:e}))
  })
};





const DRONE_LINES = {
    attack: [
        "Attack systems running... Waiting for fire!", 
        "Well, are you sure you want to destroy and conquer that country? Well, who am I to talk..."
    ],
    warShop: [
        "Hmmm, no troops, huh? Buy them from here... If you have money, though...", 
        "Commander, why don't you use nukes??? Are you too poor to afford them?"
    ],
    wonAttack: [
        "So, like, this is yours now... Keep going.", 
        "So, like, I am a drone, but I do feel mercy... Unlike somebody here."
    ],
    lostAttack: [
        "How, just how... DID YOU LOSE?!", 
        "Unplugging empathy modules... These humans are crimping my style (and my cables).", 
        "IT'S TIME TO FEEL THE RAGE OF DRONEY!!!!!", 
        "Shutdown, repeat, Shutdown....."
    ],
    materialShop: [
        "Getting stuff for buildings, huh?", 
        "Virus detected: Free Materials!!! Date of detection: Never.", 
        "If you can't win a fight, at least lose it with pride by showing your rock collection to the enemies..."
    ],
    buildShop: [
        "Commander, just buy coin factories to get RICH!", 
        "Buy the Black Market; nobody can stop you...", 
        "Losing battery... That's what I would say if I didn't have an internal Nuclear Reactor. Btw, buy one too; it buffs weapons."
    ],
    blackmarketShop: [
        "I am Dark Droney nowwww!!!!!!!!!", 
        "Buy some uranium; you'll need some for later...", 
        "VIRUS DETECTED... Virus Elimination Complete. How are you doing now, Commander?", 
        "Should we buy the Dev Tools, Commander?"
    ],
    terrapassShop: [
        "OHHHH XPPPPPPP!!!!", 
        "Commander! How could I help you with the XP?", 
        "WAIT, YOU ONCE WERE A SOLDIER?!?!?!", 
        "I wish I was a scout too...", 
        "Commander, should we start by getting the achievement 'Filthy Rich'?", 
        "I will get the achievement 'World Dominator' someday; I don't think you will, though..."
    ],
    worldwondersShop: [
        "LETS GET THE EIFFEL TOWER!!!!!", 
        "The Pentagon sounds great, Commander, buy it!", 
        "I’m not saying I’m a wonder, but the world is welcome for my existence.", 
        "BUY THE TOKYO TOWER, PLEASE COMMANDER!", 
        "Why is everything here so good? The dev should nerf everything... Including you, Commander; you are too powerful..."
    ],
    lostGamble: ["Thats what you get for gambling Commander!", "Wake up Commander, these games are rigged", "Commander, Commander I am losing you, stop it please..  For your own good..."],
   wonGamble: ["Commander I think you can stop now", "Well Commander, that was a good one...", "Commander I don't think thats what you sould do"],
   Droneys: ["YOU ONLY HAVE ONE??????? WHAT A NOOB! Also get more DRONEYSS for a special REWARD!!!"],
   Droneyss: ["WOW 100 THATS GREAT!!! KEEP GOING!!!"],
   Droneysss: ["500... I HOPE YOU ARE NOT USING AUTO CLICKER!!! BECAUSE THATS A REALLY BIG NUMBER!!!"],
   Droneyssss: ["HOLY CABLES!! 1000 DRONEYSS!!! YOU'VE GOT THE JACKPOT!!!! YOU JUST WON 10 DRONES!"]
}



const CLRS=[
  {bg:"#dc2626",light:"#fca5a5",name:"Red"},
  {bg:"#2563eb",light:"#93c5fd",name:"Blue"},
  {bg:"#16a34a",light:"#86efac",name:"Green"},
  {bg:"#d97706",light:"#fcd34d",name:"Gold"},
  {bg:"#7c3aed",light:"#c4b5fd",name:"Purple"},
  {bg:"#0891b2",light:"#67e8f9",name:"Cyan"},
  {bg:"#db2777",light:"#f9a8d4",name:"Pink"},
  {bg:"#65a30d",light:"#bef264",name:"Lime"}];

const DMG={tank:0.25,bomb:1,mortar:7,devils_tank:0.02,plane:1.5,missile:3,bomber:5,artillery:2,drone:4,chem_bomb:6,emp:0,stealth_bomber:26.5,droner_ghoster: 8.5,hell_rainer:17.5,orbital_hi:75,dirty_bomb:4};
const DAILY_REWARD=3000000000;
const COIN_FACTORY_YIELD=5;
const COIN_FACTORY_INTERVAL_MS=1000;
const BOT_NAMES=["DroneyAlpha","DroneyBeta","DroneyGamma","DroneyDelta"];

const SHOP_ITEMS=[
  {id:"tank",      label:"\u{1FA96} Tank",      desc:"Basic ground unit. Cheap & reliable.",        price:180,  dmg:DMG.tank,      color:"#f59e0b"},
  {id:"bomb",      label:"\u{1F4A3} Bomb",      desc:"Explosive. High damage.",                     price:300,  dmg:DMG.bomb,      color:"#ef4444"},
  {id:"plane",     label:"✈️ Plane",     desc:"Air unit. Extends attack radius to 3.",       price:470,  dmg:DMG.plane,     color:"#3b82f6"},
  {id:"missile",   label:"🚀 Missile",   desc:"Ballistic strike. Very high damage.",         price:675,  dmg:DMG.missile,   color:"#f97316"},
  {id:"artillery", label:"🛦🔥 Artillery", desc:"Heavy cannon. 2 dmg, area suppression.",     price:500,  dmg:DMG.artillery, color:"#a78bfa"},
  {id:"drone",     label:"🛰Drone",     desc:"Precision strike. 4 dmg, hard to intercept.",price:1000,  dmg:DMG.drone,     color:"#06b6d4", oilCost:1},
  {id:"bomber",    label:"🛦💣 Bomber",    desc:"Carpet bomb. 5 dmg",                price:1800, dmg:DMG.bomber,    color:"#dc2626", oilCost:1},
  {id:"air_def",      label:"🛡️✈️ Air Def",      desc:"Reduces enemy win chance by 5% each.",               price:1200,   dmg:0,               color:"#6366f1", oilCost:2},
  {id:"chem_bomb",    label:"💣☣️ Chem Bomb",    desc:"6 dmg + poisons country: next attacker -20% win.",  price:2600,  dmg:DMG.chem_bomb,   color:"#84cc16", oilCost:3},
  {id:"emp",          label:"⚡📡 EMP",          desc:"0 dmg but disables all enemy buildings for 4 min.",  price:1050,  dmg:0,               color:"#f0abfc", oilCost:2},
  {id:"mortar",          label:"🌀🌫️💣 Fading Reboot Mortar",          desc:"7 dmg, a remineder of what war causes",  price:3200,  dmg:DMG.mortar,               color:"#565051", oilCost:2},
  {id: "droner_ghoster", label:"🛰🔍❌ L.O.S.T Drone", desc:"8.5 dmg. Updated with Droney systems!",              price: 4250,  dmg:DMG.droner_ghoster, color:"#A020F0", oilCost:2},
  {id: "hell_rainer", label:"💣🌧 H.E.L.L R.A.I.N.😈🔥 ‍‍‍‍‍‍‍‍‍‍ㅤㅤㅤㅤㅤㅤㅤㅤBOMBER", desc:"17.5 dmg. THE DEFINITION OF HELL",              price: 5250,  dmg:DMG.hell_rainer, color:"#880808", oilCost:5},
  {id:"stealth_bomber",label:"🖤🛦💣 B-2 Stealth Bomber",desc:"26.5 dmg. Bypasses Air Defence completely.",           price:12950,  dmg:DMG.stealth_bomber, color:"#c084fc", oilCost:7},
  {id:"orbital_hi",label:"🛰️⚡💥Orbital Railgun",desc:"75 dmg. MAX POWER CONQUER 100% CHANCE OF WINNING!!!!.",           price:79950,  dmg:DMG.orbital_hi, color:"#0096FF", oilCost:17}];

const MATERIALS=[
  {id:"wood",    label:"Wood",    color:"#84cc16"},
  {id:"stone",   label:"Stone",   color:"#94a3b8"},
  {id:"iron",    label:"Iron",    color:"#6b7280"},
  {id:"gold",    label:"Gold",    color:"#f59e0b"},
  {id:"oil",     label:"Oil",     color:"#78350f"},
  {id:"uranium", label:"Uranium", color:"#4ade80"}];

const BUILDINGS=[
  {id:"barracks",    label:"🏯 Barracks",    desc:"Discounts Tanks by 20% per barracks.",    max:3, cost:{wood:5,stone:4},      color:"#f59e0b"},
  {id:"airbase",     label:"🏢✈️ Air Base",    desc:"Discounts Planes by 15% per airbase.",    max:2, cost:{stone:5,iron:3},      color:"#3b82f6"},
  {id:"coin_factory",label:"🏭\u{1FA99} Coin Factory",desc:"Earns "+COIN_FACTORY_YIELD+" coins/sec.", max:5, cost:{iron:5,stone:3},      color:"#10b981"},
  {id:"vault",       label:"🏦 Gold Vault",  desc:"+500 daily reward. +2 coins/sec/factory.",max:3, cost:{gold:3,iron:4},       color:"#f59e0b"},
  {id:"oil_rig",       label:"⛽🛢️ Oil Rig",       desc:"Generates +1 Oil every 2 minutes.",                     max:2, cost:{iron:3,stone:2,gold:1},   color:"#78350f"},
  {id:"spy_academy", label:"🕵️🏫 Spy Academy", desc:"Trains 1 spy every 20 min.",              max:1, cost:{wood:9,gold:3},       color:"#10b981"},
  {id:"watchtower",  label:"🗼 Watchtower",  desc:"Unlocks the Satellite recipe in Weapons Lab. Also lets you see attacker weapon counts.", max:1, cost:{iron:7 ,stone:5},      color:"#6366f1"},
  {id:"embassy",     label:"🏤 Embassy",     desc:"+5% win chance when attacking.",          max:1, cost:{gold:4,stone:7},      color:"#f97316"},
  {id:"port",        label:"⚓ Port",        desc:"+1 attack range (coastal countries only).",max:1, cost:{wood:14,iron:3},      color:"#06b6d4"},
  {id:"mine",        label:"⛏️ Mine",        desc:"+1 Iron & Stone per bonus tick.",          max:2, cost:{wood:22,stone:13},     color:"#78716c"},
  {id:"uranium_ext", label:"☢️ Uranium Extractor",desc:"Converts 1 Gold into 1 Uranium/min.",max:1, cost:{iron:7,stone:5},    color:"#4ade80"},
  {id:"nuclear_reactor",label:"🏭☢️ Nuclear Reactor",desc:"Boosts ALL weapon damage by 50%.", max:1, cost:{iron:7,uranium:5,stone:11}, color:"#a78bfa"},
  {id:"fortress",    label:"🛕 Fortress",    desc:"Fortifies all your territories. Reduces enemy win chance by 10%.", max:1, cost:{stone:11,iron:9},  color:"#f43f5e"},
  {id:"black_market",  label:"🛒🏴‍☠️ Black Market",  desc:"Unlocks the Black Market for rare deals.",              max:1, cost:{gold:6,iron:5},           color:"#8b5cf6"},
  {id:"radar",         label:"📡🏢 Radar Station", desc:"Reveals weapon counts of incoming attackers.",           max:1, cost:{iron:7,gold:3},           color:"#06b6d4"},
  {id:"bomber_factory",         label:"🏭🛦💣 Bomber Factory", desc:"Creates one bomber/2 min",           max:2, cost:{iron:11,gold:7},           color:"#8B0000"},
  {id:"hell_rainer_factory",         label:"🏭🛦💣🌧 H.E.L.L R.A.I.N Bomber Factory", desc:"Creates one H.E.L.L R.A.I.N bomber/2 min",           max:1, cost:{iron:77,gold:56},           color:"#FF0000"},
  {id:"casino_place", label:"🎰🎲♠ Casino", desc:"Unlocks the Gambling Den", max:1, cost:{gold:7, iron:15}, color:"#fcd34d"},  
  {id:"hospital",      label:"🏥 Hospital",      desc:"Recover 30% of deployed troops after a lost battle.",    max:1, cost:{wood:15,stone:9,gold:3},   color:"#f43f5e"},
  {id:"trade_post",    label:"🏣 Trade Post",    desc:"Unlocks the Trade system. Send trade offers to other players with a Trade Post.",  max:1, cost:{wood:26,stone:11,gold:5},   color:"#f59e0b"},
  {id:"droneys_factory", label:"🤖🏭 Droneys Factory", desc:"Unlocks the DRONEYSS button. Click 1000 times to earn 10 Drones!", max:1, cost:{iron:7,stone:3,oil:1}, color:"#00bcd4"}];

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
  {id:"bm_artillery3",  label:"3 Artillery",    desc:"Heavy cannon units",                    cost:{coins:1000,iron:2},      reward:{artillery:3}},
  {id:"bm_oil5",        label:"5 Oil Barrels",  desc:"Smuggled crude oil",                    cost:{coins:1500,gold:1},      reward:{oil:5}},
  {id:"bm_chem2",       label:"2 Chem Bombs",   desc:"Illegal chemical weapons",              cost:{coins:2500,oil:3},       reward:{chem_bomb:2}},
  {id:"bm_emp1",        label:"EMP Device",     desc:"Single-use electromagnetic pulse",      cost:{coins:2000,iron:3},      reward:{emp:1}},
  {id:"bm_ghost1",      label:"Stealth Bomber",   desc:"Stealth aircraft, bypasses air def",    cost:{coins:35000,gold:7},      reward:{stealth_bomber:3}},
  {id:"bm_intel2",      label:"2 Intel Kits",   desc:"Spy on 2 enemies instantly",            cost:{coins:1800},             reward:{spy:2}}];

const WORLD_WONDERS=[
  {id:"event1",    name:"EVENT: Mays Gold Vault",     country:"angola",          bonus:{gold:3, coins:55,  label:"3 gold/min & 55 coins/sec"},   cost:{coins:35000},        color:"gold", desc:"Event changes each month!", special:true},
  {id:"pentagon",    name:"The Pentagon",     country:"usa",          bonus:{coins:80,  label:"+80 coins/sec"},   cost:{coins:37000,iron:8,gold:5},        color:"#3b82f6", desc:"Dominates North America. Massive coin income for its owner."},
  {id:"ben",    name:"The Big Ben",     country:"uk",          bonus:{coins:100,  label:"+100 coins/sec"},   cost:{coins:50000,iron:8,gold:5},        color:"#D4AF37", desc:"The Tower that ticks gold"},
  {id:"kremlin",     name:"The Kremlin",      country:"russia",       bonus:{troops:5,  label:"+5 tanks/min"},    cost:{coins:13000,stone:10,iron:6},      color:"#ef4444", desc:"Controls Eastern Europe & Asia. Your army grows extremely fast."},
  {id:"colosseum",     name:"The Colosseum",      country:"italy",       bonus:{troops:4, coins:20, label:"+4 tanks/min & +20 coins/sec"},    cost:{coins:33000,stone:10,iron:6},      color:"#8B0000", desc:"The Roman Empire never dies."},
  {id:"greatwall",   name:"Great Wall",       country:"china",        bonus:{troops:3,  label:"+3 tanks/min"},    cost:{coins:36000,stone:12,iron:4},      color:"#f59e0b", desc:"The mightiest fortification ever built. Troops pour in constantly."},
  {id:"pyramids",    name:"The Pyramids",     country:"egypt",        bonus:{gold:3,    label:"+3 gold/min"},     cost:{coins:32000,stone:8,gold:3},       color:"#f5c842", desc:"Controls North Africa. Gold income is unmatched."},
  {id:"eiffel",      name:"Eiffel Tower",     country:"france",       bonus:{coins:40,  label:"+40 coins/sec"},   cost:{coins:33000,iron:6,gold:4},        color:"#a78bfa", desc:"The most visited landmark on Earth. Coins flow like tourists."},
  {id:"amazon_hq",   name:"Amazon Rainforest",country:"brazil",       bonus:{wood:5,    label:"+5 wood/min"},     cost:{coins:31000,wood:8,stone:4},        color:"#22c55e", desc:"Controls South America. Endless resources from the jungle."},
  {id:"cuba_statue",   name:"The Christ of Havana",country:"cuba",       bonus:{gold: 3, stone:2,    label:"+3 Gold/min & +2 Stone/min"},     cost:{coins:34000,gold:3,stone:11},        color:"#FFFFFF", desc:"Controls Cuba. Endless resources from God"},
  {id:"tokyo_tower",   name:"Tokyo Tower",country:"japan",       bonus:{iron: 5, coins:45,    label:"+5 Iron/min & +45 coins/sec"},     cost:{coins:35500,iron:15,gold:5},        color:"#FFB347", desc:"Controls Japan. Endless resources and coins from the Japan territory."},
  {id:"sydney   ",   name:"Sydney Opera House",country:"australia",       bonus:{coins:65,    label:"+65 coins/sec"},     cost:{coins:35750,iron:11,gold:5},        color:"#707372", desc:"Controls Australia. Endless coins from the Austalian territory."},
  {id:"mt_olymp",   name:"Mount Olympus",country:"greece",       bonus:{stone:20, wood:10,    label:"+20 stone/min & +10 wood/min "},     cost:{coins:37000,stone:33,gold:5},        color:"#636363", desc:"The home of Gods.", special:true},
  {id:"dracula",     name:"Dracula's Castle",  country:"romania",      bonus:{spy:3,     label:"+3 spies/day & -15% def"},cost:{coins:50000,stone:6,gold:5}, color:"#dc2626", desc:"Built on cursed ground — enemies fear it. Spy production surges and all attackers suffer -15% win chance against your territories.", special:true},
  {id:"gates_of_hell",     name:"Gates of Hell",  country:"turkmenistan",      bonus:{coins:-66666666666666666666666666666666666, devils1:666,    label:"REMOVES ALL YOUR COINS! & +666 tanks/min"},cost:{coins:666666,stone:666,gold:666}, color:"#FF6A00", desc:"Devils bargain, Lose your wealth forever but get the devils troops", special:true},
  {id:"generic_flower",     name:"Floralis Genérica",  country:"argentina",      bonus:{spy:1, coins:35, troops:1, gold:1, wood:1, stone:1, iron:1,     label:"EVERYTHING!!  +1 spy/day, +35 coins/sec, +1 tank/min, +1 gold/min +1 wood/min +1 stone/min +1 iron/min"},cost:{coins:52020,iron:11 ,gold:5}, color:"#D3D3D3", desc:"Generic...  Everything!!", special:true},
];

const CRISIS_EVENTS=[
  {id:"oil_shortage",  label:"⛽ Oil Shortage",     desc:"Global oil supply disrupted. Oil income halved for 3 minutes.",     duration:180000, effect:"oil_half"},
  {id:"gold_rush",     label:"💰 Gold Rush",         desc:"Massive gold deposits discovered in Africa! South Africa & Saudi output doubled for 3 min.", duration:180000, effect:"gold_double"},
  {id:"arms_embargo",  label:"🚫 Arms Embargo",      desc:"International arms embargo! War Shop prices +50% for 2 minutes.", duration:120000, effect:"shop_expensive"},
  {id:"nuclear_scare", label:"☢ Nuclear Scare",      desc:"Radiation alert! All uranium extraction stopped for 2 minutes.",  duration:120000, effect:"uranium_stop"},
  {id:"economic_boom", label:"📈 Economic Boom",      desc:"Global economy surging! Coin factory output doubled for 3 min.", duration:180000, effect:"coins_double"},
  {id:"cyber_attack",  label:"💻 Cyber Attack",      desc:"Massive cyber attack! All Radar Stations and Watchtowers offline for 2 min.", duration:120000, effect:"intel_down"},
  {id:"resource_drop", label:"📦 Supply Drop",       desc:"UN supply drop! All players receive +3 of each material.",       duration:0,      effect:"resource_drop"},
  {id:"spy_leak",      label:"🕵 Intelligence Leak",  desc:"Spy network compromised! All players' coin balances visible for 2 min.", duration:120000, effect:"coins_visible"},
  {id:"your_love_is_my_drug",      label:"Virus detected... All systems removed",  desc:"The Virus makes all of your weapons dissapear", duration:240000, effect:"remove_weapons"},
];

const ALL_MISSIONS=[
  {id:"m_win",     stat:"wins",         goal:1,  label:"Win 1 battle",           xp:50,  coins:500},
  {id:"m_conq5",   stat:"conquests",    goal:5,  label:"Conquer 5 territories",  xp:75,  coins:800},
  {id:"m_coins",   stat:"coinsEarned",  goal:5000,label:"Earn 5,000 coins",      xp:60,  coins:600},
  {id:"m_build",   stat:"builds",       goal:2,  label:"Build 2 structures",     xp:80,  coins:700},
  {id:"m_buy3",    stat:"weaponsBought",goal:3,  label:"Buy 3 weapons",          xp:50,  coins:500},
  {id:"m_bomber",  stat:"bombersUsed",  goal:1,  label:"Use a Bomber",           xp:100, coins:1000},
  {id:"m_spy",     stat:"spiesUsed",    goal:1,  label:"Use a Spy",              xp:80,  coins:800},
  {id:"m_intel",   stat:"intelOps",     goal:1,  label:"Run an Intel operation", xp:90,  coins:900},
  {id:"m_emp",     stat:"empsUsed",     goal:1,  label:"Deploy an EMP",          xp:120, coins:1200},
  {id:"m_oil10",   stat:"oilGathered",  goal:10, label:"Collect 10 Oil",         xp:70,  coins:700}];

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
  {level:10, xpNeeded:5000, label:"Commander",   reward:{type:"coins",  amount:10000}}];

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
  {id:"nuke_used",   name:"Nuclear Strike", desc:"Fire a nuclear bomb",           xp:300,  emoji:"\u2622\uFE0F"},
  {id:"emp_used",    name:"Blackout",       desc:"Deploy an EMP",                 xp:150,  emoji:"\u26A1"},
  {id:"intel_op",    name:"Shadow Agent",   desc:"Run an Intel operation",        xp:150,  emoji:"\uD83D\uDD75"},
  {id:"oil_baron",   name:"Oil Baron",      desc:"Collect 50 Oil",                xp:200,  emoji:"\uD83D\uDEE2\uFE0F"}];

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

function calcDamage(deploy){
  return Math.round((
    (deploy.tank||0)*DMG.tank+
    (deploy.bomb||0)*DMG.bomb+
    (deploy.plane||0)*DMG.plane+
    (deploy.missile||0)*DMG.missile+
    (deploy.bomber||0)*DMG.bomber+
    (deploy.artillery||0)*DMG.artillery+
    (deploy.drone||0)*DMG.drone+
    (deploy.chem_bomb||0)*DMG.chem_bomb+
    (deploy.mortar||0)*DMG.mortar+
    (deploy.devils_tank||0)*DMG.devils_tank+
    (deploy.stealth_bomber||0)*DMG.stealth_bomber+
    (deploy.droner_ghoster||0)*DMG.droner_ghoster+
    (deploy.hell_rainer||0)*DMG.hell_rainer+
    (deploy.dirty_bomb||0)*DMG.dirty_bomb
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
  {id:"alaska", name:"Alaska", area:40, lx:130.8, ly:198.6, borders:["canada", "russia"], d:"M124.7,149.5 L128.3,151.9 L130.5,150.9 L138.9,151.2 L138.6,152.4 L146.3,153.3 L151.4,152.8 L161.9,154.4 L171.6,154.9 L175.4,155.6 L182.1,154.8 L189.6,156.3 L195.1,157.1 L195.0,176.7 L195.0,206.7 L199.9,206.9 L204.8,208.3 L208.3,210.6 L212.7,214.1 L217.6,211.2 L222.6,209.5 L225.3,212.2 L228.6,214.3 L233.2,216.7 L236.3,220.5 L241.5,226.5 L250.0,229.9 L250.1,233.2 L247.3,235.8 L244.6,233.8 L240.2,232.1 L238.7,227.5 L232.3,223.2 L229.6,218.2 L224.8,217.9 L216.9,217.8 L211.0,216.3 L200.7,210.8 L195.9,209.8 L187.1,207.9 L180.2,208.3 L170.4,205.9 L164.4,203.7 L158.9,204.8 L159.9,208.4 L157.1,208.8 L151.4,209.9 L147.0,211.7 L141.4,212.8 L140.7,209.7 L143.0,204.5 L148.3,202.9 L146.9,201.6 L140.5,204.5 L137.1,208.0 L129.9,211.8 L133.6,214.3 L128.8,218.1 L123.5,220.3 L118.5,221.9 L117.2,224.3 L109.4,227.0 L107.8,229.5 L102.0,231.7 L98.6,231.3 L93.9,232.8 L88.8,234.6 L84.7,236.4 L76.1,237.9 L75.3,237.0 L80.8,234.5 L85.6,232.9 L91.0,230.0 L97.2,229.4 L99.6,227.2 L106.6,224.1 L107.7,223.0 L111.4,221.2 L112.2,217.2 L114.8,214.0 L109.0,215.6 L107.4,214.7 L104.7,216.7 L101.4,214.0 L100.1,215.9 L98.2,213.2 L93.2,215.3 L90.2,215.3 L89.7,212.2 L90.6,210.3 L87.4,208.4 L80.9,209.4 L76.7,206.9 L73.3,205.7 L73.2,202.7 L69.4,200.4 L71.3,197.4 L75.4,194.4 L77.2,191.7 L81.2,191.3 L84.7,192.2 L88.7,189.6 L92.3,190.1 L96.1,188.5 L95.2,186.0 L92.4,185.1 L96.1,183.1 L93.0,183.1 L87.7,184.3 L86.2,185.4 L82.3,184.3 L75.2,184.9 L67.9,183.6 L65.8,181.5 L59.4,178.4 L66.5,176.2 L77.6,173.6 L81.7,173.6 L81.1,176.3 L91.6,176.1 L87.6,172.8 L81.4,170.8 L77.8,168.1 L73.0,165.9 L66.2,164.2 L69.0,161.5 L77.8,161.3 L84.2,158.9 L85.3,156.3 L90.5,153.8 L95.3,153.2 L104.8,150.8 L109.4,151.2 L117.1,148.4 L124.7,149.5 Z"},
  {id:"canada", name:"Canada", area:180, lx:446.9, ly:226.9, bonus:{"wood": 2, "label": "+2 wood/min"}, borders:["usa"], d:"M581.7,279.3 L585.3,280.0 L589.9,279.9 L587.5,282.0 L585.6,282.4 L579.3,280.1 L578.0,278.4 L579.9,276.8 L581.7,279.3 Z M591.0,265.8 L588.5,265.9 L582.1,264.3 L577.4,261.8 L579.1,261.3 L585.7,262.7 L590.8,264.9 L591.0,265.8 Z M282.4,269.0 L279.9,269.7 L271.7,267.3 L270.2,265.4 L265.7,263.6 L264.9,262.1 L259.7,261.1 L257.8,258.3 L258.2,257.0 L263.5,258.2 L266.5,259.0 L271.2,259.6 L272.9,261.4 L275.4,263.9 L280.4,266.1 L282.4,269.0 Z M619.3,257.5 L616.0,262.1 L619.3,260.3 L622.6,261.4 L620.9,263.3 L625.3,264.7 L627.6,263.5 L632.6,265.1 L631.1,268.9 L634.6,268.0 L635.2,270.8 L636.8,274.1 L634.7,278.8 L632.4,279.0 L629.1,278.0 L630.2,273.6 L628.8,273.0 L623.0,277.6 L620.0,277.4 L623.5,274.9 L618.7,273.6 L613.4,273.9 L603.7,273.8 L602.9,272.2 L606.0,270.3 L603.8,268.9 L608.0,265.7 L613.2,257.3 L616.3,254.3 L620.6,252.5 L623.0,252.7 L622.0,254.2 L619.3,257.5 Z M236.4,239.8 L241.3,239.4 L239.8,245.4 L244.1,249.6 L242.1,249.6 L239.1,247.2 L237.3,244.7 L234.7,243.1 L233.8,240.8 L234.1,239.1 L236.4,239.8 Z M503.7,196.9 L501.7,199.7 L499.5,199.3 L498.2,197.7 L498.4,197.3 L500.4,195.7 L502.4,195.9 L503.7,196.9 Z M490.5,194.0 L484.7,196.9 L481.1,196.8 L480.0,195.4 L483.7,193.0 L490.6,193.0 L490.5,194.0 Z M474.2,178.5 L475.1,180.8 L477.7,180.0 L480.6,181.4 L486.1,183.2 L491.8,184.8 L492.2,187.3 L495.9,186.9 L499.5,188.7 L495.0,190.3 L487.3,189.1 L484.5,186.7 L479.5,189.5 L472.4,192.2 L470.7,189.1 L463.9,189.6 L468.2,187.0 L468.9,182.9 L470.6,178.0 L474.2,178.5 Z M520.7,170.6 L515.1,170.9 L513.8,168.3 L515.9,165.3 L520.5,164.6 L524.4,166.1 L524.5,168.3 L523.9,169.0 L520.7,170.6 Z M421.8,160.3 L418.7,162.1 L411.9,160.5 L407.8,161.1 L401.0,158.7 L405.4,157.1 L408.9,154.8 L414.2,156.3 L417.2,157.2 L418.7,158.2 L421.8,160.3 Z M447.3,158.2 L447.2,163.6 L453.9,159.5 L459.9,162.9 L458.4,166.8 L463.2,170.3 L468.5,166.5 L472.1,162.0 L472.4,156.2 L479.5,156.6 L486.9,157.4 L493.6,160.0 L493.9,162.6 L490.2,165.4 L493.7,168.2 L493.1,170.8 L483.3,174.5 L476.3,175.3 L471.2,173.7 L469.7,176.4 L464.8,180.8 L463.4,183.1 L457.6,186.7 L450.4,187.0 L446.5,189.3 L446.1,192.7 L440.3,193.4 L434.2,197.6 L428.8,203.6 L426.9,207.8 L426.6,213.9 L433.9,214.8 L436.2,219.7 L438.5,223.7 L445.5,222.7 L454.8,224.9 L459.8,227.0 L463.4,229.4 L469.6,230.9 L474.9,233.1 L483.2,233.4 L488.6,233.9 L487.8,238.5 L489.4,243.8 L493.0,249.7 L500.4,254.7 L504.3,253.0 L507.0,247.6 L504.4,239.3 L500.9,236.5 L508.9,234.0 L514.5,230.3 L517.3,226.6 L516.9,223.1 L513.5,218.6 L507.4,214.6 L513.3,209.1 L511.1,204.3 L509.5,196.1 L512.9,194.9 L521.5,196.3 L526.7,196.8 L530.8,195.4 L535.5,197.2 L541.6,200.3 L543.1,202.3 L552.0,202.7 L551.9,207.2 L553.6,213.8 L558.1,214.7 L561.8,217.8 L569.0,214.8 L573.8,209.0 L577.1,206.6 L581.0,211.3 L587.5,218.0 L593.0,224.3 L591.0,227.7 L597.7,230.6 L602.2,233.6 L610.1,235.0 L613.3,236.7 L615.3,241.2 L619.2,241.9 L621.2,243.9 L621.6,249.8 L618.0,251.8 L614.4,253.6 L606.1,255.5 L599.8,259.8 L591.4,260.7 L580.7,259.6 L573.2,259.5 L568.0,259.9 L563.8,263.7 L557.4,266.0 L550.2,273.0 L544.5,277.9 L548.7,277.0 L556.8,270.1 L567.2,265.7 L574.7,265.2 L579.1,267.7 L574.4,271.3 L576.0,277.0 L577.6,281.0 L584.1,283.6 L592.4,282.8 L597.4,276.9 L597.8,280.7 L601.0,282.6 L594.8,286.1 L583.7,289.2 L578.8,291.4 L573.2,295.2 L569.4,294.8 L569.2,290.3 L577.9,286.0 L569.9,286.1 L564.3,286.8 L561.0,283.8 L561.0,276.6 L558.8,275.1 L555.5,276.0 L553.8,274.6 L550.0,278.6 L548.5,282.7 L546.7,285.1 L544.6,285.9 L543.0,286.2 L542.5,287.5 L533.3,287.5 L525.7,287.5 L523.4,288.5 L518.1,292.3 L517.5,292.7 L515.9,294.7 L511.3,294.7 L506.4,294.8 L504.1,295.6 L504.9,296.6 L505.4,298.2 L505.3,298.8 L498.8,301.4 L493.6,302.2 L487.8,305.0 L486.5,305.0 L484.9,304.2 L484.3,303.5 L484.4,302.9 L485.5,301.1 L487.8,298.2 L489.3,295.0 L488.3,290.5 L487.2,285.7 L482.0,283.2 L482.7,282.3 L481.9,281.6 L480.5,281.6 L479.5,280.8 L479.3,279.5 L478.3,280.1 L477.0,279.9 L477.3,279.4 L476.1,278.9 L475.6,277.5 L471.7,275.8 L467.7,274.0 L462.8,272.0 L458.1,270.1 L453.6,271.6 L452.0,271.6 L445.9,270.2 L441.8,270.9 L436.9,269.3 L431.8,268.5 L428.4,268.1 L426.8,267.2 L425.9,264.3 L424.2,264.4 L424.2,266.4 L413.9,266.4 L396.8,266.4 L379.8,266.4 L364.8,266.4 L349.8,266.4 L335.0,266.4 L319.8,266.4 L314.8,266.4 L300.0,266.4 L285.8,266.4 L285.1,266.4 L275.4,261.2 L271.9,258.9 L262.8,256.7 L260.0,252.1 L260.7,248.8 L254.4,246.6 L253.5,242.3 L247.4,238.5 L247.3,235.8 L250.1,233.2 L250.0,229.9 L241.5,226.5 L236.3,220.5 L233.2,216.7 L228.6,214.3 L225.3,212.2 L222.6,209.5 L217.6,211.2 L212.7,214.1 L208.3,210.6 L204.8,208.3 L199.9,206.9 L195.0,206.7 L195.0,176.7 L195.1,157.1 L204.4,158.3 L212.3,160.9 L217.5,161.4 L221.9,159.2 L227.9,157.5 L235.4,158.2 L242.8,155.8 L251.0,154.5 L254.5,156.7 L258.2,155.5 L259.3,153.0 L262.8,153.6 L271.2,158.3 L277.9,154.7 L278.6,158.7 L284.7,157.9 L286.6,156.3 L292.6,156.6 L300.3,158.8 L312.0,160.8 L318.9,161.7 L323.8,161.3 L330.5,164.0 L323.5,166.6 L332.5,167.8 L346.0,167.1 L350.3,166.2 L355.6,169.4 L361.0,166.7 L355.9,164.5 L359.2,162.7 L365.2,162.4 L369.2,161.9 L373.3,163.1 L378.3,166.0 L383.9,165.6 L392.7,168.0 L400.5,167.1 L407.8,167.3 L407.2,164.0 L411.7,163.1 L419.4,164.8 L419.4,169.8 L422.6,165.6 L426.6,165.8 L428.8,160.5 L423.5,157.2 L417.6,155.1 L418.0,149.2 L424.0,145.4 L430.6,146.3 L435.6,148.6 L442.4,154.5 L438.0,157.1 L447.3,158.2 Z M329.2,139.1 L326.7,141.6 L337.8,140.0 L344.7,142.6 L350.4,139.9 L355.0,141.7 L359.1,146.8 L361.6,144.7 L358.0,139.2 L362.4,138.5 L367.4,139.3 L373.0,141.5 L376.1,146.6 L377.7,150.3 L386.1,152.9 L395.1,155.4 L394.6,157.7 L386.3,158.2 L389.5,160.2 L387.8,162.1 L378.8,161.3 L370.2,159.9 L364.4,160.2 L355.0,162.0 L342.3,162.8 L333.4,163.3 L330.7,160.8 L323.9,159.4 L319.5,159.9 L313.3,155.8 L316.6,155.2 L324.3,154.3 L331.4,154.5 L337.9,153.6 L328.2,152.4 L317.6,152.8 L310.5,152.7 L307.8,150.8 L319.4,148.6 L311.7,148.7 L303.0,147.3 L307.2,143.4 L310.7,141.3 L324.1,138.1 L329.2,139.1 Z M377.5,137.5 L373.1,141.0 L365.3,137.3 L367.0,136.6 L373.7,136.3 L377.5,137.5 Z M518.3,139.2 L518.7,140.6 L513.4,140.5 L508.0,140.4 L502.6,141.1 L501.1,140.8 L495.6,138.0 L495.8,136.1 L498.2,135.7 L509.7,136.3 L518.3,139.2 Z M467.2,138.9 L471.1,142.2 L475.7,137.9 L488.4,135.8 L497.0,141.2 L496.3,144.7 L506.1,143.1 L510.9,141.0 L522.0,143.7 L528.9,146.2 L529.5,148.5 L538.8,147.3 L544.0,150.7 L556.1,152.8 L560.4,154.9 L565.2,159.9 L556.0,162.3 L567.8,165.8 L575.7,166.9 L582.9,171.8 L590.7,172.1 L589.2,175.8 L580.4,182.0 L574.3,179.7 L566.4,174.6 L559.9,175.3 L559.3,178.3 L564.6,181.4 L571.3,183.8 L573.4,185.2 L576.7,190.4 L574.9,194.2 L568.6,192.8 L556.1,188.6 L563.2,193.1 L568.4,196.3 L569.2,198.1 L555.6,196.0 L544.9,193.0 L538.8,190.4 L540.6,188.9 L533.1,186.2 L525.8,183.6 L525.9,185.2 L511.5,186.0 L507.2,184.2 L510.5,180.3 L519.9,180.2 L530.2,179.5 L528.5,177.7 L530.3,175.0 L536.7,169.9 L535.4,167.6 L533.4,165.7 L525.8,163.2 L515.7,161.4 L518.9,160.1 L513.6,156.8 L509.2,156.5 L505.2,154.7 L502.5,156.2 L493.5,156.9 L475.3,155.7 L464.7,154.2 L456.6,153.4 L452.4,151.5 L457.7,149.1 L450.6,149.1 L449.0,143.8 L452.8,139.0 L458.0,136.9 L470.9,135.5 L467.2,138.9 Z M398.2,135.3 L404.2,136.4 L413.1,135.7 L414.4,137.2 L409.7,139.8 L417.3,142.0 L416.4,146.8 L408.2,148.8 L403.4,148.4 L399.9,146.4 L387.5,142.3 L387.6,140.6 L397.8,141.3 L392.3,137.8 L398.2,135.3 Z M434.0,140.9 L428.7,144.9 L423.0,144.7 L419.8,140.0 L419.9,137.4 L422.5,135.2 L427.5,133.7 L437.9,133.9 L447.5,135.2 L440.0,139.9 L434.0,140.9 Z M297.7,148.3 L284.5,150.8 L281.9,148.5 L270.4,145.7 L272.5,143.5 L276.0,139.6 L280.3,136.1 L275.4,132.9 L292.3,132.1 L299.5,133.2 L312.2,133.5 L317.1,135.0 L322.4,137.2 L316.2,138.5 L303.9,142.3 L297.7,146.0 L297.7,148.3 Z M431.9,129.3 L429.2,131.3 L422.0,130.9 L415.9,129.5 L418.6,127.2 L425.7,125.8 L430.1,127.6 L431.9,129.3 Z M407.5,120.1 L411.3,122.5 L411.5,125.2 L409.2,129.2 L401.0,129.7 L395.6,128.9 L395.7,125.8 L387.5,126.2 L387.2,122.1 L392.6,122.3 L400.1,120.5 L407.1,120.8 L407.5,120.1 Z M358.9,122.8 L360.9,124.7 L365.4,123.8 L370.6,124.1 L371.5,126.6 L368.4,129.1 L351.5,130.0 L338.9,132.2 L331.3,132.4 L330.6,130.6 L341.0,128.3 L318.4,128.9 L311.4,128.0 L318.3,122.8 L323.0,121.4 L337.0,123.1 L345.9,126.3 L354.7,126.7 L347.5,121.6 L352.1,119.7 L357.3,120.3 L358.9,122.8 Z M426.6,118.1 L432.1,119.8 L442.0,119.8 L446.3,121.5 L445.2,123.5 L450.9,124.7 L454.1,125.9 L460.8,126.2 L468.1,126.6 L476.1,125.5 L486.2,125.0 L494.4,125.4 L499.7,127.4 L500.8,129.6 L497.7,131.0 L490.3,132.1 L483.9,131.5 L469.5,132.3 L459.2,132.4 L451.2,131.7 L437.9,130.0 L436.2,127.1 L435.6,124.5 L430.5,122.2 L420.2,121.6 L414.4,119.9 L416.3,117.8 L426.6,118.1 Z M319.0,115.2 L318.3,119.3 L314.5,121.1 L309.8,121.3 L300.5,123.6 L292.5,124.4 L285.7,123.3 L285.7,123.3 L294.2,119.3 L304.5,115.9 L312.1,116.0 L319.0,115.2 Z M430.8,115.9 L428.5,116.0 L419.2,115.7 L417.8,114.2 L427.9,114.3 L431.4,115.3 L430.8,115.9 Z M349.1,114.9 L339.7,116.5 L332.3,114.7 L336.4,113.1 L343.7,112.5 L350.7,113.4 L349.1,114.9 Z M351.7,110.2 L345.6,111.2 L337.3,111.2 L337.4,110.4 L342.5,108.8 L345.2,109.1 L351.7,110.2 Z M420.8,113.0 L413.5,114.1 L409.4,112.9 L407.2,110.9 L406.8,108.7 L413.3,108.9 L416.2,109.3 L422.2,111.1 L420.8,113.0 Z M399.7,111.6 L401.6,113.8 L393.5,113.2 L385.3,111.5 L374.1,111.3 L378.9,109.8 L372.9,108.5 L372.5,106.5 L382.4,107.2 L395.9,109.1 L399.7,111.6 Z M464.9,104.6 L470.9,106.3 L464.1,107.8 L454.8,111.8 L446.0,112.2 L435.6,111.5 L430.2,109.4 L430.3,107.5 L434.3,106.0 L425.1,106.1 L419.6,104.3 L416.5,101.9 L419.9,99.6 L423.4,98.0 L428.5,97.6 L426.3,96.4 L438.0,96.1 L444.3,99.0 L452.8,100.1 L460.9,101.1 L464.9,104.6 Z M557.5,86.4 L570.9,86.8 L581.6,87.5 L590.8,88.9 L590.5,90.3 L578.3,92.6 L566.2,93.7 L561.7,94.9 L572.6,94.8 L560.8,98.0 L552.7,99.5 L544.1,103.8 L533.8,104.7 L530.6,105.8 L515.5,106.4 L522.4,107.0 L518.9,108.0 L523.0,110.6 L518.3,112.4 L510.6,113.9 L508.2,115.9 L501.2,117.5 L501.9,118.7 L510.4,118.5 L510.6,119.8 L497.2,122.9 L484.1,121.5 L469.4,122.3 L462.0,121.7 L452.5,121.4 L451.9,118.9 L461.2,117.7 L458.7,113.9 L461.8,113.5 L475.1,115.8 L468.3,112.4 L460.2,111.4 L464.2,109.3 L473.1,108.1 L474.5,106.2 L467.5,104.2 L465.3,101.5 L479.0,101.7 L483.0,102.3 L490.8,100.3 L479.5,99.7 L462.0,100.1 L453.2,98.3 L449.0,96.1 L443.2,94.6 L442.1,92.8 L449.5,91.8 L455.3,91.6 L465.1,90.7 L472.5,88.8 L478.7,89.1 L484.1,90.5 L487.9,87.7 L494.5,86.8 L503.5,86.3 L518.8,86.0 L521.4,86.6 L535.8,85.7 L546.7,86.0 L557.5,86.4 Z"},
  {id:"usa", name:"United States", area:150, lx:448.8, ly:323.0, bonus:{"coins": 50, "label": "+50 coins/sec"}, borders:["canada", "mexico"], d:"M122.3,424.3 L121.6,425.2 L120.3,424.4 L120.5,422.9 L119.6,421.0 L119.9,420.4 L120.7,419.6 L120.4,418.5 L120.7,418.0 L121.1,418.1 L123.0,419.0 L123.9,419.5 L124.7,420.2 L126.0,422.0 L125.8,422.3 L123.9,423.5 L122.3,424.3 Z M119.6,416.0 L117.9,416.4 L117.1,415.3 L116.5,414.9 L116.4,414.6 L116.9,414.1 L118.7,414.6 L120.0,415.4 L119.6,416.0 Z M116.2,413.2 L116.1,413.8 L113.4,413.7 L113.7,413.0 L116.2,413.2 Z M111.7,412.5 L111.5,412.8 L111.1,412.7 L109.4,412.5 L108.7,411.3 L108.5,411.1 L109.9,410.4 L110.3,410.7 L111.7,412.5 Z M103.3,409.0 L102.7,409.5 L101.0,408.5 L101.3,408.2 L102.0,407.6 L103.2,407.8 L103.3,409.0 Z M425.9,264.3 L426.8,267.2 L428.4,268.1 L431.8,268.5 L436.9,269.3 L441.8,270.9 L445.9,270.2 L452.0,271.6 L453.6,271.6 L458.1,270.1 L462.8,272.0 L467.7,274.0 L471.7,275.8 L475.6,277.5 L476.1,278.9 L477.3,279.4 L477.0,279.9 L478.3,280.1 L479.3,279.5 L479.5,280.8 L480.5,281.6 L481.9,281.6 L482.7,282.3 L482.0,283.2 L487.2,285.7 L488.3,290.5 L489.3,295.0 L487.8,298.2 L485.5,301.1 L484.4,302.9 L484.3,303.5 L484.9,304.2 L486.5,305.0 L487.8,305.0 L493.6,302.2 L498.8,301.4 L505.3,298.8 L505.4,298.2 L504.9,296.6 L504.1,295.6 L506.4,294.8 L511.3,294.7 L515.9,294.7 L517.5,292.7 L518.1,292.3 L523.4,288.5 L525.7,287.5 L533.3,287.5 L542.5,287.5 L543.0,286.2 L544.6,285.9 L546.7,285.1 L548.5,282.7 L550.0,278.6 L553.8,274.6 L555.5,276.0 L558.8,275.1 L561.0,276.6 L561.0,283.8 L564.3,286.8 L565.2,288.5 L559.8,291.1 L554.7,292.9 L549.4,294.4 L546.8,297.6 L545.9,298.8 L545.9,301.6 L547.5,304.4 L549.6,304.5 L549.1,302.6 L550.6,303.7 L550.2,305.2 L546.8,306.1 L544.4,306.0 L540.7,306.9 L538.5,307.2 L535.6,307.4 L531.5,309.0 L538.8,308.0 L540.3,309.0 L533.3,310.6 L530.1,310.6 L530.2,309.9 L528.7,311.4 L530.2,311.6 L529.1,315.4 L525.5,319.5 L525.1,318.1 L524.0,317.9 L522.4,316.5 L523.4,319.4 L524.6,320.3 L524.7,322.3 L523.1,324.4 L520.3,328.6 L519.8,328.4 L521.4,324.8 L518.8,322.8 L518.2,318.4 L517.3,320.7 L518.4,324.0 L515.1,323.2 L518.5,324.9 L518.7,329.9 L520.1,330.3 L520.7,332.1 L521.4,337.4 L518.2,341.3 L513.0,342.9 L509.7,345.9 L507.2,346.3 L504.7,348.2 L504.0,350.0 L498.5,353.4 L495.7,355.9 L493.3,359.1 L492.5,362.8 L493.4,366.5 L495.1,371.0 L497.3,374.7 L497.4,377.0 L499.7,383.1 L499.6,386.7 L499.3,388.7 L498.1,392.0 L496.6,392.6 L494.1,392.0 L493.4,389.7 L491.5,388.5 L488.8,383.9 L486.5,379.9 L485.7,377.8 L486.8,374.3 L485.3,371.4 L481.5,367.0 L479.5,366.2 L474.5,368.6 L473.6,368.3 L471.1,365.9 L468.0,364.6 L462.3,365.2 L457.9,364.6 L454.1,365.0 L452.0,365.8 L452.9,367.2 L452.8,369.4 L453.9,370.4 L453.0,371.1 L451.1,370.3 L449.2,371.3 L445.6,371.2 L441.9,368.4 L437.5,369.0 L433.9,367.8 L430.8,368.2 L426.6,369.4 L422.0,373.3 L417.0,375.6 L414.3,378.1 L413.1,380.5 L413.1,384.1 L413.4,386.7 L414.3,388.5 L412.4,388.6 L408.8,387.5 L404.9,385.8 L403.5,383.3 L402.4,379.6 L399.4,376.6 L397.7,373.5 L395.2,369.9 L391.7,367.8 L387.6,367.9 L384.4,372.1 L380.3,370.5 L377.7,368.9 L376.5,366.0 L374.8,363.3 L371.8,360.9 L369.3,359.3 L367.5,357.4 L358.8,357.4 L358.8,359.6 L354.8,359.6 L344.9,359.6 L333.5,355.9 L325.9,353.3 L326.4,352.3 L320.0,352.9 L314.4,353.3 L313.5,350.6 L310.3,347.6 L307.9,346.9 L307.4,345.4 L304.6,345.1 L302.8,343.7 L298.2,343.2 L296.9,342.3 L296.3,339.4 L291.4,334.1 L287.3,326.8 L287.4,325.6 L285.2,323.8 L281.4,319.4 L280.7,315.1 L278.0,312.2 L279.1,307.9 L278.9,303.3 L277.3,299.3 L279.3,294.3 L279.9,289.5 L280.5,284.7 L279.6,277.7 L278.0,273.1 L276.6,270.7 L277.2,269.7 L284.4,271.5 L287.1,276.4 L288.3,275.0 L287.5,270.7 L285.8,266.4 L300.0,266.4 L314.8,266.4 L319.8,266.4 L335.0,266.4 L349.8,266.4 L364.8,266.4 L379.8,266.4 L396.8,266.4 L413.9,266.4 L424.2,266.4 L424.2,264.4 L425.9,264.3 Z M135.0,223.6 L130.0,225.6 L127.4,224.2 L126.6,221.7 L131.2,219.9 L133.9,219.1 L137.2,219.4 L139.3,221.0 L135.0,223.6 Z M72.1,208.8 L69.0,209.6 L65.8,208.6 L62.7,207.2 L67.7,206.3 L71.6,206.8 L72.1,208.8 Z M41.3,188.4 L44.4,189.4 L47.5,188.8 L51.6,190.2 L56.6,190.9 L56.1,191.5 L52.4,192.6 L48.5,191.5 L46.6,190.5 L42.2,190.8 L41.0,190.4 L41.3,188.4 Z M124.7,149.5 L128.3,151.9 L130.5,150.9 L138.9,151.2 L138.6,152.4 L146.3,153.3 L151.4,152.8 L161.9,154.4 L171.6,154.9 L175.4,155.6 L182.1,154.8 L189.6,156.3 L195.1,157.1 L195.0,176.7 L195.0,206.7 L199.9,206.9 L204.8,208.3 L208.3,210.6 L212.7,214.1 L217.6,211.2 L222.6,209.5 L225.3,212.2 L228.6,214.3 L233.2,216.7 L236.3,220.5 L241.5,226.5 L250.0,229.9 L250.1,233.2 L247.3,235.8 L244.6,233.8 L240.2,232.1 L238.7,227.5 L232.3,223.2 L229.6,218.2 L224.8,217.9 L216.9,217.8 L211.0,216.3 L200.7,210.8 L195.9,209.8 L187.1,207.9 L180.2,208.3 L170.4,205.9 L164.4,203.7 L158.9,204.8 L159.9,208.4 L157.1,208.8 L151.4,209.9 L147.0,211.7 L141.4,212.8 L140.7,209.7 L143.0,204.5 L148.3,202.9 L146.9,201.6 L140.5,204.5 L137.1,208.0 L129.9,211.8 L133.6,214.3 L128.8,218.1 L123.5,220.3 L118.5,221.9 L117.2,224.3 L109.4,227.0 L107.8,229.5 L102.0,231.7 L98.6,231.3 L93.9,232.8 L88.8,234.6 L84.7,236.4 L76.1,237.9 L75.3,237.0 L80.8,234.5 L85.6,232.9 L91.0,230.0 L97.2,229.4 L99.6,227.2 L106.6,224.1 L107.7,223.0 L111.4,221.2 L112.2,217.2 L114.8,214.0 L109.0,215.6 L107.4,214.7 L104.7,216.7 L101.4,214.0 L100.1,215.9 L98.2,213.2 L93.2,215.3 L90.2,215.3 L89.7,212.2 L90.6,210.3 L87.4,208.4 L80.9,209.4 L76.7,206.9 L73.3,205.7 L73.2,202.7 L69.4,200.4 L71.3,197.4 L75.4,194.4 L77.2,191.7 L81.2,191.3 L84.7,192.2 L88.7,189.6 L92.3,190.1 L96.1,188.5 L95.2,186.0 L92.4,185.1 L96.1,183.1 L93.0,183.1 L87.7,184.3 L86.2,185.4 L82.3,184.3 L75.2,184.9 L67.9,183.6 L65.8,181.5 L59.4,178.4 L66.5,176.2 L77.6,173.6 L81.7,173.6 L81.1,176.3 L91.6,176.1 L87.6,172.8 L81.4,170.8 L77.8,168.1 L73.0,165.9 L66.2,164.2 L69.0,161.5 L77.8,161.3 L84.2,158.9 L85.3,156.3 L90.5,153.8 L95.3,153.2 L104.8,150.8 L109.4,151.2 L117.1,148.4 L124.7,149.5 Z"},
  {id:"greenland", name:"Greenland", area:35, lx:694.8, ly:133.7, borders:["canada"], d:"M666.2,88.9 L683.0,85.8 L700.5,86.0 L706.9,84.0 L724.6,83.5 L764.5,84.2 L795.8,88.4 L786.5,90.4 L767.4,90.7 L740.5,91.2 L743.0,92.1 L760.7,91.5 L775.8,93.3 L785.5,91.7 L789.6,93.6 L784.2,96.7 L796.9,94.7 L821.2,92.7 L836.1,93.7 L839.0,96.0 L818.6,99.7 L815.8,100.9 L799.8,101.8 L811.3,102.1 L805.5,105.9 L801.5,109.4 L801.6,115.2 L807.6,118.7 L799.8,118.9 L791.6,120.6 L800.8,123.4 L802.0,127.9 L796.7,128.3 L803.1,132.9 L792.0,133.3 L797.8,135.4 L796.2,137.3 L789.1,138.1 L782.2,138.1 L788.4,141.7 L788.5,144.0 L778.6,141.8 L776.0,143.3 L782.8,144.6 L789.3,147.8 L791.2,152.1 L782.3,153.1 L778.5,151.0 L772.3,148.0 L774.0,151.6 L768.2,154.4 L781.4,154.6 L788.3,154.9 L774.9,159.5 L761.3,163.6 L746.6,165.5 L741.1,165.5 L735.9,167.5 L729.0,173.1 L718.2,176.8 L714.8,177.0 L708.1,178.3 L700.9,179.5 L696.7,182.8 L696.6,186.5 L694.1,190.0 L685.9,194.2 L687.9,198.3 L685.7,202.7 L683.1,207.8 L676.1,208.1 L668.7,203.8 L658.7,203.8 L653.8,200.9 L650.5,195.8 L641.8,189.2 L639.3,185.8 L638.6,181.0 L631.7,176.1 L633.5,172.3 L630.2,170.4 L635.1,164.2 L642.6,162.3 L644.6,160.1 L645.6,155.9 L639.9,157.8 L637.2,158.6 L632.7,159.3 L626.6,157.6 L626.2,154.0 L628.2,151.2 L632.8,151.1 L643.0,152.5 L634.5,149.2 L630.0,147.4 L625.0,148.1 L620.8,146.8 L626.4,141.9 L623.4,139.9 L619.4,136.3 L613.4,130.7 L607.0,128.6 L607.1,126.4 L593.7,123.3 L583.0,123.0 L569.7,123.2 L557.5,123.6 L551.7,121.9 L543.0,118.6 L556.1,116.9 L566.2,116.6 L544.8,115.3 L533.5,113.1 L534.2,111.0 L553.1,108.5 L571.4,106.0 L573.4,104.1 L559.9,102.2 L564.2,100.1 L581.6,96.4 L588.8,95.8 L586.7,93.4 L598.6,92.0 L614.0,91.2 L629.3,91.2 L634.8,92.8 L648.0,89.9 L660.0,91.9 L667.0,92.3 L677.4,94.0 L665.5,91.2 L666.2,88.9 Z"},
  {id:"mexico", name:"Mexico", area:55, lx:384.9, ly:399.2, borders:["usa", "guatemala", "belize"], d:"M414.3,388.5 L412.4,393.1 L411.5,396.9 L411.1,404.0 L410.6,406.5 L411.5,409.4 L413.1,412.0 L414.1,416.1 L417.4,420.0 L418.5,423.0 L420.5,425.6 L425.8,427.0 L427.9,429.2 L432.3,427.8 L436.1,427.2 L439.8,426.3 L443.0,425.4 L446.1,423.2 L447.3,420.1 L447.7,415.7 L448.6,414.2 L452.0,412.8 L457.3,411.6 L461.7,411.7 L464.7,411.3 L465.9,412.4 L465.8,415.0 L463.1,418.1 L461.9,421.3 L462.8,422.2 L462.1,424.5 L460.8,428.6 L459.5,427.3 L458.5,427.4 L457.5,427.4 L455.8,430.6 L454.9,430.0 L454.2,430.2 L454.3,431.0 L449.7,431.0 L445.0,431.0 L445.0,433.9 L442.7,433.9 L444.6,435.7 L446.4,436.9 L447.0,438.1 L447.8,438.4 L447.7,440.2 L441.3,440.2 L438.9,444.5 L439.6,445.5 L439.0,446.7 L438.9,448.3 L433.2,442.6 L430.6,440.9 L426.5,439.5 L423.7,439.9 L419.7,441.9 L417.2,442.4 L413.7,441.0 L409.9,440.0 L405.3,437.6 L401.5,436.8 L395.9,434.4 L391.7,431.9 L390.4,430.4 L387.6,430.1 L382.5,428.5 L380.4,426.0 L375.0,423.1 L372.5,419.7 L371.3,417.2 L373.0,416.6 L372.5,415.1 L373.6,413.8 L373.7,411.9 L372.0,409.6 L371.5,407.5 L369.9,404.8 L365.5,399.6 L360.4,395.4 L358.0,392.1 L353.7,390.0 L352.8,388.7 L353.5,385.4 L351.0,384.2 L348.0,381.6 L346.8,378.0 L344.1,377.5 L341.2,374.8 L338.9,372.2 L338.6,370.5 L336.0,366.6 L334.2,362.5 L334.3,360.5 L330.6,358.4 L329.0,358.6 L326.1,357.2 L325.3,359.3 L326.1,361.8 L326.6,365.8 L328.3,368.0 L332.1,371.6 L332.9,372.9 L333.6,373.2 L334.3,375.1 L335.2,375.0 L336.2,378.4 L337.7,379.7 L338.8,381.6 L341.9,384.3 L343.6,389.2 L345.1,391.5 L346.4,394.0 L346.7,396.8 L349.1,396.9 L351.1,399.3 L353.0,401.7 L352.8,402.6 L350.7,404.6 L349.8,404.5 L348.5,401.3 L345.3,398.3 L341.6,395.8 L339.1,394.4 L339.3,390.6 L338.5,387.7 L336.1,386.1 L332.7,383.7 L332.0,384.4 L330.8,383.0 L327.7,381.8 L324.7,378.7 L325.1,378.3 L327.1,378.6 L329.0,376.6 L329.2,374.2 L325.3,370.5 L322.4,369.0 L320.6,365.7 L318.7,362.3 L316.4,358.0 L314.4,353.3 L320.0,352.9 L326.4,352.3 L325.9,353.3 L333.5,355.9 L344.9,359.6 L354.8,359.6 L358.8,359.6 L358.8,357.4 L367.5,357.4 L369.3,359.3 L371.8,360.9 L374.8,363.3 L376.5,366.0 L377.7,368.9 L380.3,370.5 L384.4,372.1 L387.6,367.9 L391.7,367.8 L395.2,369.9 L397.7,373.5 L399.4,376.6 L402.4,379.6 L403.5,383.3 L404.9,385.8 L408.8,387.5 L412.4,388.6 L414.3,388.5 Z"},
  {id:"cuba", name:"Cuba", area:12, lx:501.3, ly:410.4, borders:["usa", "mexico"], d:"M488.7,402.6 L493.0,403.0 L496.9,403.1 L501.6,404.8 L503.6,406.8 L508.3,406.2 L510.0,407.4 L514.3,410.7 L517.4,413.1 L519.0,413.0 L522.0,414.1 L521.6,415.6 L525.3,415.8 L529.1,417.9 L528.5,419.2 L525.2,419.8 L521.8,420.1 L518.4,419.7 L511.2,420.2 L514.6,417.3 L512.5,415.9 L509.3,415.5 L507.6,414.0 L506.4,411.0 L503.6,411.2 L498.9,409.8 L497.4,408.7 L490.9,407.9 L489.2,406.8 L491.0,405.5 L486.1,405.3 L482.5,408.0 L480.5,408.1 L479.7,409.4 L477.3,409.9 L475.1,409.4 L477.8,407.8 L478.8,405.9 L481.1,404.7 L483.7,403.7 L487.4,403.2 L488.7,402.6 Z"},
  {id:"guatemala", name:"Guatemala", area:8, lx:449.0, ly:443.2, borders:["mexico", "belize", "honduras", "colombia"], d:"M449.5,452.5 L447.0,451.6 L443.8,451.5 L441.6,450.4 L438.9,448.3 L439.0,446.7 L439.6,445.5 L438.9,444.5 L441.3,440.2 L447.7,440.2 L447.8,438.4 L447.0,438.1 L446.4,436.9 L444.6,435.7 L442.7,433.9 L445.0,433.9 L445.0,431.0 L449.7,431.0 L454.3,431.0 L454.2,435.2 L453.9,441.2 L455.3,441.2 L457.0,442.1 L457.4,441.3 L458.9,442.0 L456.6,444.0 L454.2,445.5 L453.9,446.5 L454.3,447.5 L453.2,448.9 L452.1,449.2 L452.3,449.8 L451.4,450.4 L449.7,451.7 L449.5,452.5 Z"},
  {id:"colombia", name:"Colombia", area:38, lx:536.3, ly:501.4, borders:["venezuela", "ecuador", "peru", "brazil", "panama", "guatemala"], d:"M523.1,525.8 L521.0,524.6 L518.5,522.8 L517.1,523.6 L512.9,522.9 L511.7,520.6 L510.7,520.7 L505.7,517.7 L505.0,516.1 L506.9,515.7 L506.7,513.0 L507.9,511.1 L510.3,510.8 L512.4,507.5 L514.4,504.7 L512.5,503.4 L513.5,500.4 L512.3,495.5 L513.4,494.1 L512.6,489.7 L510.6,486.9 L511.2,484.3 L512.8,484.7 L513.8,483.1 L512.6,480.0 L513.2,479.2 L515.8,479.4 L519.6,475.7 L521.6,475.2 L521.7,473.4 L522.6,469.0 L525.5,466.5 L528.6,466.4 L529.0,465.3 L532.9,465.7 L536.9,463.1 L538.8,461.9 L541.2,459.4 L543.0,459.7 L544.3,461.1 L543.3,462.8 L540.1,463.7 L538.9,466.4 L536.9,467.9 L535.5,469.8 L534.9,473.6 L533.5,476.7 L536.1,477.1 L536.7,479.5 L537.8,480.6 L538.2,482.8 L537.6,484.7 L537.8,485.8 L539.0,486.3 L540.2,488.1 L546.6,487.6 L549.5,488.3 L553.1,492.8 L555.1,492.2 L558.7,492.5 L561.5,491.9 L563.3,492.8 L562.4,495.7 L561.3,497.4 L560.9,501.2 L561.9,504.7 L563.3,506.3 L563.5,507.5 L561.0,510.1 L562.8,511.3 L564.1,513.1 L565.6,518.4 L564.7,519.0 L563.7,515.9 L562.3,514.2 L560.7,516.1 L550.9,515.9 L551.0,519.3 L553.9,519.8 L553.7,521.8 L552.7,521.3 L549.9,522.1 L549.9,526.0 L552.1,527.9 L552.9,530.9 L552.8,533.2 L550.5,547.7 L548.0,544.9 L546.5,544.8 L549.8,539.4 L545.9,536.9 L542.9,537.4 L541.1,536.5 L538.4,537.8 L534.6,537.2 L531.7,531.7 L529.4,530.3 L527.8,527.8 L524.5,525.3 L523.1,525.8 Z"},
  {id:"venezuela", name:"Venezuela", area:35, lx:565.2, ly:486.6, bonus:{"oil": 1, "label": "+1 oil/min"}, borders:["colombia", "brazil", "guyana", "trinidad"], d:"M543.3,462.8 L543.2,464.1 L540.3,464.7 L541.9,467.1 L541.8,469.9 L539.6,472.9 L541.5,477.1 L543.7,476.8 L544.8,473.0 L543.2,471.1 L543.0,467.1 L549.2,465.0 L548.5,462.5 L550.3,460.8 L552.1,464.5 L555.6,464.6 L558.8,467.5 L559.0,469.3 L563.5,469.3 L568.9,468.8 L571.7,471.2 L575.5,471.8 L578.4,470.2 L578.4,468.8 L584.6,468.5 L590.6,468.4 L586.3,470.0 L588.1,472.5 L592.1,472.9 L595.8,475.5 L596.6,479.7 L599.2,479.6 L601.2,480.8 L597.2,483.9 L596.8,485.9 L598.5,487.8 L597.3,488.8 L594.2,489.7 L594.3,492.1 L592.9,493.5 L596.3,497.6 L597.0,499.0 L595.2,501.1 L589.6,503.0 L586.0,503.9 L584.5,505.1 L580.6,503.8 L576.9,503.1 L575.9,503.6 L578.2,505.0 L578.0,508.5 L578.7,511.8 L582.9,512.3 L583.2,513.4 L579.6,514.9 L579.0,517.1 L576.9,518.0 L573.2,519.2 L572.3,520.8 L568.4,521.2 L565.6,518.4 L564.1,513.1 L562.8,511.3 L561.0,510.1 L563.5,507.5 L563.3,506.3 L561.9,504.7 L560.9,501.2 L561.3,497.4 L562.4,495.7 L563.3,492.8 L561.5,491.9 L558.7,492.5 L555.1,492.2 L553.1,492.8 L549.5,488.3 L546.6,487.6 L540.2,488.1 L539.0,486.3 L537.8,485.8 L537.6,484.7 L538.2,482.8 L537.8,480.6 L536.7,479.5 L536.1,477.1 L533.5,476.7 L534.9,473.6 L535.5,469.8 L536.9,467.9 L538.9,466.4 L540.1,463.7 L543.3,462.8 Z"},
  {id:"ecuador", name:"Ecuador", area:14, lx:505.7, ly:534.2, borders:["colombia", "peru"], d:"M498.5,543.0 L501.1,539.0 L500.1,536.7 L498.2,539.2 L495.2,536.9 L496.2,535.4 L495.3,530.6 L497.1,529.8 L498.0,526.5 L499.9,523.1 L499.5,520.9 L502.3,519.8 L505.7,517.7 L510.7,520.7 L511.7,520.6 L512.9,522.9 L517.1,523.6 L518.5,522.8 L521.0,524.6 L523.1,525.8 L523.8,529.8 L522.3,533.2 L516.8,538.8 L510.8,540.8 L507.7,545.4 L506.8,549.0 L504.0,551.2 L501.9,548.5 L499.9,547.9 L497.8,548.4 L497.7,546.4 L499.1,545.2 L498.5,543.0 Z"},
  {id:"peru", name:"Peru", area:55, lx:529.6, ly:566.8, borders:["ecuador", "colombia", "brazil", "bolivia", "chile"], d:"M552.0,617.8 L550.7,620.5 L548.1,621.8 L543.1,618.8 L542.7,616.6 L532.8,611.3 L523.8,605.6 L520.0,602.3 L517.9,598.0 L518.7,596.4 L514.5,589.5 L509.5,579.8 L504.8,569.3 L502.8,566.9 L501.2,563.0 L497.3,559.5 L493.8,557.4 L495.4,555.0 L492.9,550.0 L494.5,546.3 L498.5,543.0 L499.1,545.2 L497.7,546.4 L497.8,548.4 L499.9,547.9 L501.9,548.5 L504.0,551.2 L506.8,549.0 L507.7,545.4 L510.8,540.8 L516.8,538.8 L522.3,533.2 L523.8,529.8 L523.1,525.8 L524.5,525.3 L527.8,527.8 L529.4,530.3 L531.7,531.7 L534.6,537.2 L538.4,537.8 L541.1,536.5 L542.9,537.4 L545.9,536.9 L549.8,539.4 L546.5,544.8 L548.0,544.9 L550.5,547.7 L546.0,547.4 L545.4,548.2 L541.3,549.2 L535.5,552.8 L535.2,555.3 L533.9,557.1 L534.4,560.0 L531.4,561.5 L531.4,563.7 L530.1,564.7 L532.1,569.5 L534.9,572.7 L533.9,574.9 L537.2,575.2 L539.1,578.1 L543.5,578.2 L547.6,575.1 L547.3,583.1 L549.5,583.7 L552.4,582.8 L556.7,591.3 L555.6,593.1 L555.4,596.8 L555.3,601.3 L553.3,603.9 L554.2,605.9 L553.1,607.7 L555.2,612.1 L552.0,617.8 Z"},
  {id:"brazil", name:"Brazil", area:148, lx:615.3, ly:575.9, borders:["venezuela", "colombia", "peru", "bolivia", "paraguay", "argentina", "uruguay"], d:"M611.9,684.5 L618.5,677.3 L624.2,672.2 L627.5,670.0 L631.8,667.1 L631.9,662.9 L629.3,659.8 L626.9,660.8 L627.9,657.8 L628.5,654.7 L628.5,651.8 L626.7,650.8 L624.9,651.7 L623.0,651.4 L622.4,649.4 L621.9,644.6 L621.0,643.0 L617.6,641.6 L615.6,642.6 L610.3,641.6 L610.6,634.4 L609.2,631.5 L610.7,630.4 L610.3,627.4 L611.6,625.1 L612.5,620.9 L611.3,617.6 L608.6,616.2 L608.1,614.1 L608.8,611.0 L599.2,610.8 L597.3,604.7 L598.7,604.6 L598.7,602.3 L597.7,600.8 L597.5,597.7 L594.6,596.1 L591.4,596.2 L589.4,594.7 L586.0,593.6 L584.0,591.6 L578.4,590.8 L573.0,586.0 L573.4,582.5 L572.8,580.5 L573.3,576.5 L566.8,577.4 L564.1,579.4 L559.8,581.5 L558.6,583.1 L556.1,583.2 L552.4,582.8 L549.5,583.7 L547.3,583.1 L547.6,575.1 L543.5,578.2 L539.1,578.1 L537.2,575.2 L533.9,574.9 L534.9,572.7 L532.1,569.5 L530.1,564.7 L531.4,563.7 L531.4,561.5 L534.4,560.0 L533.9,557.1 L535.2,555.3 L535.5,552.8 L541.3,549.2 L545.4,548.2 L546.0,547.4 L550.5,547.7 L552.8,533.2 L552.9,530.9 L552.1,527.9 L549.9,526.0 L549.9,522.1 L552.7,521.3 L553.7,521.8 L553.9,519.8 L551.0,519.3 L550.9,515.9 L560.7,516.1 L562.3,514.2 L563.7,515.9 L564.7,519.0 L565.6,518.4 L568.4,521.2 L572.3,520.8 L573.2,519.2 L576.9,518.0 L579.0,517.1 L579.6,514.9 L583.2,513.4 L582.9,512.3 L578.7,511.8 L578.0,508.5 L578.2,505.0 L575.9,503.6 L576.9,503.1 L580.6,503.8 L584.5,505.1 L586.0,503.9 L589.6,503.0 L595.2,501.1 L597.0,499.0 L596.3,497.6 L598.9,497.3 L600.1,498.5 L599.4,500.9 L601.2,501.7 L602.3,504.1 L600.9,506.0 L600.1,510.5 L601.4,513.1 L601.8,515.6 L604.8,518.0 L607.3,518.3 L607.9,517.3 L609.4,517.0 L611.7,516.1 L613.3,514.7 L616.1,515.2 L617.3,515.0 L620.0,515.4 L620.5,514.3 L619.6,513.3 L620.1,511.8 L622.2,512.2 L624.5,511.7 L627.4,512.8 L629.6,513.9 L631.1,512.5 L632.2,512.7 L632.9,514.2 L635.3,513.8 L637.2,511.8 L638.8,507.9 L641.7,503.1 L643.4,502.8 L644.7,505.7 L647.5,515.0 L650.1,515.8 L650.3,519.5 L646.5,523.8 L648.1,525.4 L656.9,526.2 L657.1,531.5 L660.9,528.1 L667.2,530.0 L675.5,533.2 L677.9,536.3 L677.1,539.2 L682.9,537.6 L692.6,540.4 L700.1,540.2 L707.5,544.5 L713.9,550.4 L717.7,552.0 L722.0,552.2 L723.8,553.8 L725.5,560.6 L726.4,563.8 L724.4,572.5 L721.8,575.9 L714.8,583.3 L711.6,589.2 L707.9,593.8 L706.6,593.9 L705.2,597.8 L705.6,607.7 L704.2,615.8 L703.7,619.3 L702.1,621.4 L701.2,628.4 L696.1,635.3 L695.3,640.8 L691.2,643.1 L690.1,646.2 L684.6,646.2 L676.8,648.2 L673.2,650.6 L667.6,652.1 L661.8,656.3 L657.5,661.6 L656.8,665.5 L657.6,668.4 L656.7,673.8 L655.6,676.3 L652.1,679.2 L646.5,688.5 L642.1,692.7 L638.7,695.2 L636.4,700.2 L633.1,703.2 L631.7,700.2 L634.0,697.7 L631.1,694.1 L627.1,691.2 L622.0,687.8 L620.1,688.0 L615.1,683.9 L611.9,684.5 Z"},
  {id:"bolivia", name:"Bolivia", area:38, lx:579.9, ly:612.2, borders:["peru", "brazil", "paraguay", "argentina", "chile"], d:"M585.8,641.3 L580.1,641.1 L578.1,645.3 L575.2,641.5 L568.6,640.2 L564.5,645.0 L560.9,645.7 L558.9,638.4 L556.2,632.5 L557.8,627.4 L555.2,625.2 L554.5,621.4 L552.0,617.8 L555.2,612.1 L553.1,607.7 L554.2,605.9 L553.3,603.9 L555.3,601.3 L555.4,596.8 L555.6,593.1 L556.7,591.3 L552.4,582.8 L556.1,583.2 L558.6,583.1 L559.8,581.5 L564.1,579.4 L566.8,577.4 L573.3,576.5 L572.8,580.5 L573.4,582.5 L573.0,586.0 L578.4,590.8 L584.0,591.6 L586.0,593.6 L589.4,594.7 L591.4,596.2 L594.6,596.1 L597.5,597.7 L597.7,600.8 L598.7,602.3 L598.7,604.6 L597.3,604.7 L599.2,610.8 L608.8,611.0 L608.1,614.1 L608.6,616.2 L611.3,617.6 L612.5,620.9 L611.6,625.1 L610.3,627.4 L610.7,630.4 L609.2,631.5 L609.1,629.9 L604.4,627.2 L599.8,627.1 L591.1,628.6 L588.7,633.3 L588.5,636.1 L586.6,642.4 L585.8,641.3 Z"},
  {id:"paraguay", name:"Paraguay", area:18, lx:611.5, ly:648.3, borders:["bolivia", "brazil", "argentina"], d:"M586.6,642.4 L588.5,636.1 L588.7,633.3 L591.1,628.6 L599.8,627.1 L604.4,627.2 L609.1,629.9 L609.2,631.5 L610.6,634.4 L610.3,641.6 L615.6,642.6 L617.6,641.6 L621.0,643.0 L621.9,644.6 L622.4,649.4 L623.0,651.4 L624.9,651.7 L626.7,650.8 L628.5,651.8 L628.5,654.7 L627.9,657.8 L626.9,660.8 L626.1,665.5 L621.5,669.5 L617.6,670.4 L612.0,669.6 L606.9,668.2 L611.8,660.1 L611.1,657.8 L606.0,655.7 L599.9,651.8 L595.8,651.0 L586.6,642.4 Z"},
  {id:"chile", name:"Chile", area:32, lx:542.8, ly:726.4, borders:["peru", "bolivia", "argentina"], d:"M556.8,802.8 L556.8,814.6 L562.2,814.6 L565.2,814.7 L563.5,816.9 L559.3,818.5 L556.8,818.3 L553.8,817.9 L550.2,816.3 L545.0,815.6 L538.7,812.6 L533.6,809.8 L526.7,803.9 L530.8,805.0 L537.8,808.5 L544.5,810.4 L547.0,808.0 L548.7,804.4 L553.3,802.2 L556.8,802.8 Z M558.9,638.4 L560.9,645.7 L564.5,645.0 L565.1,646.3 L563.4,651.8 L557.9,654.4 L558.1,663.2 L557.0,664.9 L558.5,667.0 L555.0,670.3 L551.7,675.2 L549.9,680.0 L550.4,685.1 L547.3,690.5 L549.6,699.6 L550.9,700.6 L550.9,705.5 L548.1,710.6 L548.2,715.0 L544.4,718.5 L544.4,723.3 L545.9,728.5 L542.9,730.4 L541.6,735.1 L540.4,740.5 L541.3,746.9 L539.3,748.0 L540.4,754.1 L542.7,756.1 L541.0,758.3 L543.4,759.4 L543.9,761.4 L541.7,762.4 L542.2,765.5 L540.4,772.4 L537.8,777.0 L538.3,779.6 L536.8,783.0 L532.9,785.3 L533.4,790.9 L535.1,792.8 L538.5,792.5 L538.4,796.4 L540.4,799.5 L552.5,800.2 L557.1,801.0 L552.7,801.0 L550.3,802.3 L545.8,804.2 L545.0,809.1 L542.9,809.2 L537.2,807.5 L531.5,803.9 L531.5,803.9 L525.3,800.8 L523.7,797.5 L525.1,794.4 L522.6,790.9 L522.0,781.9 L524.1,776.8 L529.4,772.7 L521.8,771.2 L526.5,766.5 L528.2,757.8 L533.8,759.6 L536.4,748.7 L533.1,747.3 L531.5,753.9 L528.3,753.1 L529.9,745.6 L531.6,735.8 L533.9,732.2 L532.5,727.0 L532.1,721.1 L534.2,720.9 L537.2,712.4 L540.7,704.0 L542.8,696.1 L541.7,688.2 L543.1,683.8 L542.6,677.3 L545.5,670.9 L546.4,660.7 L548.0,649.7 L549.5,637.9 L549.2,629.3 L548.1,621.8 L550.7,620.5 L552.0,617.8 L554.5,621.4 L555.2,625.2 L557.8,627.4 L556.2,632.5 L558.9,638.4 Z"},
  {id:"argentina", name:"Argentina", area:80, lx:574.2, ly:720.0, borders:["chile", "bolivia", "paraguay", "brazil", "uruguay"], d:"M572.5,816.3 L567.8,816.6 L565.2,814.7 L562.2,814.6 L556.8,814.6 L556.8,802.8 L558.8,805.2 L561.2,809.2 L567.8,812.4 L574.8,813.7 L572.5,816.3 Z M575.2,641.5 L578.1,645.3 L580.1,641.1 L585.8,641.3 L586.6,642.4 L595.8,651.0 L599.9,651.8 L606.0,655.7 L611.1,657.8 L611.8,660.1 L606.9,668.2 L612.0,669.6 L617.6,670.4 L621.5,669.5 L626.1,665.5 L626.9,660.8 L629.3,659.8 L631.9,662.9 L631.8,667.1 L627.5,670.0 L624.2,672.2 L618.5,677.3 L611.9,684.5 L610.6,688.7 L609.3,694.1 L609.3,699.4 L608.3,700.6 L607.9,704.0 L607.5,706.7 L613.9,711.2 L613.2,714.9 L616.3,717.2 L616.1,719.8 L611.3,726.5 L603.8,729.4 L593.8,730.5 L588.3,729.9 L589.4,733.1 L588.3,737.0 L589.3,739.7 L586.3,741.5 L581.1,742.3 L576.3,740.3 L574.4,741.7 L575.1,747.0 L578.5,748.6 L581.2,746.9 L582.7,749.6 L578.1,751.3 L574.1,754.6 L573.4,759.9 L572.2,762.7 L567.5,762.7 L563.5,765.4 L562.1,769.4 L567.0,773.2 L571.8,774.3 L570.1,779.0 L564.2,782.0 L560.9,788.2 L556.4,790.3 L554.3,792.8 L555.9,798.2 L559.3,801.3 L557.1,801.0 L552.5,800.2 L540.4,799.5 L538.4,796.4 L538.5,792.5 L535.1,792.8 L533.4,790.9 L532.9,785.3 L536.8,783.0 L538.3,779.6 L537.8,777.0 L540.4,772.4 L542.2,765.5 L541.7,762.4 L543.9,761.4 L543.4,759.4 L541.0,758.3 L542.7,756.1 L540.4,754.1 L539.3,748.0 L541.3,746.9 L540.4,740.5 L541.6,735.1 L542.9,730.4 L545.9,728.5 L544.4,723.3 L544.4,718.5 L548.2,715.0 L548.1,710.6 L550.9,705.5 L550.9,700.6 L549.6,699.6 L547.3,690.5 L550.4,685.1 L549.9,680.0 L551.7,675.2 L555.0,670.3 L558.5,667.0 L557.0,664.9 L558.1,663.2 L557.9,654.4 L563.4,651.8 L565.1,646.3 L564.5,645.0 L568.6,640.2 L575.2,641.5 Z"},
  {id:"uruguay", name:"Uruguay", area:12, lx:619.3, ly:697.6, borders:["brazil", "argentina"], d:"M611.9,684.5 L615.1,683.9 L620.1,688.0 L622.0,687.8 L627.1,691.2 L631.1,694.1 L634.0,697.7 L631.7,700.2 L633.1,703.2 L631.0,706.5 L625.3,709.5 L621.6,708.4 L618.9,709.0 L614.3,706.7 L610.9,706.9 L607.9,704.0 L608.3,700.6 L609.3,699.4 L609.3,694.1 L610.6,688.7 L611.9,684.5 Z"},
  {id:"iceland", name:"Iceland", area:12, lx:803.7, ly:180.5, borders:["uk", "norway"], d:"M827.5,174.3 L826.3,177.7 L832.0,181.3 L825.5,185.3 L811.0,188.9 L806.7,189.9 L800.1,189.1 L786.2,187.4 L791.1,185.1 L780.2,182.5 L789.1,181.5 L788.9,179.9 L778.4,178.7 L781.7,175.3 L789.3,174.5 L797.1,178.1 L804.7,175.2 L811.0,176.7 L819.2,173.9 L827.5,174.3 Z"},
  {id:"norway", name:"Norway", area:25, lx:990.1, ly:175.3, borders:["russia", "finland", "sweden", "iceland", "uk"], d:"M1040.8,149.3 L1056.5,153.2 L1050.0,154.6 L1055.5,157.9 L1047.0,160.0 L1043.0,160.5 L1045.1,156.8 L1038.7,154.7 L1030.9,156.5 L1028.4,160.3 L1023.7,162.7 L1018.3,161.4 L1011.8,161.7 L1006.2,158.9 L1003.2,160.3 L1000.1,160.5 L999.4,164.0 L990.0,163.1 L988.6,166.1 L983.8,166.0 L980.5,169.8 L975.5,175.6 L967.8,183.1 L969.6,184.9 L967.9,187.0 L962.9,186.9 L959.7,191.8 L960.0,198.8 L963.2,201.5 L961.5,207.7 L957.3,211.3 L955.1,214.4 L951.8,211.1 L941.9,217.2 L935.2,218.5 L928.3,215.8 L926.5,210.1 L925.0,197.9 L929.6,194.5 L942.8,190.1 L952.6,184.7 L961.8,177.3 L973.8,167.1 L982.2,163.1 L995.9,156.5 L1006.9,154.2 L1015.1,154.5 L1022.7,150.1 L1031.9,150.4 L1040.8,149.3 Z M1023.6,114.1 L1012.5,116.3 L1003.6,115.0 L1007.1,113.7 L1004.1,112.0 L1014.4,110.9 L1016.4,112.9 L1023.6,114.1 Z M991.3,104.4 L1007.7,108.3 L995.1,110.4 L992.4,114.2 L988.0,115.2 L985.6,119.6 L979.6,119.8 L968.8,116.6 L973.3,114.7 L965.9,113.2 L956.1,108.7 L952.2,104.6 L965.9,102.7 L968.6,104.6 L975.7,104.5 L977.6,102.7 L985.0,102.5 L991.3,104.4 Z M1027.2,100.6 L1037.0,102.5 L1029.6,105.3 L1015.1,105.9 L1000.4,105.1 L999.5,103.6 L992.3,103.5 L986.8,101.1 L1002.3,99.6 L1009.5,100.9 L1014.6,99.3 L1027.2,100.6 Z"},
  {id:"sweden", name:"Sweden", area:22, lx:984.2, ly:193.0, borders:["norway", "finland", "russia"], d:"M1010.9,178.1 L1006.1,181.8 L1006.8,185.0 L998.9,189.3 L989.2,193.8 L985.6,201.3 L989.2,205.0 L993.9,207.9 L989.3,213.9 L984.1,215.1 L982.2,223.9 L979.4,228.9 L973.3,228.4 L970.5,232.6 L964.7,232.8 L963.1,227.8 L958.9,221.8 L955.1,214.4 L957.3,211.3 L961.5,207.7 L963.2,201.5 L960.0,198.8 L959.7,191.8 L962.9,186.9 L967.9,187.0 L969.6,184.9 L967.8,183.1 L975.5,175.6 L980.5,169.8 L983.8,166.0 L988.6,166.1 L990.0,163.1 L999.4,164.0 L1000.1,160.5 L1003.2,160.3 L1009.9,162.9 L1017.7,166.4 L1017.8,174.6 L1019.5,176.6 L1010.9,178.1 Z M985.3,222.1 L986.1,222.4 L982.2,228.5 L981.8,226.5 L985.3,222.1 Z M996.8,219.1 L994.0,220.7 L994.1,221.8 L995.0,221.8 L994.8,222.2 L993.5,222.6 L993.5,223.1 L992.3,223.5 L991.6,224.6 L990.5,224.7 L990.9,223.6 L990.4,222.8 L990.8,222.1 L990.5,221.3 L993.3,219.3 L995.2,219.2 L995.5,218.9 L996.9,218.9 L996.8,219.1 Z M1004.2,188.2 L1005.3,188.1 L1004.9,188.7 L1004.1,189.4 L1003.5,189.4 L1004.1,188.7 L1004.0,188.4 L1004.2,188.2 Z"},
  {id:"finland", name:"Finland", area:20, lx:1028.9, ly:179.4, borders:["norway", "sweden", "russia"], d:"M1043.0,160.5 L1042.2,164.2 L1049.9,167.7 L1045.3,171.7 L1051.1,177.7 L1047.7,182.2 L1052.2,186.1 L1050.2,189.6 L1057.6,193.2 L1055.7,195.9 L1051.1,198.9 L1040.3,205.7 L1031.3,206.1 L1022.5,208.0 L1014.3,209.1 L1011.5,206.3 L1006.6,204.5 L1007.7,199.3 L1005.3,194.6 L1007.7,191.5 L1012.2,188.2 L1023.7,182.5 L1027.0,181.4 L1026.5,179.1 L1019.5,176.6 L1017.8,174.6 L1017.7,166.4 L1009.9,162.9 L1003.2,160.3 L1006.2,158.9 L1011.8,161.7 L1018.3,161.4 L1023.7,162.7 L1028.4,160.3 L1030.9,156.5 L1038.7,154.7 L1045.1,156.8 L1043.0,160.5 Z"},
  {id:"uk", name:"UK", area:14, lx:884.6, ly:240.0, borders:["ireland", "france", "norway", "iceland"], d:"M871.7,237.1 L869.0,240.7 L865.2,239.6 L862.1,239.7 L863.2,236.9 L862.1,234.0 L866.3,233.8 L871.7,237.1 Z M885.0,215.5 L879.6,221.2 L884.7,220.5 L890.2,220.6 L888.9,224.9 L884.4,229.6 L889.6,229.9 L890.0,230.5 L894.4,236.7 L897.8,237.5 L900.9,243.6 L902.3,245.6 L908.4,246.7 L907.8,250.0 L905.3,251.6 L907.2,254.3 L902.8,257.1 L896.1,257.0 L887.6,258.5 L885.2,257.4 L881.9,259.9 L877.3,259.3 L873.8,261.3 L871.1,260.3 L878.5,254.7 L882.9,253.6 L882.9,253.6 L875.1,252.7 L873.7,250.6 L878.9,249.0 L876.1,246.1 L877.1,242.7 L884.5,243.1 L884.5,243.1 L885.3,240.1 L881.9,236.8 L881.8,236.8 L875.8,235.8 L874.6,234.4 L876.4,232.0 L874.8,230.6 L872.1,233.1 L871.8,228.0 L869.3,225.3 L871.1,219.8 L875.0,215.6 L878.9,216.0 L885.0,215.5 Z"},
  {id:"ireland", name:"Ireland", area:10, lx:861.4, ly:242.5, borders:["uk"], d:"M869.0,240.7 L869.8,244.5 L866.1,249.2 L857.2,252.3 L850.1,251.5 L854.2,246.0 L851.6,240.6 L858.4,236.5 L862.1,234.0 L863.2,236.9 L862.1,239.7 L865.2,239.6 L869.0,240.7 Z"},
  {id:"portugal", name:"Portugal", area:10, lx:859.8, ly:315.1, borders:["spain"], d:"M854.8,304.0 L856.6,302.6 L858.7,301.9 L859.9,304.4 L862.9,304.4 L863.7,303.8 L866.7,303.9 L868.1,306.6 L865.7,308.0 L865.7,312.1 L864.9,312.9 L864.7,315.4 L862.5,315.8 L864.5,319.0 L863.1,322.5 L864.9,324.0 L864.2,325.5 L862.3,327.5 L862.7,329.2 L860.7,330.6 L858.1,329.8 L855.5,330.4 L856.3,326.3 L855.8,323.0 L853.6,322.6 L852.4,320.6 L852.8,317.1 L854.8,315.2 L855.1,313.0 L856.2,309.9 L856.0,307.6 L855.0,305.7 L854.8,304.0 Z"},
  {id:"spain", name:"Spain", area:28, lx:877.6, ly:312.5, borders:["portugal", "france", "andorra", "morocco"], d:"M854.8,304.0 L855.1,300.2 L853.0,297.9 L860.1,294.1 L866.2,295.1 L872.9,295.0 L878.3,295.9 L882.4,295.6 L890.5,295.8 L892.5,297.9 L901.7,300.3 L903.5,299.1 L909.1,301.5 L914.9,300.8 L915.2,303.9 L910.5,307.4 L904.1,308.5 L903.6,310.3 L900.5,313.2 L898.6,317.5 L900.6,320.5 L897.7,322.9 L896.6,326.3 L892.8,327.4 L889.3,331.4 L882.9,331.5 L878.2,331.4 L875.0,333.3 L873.1,335.3 L870.7,334.8 L868.8,333.1 L867.4,330.0 L862.7,329.2 L862.3,327.5 L864.2,325.5 L864.9,324.0 L863.1,322.5 L864.5,319.0 L862.5,315.8 L864.7,315.4 L864.9,312.9 L865.7,312.1 L865.7,308.0 L868.1,306.6 L866.7,303.9 L863.7,303.8 L862.9,304.4 L859.9,304.4 L858.7,301.9 L856.6,302.6 L854.8,304.0 Z"},
  {id:"france", name:"France", area:22, lx:916.2, ly:276.8, borders:["spain", "andorra", "monaco", "italy", "switzerland", "germany", "luxembourg", "belgium", "uk"], d:"M947.8,302.5 L946.1,306.6 L943.9,305.5 L942.7,302.0 L943.7,300.0 L947.0,298.0 L947.8,302.5 Z M917.9,259.1 L921.4,261.6 L924.0,261.2 L928.4,263.6 L929.5,264.1 L930.9,263.9 L933.3,265.3 L940.5,266.3 L938.0,269.9 L937.3,273.7 L936.0,274.6 L933.7,274.1 L933.8,275.4 L930.2,278.4 L930.1,280.8 L932.5,280.0 L934.2,282.3 L934.0,283.8 L935.5,285.7 L933.7,287.3 L935.0,291.4 L937.7,292.1 L937.2,294.4 L932.6,297.4 L922.8,295.9 L915.5,297.7 L914.9,300.8 L909.1,301.5 L903.5,299.1 L901.7,300.3 L892.5,297.9 L890.5,295.8 L893.1,292.7 L894.0,282.1 L888.9,276.6 L885.2,273.9 L877.5,271.9 L877.0,268.1 L883.5,266.9 L891.9,268.3 L890.3,262.3 L895.1,264.6 L906.7,260.4 L908.2,256.1 L912.6,255.0 L913.3,256.9 L915.6,257.0 L917.9,259.1 Z"},
  {id:"germany", name:"Germany", area:18, lx:953.1, ly:255.5, borders:["france", "belgium", "netherlands", "denmark", "poland", "czechia", "austria", "switzerland"], d:"M949.6,234.8 L949.7,236.9 L954.8,238.1 L954.7,240.0 L959.8,239.0 L962.6,237.5 L968.2,239.6 L970.6,241.3 L971.8,244.0 L970.4,245.4 L972.2,247.3 L973.4,250.1 L973.0,251.9 L975.1,255.3 L972.9,255.8 L971.5,255.2 L970.3,256.2 L966.7,257.2 L964.8,258.6 L961.2,259.7 L962.1,261.3 L962.6,263.5 L965.2,264.8 L968.0,267.0 L966.2,269.5 L964.4,270.1 L965.1,273.6 L964.7,274.5 L963.1,273.4 L960.7,273.2 L957.1,274.2 L952.7,274.0 L952.0,275.3 L949.5,273.9 L948.0,274.2 L942.6,272.6 L941.6,273.7 L937.3,273.7 L938.0,269.9 L940.5,266.3 L933.3,265.3 L930.9,263.9 L931.2,261.6 L930.2,260.4 L930.8,256.9 L929.9,251.3 L932.9,251.3 L934.2,249.3 L935.5,244.5 L934.5,242.7 L935.5,241.6 L939.7,241.3 L940.6,242.5 L944.0,239.9 L942.9,237.9 L942.6,234.9 L946.4,235.6 L949.6,234.8 Z"},
  {id:"poland", name:"Poland", area:18, lx:996.4, ly:252.2, borders:["germany", "russia", "belarus", "ukraine", "czechia", "slovakia"], d:"M975.1,255.3 L973.0,251.9 L973.4,250.1 L972.2,247.3 L970.4,245.4 L971.8,244.0 L970.6,241.3 L974.0,239.7 L981.8,237.3 L988.1,235.5 L993.1,236.4 L993.5,237.7 L998.3,237.8 L1004.5,238.4 L1013.7,238.3 L1016.2,238.8 L1017.4,240.5 L1017.6,242.8 L1019.0,244.8 L1019.0,246.9 L1016.0,248.0 L1017.5,250.4 L1017.6,252.8 L1020.1,257.4 L1019.6,258.9 L1017.1,259.5 L1012.6,263.9 L1013.9,266.2 L1012.8,265.9 L1008.0,263.9 L1004.4,264.7 L1002.1,264.1 L999.1,265.2 L996.6,263.4 L994.5,264.1 L994.3,263.8 L992.0,261.2 L988.2,260.9 L987.8,259.2 L984.3,258.6 L983.6,260.0 L980.9,258.9 L981.2,257.4 L977.5,257.0 L975.1,255.3 Z"},
  {id:"czechia", name:"Czechia", area:10, lx:979.5, ly:262.7, borders:["germany", "poland", "austria", "slovakia"], d:"M984.8,268.5 L982.5,267.5 L980.1,267.8 L976.3,266.2 L974.5,266.6 L971.7,268.7 L968.0,267.0 L965.2,264.8 L962.6,263.5 L962.1,261.3 L961.2,259.7 L964.8,258.6 L966.7,257.2 L970.3,256.2 L971.5,255.2 L972.9,255.8 L975.1,255.3 L977.5,257.0 L981.2,257.4 L980.9,258.9 L983.6,260.0 L984.3,258.6 L987.8,259.2 L988.2,260.9 L992.0,261.2 L994.3,263.8 L992.8,263.8 L992.0,264.7 L990.9,265.0 L990.5,266.2 L989.6,266.4 L989.4,266.9 L987.7,267.4 L985.5,267.4 L984.8,268.5 Z"},
  {id:"austria", name:"Austria", area:10, lx:967.4, ly:273.5, borders:["germany", "czechia", "slovakia", "hungary", "slovenia", "italy", "switzerland"], d:"M984.9,271.0 L984.5,273.2 L981.7,273.2 L982.7,274.3 L981.0,277.7 L980.1,278.6 L975.7,278.7 L973.2,279.9 L969.0,279.5 L961.9,278.2 L960.8,276.3 L955.8,277.3 L955.2,278.3 L952.2,277.5 L949.7,277.4 L947.4,276.4 L948.2,275.1 L948.0,274.2 L949.5,273.9 L952.0,275.3 L952.7,274.0 L957.1,274.2 L960.7,273.2 L963.1,273.4 L964.7,274.5 L965.1,273.6 L964.4,270.1 L966.2,269.5 L968.0,267.0 L971.7,268.7 L974.5,266.6 L976.3,266.2 L980.1,267.8 L982.5,267.5 L984.8,268.5 L984.4,269.2 L984.9,271.0 Z"},
  {id:"switzerland", name:"Switzerland", area:8, lx:941.5, ly:278.0, borders:["france", "germany", "austria", "italy"], d:"M948.0,274.2 L948.2,275.1 L947.4,276.4 L949.7,277.4 L952.2,277.5 L951.8,279.7 L949.6,280.6 L945.9,279.9 L944.8,282.0 L942.4,282.2 L941.6,281.4 L938.8,283.1 L936.4,283.4 L934.2,282.3 L932.5,280.0 L930.1,280.8 L930.2,278.4 L933.8,275.4 L933.7,274.1 L936.0,274.6 L937.3,273.7 L941.6,273.7 L942.6,272.6 L948.0,274.2 Z"},
  {id:"italy", name:"Italy", area:20, lx:963.3, ly:297.6, borders:["france", "switzerland", "austria", "slovenia"], d:"M977.6,323.2 L975.8,327.4 L976.5,329.0 L975.5,331.7 L971.7,329.7 L969.1,329.2 L962.2,326.5 L962.9,323.8 L968.7,324.3 L973.8,323.7 L977.6,323.2 Z M946.1,307.5 L949.0,311.2 L948.3,318.2 L946.1,317.9 L944.0,319.7 L942.1,318.3 L941.9,311.9 L940.8,308.9 L943.5,309.1 L946.1,307.5 Z M961.9,278.2 L969.0,279.5 L968.5,282.1 L969.7,284.4 L965.7,283.6 L961.6,285.5 L961.9,288.1 L961.3,289.6 L962.9,292.3 L967.6,295.0 L970.1,299.3 L975.7,303.6 L979.6,303.5 L980.8,304.7 L979.4,305.8 L983.9,307.7 L987.6,309.3 L991.9,312.0 L992.4,313.0 L991.5,314.9 L988.7,312.4 L984.3,311.6 L982.2,315.0 L985.9,316.9 L985.3,319.7 L983.2,320.0 L980.5,324.5 L978.4,324.9 L978.4,323.3 L979.5,320.5 L980.5,319.4 L978.6,316.3 L977.1,313.6 L975.0,313.0 L973.5,310.7 L970.3,309.7 L968.1,307.6 L964.4,307.3 L960.5,304.9 L956.0,301.5 L952.6,298.4 L951.0,293.2 L948.5,292.6 L944.4,290.8 L942.1,291.6 L939.3,294.0 L937.2,294.4 L937.7,292.1 L935.0,291.4 L933.7,287.3 L935.5,285.7 L934.0,283.8 L934.2,282.3 L936.4,283.4 L938.8,283.1 L941.6,281.4 L942.4,282.2 L944.8,282.0 L945.9,279.9 L949.6,280.6 L951.8,279.7 L952.2,277.5 L955.2,278.3 L955.8,277.3 L960.8,276.3 L961.9,278.2 Z"},
  {id:"greece", name:"Greece", area:12, lx:1016.1, ly:314.9, borders:["albania", "north_macedonia", "bulgaria", "turkey"], d:"M1018.5,336.6 L1021.2,338.3 L1025.1,338.0 L1028.8,338.4 L1028.7,339.3 L1031.5,338.7 L1030.8,340.3 L1023.6,340.7 L1023.7,339.8 L1017.6,338.8 L1018.5,336.6 Z M1033.0,305.6 L1031.5,308.9 L1030.3,309.5 L1027.2,309.4 L1024.6,308.9 L1018.6,310.3 L1022.0,313.2 L1019.5,314.1 L1016.7,314.1 L1014.1,311.4 L1013.1,312.5 L1014.2,315.7 L1016.8,318.2 L1014.9,319.3 L1017.7,321.8 L1020.1,323.3 L1020.2,326.3 L1015.6,324.9 L1017.0,327.6 L1013.9,328.1 L1015.8,332.8 L1012.5,332.8 L1008.4,330.5 L1006.5,326.3 L1005.6,322.8 L1003.7,320.4 L1001.1,317.4 L1000.8,315.9 L1003.1,313.3 L1003.4,311.6 L1005.0,310.8 L1005.1,309.4 L1008.4,309.0 L1010.3,307.8 L1013.0,307.9 L1013.8,307.0 L1014.8,306.8 L1018.5,307.0 L1022.5,305.5 L1026.0,307.4 L1030.5,306.9 L1030.6,304.2 L1033.0,305.6 Z"},
  {id:"romania", name:"Romania", area:16, lx:1025.3, ly:282.7, bonus:{"troops": 1, "label": "+1 Tanks/min"}, borders:["ukraine", "moldova", "bulgaria", "serbia", "hungary"], d:"M1013.6,272.3 L1015.7,271.2 L1018.8,271.7 L1022.0,271.8 L1024.3,273.1 L1026.0,272.2 L1029.7,271.7 L1031.0,270.5 L1033.1,270.5 L1034.6,271.0 L1036.2,272.6 L1037.8,274.8 L1040.6,277.9 L1040.8,280.3 L1040.3,282.5 L1041.2,284.9 L1043.4,285.9 L1045.7,285.0 L1048.0,286.0 L1048.1,287.3 L1045.7,288.4 L1044.2,288.0 L1042.8,294.3 L1039.9,293.8 L1036.2,291.8 L1030.3,293.1 L1027.8,294.4 L1020.5,294.1 L1016.7,293.3 L1014.7,293.7 L1013.3,291.5 L1012.4,290.6 L1013.5,289.7 L1012.3,289.1 L1010.7,290.3 L1007.8,288.7 L1007.4,286.5 L1004.4,285.3 L1003.8,283.6 L1001.1,281.5 L1005.1,280.6 L1008.1,277.0 L1010.5,273.4 L1013.6,272.3 Z"},
  {id:"ukraine", name:"Ukraine", area:28, lx:1053.3, ly:269.2, borders:["russia", "belarus", "poland", "slovakia", "hungary", "romania", "moldova"], d:"M1058.9,250.0 L1060.8,250.2 L1062.1,249.0 L1063.6,249.3 L1068.8,248.8 L1072.0,251.8 L1070.7,252.8 L1071.1,254.5 L1075.1,254.7 L1076.9,257.0 L1076.8,258.1 L1083.1,259.9 L1087.0,259.1 L1090.1,261.6 L1093.0,261.5 L1100.3,263.2 L1100.4,264.8 L1098.4,267.5 L1099.5,270.4 L1098.7,272.2 L1093.9,272.6 L1091.3,274.1 L1091.1,276.4 L1087.1,276.8 L1083.8,278.5 L1079.1,278.8 L1074.8,280.8 L1075.1,284.1 L1077.6,285.3 L1082.6,285.0 L1081.7,286.9 L1076.2,287.8 L1069.4,290.9 L1066.6,289.8 L1067.7,287.3 L1062.3,285.8 L1063.2,284.8 L1067.9,283.0 L1066.5,281.8 L1058.7,280.5 L1058.4,278.5 L1053.7,279.1 L1051.9,282.1 L1048.0,286.0 L1045.7,285.0 L1043.4,285.9 L1041.2,284.9 L1042.4,284.3 L1043.3,282.5 L1044.7,280.9 L1044.3,279.9 L1045.4,279.5 L1045.9,280.2 L1048.8,280.4 L1050.1,280.0 L1049.2,279.4 L1049.5,278.7 L1047.8,277.3 L1047.1,275.1 L1045.3,274.3 L1045.6,272.5 L1043.4,271.0 L1041.3,270.8 L1037.6,269.2 L1034.3,269.7 L1033.1,270.5 L1031.0,270.5 L1029.7,271.7 L1026.0,272.2 L1024.3,273.1 L1022.0,271.8 L1018.8,271.7 L1015.7,271.2 L1013.6,272.3 L1013.2,270.9 L1010.4,269.4 L1011.4,267.3 L1012.8,265.9 L1013.9,266.2 L1012.6,263.9 L1017.1,259.5 L1019.6,258.9 L1020.1,257.4 L1017.6,252.8 L1020.0,252.6 L1022.8,251.1 L1026.6,251.0 L1031.7,251.4 L1037.3,252.7 L1041.2,252.8 L1043.1,253.6 L1045.0,252.7 L1046.3,253.9 L1050.8,253.6 L1052.8,254.1 L1053.1,251.5 L1054.6,250.3 L1058.9,250.0 Z"},
  {id:"belarus", name:"Belarus", area:14, lx:1040.6, ly:243.6, borders:["russia", "ukraine", "poland", "latvia", "lithuania"], d:"M1017.4,240.5 L1022.3,240.5 L1027.7,238.5 L1028.8,235.5 L1032.9,233.8 L1032.5,231.5 L1035.5,230.6 L1040.9,228.6 L1046.1,229.9 L1046.9,231.2 L1049.5,230.6 L1054.4,231.8 L1054.9,234.3 L1053.8,235.7 L1056.9,239.2 L1059.0,240.1 L1058.7,241.1 L1062.0,242.0 L1063.5,243.4 L1061.5,244.6 L1057.5,244.4 L1056.5,244.9 L1057.7,246.6 L1058.9,250.0 L1054.6,250.3 L1053.1,251.5 L1052.8,254.1 L1050.8,253.6 L1046.3,253.9 L1045.0,252.7 L1043.1,253.6 L1041.2,252.8 L1037.3,252.7 L1031.7,251.4 L1026.6,251.0 L1022.8,251.1 L1020.0,252.6 L1017.6,252.8 L1017.5,250.4 L1016.0,248.0 L1019.0,246.9 L1019.0,244.8 L1017.6,242.8 L1017.4,240.5 Z"},
  {id:"turkey", name:"Turkey", area:32, lx:1083.0, ly:321.9, borders:["greece", "bulgaria", "georgia", "armenia", "iran", "iraq", "syria"], d:"M1084.6,306.8 L1091.7,308.9 L1097.6,308.1 L1101.9,308.5 L1107.8,305.8 L1113.1,305.5 L1117.9,308.1 L1118.8,310.0 L1118.3,312.6 L1122.0,313.9 L1124.0,315.4 L1120.5,316.9 L1122.1,323.0 L1121.1,324.6 L1123.9,328.8 L1121.5,329.7 L1119.7,328.4 L1113.9,327.7 L1111.7,328.5 L1106.1,329.3 L1103.4,329.2 L1097.6,331.2 L1093.5,331.2 L1090.8,330.2 L1085.3,331.7 L1083.7,330.7 L1083.4,333.6 L1082.1,334.8 L1080.7,335.9 L1078.9,333.5 L1080.8,331.6 L1077.8,332.0 L1073.6,330.8 L1070.1,333.8 L1062.5,334.4 L1058.5,331.6 L1053.1,331.4 L1052.0,333.6 L1048.5,334.2 L1043.7,331.4 L1038.2,331.5 L1035.2,326.3 L1031.6,323.3 L1034.0,319.2 L1030.9,316.7 L1036.4,311.7 L1044.1,311.5 L1046.2,307.5 L1055.7,308.1 L1061.7,304.7 L1067.6,303.2 L1075.8,303.1 L1084.6,306.8 Z M1036.0,310.2 L1031.8,313.1 L1030.2,310.6 L1030.3,309.5 L1031.5,308.9 L1033.0,305.6 L1030.6,304.2 L1035.7,302.6 L1040.0,303.3 L1040.6,305.3 L1044.9,307.0 L1044.0,308.3 L1038.1,308.6 L1036.0,310.2 Z"},
  {id:"bulgaria", name:"Bulgaria", area:10, lx:1023.4, ly:298.6, borders:["romania", "serbia", "north_macedonia", "greece", "turkey"], d:"M1013.3,291.5 L1014.7,293.7 L1016.7,293.3 L1020.5,294.1 L1027.8,294.4 L1030.3,293.1 L1036.2,291.8 L1039.9,293.8 L1042.8,294.3 L1040.2,296.5 L1038.4,300.3 L1040.0,303.3 L1035.7,302.6 L1030.6,304.2 L1030.5,306.9 L1026.0,307.4 L1022.5,305.5 L1018.5,307.0 L1014.8,306.8 L1014.4,303.3 L1011.9,301.6 L1012.7,300.9 L1012.2,300.3 L1013.0,298.6 L1014.9,296.9 L1012.5,294.7 L1012.1,292.7 L1013.3,291.5 Z"},
  {id:"hungary", name:"Hungary", area:10, lx:995.3, ly:274.8, borders:["austria", "slovakia", "ukraine", "romania", "serbia", "croatia", "slovenia"], d:"M981.0,277.7 L982.7,274.3 L981.7,273.2 L984.5,273.2 L984.9,271.0 L987.4,272.4 L989.3,272.9 L993.5,272.3 L993.9,271.2 L995.9,271.1 L998.3,270.3 L998.8,270.6 L1001.2,269.9 L1002.4,268.7 L1004.0,268.4 L1009.4,270.0 L1010.4,269.4 L1013.2,270.9 L1013.6,272.3 L1010.5,273.4 L1008.1,277.0 L1005.1,280.6 L1001.1,281.5 L998.0,281.3 L994.1,282.7 L992.3,283.5 L988.2,282.5 L984.4,280.2 L982.8,279.6 L981.9,277.8 L981.0,277.7 Z"},
  {id:"morocco", name:"Morocco", area:22, lx:852.7, ly:373.2, borders:["spain", "algeria", "mauritania", "western_sahara"], d:"M874.0,336.3 L877.0,338.5 L881.8,338.2 L887.0,339.3 L889.2,339.4 L891.0,342.8 L891.3,346.0 L893.1,351.6 L894.4,352.7 L893.5,354.7 L886.9,355.6 L884.7,357.6 L881.8,358.0 L881.5,361.9 L875.7,364.0 L873.8,366.7 L869.7,368.1 L864.7,368.9 L856.6,372.8 L856.7,379.0 L855.9,379.0 L855.9,379.0 L856.0,381.9 L852.9,382.0 L851.3,383.2 L849.1,383.2 L847.2,382.5 L843.0,383.1 L841.4,387.2 L839.8,387.6 L837.5,394.3 L830.5,400.0 L828.9,407.3 L826.8,409.6 L826.2,411.5 L815.0,411.9 L814.9,411.9 L815.1,409.5 L817.1,408.1 L818.7,405.3 L818.4,403.5 L820.1,399.8 L822.9,396.4 L824.6,395.6 L825.9,392.5 L826.0,389.7 L827.8,386.4 L831.1,384.5 L834.3,379.1 L834.4,379.0 L836.9,377.0 L841.6,376.4 L845.5,372.8 L848.0,371.4 L852.2,367.0 L850.9,360.5 L852.8,355.9 L853.5,353.1 L856.7,349.6 L861.7,347.2 L865.4,345.0 L868.8,339.5 L870.4,336.3 L874.0,336.3 Z"},
  {id:"algeria", name:"Algeria", area:55, lx:916.7, ly:368.8, borders:["morocco", "tunisia", "libya", "niger", "mali", "mauritania"], d:"M960.0,401.1 L942.9,411.2 L928.4,421.5 L921.3,423.9 L915.8,424.4 L915.7,421.1 L913.4,420.2 L910.3,418.7 L909.1,416.2 L892.2,404.7 L875.4,393.2 L856.6,380.4 L856.7,379.4 L856.7,379.0 L856.6,372.8 L864.7,368.9 L869.7,368.1 L873.8,366.7 L875.7,364.0 L881.5,361.9 L881.8,358.0 L884.7,357.6 L886.9,355.6 L893.5,354.7 L894.4,352.7 L893.1,351.6 L891.3,346.0 L891.0,342.8 L889.2,339.4 L894.0,336.5 L899.4,335.6 L902.5,333.4 L907.3,331.8 L915.8,330.9 L924.1,330.4 L926.6,331.2 L931.3,329.1 L936.7,329.1 L938.7,330.3 L942.1,330.0 L941.1,332.7 L941.9,337.7 L940.7,342.1 L937.6,345.0 L938.1,349.0 L942.2,352.2 L942.2,353.4 L945.3,355.6 L947.4,365.0 L949.0,369.7 L949.3,372.2 L948.4,376.5 L948.8,378.9 L948.1,381.8 L948.6,385.1 L946.6,387.3 L949.6,391.1 L949.7,393.4 L951.5,396.3 L953.9,395.4 L957.8,397.8 L960.0,401.1 Z"},
  {id:"libya", name:"Libya", area:45, lx:982.3, ly:374.6, borders:["algeria", "tunisia", "egypt", "niger", "chad"], d:"M974.3,404.3 L970.7,406.3 L967.9,403.4 L960.0,401.1 L957.8,397.8 L953.9,395.4 L951.5,396.3 L949.7,393.4 L949.6,391.1 L946.6,387.3 L948.6,385.1 L948.1,381.8 L948.8,378.9 L948.4,376.5 L949.3,372.2 L949.0,369.7 L947.4,365.0 L949.9,363.8 L950.3,361.6 L949.8,359.4 L953.2,357.4 L954.7,355.7 L957.2,354.2 L957.4,350.1 L963.3,351.9 L965.4,351.5 L969.6,352.4 L976.2,354.7 L978.6,359.4 L983.1,360.4 L990.1,362.6 L995.4,365.3 L997.9,363.9 L1000.3,361.5 L999.1,357.4 L1000.7,354.9 L1004.3,352.4 L1007.7,351.7 L1014.5,352.7 L1016.2,355.1 L1018.0,355.1 L1019.6,356.0 L1024.6,356.6 L1025.8,358.4 L1024.0,360.9 L1024.8,363.2 L1023.5,366.4 L1025.0,370.7 L1025.0,389.5 L1025.0,408.9 L1025.0,419.4 L1019.2,419.4 L1019.2,421.7 L999.2,411.6 L979.3,401.4 L974.3,404.3 Z"},
  {id:"egypt", name:"Egypt", area:40, lx:1057.6, ly:375.9, borders:["libya", "israel", "jordan", "saudi"], d:"M1074.6,369.3 L1073.2,371.4 L1072.1,375.4 L1070.8,378.2 L1069.6,379.1 L1067.9,377.4 L1065.7,375.0 L1062.1,367.5 L1061.6,367.9 L1063.7,373.5 L1066.7,378.8 L1070.5,387.0 L1072.4,389.9 L1074.0,392.9 L1078.5,398.7 L1077.5,399.6 L1077.6,403.1 L1083.5,407.8 L1084.3,408.9 L1064.5,408.9 L1045.1,408.9 L1025.0,408.9 L1025.0,389.5 L1025.0,370.7 L1023.5,366.4 L1024.8,363.2 L1024.0,360.9 L1025.8,358.4 L1032.5,358.3 L1037.3,359.7 L1042.3,361.3 L1044.6,362.1 L1048.4,360.4 L1050.5,358.9 L1054.9,358.5 L1058.4,359.1 L1059.8,361.7 L1061.0,360.0 L1065.0,361.3 L1068.9,361.6 L1071.3,360.2 L1074.6,369.3 Z"},
  {id:"mauritania", name:"Mauritania", area:30, lx:838.5, ly:426.5, borders:["morocco", "algeria", "mali", "senegal"], d:"M839.1,447.9 L835.8,444.2 L832.8,440.3 L829.5,438.9 L827.1,437.4 L824.3,437.5 L821.9,438.6 L819.4,438.2 L817.7,439.8 L817.3,437.0 L818.6,434.4 L819.3,429.4 L818.7,424.2 L818.1,421.6 L818.6,419.0 L817.3,416.4 L814.7,414.2 L815.8,412.4 L835.4,412.4 L834.4,404.8 L835.6,402.1 L840.3,401.6 L840.2,388.1 L856.6,388.4 L856.6,380.4 L875.4,393.2 L867.7,393.3 L870.1,416.1 L872.6,438.8 L873.4,439.5 L872.3,443.2 L852.2,443.3 L851.5,444.4 L849.6,444.1 L846.7,445.1 L843.3,443.7 L841.7,443.8 L840.8,446.9 L839.1,447.9 Z"},
  {id:"mali", name:"Mali", area:35, lx:870.9, ly:450.5, borders:["mauritania", "algeria", "niger", "burkina", "ivory_coast", "guinea", "senegal"], d:"M839.1,447.9 L840.8,446.9 L841.7,443.8 L843.3,443.7 L846.7,445.1 L849.6,444.1 L851.5,444.4 L852.2,443.3 L872.3,443.2 L873.4,439.5 L872.6,438.8 L870.1,416.1 L867.7,393.3 L875.4,393.2 L892.2,404.7 L909.1,416.2 L910.3,418.7 L913.4,420.2 L915.7,421.1 L915.8,424.4 L921.3,423.9 L921.4,436.1 L918.6,439.6 L918.2,442.8 L913.7,443.7 L906.9,444.1 L905.1,446.0 L901.9,446.2 L898.7,446.2 L897.4,445.2 L894.7,446.0 L890.0,448.2 L889.0,449.8 L885.2,452.2 L884.5,453.5 L882.4,454.6 L880.0,453.9 L878.6,455.2 L877.9,458.8 L873.9,463.2 L874.0,465.0 L872.6,467.2 L873.0,470.3 L870.9,471.0 L869.7,471.7 L869.0,469.5 L867.5,470.1 L866.7,469.9 L865.7,471.5 L861.9,471.4 L860.5,470.7 L859.9,471.1 L858.3,469.6 L858.6,468.0 L858.0,467.4 L856.9,467.9 L857.1,466.2 L858.1,464.9 L856.1,462.7 L855.5,461.2 L854.4,460.0 L853.4,459.9 L852.2,460.6 L850.5,461.3 L849.2,462.5 L847.0,462.1 L845.6,460.7 L844.8,460.6 L843.5,461.3 L842.7,461.3 L842.4,459.3 L842.7,457.7 L842.2,455.6 L840.4,454.2 L839.4,451.1 L839.1,447.9 Z"},
  {id:"niger", name:"Niger", area:32, lx:942.6, ly:444.3, borders:["algeria", "libya", "chad", "nigeria", "benin", "burkina", "mali"], d:"M910.8,462.0 L910.9,458.4 L905.1,457.2 L905.0,454.6 L902.1,451.2 L901.5,448.8 L901.9,446.2 L905.1,446.0 L906.9,444.1 L913.7,443.7 L918.2,442.8 L918.6,439.6 L921.4,436.1 L921.3,423.9 L928.4,421.5 L942.9,411.2 L960.0,401.1 L967.9,403.4 L970.7,406.3 L974.3,404.3 L975.5,412.5 L977.4,413.9 L977.4,415.6 L979.5,417.4 L978.4,419.7 L976.5,430.4 L976.2,437.2 L969.9,442.2 L967.7,449.2 L969.8,451.1 L969.8,454.5 L973.0,454.6 L972.5,457.1 L971.1,457.4 L970.9,459.1 L970.0,459.2 L966.6,453.5 L965.4,453.2 L961.5,456.2 L957.6,454.7 L954.9,454.3 L953.5,455.1 L950.6,454.9 L947.6,457.2 L945.1,457.3 L939.0,454.6 L936.7,455.9 L934.1,455.8 L932.2,453.8 L927.2,451.8 L921.8,452.4 L920.5,453.6 L919.8,456.6 L918.4,458.7 L918.1,463.5 L914.2,460.4 L912.5,460.4 L910.8,462.0 Z"},
  {id:"chad", name:"Chad", area:35, lx:989.2, ly:457.0, borders:["libya", "niger", "nigeria", "cameroon", "car", "sudan"], d:"M972.5,457.1 L973.0,454.6 L969.8,454.5 L969.8,451.1 L967.7,449.2 L969.9,442.2 L976.2,437.2 L976.5,430.4 L978.4,419.7 L979.5,417.4 L977.4,415.6 L977.4,413.9 L975.5,412.5 L974.3,404.3 L979.3,401.4 L999.2,411.6 L1019.2,421.7 L1019.4,442.6 L1015.1,442.2 L1012.8,446.1 L1011.5,449.4 L1012.6,450.6 L1010.9,452.2 L1011.5,454.4 L1010.2,456.6 L1009.7,458.6 L1011.4,458.3 L1012.5,460.3 L1012.5,463.4 L1014.4,464.9 L1014.3,466.2 L1011.2,467.1 L1008.6,469.2 L1005.0,475.0 L1000.3,477.4 L995.5,477.1 L994.1,477.6 L994.6,479.4 L991.9,481.3 L989.8,483.4 L983.5,485.4 L982.3,484.2 L981.5,484.1 L980.5,485.4 L976.4,485.8 L977.2,484.4 L975.6,480.8 L974.9,478.6 L972.7,477.7 L969.8,474.6 L970.9,472.1 L973.1,472.6 L974.5,472.3 L977.3,472.3 L974.6,467.5 L974.8,464.0 L974.5,460.5 L972.5,457.1 Z"},
  {id:"sudan", name:"Sudan", area:45, lx:1047.3, ly:456.7, borders:["egypt", "libya", "chad", "car", "s_sudan", "ethiopia", "eritrea"], d:"M1069.8,475.0 L1069.1,474.9 L1069.2,472.3 L1068.6,470.5 L1066.0,468.4 L1065.4,464.6 L1066.0,460.7 L1063.7,460.4 L1063.4,461.5 L1060.4,461.8 L1061.6,463.3 L1062.0,466.5 L1059.3,469.4 L1056.8,473.2 L1054.2,473.8 L1050.0,470.7 L1048.1,471.8 L1047.6,473.3 L1045.0,474.3 L1044.8,475.4 L1039.9,475.4 L1039.2,474.3 L1035.6,474.1 L1033.8,475.0 L1032.4,474.6 L1029.8,471.5 L1029.0,470.1 L1025.3,470.8 L1024.0,473.2 L1022.7,477.9 L1021.0,478.9 L1019.4,479.5 L1019.0,479.3 L1017.3,477.7 L1017.0,476.1 L1017.8,473.9 L1017.8,471.8 L1014.9,468.5 L1014.3,466.2 L1014.4,464.9 L1012.5,463.4 L1012.5,460.3 L1011.4,458.3 L1009.7,458.6 L1010.2,456.6 L1011.5,454.4 L1010.9,452.2 L1012.6,450.6 L1011.5,449.4 L1012.8,446.1 L1015.1,442.2 L1019.4,442.6 L1019.2,421.7 L1019.2,419.4 L1025.0,419.4 L1025.0,408.9 L1045.1,408.9 L1064.5,408.9 L1084.3,408.9 L1085.9,414.1 L1084.8,415.0 L1085.6,420.5 L1087.4,426.8 L1089.3,428.1 L1092.1,430.0 L1089.5,433.0 L1085.8,433.9 L1084.3,435.5 L1083.8,439.0 L1081.6,446.8 L1082.1,448.9 L1081.4,453.4 L1079.3,458.6 L1076.3,461.2 L1074.2,465.3 L1073.7,467.4 L1071.3,468.9 L1069.8,474.4 L1069.8,475.0 Z"},
  {id:"s_sudan", name:"S. Sudan", area:25, lx:1050.7, ly:482.2, borders:["sudan", "ethiopia", "kenya", "uganda", "drc", "car"], d:"M1069.8,475.0 L1069.9,479.2 L1069.1,480.8 L1066.5,480.9 L1064.8,483.9 L1067.8,484.3 L1070.4,486.9 L1071.3,489.0 L1073.5,490.2 L1076.5,495.9 L1073.1,499.4 L1070.0,502.6 L1066.9,505.0 L1063.4,505.0 L1059.4,506.2 L1056.2,505.0 L1054.2,506.5 L1049.8,503.0 L1048.6,500.7 L1045.8,501.8 L1043.5,501.5 L1042.1,502.4 L1039.9,501.7 L1036.9,497.4 L1036.1,495.7 L1032.3,493.6 L1031.1,490.4 L1029.0,488.2 L1025.6,485.4 L1025.6,483.7 L1022.8,481.6 L1019.4,479.5 L1021.0,478.9 L1022.7,477.9 L1024.0,473.2 L1025.3,470.8 L1029.0,470.1 L1029.8,471.5 L1032.4,474.6 L1033.8,475.0 L1035.6,474.1 L1039.2,474.3 L1039.9,475.4 L1044.8,475.4 L1045.0,474.3 L1047.6,473.3 L1048.1,471.8 L1050.0,470.7 L1054.2,473.8 L1056.8,473.2 L1059.3,469.4 L1062.0,466.5 L1061.6,463.3 L1060.4,461.8 L1063.4,461.5 L1063.7,460.4 L1066.0,460.7 L1065.4,464.6 L1066.0,468.4 L1068.6,470.5 L1069.2,472.3 L1069.1,474.9 L1069.8,475.0 Z"},
  {id:"ethiopia", name:"Ethiopia", area:38, lx:1095.2, ly:477.0, borders:["sudan", "s_sudan", "kenya", "somalia", "djibouti", "eritrea"], d:"M1089.5,446.0 L1092.6,448.4 L1095.5,447.2 L1096.7,448.3 L1100.1,448.4 L1104.5,450.5 L1105.8,452.3 L1108.0,454.0 L1110.0,457.1 L1111.8,458.8 L1110.0,461.1 L1108.3,463.6 L1108.7,465.1 L1108.8,466.7 L1111.6,466.8 L1112.8,466.4 L1113.9,467.3 L1112.8,469.2 L1114.6,472.1 L1116.5,474.6 L1118.4,476.5 L1134.7,482.8 L1138.9,482.8 L1124.8,498.6 L1118.3,498.8 L1113.8,502.6 L1110.6,502.7 L1109.3,504.3 L1105.9,504.3 L1103.8,502.5 L1099.3,504.7 L1097.8,506.9 L1094.5,506.5 L1093.4,505.9 L1092.2,506.1 L1090.6,506.0 L1084.3,501.5 L1080.8,501.5 L1079.1,499.8 L1079.1,496.8 L1076.5,495.9 L1073.5,490.2 L1071.3,489.0 L1070.4,486.9 L1067.8,484.3 L1064.8,483.9 L1066.5,480.9 L1069.1,480.8 L1069.9,479.2 L1069.8,474.4 L1071.3,468.9 L1073.7,467.4 L1074.2,465.3 L1076.3,461.2 L1079.3,458.6 L1081.4,453.4 L1082.1,448.9 L1088.0,450.0 L1089.5,446.0 Z"},
  {id:"somalia", name:"Somalia", area:25, lx:1135.3, ly:489.2, borders:["ethiopia", "kenya", "djibouti"], d:"M1148.6,463.9 L1151.3,463.4 L1153.7,461.6 L1155.6,461.5 L1155.7,463.0 L1155.2,466.1 L1155.2,468.8 L1154.2,470.7 L1152.8,476.5 L1150.4,482.3 L1147.3,489.1 L1143.0,496.8 L1138.7,502.7 L1132.8,509.9 L1127.8,514.2 L1120.3,519.4 L1115.7,523.5 L1110.2,529.9 L1109.1,532.6 L1107.9,533.9 L1105.0,529.5 L1104.9,510.3 L1109.3,504.3 L1110.6,502.7 L1113.8,502.6 L1118.3,498.8 L1124.8,498.6 L1138.9,482.8 L1142.4,478.4 L1144.7,475.1 L1144.7,472.4 L1144.7,467.0 L1144.7,464.9 L1144.7,464.8 L1146.3,464.7 L1148.6,463.9 Z"},
  {id:"kenya", name:"Kenya", area:22, lx:1089.4, ly:518.6, borders:["ethiopia", "s_sudan", "uganda", "tanzania", "somalia"], d:"M1105.0,529.5 L1107.9,533.9 L1104.4,536.0 L1103.2,538.2 L1101.3,538.6 L1100.6,542.3 L1099.0,544.4 L1098.0,547.9 L1096.0,549.7 L1088.8,544.4 L1088.5,541.3 L1070.4,530.6 L1069.5,530.0 L1069.5,524.4 L1070.9,522.3 L1073.4,518.8 L1075.2,514.9 L1073.0,508.9 L1072.4,506.2 L1070.0,502.6 L1073.1,499.4 L1076.5,495.9 L1079.1,496.8 L1079.1,499.8 L1080.8,501.5 L1084.3,501.5 L1090.6,506.0 L1092.2,506.1 L1093.4,505.9 L1094.5,506.5 L1097.8,506.9 L1099.3,504.7 L1103.8,502.5 L1105.9,504.3 L1109.3,504.3 L1104.9,510.3 L1105.0,529.5 Z"},
  {id:"tanzania", name:"Tanzania", area:30, lx:1071.7, ly:559.4, borders:["kenya", "uganda", "rwanda", "burundi", "drc", "zambia", "malawi", "mozambique"], d:"M1069.5,530.0 L1070.4,530.6 L1088.5,541.3 L1088.8,544.4 L1096.0,549.7 L1093.7,556.2 L1094.0,559.2 L1097.2,561.1 L1097.3,562.5 L1096.0,565.7 L1096.3,567.3 L1095.9,569.8 L1097.7,573.1 L1099.7,578.3 L1101.6,579.5 L1097.6,582.5 L1092.1,584.6 L1089.1,584.5 L1087.4,586.1 L1083.9,586.2 L1082.6,586.9 L1076.6,585.4 L1072.8,585.8 L1071.4,578.6 L1069.7,576.2 L1068.7,574.7 L1063.8,573.7 L1061.0,572.1 L1057.8,571.2 L1055.8,570.4 L1053.7,569.0 L1051.0,562.4 L1048.1,559.4 L1047.1,556.3 L1047.6,553.6 L1046.7,548.7 L1048.8,548.5 L1050.6,546.6 L1052.5,543.8 L1053.8,542.7 L1053.7,541.0 L1052.6,539.8 L1052.3,537.7 L1053.8,537.1 L1054.1,534.0 L1052.1,531.0 L1053.8,530.4 L1059.3,530.4 L1069.5,530.0 Z"},
  {id:"drc", name:"D.R. Congo", area:65, lx:1015.1, ly:544.9, bonus:{"stone": 1, "label": "+1 stone/min"}, borders:["car", "s_sudan", "uganda", "rwanda", "burundi", "tanzania", "zambia", "angola", "congo"], d:"M1054.2,506.5 L1053.9,512.7 L1055.9,513.4 L1054.3,515.2 L1052.3,516.6 L1050.4,519.4 L1049.4,521.8 L1049.1,526.1 L1047.9,528.1 L1047.9,532.1 L1046.5,533.6 L1046.3,536.7 L1045.6,537.1 L1045.1,540.0 L1046.4,542.4 L1046.7,548.7 L1047.6,553.6 L1047.1,556.3 L1048.1,559.4 L1051.0,562.4 L1053.7,569.0 L1051.7,568.5 L1045.0,569.4 L1043.7,570.0 L1042.2,573.4 L1043.4,575.7 L1042.5,581.9 L1041.9,587.2 L1043.2,588.2 L1046.7,590.2 L1048.1,589.3 L1048.5,595.0 L1044.7,594.9 L1042.6,592.0 L1040.8,589.8 L1036.9,589.0 L1035.8,586.3 L1032.8,587.9 L1028.8,587.2 L1027.1,584.8 L1023.9,584.3 L1021.6,584.4 L1021.3,582.8 L1019.6,582.7 L1017.3,582.4 L1014.2,583.1 L1012.0,583.0 L1010.8,583.5 L1011.0,577.2 L1009.4,575.3 L1009.0,572.0 L1009.7,568.8 L1008.7,566.8 L1008.6,563.5 L1002.6,563.5 L1003.0,561.6 L1000.5,561.6 L1000.2,562.6 L997.1,562.8 L995.8,565.8 L995.1,567.2 L992.3,566.4 L990.7,567.2 L987.4,567.6 L985.4,564.8 L984.3,563.1 L982.9,560.0 L981.6,556.0 L966.9,556.0 L965.1,556.6 L963.7,556.5 L961.6,557.2 L960.9,555.6 L962.2,555.0 L962.3,552.7 L963.2,551.3 L965.0,550.2 L966.3,550.8 L968.0,548.8 L970.7,548.8 L971.0,550.3 L972.9,551.2 L975.9,547.9 L978.8,545.3 L980.0,543.7 L979.9,539.3 L982.0,534.2 L984.3,531.5 L987.6,528.9 L988.2,527.2 L988.3,525.3 L989.1,523.5 L988.9,520.5 L989.5,515.8 L990.5,512.5 L992.0,509.7 L992.3,506.5 L992.7,502.8 L994.7,500.1 L997.3,498.4 L1001.5,500.2 L1004.6,502.2 L1008.3,502.7 L1012.0,503.7 L1013.5,500.5 L1014.2,500.1 L1016.5,500.7 L1022.1,498.0 L1024.0,499.2 L1025.6,499.0 L1026.4,497.7 L1028.3,497.3 L1032.0,497.8 L1035.2,497.9 L1036.9,497.4 L1039.9,501.7 L1042.1,502.4 L1043.5,501.5 L1045.8,501.8 L1048.6,500.7 L1049.8,503.0 L1054.2,506.5 Z"},
  {id:"angola", name:"Angola", area:38, lx:987.2, ly:582.7, borders:["drc", "congo", "zambia", "namibia", "botswana"], d:"M981.6,556.0 L982.9,560.0 L984.3,563.1 L985.4,564.8 L987.4,567.6 L990.7,567.2 L992.3,566.4 L995.1,567.2 L995.8,565.8 L997.1,562.8 L1000.2,562.6 L1000.5,561.6 L1003.0,561.6 L1002.6,563.5 L1008.6,563.5 L1008.7,566.8 L1009.7,568.8 L1009.0,572.0 L1009.4,575.3 L1011.0,577.2 L1010.8,583.5 L1012.0,583.0 L1014.2,583.1 L1017.3,582.4 L1019.6,582.7 L1020.1,584.3 L1019.5,586.9 L1020.4,589.3 L1019.7,591.3 L1020.1,593.1 L1009.7,593.1 L1009.4,609.9 L1012.8,614.2 L1016.1,617.5 L1006.9,619.6 L994.8,618.9 L991.3,616.4 L971.0,616.6 L970.3,617.0 L967.3,614.6 L964.1,614.4 L961.1,615.3 L958.7,616.3 L958.2,613.0 L958.9,608.4 L960.6,603.5 L960.9,601.3 L962.5,596.5 L963.7,594.3 L966.6,590.9 L968.2,588.5 L968.7,584.6 L968.4,581.6 L966.9,579.7 L965.6,576.5 L964.4,573.4 L964.6,572.3 L966.2,570.2 L964.7,565.1 L963.6,561.6 L961.1,558.2 L961.6,557.2 L963.7,556.5 L965.1,556.6 L966.9,556.0 L981.6,556.0 Z M962.2,555.0 L960.9,555.6 L959.6,551.6 L961.6,549.3 L963.1,548.4 L965.0,550.2 L963.2,551.3 L962.3,552.7 L962.2,555.0 Z"},
  {id:"zambia", name:"Zambia", area:28, lx:1040.1, ly:592.8, borders:["drc", "tanzania", "malawi", "mozambique", "zimbabwe", "botswana", "namibia", "angola"], d:"M1063.8,573.7 L1066.2,576.1 L1067.4,580.6 L1066.6,582.0 L1065.6,586.3 L1066.5,590.6 L1065.0,592.5 L1063.4,597.4 L1066.1,598.7 L1050.9,603.1 L1051.4,606.8 L1047.6,607.6 L1044.7,609.7 L1044.1,611.5 L1042.3,611.9 L1038.0,616.3 L1035.2,619.7 L1033.5,619.8 L1031.9,619.2 L1026.3,618.6 L1025.4,618.2 L1025.4,617.8 L1023.4,616.6 L1020.2,616.3 L1016.1,617.5 L1012.8,614.2 L1009.4,609.9 L1009.7,593.1 L1020.1,593.1 L1019.7,591.3 L1020.4,589.3 L1019.5,586.9 L1020.1,584.3 L1019.6,582.7 L1021.3,582.8 L1021.6,584.4 L1023.9,584.3 L1027.1,584.8 L1028.8,587.2 L1032.8,587.9 L1035.8,586.3 L1036.9,589.0 L1040.8,589.8 L1042.6,592.0 L1044.7,594.9 L1048.5,595.0 L1048.1,589.3 L1046.7,590.2 L1043.2,588.2 L1041.9,587.2 L1042.5,581.9 L1043.4,575.7 L1042.2,573.4 L1043.7,570.0 L1045.0,569.4 L1051.7,568.5 L1053.7,569.0 L1055.8,570.4 L1057.8,571.2 L1061.0,572.1 L1063.8,573.7 Z"},
  {id:"zimbabwe", name:"Zimbabwe", area:18, lx:1048.3, ly:624.6, borders:["zambia", "mozambique", "south_africa", "botswana"], d:"M1056.0,642.4 L1053.3,641.9 L1051.6,642.5 L1049.2,641.7 L1047.2,641.6 L1044.0,639.2 L1040.1,638.4 L1038.6,635.1 L1038.6,633.2 L1036.5,632.6 L1030.8,626.8 L1029.3,623.8 L1028.2,622.8 L1026.3,618.6 L1031.9,619.2 L1033.5,619.8 L1035.2,619.7 L1038.0,616.3 L1042.3,611.9 L1044.1,611.5 L1044.7,609.7 L1047.6,607.6 L1051.4,606.8 L1051.7,608.8 L1055.9,608.7 L1058.2,609.8 L1059.3,611.1 L1061.6,611.5 L1064.2,613.2 L1064.2,619.9 L1063.3,623.5 L1063.1,627.5 L1063.9,629.1 L1063.3,632.2 L1062.5,632.6 L1061.2,636.4 L1056.0,642.4 Z"},
  {id:"botswana", name:"Botswana", area:22, lx:1021.9, ly:643.2, borders:["namibia", "zambia", "zimbabwe", "south_africa"], d:"M1028.2,622.8 L1029.3,623.8 L1030.8,626.8 L1036.5,632.6 L1038.6,633.2 L1038.6,635.1 L1040.1,638.4 L1044.0,639.2 L1047.2,641.6 L1040.1,645.5 L1035.6,649.4 L1033.9,652.9 L1032.4,654.9 L1029.7,655.3 L1028.8,657.9 L1028.3,659.5 L1025.1,660.7 L1021.1,660.5 L1018.7,659.0 L1016.6,658.4 L1014.1,659.6 L1012.9,662.1 L1010.5,663.7 L1008.0,666.1 L1004.4,666.6 L1003.3,664.7 L1003.8,661.5 L1000.8,656.5 L999.5,655.7 L999.5,640.3 L1004.4,640.1 L1004.6,621.3 L1008.3,621.2 L1016.0,619.3 L1017.9,621.5 L1021.1,619.4 L1022.6,619.4 L1025.4,618.2 L1026.3,618.6 L1028.2,622.8 Z"},
  {id:"namibia", name:"Namibia", area:28, lx:989.2, ly:639.3, borders:["angola", "zambia", "botswana", "south_africa"], d:"M981.7,675.8 L978.0,671.8 L976.1,668.0 L974.9,662.8 L973.7,659.0 L972.0,650.9 L971.9,644.6 L971.3,641.7 L969.3,639.5 L966.8,635.2 L964.1,628.8 L963.0,625.5 L959.0,620.4 L958.7,616.3 L961.1,615.3 L964.1,614.4 L967.3,614.6 L970.3,617.0 L971.0,616.6 L991.3,616.4 L994.8,618.9 L1006.9,619.6 L1016.1,617.5 L1020.2,616.3 L1023.4,616.6 L1025.4,617.8 L1025.4,618.2 L1022.6,619.4 L1021.1,619.4 L1017.9,621.5 L1016.0,619.3 L1008.3,621.2 L1004.6,621.3 L1004.4,640.1 L999.5,640.3 L999.5,655.7 L999.5,675.2 L995.0,677.9 L992.3,678.3 L989.2,677.3 L986.9,676.9 L986.1,674.7 L984.1,673.2 L981.7,675.8 Z"},
  {id:"south_africa", name:"S.Africa", area:38, lx:1024.5, ly:676.0, bonus:{"gold": 1, "label": "+1 gold/min"}, borders:["namibia", "botswana", "zimbabwe", "mozambique", "eswatini", "lesotho"], d:"M1057.6,679.4 L1056.6,680.2 L1054.5,682.9 L1053.1,685.6 L1050.3,689.4 L1044.6,694.8 L1041.1,698.0 L1037.3,700.4 L1032.1,702.4 L1029.5,702.7 L1028.9,704.2 L1025.9,703.4 L1023.4,704.4 L1018.0,703.4 L1014.9,704.0 L1012.9,703.7 L1007.7,705.8 L1003.4,706.6 L1000.4,708.6 L998.1,708.8 L996.0,706.9 L994.3,706.8 L992.1,704.4 L991.9,705.2 L991.2,703.7 L991.3,700.7 L989.6,697.1 L991.2,696.2 L991.1,692.1 L987.8,687.2 L985.3,682.7 L985.3,682.7 L981.7,675.8 L984.1,673.2 L986.1,674.7 L986.9,676.9 L989.2,677.3 L992.3,678.3 L995.0,677.9 L999.5,675.2 L999.5,655.7 L1000.8,656.5 L1003.8,661.5 L1003.3,664.7 L1004.4,666.6 L1008.0,666.1 L1010.5,663.7 L1012.9,662.1 L1014.1,659.6 L1016.6,658.4 L1018.7,659.0 L1021.1,660.5 L1025.1,660.7 L1028.3,659.5 L1028.8,657.9 L1029.7,655.3 L1032.4,654.9 L1033.9,652.9 L1035.6,649.4 L1040.1,645.5 L1047.2,641.6 L1049.2,641.7 L1051.6,642.5 L1053.3,641.9 L1056.0,642.4 L1058.4,649.9 L1059.7,653.6 L1058.8,659.5 L1059.2,661.4 L1056.7,660.4 L1055.2,660.8 L1054.7,662.3 L1053.4,664.3 L1053.4,666.1 L1056.4,669.0 L1059.3,668.4 L1060.4,666.1 L1064.2,666.1 L1062.9,670.0 L1062.3,674.4 L1061.0,676.7 L1057.6,679.4 Z"},
  {id:"mozambique", name:"Mozambique", area:28, lx:1074.3, ly:619.5, borders:["tanzania", "malawi", "zambia", "zimbabwe", "south_africa", "eswatini"], d:"M1072.8,585.8 L1076.6,585.4 L1082.6,586.9 L1083.9,586.2 L1087.4,586.1 L1089.1,584.5 L1092.1,584.6 L1097.6,582.5 L1101.6,579.5 L1102.4,581.8 L1102.2,587.1 L1102.8,591.7 L1103.0,600.0 L1103.9,602.5 L1102.4,606.3 L1100.4,610.0 L1097.3,613.2 L1092.7,615.3 L1087.1,617.8 L1081.4,623.5 L1079.5,624.4 L1076.0,628.2 L1073.9,629.4 L1073.5,633.2 L1075.9,637.2 L1076.9,640.3 L1076.9,641.9 L1077.8,641.6 L1077.7,646.8 L1076.9,649.2 L1078.0,650.1 L1077.3,652.3 L1075.2,654.2 L1071.1,656.0 L1065.1,658.8 L1062.9,660.8 L1063.3,663.0 L1064.6,663.4 L1064.2,666.1 L1060.4,666.1 L1059.9,663.8 L1059.2,661.4 L1058.8,659.5 L1059.7,653.6 L1058.4,649.9 L1056.0,642.4 L1061.2,636.4 L1062.5,632.6 L1063.3,632.2 L1063.9,629.1 L1063.1,627.5 L1063.3,623.5 L1064.2,619.9 L1064.2,613.2 L1061.6,611.5 L1059.3,611.1 L1058.2,609.8 L1055.9,608.7 L1051.7,608.8 L1051.4,606.8 L1050.9,603.1 L1066.1,598.7 L1068.9,601.3 L1070.3,600.8 L1072.3,602.1 L1072.6,604.2 L1071.5,606.7 L1071.9,610.4 L1075.2,613.7 L1076.7,610.0 L1078.9,608.9 L1078.4,602.1 L1076.3,598.3 L1074.5,596.6 L1072.8,596.7 L1071.4,589.8 L1072.8,585.8 Z"},
  {id:"madagascar", name:"Madagascar", area:20, lx:1134.9, ly:619.8, borders:["mozambique"], d:"M1147.7,590.8 L1149.0,593.1 L1150.3,596.5 L1151.1,602.9 L1152.4,605.4 L1151.9,607.9 L1151.0,609.4 L1149.3,606.4 L1148.4,607.9 L1149.3,611.8 L1148.9,614.1 L1147.5,615.3 L1147.2,619.8 L1145.2,625.9 L1142.7,633.2 L1139.7,643.2 L1137.7,650.5 L1135.5,656.6 L1131.4,657.9 L1127.0,660.1 L1124.2,658.8 L1120.2,656.9 L1118.8,654.1 L1118.5,649.4 L1116.7,645.2 L1116.3,641.4 L1117.2,637.6 L1119.5,636.7 L1119.5,634.9 L1121.9,630.9 L1122.3,627.6 L1121.2,625.1 L1120.2,621.7 L1119.8,616.9 L1121.6,613.9 L1122.2,610.6 L1124.7,610.4 L1127.5,609.3 L1129.4,608.4 L1131.6,608.3 L1134.4,605.3 L1138.5,602.0 L1140.0,599.4 L1139.3,597.1 L1141.5,597.7 L1144.2,594.1 L1144.3,590.9 L1146.0,588.5 L1147.7,590.8 Z"},
  {id:"nigeria", name:"Nigeria", area:32, lx:942.2, ly:473.8, borders:["niger", "chad", "cameroon", "benin"], d:"M942.5,499.8 L937.3,501.7 L935.4,501.4 L933.5,502.6 L929.5,502.5 L926.8,499.2 L925.2,495.4 L921.6,491.9 L917.9,492.0 L913.5,492.0 L913.7,483.5 L913.6,480.1 L914.6,476.8 L916.1,475.2 L918.5,471.9 L918.0,470.5 L919.0,468.3 L917.9,465.2 L918.1,463.5 L918.4,458.7 L919.8,456.6 L920.5,453.6 L921.8,452.4 L927.2,451.8 L932.2,453.8 L934.1,455.8 L936.7,455.9 L939.0,454.6 L945.1,457.3 L947.6,457.2 L950.6,454.9 L953.5,455.1 L954.9,454.3 L957.6,454.7 L961.5,456.2 L965.4,453.2 L966.6,453.5 L970.0,459.2 L970.9,459.1 L972.9,461.2 L972.3,462.2 L972.1,463.9 L967.9,468.0 L966.5,471.4 L965.8,474.1 L964.8,475.3 L963.8,479.0 L961.1,481.2 L960.3,483.8 L959.2,486.0 L958.7,488.2 L955.3,489.9 L952.5,487.8 L950.6,487.9 L947.6,490.9 L946.2,491.0 L943.8,496.1 L942.5,499.8 Z"},
  {id:"cameroon", name:"Cameroon", area:18, lx:965.7, ly:489.5, borders:["nigeria", "chad", "car", "congo", "gabon", "equatorial_guinea"], d:"M965.4,513.0 L964.8,512.7 L961.8,513.4 L958.8,512.7 L956.4,513.1 L948.2,512.9 L949.0,508.8 L947.0,505.3 L944.7,504.4 L943.7,502.0 L942.4,501.3 L942.5,499.8 L943.8,496.1 L946.2,491.0 L947.6,490.9 L950.6,487.9 L952.5,487.8 L955.3,489.9 L958.7,488.2 L959.2,486.0 L960.3,483.8 L961.1,481.2 L963.8,479.0 L964.8,475.3 L965.8,474.1 L966.5,471.4 L967.9,468.0 L972.1,463.9 L972.3,462.2 L972.9,461.2 L970.9,459.1 L971.1,457.4 L972.5,457.1 L974.5,460.5 L974.8,464.0 L974.6,467.5 L977.3,472.3 L974.5,472.3 L973.1,472.6 L970.9,472.1 L969.8,474.6 L972.7,477.7 L974.9,478.6 L975.6,480.8 L977.2,484.4 L976.4,485.8 L973.9,491.2 L972.7,492.1 L972.3,496.2 L972.8,498.4 L972.4,500.0 L974.8,502.8 L975.2,504.7 L977.0,507.4 L979.3,509.1 L979.5,511.5 L980.1,513.0 L979.7,515.9 L975.7,514.6 L971.7,513.2 L965.4,513.0 Z"},
  {id:"senegal", name:"Senegal", area:10, lx:827.0, ly:451.8, borders:["mauritania", "mali", "guinea", "gambia"], d:"M816.4,453.2 L814.4,449.1 L811.9,447.3 L814.1,446.3 L816.5,442.6 L817.7,439.8 L819.4,438.2 L821.9,438.6 L824.3,437.5 L827.1,437.4 L829.5,438.9 L832.8,440.3 L835.8,444.2 L839.1,447.9 L839.4,451.1 L840.4,454.2 L842.2,455.6 L842.7,457.7 L842.4,459.3 L841.7,459.6 L839.0,459.2 L838.6,459.8 L837.5,459.9 L833.9,458.6 L831.5,458.6 L822.3,458.4 L820.9,458.9 L819.3,458.8 L816.6,459.6 L815.8,455.6 L820.3,455.7 L821.5,455.0 L822.4,454.9 L824.3,453.7 L826.4,454.8 L828.6,454.9 L830.8,453.7 L829.8,452.2 L828.1,453.1 L826.6,453.1 L824.6,451.8 L823.0,451.8 L821.9,453.1 L816.4,453.2 Z"},
  {id:"guinea", name:"Guinea", area:12, lx:845.5, ly:470.4, borders:["senegal", "mali", "ivory_coast", "liberia", "sierra_leone"], d:"M857.8,484.4 L856.4,484.3 L855.4,486.4 L854.0,486.4 L853.0,485.3 L853.3,483.2 L851.2,479.9 L849.9,480.5 L848.8,480.6 L847.5,480.9 L847.5,479.0 L846.7,477.6 L846.9,476.1 L845.8,473.9 L844.4,472.0 L840.4,472.0 L839.2,473.0 L837.9,473.1 L837.0,474.2 L836.4,475.7 L833.8,478.0 L831.6,474.9 L829.6,472.8 L828.3,472.1 L827.1,471.1 L826.5,468.8 L825.8,467.6 L824.3,466.7 L826.6,464.2 L828.1,464.3 L829.4,463.4 L830.5,463.4 L831.3,462.7 L830.9,460.9 L831.4,460.4 L831.5,458.6 L833.9,458.6 L837.5,459.9 L838.6,459.8 L839.0,459.2 L841.7,459.6 L842.4,459.3 L842.7,461.3 L843.5,461.3 L844.8,460.6 L845.6,460.7 L847.0,462.1 L849.2,462.5 L850.5,461.3 L852.2,460.6 L853.4,459.9 L854.4,460.0 L855.5,461.2 L856.1,462.7 L858.1,464.9 L857.1,466.2 L856.9,467.9 L858.0,467.4 L858.6,468.0 L858.3,469.6 L859.9,471.1 L858.9,471.5 L858.5,473.3 L859.6,475.5 L860.8,479.7 L859.0,480.4 L858.5,481.1 L858.9,482.1 L858.6,484.4 L857.8,484.4 Z"},
  {id:"saudi", name:"Saudi Arabia", area:55, lx:1118.5, ly:399.0, bonus:{"gold": 1, "label": "+1 gold/min"}, borders:["jordan", "iraq", "kuwait", "qatar", "uae", "oman", "yemen", "egypt"], d:"M1113.9,438.7 L1113.2,436.5 L1111.7,434.9 L1111.4,432.8 L1108.8,430.9 L1106.1,426.5 L1104.7,422.2 L1101.2,418.5 L1099.0,417.7 L1095.7,412.6 L1095.1,409.0 L1095.3,405.8 L1092.5,400.0 L1090.1,397.9 L1087.4,396.8 L1085.8,393.8 L1086.0,392.6 L1084.7,389.9 L1083.2,388.7 L1081.2,384.8 L1078.2,380.5 L1075.7,376.9 L1073.2,376.9 L1073.9,374.0 L1074.2,372.2 L1074.8,370.1 L1080.3,370.9 L1082.5,369.3 L1083.7,367.4 L1087.5,366.6 L1088.3,364.9 L1090.0,364.0 L1085.0,358.7 L1095.0,356.1 L1096.0,355.3 L1102.0,356.7 L1109.4,360.4 L1123.5,371.0 L1132.8,371.4 L1137.3,371.9 L1138.5,374.4 L1142.1,374.3 L1144.0,378.9 L1146.5,380.1 L1147.4,381.9 L1150.8,384.1 L1151.1,386.3 L1150.6,388.1 L1151.2,389.8 L1152.6,391.3 L1153.3,393.1 L1154.1,394.3 L1155.6,395.4 L1156.9,395.0 L1157.9,397.0 L1158.1,398.3 L1160.0,403.6 L1175.0,406.3 L1176.0,405.2 L1178.3,408.9 L1175.0,419.4 L1160.0,424.7 L1145.6,426.7 L1140.9,429.1 L1137.3,434.7 L1135.0,435.5 L1133.7,433.8 L1131.8,434.0 L1127.0,433.5 L1126.1,433.0 L1120.3,433.1 L1119.0,433.6 L1116.9,432.2 L1115.6,434.8 L1116.1,437.0 L1113.9,438.7 Z"},
  {id:"iraq", name:"Iraq", area:22, lx:1123.0, ly:347.8, bonus:{"oil": 2, "label": "+2 oil/min"}, borders:["turkey", "syria", "jordan", "saudi", "kuwait", "iran"], d:"M1127.1,335.1 L1130.4,336.7 L1130.8,339.8 L1128.2,341.6 L1127.1,345.7 L1130.5,350.7 L1136.7,353.6 L1139.2,357.6 L1138.4,361.5 L1140.0,361.5 L1140.1,364.3 L1142.8,367.1 L1139.9,366.8 L1136.5,366.4 L1132.8,371.4 L1123.5,371.0 L1109.4,360.4 L1102.0,356.7 L1096.0,355.3 L1094.0,348.8 L1105.0,343.3 L1106.9,337.0 L1106.4,333.1 L1109.2,331.8 L1111.7,328.5 L1113.9,327.7 L1119.7,328.4 L1121.5,329.7 L1123.9,328.8 L1127.1,335.1 Z"},
  {id:"iran", name:"Iran", area:45, lx:1167.1, ly:348.7, bonus:{"oil": 1, "label": "+1 oil/min"}, borders:["turkey", "iraq", "kuwait", "pakistan", "afghanistan", "turkmenistan", "azerbaijan", "armenia"], d:"M1169.6,328.7 L1174.0,327.7 L1177.6,324.6 L1180.9,324.8 L1183.1,323.8 L1186.7,324.3 L1192.2,327.0 L1196.2,327.5 L1201.9,332.2 L1205.6,332.4 L1206.1,336.8 L1204.0,343.4 L1202.6,347.3 L1204.8,348.0 L1202.7,350.9 L1204.3,355.1 L1204.7,358.5 L1208.5,359.4 L1208.9,362.8 L1204.4,367.6 L1206.8,370.3 L1208.9,373.5 L1213.6,375.9 L1213.8,380.5 L1216.2,381.4 L1216.6,383.8 L1209.4,386.5 L1207.5,392.6 L1198.1,391.0 L1192.6,389.8 L1187.0,389.2 L1184.9,382.7 L1182.5,381.7 L1178.6,382.7 L1173.6,385.2 L1167.5,383.5 L1162.4,379.4 L1157.6,377.9 L1154.3,372.9 L1150.6,365.9 L1147.9,366.7 L1144.7,365.0 L1142.8,367.1 L1140.1,364.3 L1140.0,361.5 L1138.4,361.5 L1139.2,357.6 L1136.7,353.6 L1130.5,350.7 L1127.1,345.7 L1128.2,341.6 L1130.8,339.8 L1130.4,336.7 L1127.1,335.1 L1123.9,328.8 L1121.1,324.6 L1122.1,323.0 L1120.5,316.9 L1124.0,315.4 L1124.8,317.4 L1127.3,319.8 L1130.7,320.5 L1132.5,320.4 L1138.4,316.5 L1140.3,316.1 L1141.8,317.6 L1140.1,320.3 L1143.2,323.0 L1144.4,322.8 L1146.0,326.6 L1150.7,327.7 L1154.2,330.4 L1161.3,331.3 L1169.1,329.9 L1169.6,328.7 Z"},
  {id:"syria", name:"Syria", area:14, lx:1090.3, ly:339.4, borders:["turkey", "iraq", "jordan", "israel", "lebanon"], d:"M1094.0,348.8 L1084.2,354.5 L1078.6,352.4 L1078.5,352.3 L1079.2,351.5 L1079.1,349.4 L1080.3,346.5 L1083.1,344.5 L1082.2,342.4 L1080.0,342.2 L1079.5,338.1 L1080.7,335.9 L1082.1,334.8 L1083.4,333.6 L1083.7,330.7 L1085.3,331.7 L1090.8,330.2 L1093.5,331.2 L1097.6,331.2 L1103.4,329.2 L1106.1,329.3 L1111.7,328.5 L1109.2,331.8 L1106.4,333.1 L1106.9,337.0 L1105.0,343.3 L1094.0,348.8 Z"},
  {id:"jordan", name:"Jordan", area:10, lx:1083.3, ly:360.7, borders:["syria", "iraq", "saudi", "israel", "egypt"], d:"M1077.7,354.0 L1078.6,352.4 L1084.2,354.5 L1094.0,348.8 L1096.0,355.3 L1095.0,356.1 L1085.0,358.7 L1090.0,364.0 L1088.3,364.9 L1087.5,366.6 L1083.7,367.4 L1082.5,369.3 L1080.3,370.9 L1074.8,370.1 L1074.6,369.3 L1077.1,360.9 L1077.0,358.8 L1077.7,357.3 L1077.7,354.0 Z"},
  {id:"israel", name:"Israel", area:6, lx:1076.0, ly:355.3, borders:["syria", "jordan", "egypt", "lebanon"], d:"M1078.6,352.4 L1077.7,354.0 L1075.9,353.3 L1074.9,356.8 L1076.1,357.4 L1074.9,358.1 L1074.6,359.5 L1077.0,358.8 L1077.1,360.9 L1074.6,369.3 L1071.3,360.2 L1072.8,358.5 L1072.4,358.2 L1073.8,355.7 L1074.8,351.7 L1075.5,350.4 L1075.6,350.4 L1077.3,350.4 L1077.8,349.4 L1079.1,349.4 L1079.2,351.5 L1078.5,352.3 L1078.6,352.4 Z"},
  {id:"yemen", name:"Yemen", area:20, lx:1132.5, ly:443.4, borders:["saudi", "oman"], d:"M1165.5,437.1 L1161.9,438.5 L1161.0,440.9 L1160.8,442.7 L1155.9,444.9 L1147.9,447.4 L1143.4,451.1 L1141.2,451.4 L1139.7,451.1 L1136.8,453.3 L1133.6,454.3 L1129.4,454.6 L1128.1,454.9 L1127.0,456.2 L1125.7,456.6 L1124.9,458.0 L1122.5,457.9 L1120.9,458.6 L1117.4,458.3 L1116.1,455.2 L1116.3,452.3 L1115.4,450.8 L1114.5,446.9 L1113.0,444.7 L1114.0,444.5 L1113.5,442.0 L1114.1,441.0 L1113.9,438.7 L1116.1,437.0 L1115.6,434.8 L1116.9,432.2 L1119.0,433.6 L1120.3,433.1 L1126.1,433.0 L1127.0,433.5 L1131.8,434.0 L1133.7,433.8 L1135.0,435.5 L1137.3,434.7 L1140.9,429.1 L1145.6,426.7 L1160.0,424.7 L1163.9,433.4 L1165.5,437.1 Z"},
  {id:"oman", name:"Oman", area:14, lx:1183.3, ly:415.1, borders:["saudi", "uae", "yemen"], d:"M1194.3,413.6 L1192.4,417.2 L1190.2,416.9 L1189.1,418.2 L1188.3,420.8 L1188.9,424.4 L1188.5,425.0 L1186.2,425.0 L1183.0,427.0 L1182.6,429.5 L1181.4,430.7 L1178.3,430.6 L1176.3,431.9 L1176.4,434.1 L1174.0,435.5 L1171.2,435.0 L1167.9,436.8 L1165.5,437.1 L1163.9,433.4 L1160.0,424.7 L1175.0,419.4 L1178.3,408.9 L1176.0,405.2 L1176.2,403.0 L1177.6,400.8 L1177.6,398.7 L1179.9,397.6 L1179.0,396.9 L1179.4,393.5 L1182.0,393.5 L1184.2,397.1 L1187.0,399.0 L1190.7,399.7 L1193.6,400.6 L1195.9,403.7 L1197.3,405.4 L1199.0,406.1 L1199.0,407.3 L1197.2,410.4 L1196.4,411.9 L1194.3,413.6 Z M1182.0,388.3 L1181.3,389.3 L1180.4,387.5 L1181.8,385.7 L1182.4,386.1 L1182.0,388.3 Z"},
  {id:"uae", name:"UAE", area:10, lx:1171.2, ly:397.3, borders:["saudi", "oman"], d:"M1157.9,397.0 L1158.8,396.8 L1159.0,398.2 L1162.9,397.4 L1167.0,397.5 L1170.0,397.7 L1173.5,394.1 L1177.2,390.7 L1180.4,387.5 L1181.3,389.3 L1182.0,393.5 L1179.4,393.5 L1179.0,396.9 L1179.9,397.6 L1177.6,398.7 L1177.6,400.8 L1176.2,403.0 L1176.0,405.2 L1175.0,406.3 L1160.0,403.6 L1158.1,398.3 L1157.9,397.0 Z"},
  {id:"afghanistan", name:"Afghanistan", area:25, lx:1238.5, ly:341.3, borders:["iran", "pakistan", "turkmenistan", "uzbekistan", "tajikistan", "china"], d:"M1206.1,336.8 L1211.2,338.8 L1214.9,338.1 L1216.0,335.8 L1219.9,335.0 L1222.7,333.4 L1223.7,329.1 L1227.9,328.1 L1228.7,326.2 L1231.1,327.6 L1232.6,327.8 L1235.4,327.8 L1239.1,329.0 L1240.7,329.6 L1244.3,327.9 L1246.0,328.9 L1247.6,326.5 L1250.6,326.6 L1251.4,325.8 L1251.9,323.7 L1254.0,321.9 L1256.7,323.1 L1256.2,324.7 L1257.7,324.9 L1257.2,329.4 L1259.2,331.1 L1261.0,330.0 L1263.2,329.5 L1266.3,327.1 L1269.7,327.5 L1274.9,327.5 L1275.8,329.0 L1272.9,329.6 L1270.3,330.6 L1264.6,331.2 L1259.2,332.3 L1256.3,334.6 L1257.5,336.8 L1258.1,339.5 L1255.6,341.7 L1255.8,343.7 L1254.4,345.6 L1249.7,345.4 L1251.6,348.9 L1248.4,350.3 L1246.3,353.5 L1246.6,356.6 L1244.6,358.1 L1242.8,357.6 L1239.0,358.3 L1238.4,359.8 L1234.7,359.8 L1231.9,362.8 L1231.7,367.3 L1225.2,369.5 L1221.8,369.0 L1220.7,370.1 L1217.8,369.5 L1212.7,370.3 L1204.4,367.6 L1208.9,362.8 L1208.5,359.4 L1204.7,358.5 L1204.3,355.1 L1202.7,350.9 L1204.8,348.0 L1202.6,347.3 L1204.0,343.4 L1206.1,336.8 Z"},
  {id:"pakistan", name:"Pakistan", area:30, lx:1247.0, ly:362.4, borders:["iran", "afghanistan", "china", "india"], d:"M1275.8,329.0 L1279.5,331.5 L1281.0,335.5 L1289.2,337.7 L1284.4,342.1 L1278.8,342.9 L1271.2,341.6 L1268.7,343.9 L1270.5,348.5 L1272.3,352.1 L1276.3,354.7 L1272.0,357.7 L1272.1,361.5 L1267.3,366.8 L1264.1,372.1 L1258.9,377.7 L1253.1,377.3 L1247.6,382.8 L1250.8,385.2 L1251.4,389.2 L1254.2,391.9 L1255.2,396.5 L1244.2,396.4 L1240.9,400.0 L1237.2,398.6 L1235.7,394.8 L1231.9,390.8 L1222.7,391.8 L1214.5,391.9 L1207.5,392.6 L1209.4,386.5 L1216.6,383.8 L1216.2,381.4 L1213.8,380.5 L1213.6,375.9 L1208.9,373.5 L1206.8,370.3 L1204.4,367.6 L1212.7,370.3 L1217.8,369.5 L1220.7,370.1 L1221.8,369.0 L1225.2,369.5 L1231.7,367.3 L1231.9,362.8 L1234.7,359.8 L1238.4,359.8 L1239.0,358.3 L1242.8,357.6 L1244.6,358.1 L1246.6,356.6 L1246.3,353.5 L1248.4,350.3 L1251.6,348.9 L1249.7,345.4 L1254.4,345.6 L1255.8,343.7 L1255.6,341.7 L1258.1,339.5 L1257.5,336.8 L1256.3,334.6 L1259.2,332.3 L1264.6,331.2 L1270.3,330.6 L1272.9,329.6 L1275.8,329.0 Z"},
  {id:"india", name:"India", area:95, lx:1317.2, ly:398.2, borders:["pakistan", "china", "nepal", "bhutan", "bangladesh", "myanmar"], d:"M1289.2,337.7 L1294.6,343.9 L1294.1,348.2 L1296.0,350.9 L1295.9,353.6 L1292.3,352.8 L1293.7,358.7 L1298.6,362.0 L1305.6,365.7 L1302.4,368.1 L1300.4,373.0 L1305.3,375.0 L1310.0,377.6 L1316.5,380.6 L1323.4,381.3 L1326.3,383.9 L1330.1,384.4 L1336.1,385.7 L1340.3,385.6 L1340.9,383.5 L1340.2,380.1 L1340.6,377.9 L1343.7,376.8 L1344.1,380.9 L1344.2,382.0 L1348.7,384.0 L1351.9,383.2 L1356.1,383.5 L1360.2,383.4 L1360.5,380.1 L1358.5,378.4 L1362.5,377.8 L1367.1,373.8 L1372.8,370.5 L1377.0,371.8 L1380.6,369.6 L1382.9,372.8 L1381.2,375.1 L1386.6,375.8 L1387.0,377.8 L1385.3,378.8 L1385.7,382.1 L1382.1,381.1 L1375.6,384.8 L1375.8,387.8 L1373.0,392.2 L1372.8,394.8 L1370.5,399.1 L1366.6,397.9 L1366.4,403.4 L1365.3,405.2 L1365.8,407.4 L1363.4,408.7 L1360.7,400.3 L1359.3,400.3 L1358.5,403.7 L1355.8,401.0 L1357.3,397.9 L1359.6,397.6 L1361.9,393.2 L1359.0,392.3 L1354.4,392.4 L1349.6,391.6 L1349.2,388.0 L1346.8,387.7 L1342.8,385.4 L1341.0,389.0 L1344.7,391.8 L1341.5,393.8 L1340.4,395.7 L1343.5,397.1 L1342.6,400.3 L1344.4,404.2 L1345.2,408.6 L1344.4,410.5 L1341.0,410.5 L1334.9,411.6 L1335.2,415.5 L1332.5,418.6 L1325.3,422.2 L1319.7,428.4 L1315.9,431.7 L1311.0,435.2 L1311.0,437.6 L1308.5,438.9 L1304.0,440.8 L1301.6,441.1 L1300.1,445.1 L1301.2,452.0 L1301.4,456.4 L1299.3,461.4 L1299.3,470.3 L1296.7,470.6 L1294.4,474.6 L1295.9,476.4 L1291.4,477.9 L1289.7,481.4 L1287.7,483.0 L1283.0,478.0 L1280.7,470.6 L1278.7,465.3 L1277.0,462.8 L1274.3,457.8 L1273.1,451.2 L1272.2,447.9 L1267.7,440.6 L1265.6,430.4 L1264.1,423.6 L1264.1,417.2 L1263.2,412.3 L1255.9,415.4 L1252.4,414.8 L1245.8,408.4 L1248.2,406.5 L1246.7,404.4 L1240.9,400.0 L1244.2,396.4 L1255.2,396.5 L1254.2,391.9 L1251.4,389.2 L1250.8,385.2 L1247.6,382.8 L1253.1,377.3 L1258.9,377.7 L1264.1,372.1 L1267.3,366.8 L1272.1,361.5 L1272.0,357.7 L1276.3,354.7 L1272.3,352.1 L1270.5,348.5 L1268.7,343.9 L1271.2,341.6 L1278.8,342.9 L1284.4,342.1 L1289.2,337.7 Z"},
  {id:"nepal", name:"Nepal", area:10, lx:1322.8, ly:376.1, borders:["india", "china"], d:"M1340.6,377.9 L1340.2,380.1 L1340.9,383.5 L1340.3,385.6 L1336.1,385.7 L1330.1,384.4 L1326.3,383.9 L1323.4,381.3 L1316.5,380.6 L1310.0,377.6 L1305.3,375.0 L1300.4,373.0 L1302.4,368.1 L1305.6,365.7 L1307.6,364.4 L1311.6,366.1 L1316.7,369.5 L1319.5,370.3 L1321.2,372.8 L1325.1,373.8 L1329.1,376.1 L1334.8,377.4 L1340.6,377.9 Z"},
  {id:"bangladesh", name:"Bangladesh", area:12, lx:1353.1, ly:401.5, borders:["india", "myanmar"], d:"M1363.4,408.7 L1363.3,412.5 L1361.5,411.7 L1361.8,415.9 L1360.4,413.2 L1360.1,410.5 L1359.2,407.9 L1357.1,404.9 L1352.5,404.6 L1352.9,406.8 L1351.4,409.8 L1349.2,408.7 L1348.5,409.6 L1347.1,409.1 L1345.2,408.6 L1344.4,404.2 L1342.6,400.3 L1343.5,397.1 L1340.4,395.7 L1341.5,393.8 L1344.7,391.8 L1341.0,389.0 L1342.8,385.4 L1346.8,387.7 L1349.2,388.0 L1349.6,391.6 L1354.4,392.4 L1359.0,392.3 L1361.9,393.2 L1359.6,397.6 L1357.3,397.9 L1355.8,401.0 L1358.5,403.7 L1359.3,400.3 L1360.7,400.3 L1363.4,408.7 Z"},
  {id:"myanmar", name:"Myanmar", area:22, lx:1385.7, ly:419.5, borders:["india", "bangladesh", "china", "laos", "thailand"], d:"M1397.7,418.5 L1394.8,420.7 L1391.3,421.0 L1389.0,426.7 L1386.9,427.6 L1389.3,432.3 L1392.5,436.1 L1394.5,439.6 L1392.7,444.2 L1391.0,445.2 L1392.2,447.8 L1395.5,452.0 L1396.1,455.0 L1396.0,457.4 L1397.9,462.2 L1395.2,467.2 L1392.8,472.6 L1392.3,468.7 L1393.8,464.6 L1392.1,461.5 L1392.5,455.7 L1390.5,453.0 L1388.9,446.7 L1388.0,440.0 L1385.8,435.7 L1382.5,438.3 L1376.8,442.1 L1374.0,441.6 L1370.9,440.4 L1372.7,433.8 L1371.6,428.9 L1367.7,422.8 L1368.3,420.9 L1365.4,420.2 L1361.8,415.9 L1361.5,411.7 L1363.3,412.5 L1363.4,408.7 L1365.8,407.4 L1365.3,405.2 L1366.4,403.4 L1366.6,397.9 L1370.5,399.1 L1372.8,394.8 L1373.0,392.2 L1375.8,387.8 L1375.6,384.8 L1382.1,381.1 L1385.7,382.1 L1385.3,378.8 L1387.0,377.8 L1386.6,375.8 L1389.6,375.4 L1391.2,378.6 L1393.4,379.8 L1393.6,383.9 L1393.4,388.2 L1388.6,392.6 L1388.0,398.9 L1393.3,398.0 L1394.5,402.9 L1397.7,403.9 L1396.2,408.3 L1399.9,410.2 L1402.1,411.2 L1405.8,409.7 L1405.9,411.9 L1401.6,415.3 L1400.6,417.2 L1397.7,418.5 Z"},
  {id:"thailand", name:"Thailand", area:20, lx:1403.1, ly:455.6, borders:["myanmar", "laos", "cambodia", "malaysia"], d:"M1412.9,460.7 L1408.4,458.3 L1404.2,458.4 L1404.9,454.2 L1400.5,454.2 L1400.1,460.0 L1397.4,467.8 L1395.8,472.4 L1396.1,476.2 L1399.4,476.4 L1401.4,481.2 L1402.3,485.8 L1405.1,488.8 L1408.1,489.4 L1410.7,492.2 L1409.1,494.3 L1405.8,495.0 L1405.4,492.3 L1401.3,489.9 L1400.4,490.9 L1398.5,488.9 L1397.6,486.2 L1394.9,483.3 L1392.5,480.8 L1391.7,483.9 L1390.8,480.9 L1391.3,477.6 L1392.8,472.6 L1395.2,467.2 L1397.9,462.2 L1396.0,457.4 L1396.1,455.0 L1395.5,452.0 L1392.2,447.8 L1391.0,445.2 L1392.7,444.2 L1394.5,439.6 L1392.5,436.1 L1389.3,432.3 L1386.9,427.6 L1389.0,426.7 L1391.3,421.0 L1394.8,420.7 L1397.7,418.5 L1400.6,417.2 L1402.7,418.9 L1403.0,422.0 L1406.4,422.3 L1405.2,427.8 L1405.3,432.6 L1410.6,429.4 L1412.1,430.4 L1415.0,430.2 L1416.0,428.4 L1419.8,428.7 L1423.6,433.0 L1423.9,438.2 L1427.9,442.8 L1427.7,447.3 L1426.1,449.7 L1421.4,448.9 L1414.9,449.9 L1411.7,454.3 L1412.9,460.7 Z"},
  {id:"laos", name:"Laos", area:12, lx:1418.2, ly:428.5, borders:["myanmar", "china", "vietnam", "cambodia", "thailand"], d:"M1426.1,449.7 L1427.7,447.3 L1427.9,442.8 L1423.9,438.2 L1423.6,433.0 L1419.8,428.7 L1416.0,428.4 L1415.0,430.2 L1412.1,430.4 L1410.6,429.4 L1405.3,432.6 L1405.2,427.8 L1406.4,422.3 L1403.0,422.0 L1402.7,418.9 L1400.6,417.2 L1401.6,415.3 L1405.9,411.9 L1406.4,413.1 L1409.0,413.2 L1408.3,407.2 L1410.9,406.4 L1413.8,410.6 L1416.0,415.4 L1422.2,415.4 L1424.1,420.0 L1420.9,421.4 L1419.5,423.3 L1425.5,426.5 L1429.6,432.7 L1432.8,437.4 L1436.6,441.0 L1437.8,444.8 L1436.9,450.0 L1432.5,448.1 L1430.2,451.7 L1426.1,449.7 Z"},
  {id:"vietnam", name:"Vietnam", area:14, lx:1430.1, ly:435.5, borders:["china", "laos", "cambodia"], d:"M1440.3,411.3 L1433.6,415.8 L1429.4,420.8 L1428.3,424.4 L1432.1,430.0 L1436.8,436.9 L1441.3,440.1 L1444.4,444.4 L1446.7,454.1 L1446.0,463.4 L1441.8,466.9 L1436.1,470.3 L1432.0,474.7 L1425.8,479.6 L1424.0,476.2 L1425.4,472.7 L1421.7,469.7 L1426.0,467.5 L1431.2,467.1 L1429.1,463.9 L1437.5,459.9 L1438.1,453.6 L1436.9,450.0 L1437.8,444.8 L1436.6,441.0 L1432.8,437.4 L1429.6,432.7 L1425.5,426.5 L1419.5,423.3 L1420.9,421.4 L1424.1,420.0 L1422.2,415.4 L1416.0,415.4 L1413.8,410.6 L1410.9,406.4 L1413.5,405.1 L1417.5,405.2 L1422.4,404.6 L1426.6,401.8 L1429.1,403.7 L1433.6,404.7 L1432.8,407.7 L1435.2,409.9 L1440.3,411.3 Z"},
  {id:"cambodia", name:"Cambodia", area:10, lx:1424.7, ly:458.8, borders:["thailand", "laos", "vietnam"], d:"M1417.5,468.9 L1415.5,466.1 L1412.9,460.7 L1411.7,454.3 L1414.9,449.9 L1421.4,448.9 L1426.1,449.7 L1430.2,451.7 L1432.5,448.1 L1436.9,450.0 L1438.1,453.6 L1437.5,459.9 L1429.1,463.9 L1431.2,467.1 L1426.0,467.5 L1421.7,469.7 L1417.5,468.9 Z"},
  {id:"malaysia", name:"Malaysia", area:14, lx:1473.9, ly:505.5, borders:["thailand", "indonesia", "brunei"], d:"M1405.4,492.3 L1405.8,495.0 L1409.1,494.3 L1410.7,492.2 L1411.9,492.7 L1414.8,495.8 L1416.9,499.4 L1417.2,502.9 L1416.7,505.3 L1417.1,507.1 L1417.5,510.3 L1419.3,511.7 L1421.2,516.4 L1421.1,518.2 L1417.6,518.5 L1412.9,514.6 L1407.0,510.4 L1406.4,507.7 L1403.5,504.2 L1402.8,499.8 L1401.0,497.0 L1401.5,493.1 L1400.4,490.9 L1401.3,489.9 L1405.4,492.3 Z M1493.1,501.4 L1489.4,503.2 L1485.1,502.3 L1479.3,502.3 L1477.6,508.3 L1475.7,510.1 L1473.1,517.4 L1469.0,518.6 L1464.3,517.1 L1461.9,517.6 L1459.0,520.2 L1455.8,519.8 L1452.6,520.9 L1449.2,517.9 L1448.3,514.4 L1452.0,516.2 L1455.8,515.2 L1456.9,510.8 L1459.0,509.8 L1465.0,508.6 L1468.6,504.5 L1471.0,501.1 L1473.3,503.8 L1474.3,502.1 L1476.7,502.2 L1477.0,498.8 L1477.3,496.2 L1481.1,492.6 L1483.6,488.5 L1485.6,488.4 L1488.2,491.1 L1488.4,493.4 L1491.7,494.9 L1495.9,496.5 L1495.6,498.5 L1492.2,498.8 L1493.1,501.4 Z"},
  {id:"indonesia", name:"Indonesia", area:50, lx:1508.2, ly:535.7, borders:["malaysia", "papua_ng", "east_timor"], d:"M1503.6,579.0 L1501.5,579.1 L1494.8,575.4 L1499.5,574.4 L1502.1,576.0 L1503.9,577.6 L1503.6,579.0 Z M1522.2,578.5 L1517.9,579.7 L1517.3,579.0 L1517.8,577.3 L1519.9,574.0 L1524.8,571.9 L1525.4,573.0 L1525.4,574.6 L1522.2,578.5 Z M1489.5,567.7 L1491.3,569.1 L1494.4,568.7 L1495.6,570.9 L1489.9,572.0 L1486.4,572.7 L1483.7,572.7 L1485.4,569.6 L1488.2,569.6 L1489.5,567.7 Z M1514.5,567.7 L1513.8,570.7 L1506.3,572.1 L1499.6,571.5 L1499.6,569.6 L1503.6,568.5 L1506.7,570.1 L1510.0,569.7 L1514.5,567.7 Z M1443.1,560.8 L1452.7,561.3 L1453.8,559.1 L1463.1,561.7 L1464.9,565.1 L1472.4,566.0 L1478.5,569.2 L1472.8,571.2 L1467.3,569.1 L1462.8,569.2 L1457.6,568.8 L1452.9,567.9 L1447.1,565.9 L1443.5,565.3 L1441.4,566.0 L1432.3,563.8 L1431.4,561.5 L1426.8,561.2 L1430.3,556.1 L1436.3,556.4 L1440.4,558.5 L1442.4,558.9 L1443.1,560.8 Z M1573.6,557.8 L1571.1,561.4 L1570.6,557.4 L1571.5,555.5 L1572.5,553.7 L1573.6,555.3 L1573.6,557.8 Z M1536.2,543.3 L1534.4,545.0 L1530.9,544.0 L1529.9,541.8 L1535.0,541.5 L1536.2,543.3 Z M1552.4,541.3 L1554.2,545.4 L1550.0,543.2 L1545.8,542.7 L1543.0,543.1 L1539.5,542.9 L1540.7,540.0 L1546.9,539.8 L1552.4,541.3 Z M1570.7,531.1 L1572.1,539.6 L1577.3,542.8 L1581.5,537.2 L1587.2,534.0 L1591.6,534.0 L1595.9,535.8 L1599.6,537.7 L1605.0,538.7 L1605.1,555.9 L1605.2,573.1 L1600.7,568.8 L1595.6,567.7 L1594.4,569.2 L1588.1,569.4 L1590.2,565.1 L1593.3,563.6 L1592.0,557.9 L1589.6,553.5 L1579.9,549.0 L1575.8,548.6 L1568.3,543.7 L1566.8,546.2 L1564.9,546.7 L1563.8,544.8 L1563.8,542.5 L1559.9,539.9 L1565.3,538.0 L1568.9,538.1 L1568.5,536.7 L1561.2,536.7 L1559.2,533.5 L1554.7,532.6 L1552.6,529.9 L1559.3,528.7 L1561.9,527.0 L1569.9,529.1 L1570.7,531.1 Z M1526.2,517.5 L1522.2,522.7 L1518.4,523.8 L1513.6,522.7 L1505.3,523.0 L1500.9,523.7 L1500.2,527.7 L1504.7,532.4 L1507.4,530.0 L1516.7,528.2 L1516.3,530.7 L1514.1,529.9 L1511.9,533.0 L1507.5,535.1 L1512.3,541.8 L1511.4,543.6 L1515.9,549.7 L1515.8,553.2 L1513.1,554.7 L1511.2,552.9 L1513.6,548.6 L1508.7,550.6 L1507.4,549.1 L1508.1,547.1 L1504.5,544.0 L1504.9,538.9 L1501.5,540.5 L1502.0,546.6 L1502.2,554.2 L1499.0,554.9 L1496.8,553.4 L1498.3,548.5 L1497.5,543.4 L1495.4,543.4 L1493.8,539.8 L1495.9,536.3 L1496.6,532.1 L1499.1,524.2 L1500.2,522.0 L1504.4,518.1 L1508.3,519.6 L1514.6,520.4 L1520.4,520.2 L1525.3,516.3 L1526.2,517.5 Z M1543.4,519.0 L1543.2,523.6 L1540.6,523.1 L1539.8,526.3 L1541.9,529.1 L1540.5,529.7 L1538.5,526.4 L1537.0,519.7 L1538.0,515.4 L1539.7,513.5 L1540.0,516.4 L1543.0,516.9 L1543.4,519.0 Z M1489.4,515.4 L1495.0,520.2 L1489.1,520.9 L1487.4,524.5 L1487.6,529.2 L1482.8,532.9 L1482.7,538.1 L1480.7,546.2 L1480.0,544.3 L1474.3,546.7 L1472.3,543.4 L1468.8,543.2 L1466.3,541.5 L1460.3,543.4 L1458.5,540.8 L1455.2,541.1 L1451.1,540.5 L1450.4,533.4 L1447.9,531.9 L1445.5,527.4 L1444.8,522.8 L1445.3,517.9 L1448.3,514.4 L1449.2,517.9 L1452.6,520.9 L1455.8,519.8 L1459.0,520.2 L1461.9,517.6 L1464.3,517.1 L1469.0,518.6 L1473.1,517.4 L1475.7,510.1 L1477.6,508.3 L1479.3,502.3 L1485.1,502.3 L1489.4,503.2 L1486.6,507.9 L1490.2,512.9 L1489.4,515.4 Z M1429.1,555.9 L1423.6,556.0 L1419.3,551.6 L1412.9,547.3 L1410.8,544.1 L1407.0,539.8 L1404.5,535.8 L1400.7,528.4 L1396.3,524.0 L1394.9,519.5 L1393.0,515.4 L1388.5,512.1 L1385.9,507.5 L1382.1,504.6 L1376.9,498.8 L1376.5,496.1 L1379.7,496.3 L1387.4,497.3 L1391.8,502.5 L1395.7,506.1 L1398.5,508.2 L1403.2,513.9 L1408.3,514.0 L1412.5,517.6 L1415.4,522.0 L1419.2,524.4 L1417.2,528.8 L1420.1,530.6 L1421.8,530.7 L1422.7,534.4 L1424.4,537.4 L1428.1,537.8 L1430.5,541.2 L1429.3,547.7 L1429.1,555.9 Z"},
  {id:"philippines", name:"Philippines", area:14, lx:1508.9, ly:443.8, borders:["taiwan", "indonesia"], d:"M1531.9,480.6 L1532.4,484.1 L1532.7,487.1 L1531.0,491.9 L1529.2,486.5 L1526.8,489.2 L1528.4,493.1 L1527.0,495.5 L1521.1,492.5 L1519.7,488.7 L1521.2,486.2 L1518.1,483.7 L1516.5,485.8 L1514.1,485.6 L1510.4,488.6 L1509.6,487.0 L1511.6,482.6 L1514.7,481.1 L1517.4,479.1 L1519.2,481.5 L1523.0,480.1 L1523.8,477.7 L1527.4,477.6 L1527.1,473.5 L1531.1,476.0 L1531.5,478.6 L1531.9,480.6 Z M1519.9,470.8 L1518.1,472.5 L1516.5,475.8 L1515.0,477.4 L1511.9,473.7 L1512.9,472.3 L1514.2,470.8 L1514.7,467.6 L1517.5,467.3 L1516.7,470.8 L1520.4,465.7 L1519.9,470.8 Z M1492.5,475.8 L1485.9,480.8 L1488.3,477.1 L1491.9,473.9 L1494.9,470.2 L1497.6,465.0 L1498.4,469.3 L1495.1,472.2 L1492.5,475.8 Z M1509.4,462.2 L1512.4,463.9 L1515.6,463.9 L1515.5,466.1 L1513.2,468.3 L1510.0,469.9 L1509.8,467.4 L1510.2,464.7 L1509.4,462.2 Z M1527.5,460.8 L1528.9,466.7 L1525.1,465.3 L1525.2,467.1 L1526.4,470.3 L1524.0,471.5 L1523.8,467.8 L1522.3,467.5 L1521.5,464.3 L1524.5,464.8 L1524.4,462.8 L1521.3,458.7 L1526.1,458.8 L1527.5,460.8 Z M1507.6,456.0 L1506.3,460.6 L1504.2,457.9 L1501.6,453.9 L1505.9,454.1 L1507.6,456.0 Z M1506.6,427.3 L1509.7,428.8 L1511.2,427.5 L1511.7,428.8 L1510.9,431.0 L1512.6,434.8 L1511.3,439.2 L1508.3,440.9 L1507.5,445.2 L1508.6,449.4 L1511.3,450.0 L1513.5,449.3 L1519.8,452.3 L1519.3,455.1 L1520.9,456.4 L1520.4,458.8 L1516.5,456.2 L1514.6,453.5 L1513.4,455.4 L1510.2,452.2 L1505.6,453.0 L1503.1,451.9 L1503.4,449.7 L1505.0,448.3 L1503.5,447.1 L1502.8,449.0 L1500.4,446.0 L1499.6,443.7 L1499.4,438.6 L1501.4,440.4 L1502.0,432.1 L1503.6,427.3 L1506.6,427.3 Z"},
  {id:"china", name:"China", area:160, lx:1429.4, ly:327.9, bonus:{"troops": 2, "label": "+2 tanks/min"}, borders:["russia", "mongolia", "n_korea", "vietnam", "laos", "myanmar", "india", "bhutan", "nepal", "pakistan", "afghanistan", "tajikistan", "kyrgyzstan", "kazakhstan"], d:"M1451.7,426.4 L1447.4,429.0 L1443.3,427.3 L1443.1,422.8 L1445.6,420.4 L1451.1,418.9 L1453.9,419.0 L1455.1,421.0 L1452.9,423.4 L1451.7,426.4 Z M1538.3,262.4 L1547.0,264.1 L1552.9,267.8 L1554.9,272.8 L1562.5,272.8 L1566.9,270.7 L1575.1,269.1 L1572.5,273.9 L1570.6,275.8 L1568.8,281.6 L1565.5,286.7 L1559.4,285.8 L1555.1,287.7 L1556.4,292.2 L1555.7,298.4 L1553.2,298.6 L1553.2,301.2 L1550.0,298.1 L1548.0,301.1 L1540.3,303.4 L1541.0,306.1 L1536.7,306.0 L1534.3,304.3 L1530.9,308.0 L1525.4,310.9 L1521.3,314.3 L1514.3,315.8 L1510.7,318.3 L1505.3,319.7 L1507.9,317.3 L1506.9,315.2 L1510.8,311.7 L1508.2,308.9 L1503.8,310.8 L1498.2,314.4 L1495.1,317.8 L1490.2,318.1 L1487.7,320.6 L1490.3,324.1 L1494.4,325.0 L1494.6,327.4 L1498.5,328.9 L1504.1,325.1 L1508.6,327.2 L1511.8,327.3 L1512.6,330.1 L1505.5,331.6 L1503.2,334.4 L1498.3,337.1 L1495.8,340.8 L1501.1,343.7 L1503.1,348.8 L1506.1,353.7 L1509.5,357.7 L1509.5,361.7 L1506.3,363.1 L1507.5,365.9 L1510.5,367.6 L1509.7,371.8 L1508.4,376.0 L1505.6,376.5 L1502.0,382.2 L1497.9,389.1 L1493.3,395.4 L1486.4,400.3 L1479.5,404.8 L1473.8,405.4 L1470.8,407.7 L1469.0,406.0 L1466.2,408.6 L1459.2,411.3 L1453.9,412.1 L1452.2,417.6 L1449.4,418.0 L1448.1,414.1 L1449.3,412.1 L1442.6,410.4 L1440.3,411.3 L1435.2,409.9 L1432.8,407.7 L1433.6,404.7 L1429.1,403.7 L1426.6,401.8 L1422.4,404.6 L1417.5,405.2 L1413.5,405.1 L1410.9,406.4 L1408.3,407.2 L1409.0,413.2 L1406.4,413.1 L1405.9,411.9 L1405.8,409.7 L1402.1,411.2 L1399.9,410.2 L1396.2,408.3 L1397.7,403.9 L1394.5,402.9 L1393.3,398.0 L1388.0,398.9 L1388.6,392.6 L1393.4,388.2 L1393.6,383.9 L1393.4,379.8 L1391.2,378.6 L1389.6,375.4 L1386.6,375.8 L1381.2,375.1 L1382.9,372.8 L1380.6,369.6 L1377.0,371.8 L1372.8,370.5 L1367.1,373.8 L1362.5,377.8 L1358.5,378.4 L1356.3,377.0 L1353.7,376.9 L1350.1,375.7 L1347.4,377.0 L1344.1,380.9 L1343.7,376.8 L1340.6,377.9 L1334.8,377.4 L1329.1,376.1 L1325.1,373.8 L1321.2,372.8 L1319.5,370.3 L1316.7,369.5 L1311.6,366.1 L1307.6,364.4 L1305.6,365.7 L1298.6,362.0 L1293.7,358.7 L1292.3,352.8 L1295.9,353.6 L1296.0,350.9 L1294.1,348.2 L1294.6,343.9 L1289.2,337.7 L1281.0,335.5 L1279.5,331.5 L1275.8,329.0 L1274.9,327.5 L1274.1,324.5 L1274.3,322.4 L1271.3,321.2 L1269.6,321.8 L1268.4,316.9 L1269.8,315.7 L1269.1,314.4 L1273.9,312.0 L1277.3,310.9 L1282.6,311.6 L1284.5,308.3 L1290.9,307.6 L1292.7,305.5 L1300.6,302.7 L1301.3,301.5 L1300.9,298.5 L1304.3,297.1 L1299.8,287.9 L1309.7,285.8 L1312.3,284.7 L1315.9,275.2 L1325.8,276.9 L1328.6,274.6 L1328.8,269.3 L1333.0,268.8 L1336.8,265.3 L1338.8,264.8 L1340.1,268.5 L1344.3,271.3 L1351.4,273.3 L1354.9,277.5 L1352.9,283.7 L1354.7,286.0 L1360.7,286.9 L1367.4,287.6 L1373.4,290.9 L1376.5,291.5 L1378.8,296.4 L1381.7,299.5 L1387.3,299.4 L1397.6,300.6 L1404.2,299.8 L1409.2,300.6 L1416.6,303.8 L1422.6,303.8 L1424.8,305.5 L1430.6,302.6 L1438.7,300.8 L1446.2,300.6 L1452.1,298.7 L1455.6,295.9 L1459.1,294.1 L1458.3,292.4 L1456.7,290.4 L1459.4,287.0 L1462.2,287.4 L1467.3,288.5 L1472.3,285.7 L1479.9,283.7 L1483.6,280.2 L1487.1,278.7 L1494.4,278.0 L1498.3,278.6 L1498.9,276.7 L1494.3,273.0 L1490.3,271.3 L1486.5,273.3 L1481.5,272.4 L1478.7,273.1 L1477.4,271.0 L1481.0,265.7 L1483.4,261.7 L1489.4,263.7 L1496.4,260.4 L1496.4,258.0 L1500.9,252.4 L1503.7,250.7 L1503.6,247.8 L1500.9,246.6 L1505.0,244.0 L1511.2,243.0 L1517.9,242.9 L1525.3,244.4 L1529.7,246.4 L1532.8,251.7 L1534.7,254.0 L1536.4,257.2 L1538.3,262.4 Z"},
  {id:"mongolia", name:"Mongolia", area:45, lx:1422.9, ly:275.9, borders:["russia", "china"], d:"M1338.8,264.8 L1344.0,263.9 L1353.6,259.4 L1361.2,256.9 L1365.5,258.5 L1370.7,258.6 L1374.1,261.0 L1379.1,261.2 L1386.3,262.6 L1391.2,258.9 L1389.1,255.8 L1394.3,250.3 L1399.9,252.5 L1404.4,253.1 L1410.3,254.5 L1411.3,258.4 L1418.4,260.6 L1423.1,259.7 L1429.4,259.0 L1434.4,259.7 L1439.3,262.2 L1442.4,264.9 L1447.0,264.8 L1453.3,265.7 L1457.9,264.4 L1464.5,263.5 L1471.8,259.8 L1474.8,260.4 L1477.4,262.1 L1483.4,261.7 L1481.0,265.7 L1477.4,271.0 L1478.7,273.1 L1481.5,272.4 L1486.5,273.3 L1490.3,271.3 L1494.3,273.0 L1498.9,276.7 L1498.3,278.6 L1494.4,278.0 L1487.1,278.7 L1483.6,280.2 L1479.9,283.7 L1472.3,285.7 L1467.3,288.5 L1462.2,287.4 L1459.4,287.0 L1456.7,290.4 L1458.3,292.4 L1459.1,294.1 L1455.6,295.9 L1452.1,298.7 L1446.2,300.6 L1438.7,300.8 L1430.6,302.6 L1424.8,305.5 L1422.6,303.8 L1416.6,303.8 L1409.2,300.6 L1404.2,299.8 L1397.6,300.6 L1387.3,299.4 L1381.7,299.5 L1378.8,296.4 L1376.5,291.5 L1373.4,290.9 L1367.4,287.6 L1360.7,286.9 L1354.7,286.0 L1352.9,283.7 L1354.9,277.5 L1351.4,273.3 L1344.3,271.3 L1340.1,268.5 L1338.8,264.8 Z"},
  {id:"n_korea", name:"N. Korea", area:10, lx:1536.6, ly:314.5, borders:["china", "s_korea", "russia"], d:"M1553.2,301.2 L1553.9,302.2 L1552.0,301.9 L1549.8,303.6 L1548.3,305.4 L1548.5,309.2 L1545.9,310.4 L1545.1,311.3 L1543.2,312.9 L1539.8,313.8 L1537.7,315.2 L1537.5,317.5 L1536.9,318.0 L1538.9,318.9 L1541.7,321.2 L1541.0,322.5 L1538.9,322.8 L1535.4,323.1 L1533.4,325.5 L1531.2,325.3 L1530.9,325.8 L1528.4,324.8 L1527.8,325.8 L1526.4,326.2 L1526.2,325.2 L1524.9,324.7 L1523.6,323.9 L1524.9,321.5 L1526.1,320.9 L1525.7,320.0 L1526.9,317.1 L1526.6,316.3 L1523.7,315.7 L1521.3,314.3 L1525.4,310.9 L1530.9,308.0 L1534.3,304.3 L1536.7,306.0 L1541.0,306.1 L1540.3,303.4 L1548.0,301.1 L1550.0,298.1 L1553.2,301.2 Z"},
  {id:"s_korea", name:"S. Korea", area:10, lx:1537.9, ly:331.0, borders:["n_korea"], d:"M1541.7,321.2 L1546.1,327.4 L1547.3,330.9 L1547.3,336.9 L1545.5,339.8 L1540.9,340.9 L1536.9,343.0 L1532.4,343.5 L1531.9,340.6 L1532.8,336.7 L1530.6,331.2 L1534.3,330.3 L1530.9,325.8 L1531.2,325.3 L1533.4,325.5 L1535.4,323.1 L1538.9,322.8 L1541.0,322.5 L1541.7,321.2 Z"},
  {id:"japan", name:"Japan", area:18, lx:1579.9, ly:336.8, bonus:{"coins": 35, "label": "+35 coins/sec"}, borders:["s_korea", "russia"], d:"M1573.2,344.8 L1573.8,346.6 L1571.0,349.8 L1569.0,348.1 L1566.4,349.3 L1565.1,352.4 L1561.8,350.9 L1561.9,348.4 L1564.6,345.2 L1567.5,345.8 L1569.5,343.6 L1573.2,344.8 Z M1604.9,329.0 L1603.0,333.2 L1603.9,335.8 L1601.3,339.5 L1594.9,342.0 L1586.1,342.4 L1579.0,348.4 L1575.6,346.4 L1575.4,342.4 L1566.7,343.6 L1560.8,346.1 L1554.9,346.2 L1560.0,350.0 L1556.7,359.0 L1553.4,361.2 L1551.0,359.2 L1552.2,354.4 L1549.1,352.9 L1547.0,349.3 L1551.8,347.6 L1554.4,344.3 L1559.4,341.6 L1563.1,338.0 L1573.0,336.4 L1578.4,337.5 L1583.6,328.1 L1587.0,330.6 L1594.3,325.4 L1597.1,323.3 L1600.3,316.9 L1599.4,310.9 L1601.5,307.6 L1606.8,306.6 L1609.6,313.9 L1609.4,318.2 L1604.8,323.5 L1604.9,329.0 Z M1619.6,291.9 L1623.1,293.0 L1626.6,290.7 L1627.7,296.7 L1620.3,298.1 L1615.9,303.4 L1608.1,299.8 L1605.3,305.5 L1599.8,305.6 L1599.1,300.4 L1601.6,296.3 L1606.9,296.0 L1608.4,288.7 L1609.8,284.6 L1615.7,290.1 L1619.6,291.9 Z"},
  {id:"taiwan", name:"Taiwan", area:8, lx:1505.5, ly:399.1, borders:["china", "philippines"], d:"M1508.9,396.3 L1505.9,404.7 L1503.7,409.0 L1501.1,404.6 L1500.5,400.7 L1503.5,395.5 L1507.5,391.5 L1509.8,393.1 L1508.9,396.3 Z"},
  {id:"russia", name:"Russia", area:300, lx:1356.4, ly:211.8, bonus:{"troops": 3, "label": "+3 tanks/min"}, borders:["norway", "finland", "estonia", "latvia", "lithuania", "poland", "belarus", "ukraine", "georgia", "azerbaijan", "kazakhstan", "china", "mongolia", "n_korea", "japan", "usa"], d:"M1618.2,257.2 L1623.3,266.5 L1615.9,264.8 L1612.8,272.4 L1617.7,277.8 L1617.5,281.5 L1613.7,278.3 L1610.5,282.4 L1609.5,278.0 L1610.1,272.8 L1609.5,267.1 L1610.7,263.1 L1610.9,256.1 L1608.0,250.9 L1608.4,243.7 L1613.0,241.3 L1611.0,238.8 L1613.3,238.1 L1614.6,241.6 L1616.3,246.6 L1616.2,251.8 L1618.2,257.2 Z M1013.7,238.3 L1004.5,238.4 L998.3,237.8 L999.4,235.4 L1006.3,233.7 L1011.6,234.6 L1013.8,235.5 L1013.3,236.9 L1013.7,238.3 Z M24.9,173.6 L28.3,174.9 L27.1,171.1 L40.7,171.8 L50.5,176.8 L45.5,179.1 L37.3,179.6 L37.2,184.8 L35.2,185.9 L30.5,185.7 L26.7,183.9 L20.1,182.4 L19.0,180.1 L13.9,179.2 L8.2,179.9 L5.5,178.0 L6.6,176.1 L0.6,177.3 L2.8,179.8 L0.0,182.1 L0.0,161.0 L12.2,165.1 L25.4,170.3 L24.9,173.6 Z M1800.0,151.2 L1794.5,151.4 L1793.6,149.8 L1800.0,147.6 L1800.0,151.2 Z M6.5,150.8 L0.0,151.2 L0.0,147.6 L0.6,147.3 L4.9,147.3 L12.1,148.9 L11.7,149.6 L6.5,150.8 Z M1618.0,138.6 L1610.4,138.6 L1600.2,138.0 L1599.3,137.8 L1604.1,135.7 L1610.3,135.2 L1617.4,137.2 L1618.0,138.6 Z M1653.7,128.7 L1647.9,130.8 L1639.9,130.3 L1630.6,128.3 L1631.8,126.5 L1641.1,127.3 L1653.7,128.7 Z M1625.4,126.2 L1621.5,130.1 L1603.1,130.0 L1594.8,131.2 L1584.9,127.8 L1587.6,124.2 L1594.2,123.2 L1607.4,123.4 L1625.4,126.2 Z M1187.7,151.8 L1184.7,152.2 L1168.4,151.5 L1167.1,149.2 L1158.0,147.8 L1157.3,144.9 L1162.4,143.8 L1162.2,140.9 L1172.1,136.4 L1167.5,135.8 L1179.5,131.1 L1178.2,128.7 L1189.3,126.0 L1205.9,122.6 L1222.5,121.6 L1231.1,119.6 L1240.8,118.9 L1244.3,121.0 L1240.9,122.7 L1223.2,125.3 L1207.9,127.8 L1192.4,132.8 L1184.9,138.0 L1177.1,143.0 L1178.1,147.4 L1187.7,151.8 Z M1434.9,118.7 L1436.2,121.4 L1440.8,120.1 L1455.4,120.1 L1466.7,122.7 L1470.7,124.7 L1469.4,127.4 L1463.9,129.0 L1450.8,131.9 L1447.0,133.5 L1453.2,134.2 L1460.6,135.6 L1465.1,134.6 L1467.6,138.0 L1469.8,136.6 L1477.8,135.7 L1493.9,136.6 L1495.1,139.1 L1516.0,139.9 L1516.3,135.8 L1526.9,136.8 L1534.9,136.7 L1543.0,139.5 L1545.3,142.9 L1542.3,145.1 L1548.6,149.3 L1556.4,151.4 L1561.3,145.9 L1569.3,148.2 L1577.8,146.8 L1587.5,148.4 L1591.2,147.0 L1599.3,147.7 L1595.7,142.8 L1602.3,140.5 L1647.5,143.9 L1651.8,147.1 L1664.8,151.1 L1685.0,150.1 L1695.0,151.0 L1699.2,153.2 L1698.5,157.0 L1704.7,158.5 L1711.4,157.4 L1720.3,157.3 L1729.7,158.3 L1739.2,157.8 L1747.9,162.4 L1754.1,160.8 L1750.0,157.4 L1752.3,155.0 L1768.2,156.5 L1778.6,156.2 L1793.0,158.7 L1800.0,161.0 L1800.0,182.1 L1800.0,182.1 L1793.5,184.4 L1787.1,184.0 L1791.6,186.8 L1794.5,191.2 L1796.9,192.6 L1797.4,194.8 L1796.1,196.2 L1786.8,195.0 L1772.8,199.0 L1768.4,199.6 L1760.8,203.3 L1753.5,206.6 L1751.7,209.0 L1744.5,205.3 L1731.5,209.4 L1729.2,207.5 L1724.4,209.7 L1717.7,209.0 L1716.1,212.5 L1710.1,217.6 L1710.3,219.7 L1716.0,220.9 L1715.3,228.6 L1710.6,228.8 L1708.5,233.2 L1710.6,235.5 L1701.8,238.2 L1700.1,244.2 L1692.7,245.5 L1691.2,250.9 L1683.9,255.8 L1682.1,252.1 L1680.0,244.4 L1677.2,232.7 L1679.6,225.4 L1683.8,222.2 L1684.1,219.8 L1691.8,218.6 L1700.8,211.9 L1709.4,206.5 L1718.3,202.3 L1722.4,194.9 L1716.3,195.3 L1713.3,199.7 L1700.6,205.5 L1696.5,199.0 L1683.6,200.8 L1671.1,209.6 L1675.2,212.8 L1664.1,214.2 L1656.3,214.8 L1656.7,211.0 L1648.9,210.2 L1642.7,212.7 L1627.4,211.8 L1611.0,213.4 L1594.8,223.7 L1575.6,236.1 L1583.5,236.8 L1586.0,240.1 L1590.8,241.3 L1594.0,238.7 L1599.5,239.0 L1606.7,244.8 L1606.9,249.3 L1603.0,254.6 L1602.6,260.9 L1600.3,269.3 L1592.8,276.9 L1591.1,280.6 L1584.3,286.7 L1577.6,292.8 L1574.3,296.0 L1567.7,299.1 L1564.5,299.1 L1561.4,296.6 L1554.7,300.4 L1553.9,302.2 L1553.2,301.2 L1553.2,298.6 L1555.7,298.4 L1556.4,292.2 L1555.1,287.7 L1559.4,285.8 L1565.5,286.7 L1568.8,281.6 L1570.6,275.8 L1572.5,273.9 L1575.1,269.1 L1566.9,270.7 L1562.5,272.8 L1554.9,272.8 L1552.9,267.8 L1547.0,264.1 L1538.3,262.4 L1536.4,257.2 L1534.7,254.0 L1532.8,251.7 L1529.7,246.4 L1525.3,244.4 L1517.9,242.9 L1511.2,243.0 L1505.0,244.0 L1500.9,246.6 L1503.6,247.8 L1503.7,250.7 L1500.9,252.4 L1496.4,258.0 L1496.4,260.4 L1489.4,263.7 L1483.4,261.7 L1477.4,262.1 L1474.8,260.4 L1471.8,259.8 L1464.5,263.5 L1457.9,264.4 L1453.3,265.7 L1447.0,264.8 L1442.4,264.9 L1439.3,262.2 L1434.4,259.7 L1429.4,259.0 L1423.1,259.7 L1418.4,260.6 L1411.3,258.4 L1410.3,254.5 L1404.4,253.1 L1399.9,252.5 L1394.3,250.3 L1389.1,255.8 L1391.2,258.9 L1386.3,262.6 L1379.1,261.2 L1374.1,261.0 L1370.7,258.6 L1365.5,258.5 L1361.2,256.9 L1353.6,259.4 L1344.0,263.9 L1338.8,264.8 L1336.8,265.3 L1334.1,262.0 L1327.7,262.7 L1325.6,260.5 L1322.1,259.5 L1319.7,256.4 L1316.9,255.5 L1309.7,256.8 L1302.8,253.8 L1300.2,256.5 L1289.0,243.1 L1282.6,239.1 L1284.5,237.4 L1271.9,242.4 L1267.1,242.7 L1267.5,239.8 L1261.1,238.0 L1255.9,239.3 L1254.3,233.8 L1245.3,232.7 L1240.8,234.9 L1228.3,236.8 L1225.9,238.1 L1207.2,240.0 L1204.9,241.8 L1208.5,245.4 L1203.7,246.8 L1204.6,248.2 L1199.8,250.8 L1207.9,254.4 L1206.7,256.9 L1199.7,256.7 L1198.2,258.2 L1191.8,255.5 L1183.9,255.6 L1178.6,257.8 L1172.7,255.7 L1161.6,252.0 L1153.8,252.2 L1143.5,257.9 L1142.9,261.8 L1137.7,258.7 L1133.8,264.5 L1135.2,265.6 L1132.3,269.6 L1136.6,273.2 L1140.3,273.0 L1143.5,276.5 L1143.0,279.3 L1145.5,280.1 L1143.2,283.2 L1138.4,284.1 L1133.4,289.6 L1138.0,294.6 L1137.5,298.1 L1142.9,304.3 L1139.9,306.5 L1139.1,307.8 L1136.9,307.5 L1133.4,304.2 L1132.0,304.1 L1128.9,302.8 L1127.4,300.7 L1122.7,299.6 L1119.7,300.4 L1118.8,299.4 L1112.0,296.9 L1104.6,296.0 L1100.4,295.1 L1099.8,295.8 L1093.4,291.3 L1087.7,289.3 L1083.4,286.2 L1087.0,285.4 L1091.2,281.0 L1088.4,278.9 L1095.7,276.7 L1095.6,275.6 L1091.1,276.4 L1091.3,274.1 L1093.9,272.6 L1098.7,272.2 L1099.5,270.4 L1098.4,267.5 L1100.4,264.8 L1100.3,263.2 L1093.0,261.5 L1090.1,261.6 L1087.0,259.1 L1083.1,259.9 L1076.8,258.1 L1076.9,257.0 L1075.1,254.7 L1071.1,254.5 L1070.7,252.8 L1072.0,251.8 L1068.8,248.8 L1063.6,249.3 L1062.1,249.0 L1060.8,250.2 L1058.9,250.0 L1057.7,246.6 L1056.5,244.9 L1057.5,244.4 L1061.5,244.6 L1063.5,243.4 L1062.0,242.0 L1058.7,241.1 L1059.0,240.1 L1056.9,239.2 L1053.8,235.7 L1054.9,234.3 L1054.4,231.8 L1049.5,230.6 L1046.9,231.2 L1046.1,229.9 L1040.9,228.6 L1039.3,225.4 L1038.9,222.9 L1036.4,221.7 L1038.6,220.0 L1037.1,215.1 L1040.7,212.0 L1039.9,211.1 L1045.6,208.2 L1040.3,205.7 L1051.1,198.9 L1055.7,195.9 L1057.6,193.2 L1050.2,189.6 L1052.2,186.1 L1047.7,182.2 L1051.1,177.7 L1045.3,171.7 L1049.9,167.7 L1042.2,164.2 L1043.0,160.5 L1047.0,160.0 L1055.5,157.9 L1060.7,156.1 L1068.9,159.2 L1082.6,160.5 L1101.5,166.5 L1105.3,169.0 L1105.6,172.5 L1100.1,175.3 L1091.9,176.7 L1069.6,172.7 L1065.9,173.3 L1074.1,177.2 L1074.4,179.6 L1074.7,185.0 L1081.2,186.6 L1085.1,188.0 L1085.7,185.5 L1082.7,183.2 L1085.9,181.2 L1098.0,184.5 L1102.2,183.2 L1098.8,179.3 L1110.5,174.2 L1115.1,174.5 L1119.7,176.3 L1122.7,172.7 L1118.5,169.5 L1120.9,166.4 L1117.3,163.1 L1131.2,164.8 L1134.1,167.7 L1127.8,168.4 L1127.8,171.3 L1131.7,173.1 L1139.5,172.0 L1140.7,168.6 L1151.1,166.1 L1168.6,161.6 L1172.4,161.8 L1167.4,165.0 L1173.6,165.6 L1177.2,163.8 L1186.6,163.7 L1194.0,161.5 L1199.7,164.6 L1205.4,161.1 L1200.2,158.1 L1202.8,156.3 L1217.5,157.9 L1224.4,159.6 L1242.6,165.6 L1245.9,162.9 L1240.8,160.1 L1240.7,159.0 L1234.7,158.4 L1236.3,155.9 L1233.6,151.8 L1233.5,150.1 L1242.7,145.3 L1246.0,140.5 L1249.7,139.5 L1262.9,140.9 L1264.0,143.8 L1259.2,148.1 L1262.4,149.8 L1264.0,153.5 L1262.8,160.7 L1268.3,164.0 L1266.2,167.5 L1256.4,175.0 L1262.1,175.8 L1264.1,173.9 L1269.6,172.5 L1270.9,169.9 L1275.3,167.4 L1272.3,164.4 L1274.7,160.9 L1269.2,160.5 L1268.0,157.5 L1272.0,152.2 L1265.5,147.9 L1274.5,144.4 L1273.3,140.6 L1275.8,140.5 L1278.4,143.4 L1276.4,148.5 L1281.8,149.5 L1279.5,145.7 L1287.9,143.6 L1298.3,143.3 L1307.5,146.3 L1303.1,141.9 L1302.6,136.3 L1311.2,135.2 L1323.3,135.5 L1334.1,134.8 L1330.0,132.0 L1335.8,128.6 L1341.6,128.4 L1351.3,125.8 L1364.5,125.1 L1366.2,123.6 L1379.3,123.1 L1383.4,124.3 L1394.6,121.5 L1403.8,121.6 L1405.2,119.3 L1410.0,117.1 L1421.8,114.9 L1430.3,116.6 L1423.5,117.9 L1434.9,118.7 Z M1425.4,111.7 L1397.2,113.8 L1406.3,106.8 L1410.4,106.2 L1414.2,106.6 L1426.9,109.6 L1425.4,111.7 Z M1155.7,99.9 L1149.0,100.6 L1144.5,101.0 L1143.8,101.9 L1137.9,102.7 L1132.5,101.5 L1135.4,99.8 L1124.2,99.7 L1134.0,98.7 L1141.6,98.6 L1142.6,100.1 L1145.5,98.8 L1150.2,97.9 L1157.6,99.1 L1155.7,99.9 Z M1399.7,108.7 L1388.8,109.3 L1374.9,107.8 L1366.6,105.8 L1362.7,102.0 L1355.9,101.0 L1368.9,97.4 L1379.7,96.2 L1389.4,98.8 L1400.9,103.9 L1399.7,108.7 Z"},
  {id:"kazakhstan", name:"Kazakhstan", area:65, lx:1225.5, ly:275.9, borders:["russia", "china", "kyrgyzstan", "uzbekistan", "turkmenistan"], d:"M1254.8,301.9 L1251.9,302.9 L1245.4,306.6 L1243.2,310.4 L1241.3,310.4 L1239.9,307.9 L1233.6,307.7 L1232.6,303.4 L1230.1,303.4 L1230.5,298.1 L1224.5,294.2 L1215.9,294.6 L1210.1,295.4 L1205.3,290.6 L1201.2,288.6 L1193.4,284.9 L1192.5,284.4 L1179.6,287.5 L1179.8,307.0 L1177.3,307.2 L1173.8,303.1 L1170.4,301.6 L1164.7,302.7 L1162.5,304.5 L1162.2,303.2 L1163.5,301.0 L1162.5,299.2 L1156.7,297.4 L1154.5,292.6 L1151.7,291.3 L1151.5,289.6 L1156.4,290.1 L1156.6,286.2 L1160.8,285.3 L1165.2,286.1 L1166.1,281.0 L1165.2,277.7 L1160.2,278.0 L1156.0,276.7 L1150.2,279.0 L1145.5,280.1 L1143.0,279.3 L1143.5,276.5 L1140.3,273.0 L1136.6,273.2 L1132.3,269.6 L1135.2,265.6 L1133.8,264.5 L1137.7,258.7 L1142.9,261.8 L1143.5,257.9 L1153.8,252.2 L1161.6,252.0 L1172.7,255.7 L1178.6,257.8 L1183.9,255.6 L1191.8,255.5 L1198.2,258.2 L1199.7,256.7 L1206.7,256.9 L1207.9,254.4 L1199.8,250.8 L1204.6,248.2 L1203.7,246.8 L1208.5,245.4 L1204.9,241.8 L1207.2,240.0 L1225.9,238.1 L1228.3,236.8 L1240.8,234.9 L1245.3,232.7 L1254.3,233.8 L1255.9,239.3 L1261.1,238.0 L1267.5,239.8 L1267.1,242.7 L1271.9,242.4 L1284.5,237.4 L1282.6,239.1 L1289.0,243.1 L1300.2,256.5 L1302.8,253.8 L1309.7,256.8 L1316.9,255.5 L1319.7,256.4 L1322.1,259.5 L1325.6,260.5 L1327.7,262.7 L1334.1,262.0 L1336.8,265.3 L1333.0,268.8 L1328.8,269.3 L1328.6,274.6 L1325.8,276.9 L1315.9,275.2 L1312.3,284.7 L1309.7,285.8 L1299.8,287.9 L1304.3,297.1 L1300.9,298.5 L1301.3,301.5 L1298.2,300.7 L1295.7,298.8 L1288.3,298.3 L1280.0,298.1 L1278.2,298.7 L1271.1,296.5 L1268.2,297.6 L1267.4,300.7 L1259.2,298.9 L1255.9,299.6 L1254.8,301.9 Z"},
  {id:"uzbekistan", name:"Uzbekistan", area:22, lx:1227.4, ly:308.2, borders:["kazakhstan", "turkmenistan", "afghanistan", "tajikistan", "kyrgyzstan"], d:"M1232.6,327.8 L1232.7,324.6 L1226.1,322.3 L1220.9,319.7 L1217.6,317.2 L1211.9,313.6 L1209.4,308.2 L1207.7,307.2 L1202.3,307.4 L1200.4,306.4 L1199.9,302.2 L1193.1,299.4 L1188.9,302.4 L1184.7,304.3 L1185.5,306.9 L1179.8,307.0 L1179.6,287.5 L1192.5,284.4 L1193.4,284.9 L1201.2,288.6 L1205.3,290.6 L1210.1,295.4 L1215.9,294.6 L1224.5,294.2 L1230.5,298.1 L1230.1,303.4 L1232.6,303.4 L1233.6,307.7 L1239.9,307.9 L1241.3,310.4 L1243.2,310.4 L1245.4,306.6 L1251.9,302.9 L1254.8,301.9 L1256.3,302.4 L1252.1,305.9 L1255.8,307.9 L1259.4,306.5 L1265.3,309.3 L1258.9,313.1 L1255.1,312.6 L1253.0,312.7 L1252.3,311.3 L1253.3,308.8 L1246.6,310.0 L1245.1,313.4 L1242.7,316.4 L1238.5,316.1 L1237.2,318.4 L1240.9,319.7 L1242.0,323.6 L1239.1,329.0 L1235.4,327.8 L1232.6,327.8 Z"},
  {id:"turkmenistan", name:"Turkmenistan", area:20, lx:1193.1, ly:318.0, borders:["kazakhstan", "uzbekistan", "afghanistan", "iran"], d:"M1206.1,336.8 L1205.6,332.4 L1201.9,332.2 L1196.2,327.5 L1192.2,327.0 L1186.7,324.3 L1183.1,323.8 L1180.9,324.8 L1177.6,324.6 L1174.0,327.7 L1169.6,328.7 L1168.7,324.9 L1169.4,319.4 L1165.5,317.6 L1166.8,314.0 L1163.5,313.7 L1164.6,309.3 L1169.3,310.6 L1173.7,308.9 L1170.0,305.7 L1168.6,302.7 L1164.6,304.0 L1164.1,307.9 L1162.5,304.5 L1164.7,302.7 L1170.4,301.6 L1173.8,303.1 L1177.3,307.2 L1179.8,307.0 L1185.5,306.9 L1184.7,304.3 L1188.9,302.4 L1193.1,299.4 L1199.9,302.2 L1200.4,306.4 L1202.3,307.4 L1207.7,307.2 L1209.4,308.2 L1211.9,313.6 L1217.6,317.2 L1220.9,319.7 L1226.1,322.3 L1232.7,324.6 L1232.6,327.8 L1231.1,327.6 L1228.7,326.2 L1227.9,328.1 L1223.7,329.1 L1222.7,333.4 L1219.9,335.0 L1216.0,335.8 L1214.9,338.1 L1211.2,338.8 L1206.1,336.8 Z"},
  {id:"australia", name:"Australia", area:140, lx:1566.6, ly:650.2, borders:["indonesia", "papua_ng", "new_zealand"], d:"M1627.0,740.3 L1631.8,742.1 L1634.5,741.4 L1638.4,740.4 L1641.4,740.7 L1641.8,747.0 L1640.1,748.8 L1639.6,753.1 L1637.8,751.6 L1634.4,755.3 L1633.3,755.0 L1630.2,754.8 L1627.2,750.3 L1626.5,746.8 L1623.6,742.2 L1623.7,739.8 L1627.0,740.3 Z M1617.8,597.6 L1619.6,601.8 L1622.8,599.8 L1624.5,602.0 L1626.9,604.1 L1626.4,606.4 L1627.4,611.0 L1628.2,613.6 L1629.4,614.2 L1630.8,618.7 L1630.3,621.5 L1631.9,625.1 L1637.4,627.8 L1640.9,630.3 L1644.2,632.6 L1643.6,633.9 L1646.4,637.2 L1648.4,642.9 L1650.4,641.8 L1652.4,644.0 L1653.6,643.2 L1654.5,648.8 L1658.0,652.1 L1660.4,654.1 L1664.3,658.4 L1665.7,662.6 L1665.8,665.6 L1665.5,668.9 L1667.8,673.4 L1667.6,678.0 L1666.7,680.5 L1665.3,685.2 L1665.4,688.2 L1664.5,692.0 L1662.3,696.8 L1658.5,699.4 L1656.7,703.5 L1655.1,706.1 L1653.6,710.6 L1651.6,713.3 L1650.4,717.2 L1649.7,720.9 L1650.0,722.5 L1647.1,724.4 L1641.5,724.5 L1636.9,726.7 L1634.6,728.8 L1631.6,731.0 L1627.4,728.7 L1624.4,727.8 L1625.2,725.0 L1622.4,726.0 L1618.0,729.8 L1613.7,728.4 L1610.9,727.6 L1608.0,727.2 L1603.2,725.7 L1600.0,722.4 L1599.0,718.4 L1597.9,715.7 L1595.4,713.6 L1590.6,713.0 L1592.2,710.4 L1591.0,706.5 L1588.6,710.1 L1584.1,711.1 L1586.8,708.2 L1587.5,705.1 L1589.5,702.5 L1589.1,698.6 L1585.0,703.1 L1581.9,704.9 L1579.9,709.1 L1576.0,707.0 L1576.2,704.2 L1573.1,700.3 L1570.4,698.4 L1571.4,697.1 L1565.0,693.9 L1561.4,693.8 L1556.6,691.2 L1547.7,691.7 L1541.2,693.6 L1535.5,695.4 L1530.7,695.0 L1525.4,697.7 L1521.1,699.0 L1520.1,701.7 L1518.3,703.9 L1514.1,704.0 L1510.9,704.5 L1506.5,703.5 L1502.9,704.1 L1499.5,704.3 L1496.5,707.1 L1495.0,706.9 L1492.5,708.4 L1490.1,710.1 L1486.5,709.9 L1483.1,709.9 L1477.8,706.5 L1475.1,705.5 L1475.2,702.5 L1477.7,701.7 L1478.6,700.5 L1478.4,698.6 L1479.0,695.0 L1478.4,691.8 L1475.8,686.5 L1475.0,683.5 L1475.2,680.5 L1473.2,677.1 L1473.1,675.5 L1470.9,673.4 L1470.2,669.3 L1467.4,665.1 L1466.7,662.8 L1468.9,665.1 L1467.2,660.2 L1469.7,661.8 L1471.2,663.8 L1471.1,661.1 L1468.6,656.9 L1468.1,655.3 L1467.0,653.7 L1467.5,650.6 L1468.5,649.3 L1469.2,646.7 L1468.7,643.6 L1470.7,639.8 L1471.1,643.8 L1473.2,640.2 L1477.3,638.4 L1479.7,636.2 L1483.6,634.3 L1485.8,633.8 L1487.2,634.5 L1491.1,632.5 L1494.2,631.9 L1494.9,630.8 L1496.3,630.3 L1499.0,630.4 L1504.3,628.9 L1507.0,626.5 L1508.3,623.7 L1511.2,621.0 L1511.4,618.9 L1511.6,616.1 L1515.1,611.6 L1517.2,616.1 L1519.3,615.1 L1517.5,612.6 L1519.1,610.0 L1521.3,611.2 L1521.9,607.2 L1524.6,604.6 L1525.8,602.5 L1528.4,601.6 L1528.4,600.1 L1530.6,600.7 L1530.7,599.4 L1532.9,598.6 L1535.3,597.9 L1539.0,600.4 L1541.8,603.5 L1544.9,603.5 L1548.1,604.0 L1547.0,601.1 L1549.4,596.9 L1551.7,595.5 L1550.9,594.2 L1553.1,591.2 L1556.1,589.3 L1558.7,589.9 L1562.9,588.9 L1562.8,586.2 L1559.1,584.5 L1561.8,583.7 L1565.1,585.0 L1567.8,587.2 L1572.0,588.6 L1573.4,588.0 L1576.5,589.6 L1579.4,588.1 L1581.3,588.6 L1582.5,587.6 L1584.8,590.2 L1583.4,593.0 L1581.5,595.1 L1579.8,595.3 L1580.4,597.4 L1578.9,600.1 L1577.1,602.7 L1577.5,604.2 L1581.5,607.1 L1585.3,608.8 L1587.9,610.6 L1591.5,613.7 L1592.9,613.7 L1595.5,615.1 L1596.3,616.7 L1601.1,618.5 L1604.4,616.7 L1605.4,613.8 L1606.4,611.5 L1607.0,608.6 L1608.5,604.4 L1607.8,601.9 L1608.2,600.3 L1607.6,597.3 L1608.3,593.3 L1609.2,592.2 L1608.4,590.5 L1609.6,587.7 L1610.6,584.8 L1610.7,583.3 L1612.6,581.3 L1614.0,583.9 L1614.3,587.2 L1615.6,587.8 L1615.8,590.1 L1617.6,592.7 L1618.0,595.7 L1617.8,597.6 Z"},
  {id:"new_zealand", name:"New Zealand", area:18, lx:1777.1, ly:726.0, borders:["australia"], d:"M1765.1,741.0 L1766.2,743.1 L1769.8,741.0 L1771.2,743.2 L1771.2,745.5 L1769.4,747.9 L1766.1,751.8 L1763.6,753.9 L1765.4,756.4 L1761.5,756.5 L1757.3,758.5 L1755.9,762.0 L1753.1,767.3 L1749.2,769.7 L1746.7,771.2 L1742.1,771.0 L1738.8,769.3 L1733.4,768.9 L1732.5,767.0 L1735.2,763.1 L1741.5,757.9 L1744.7,756.9 L1748.3,754.9 L1752.6,752.1 L1755.6,749.4 L1757.8,745.4 L1759.7,744.1 L1760.5,741.2 L1764.0,738.7 L1765.1,741.0 Z M1773.1,715.8 L1776.7,721.4 L1776.8,717.8 L1779.0,719.2 L1779.8,723.2 L1783.8,724.9 L1787.2,725.4 L1790.1,723.3 L1792.6,723.9 L1791.4,728.6 L1789.9,731.7 L1786.0,731.6 L1784.7,733.2 L1785.2,735.5 L1784.4,736.5 L1782.5,739.3 L1780.1,742.9 L1776.2,745.0 L1775.3,743.6 L1773.3,742.9 L1776.1,738.5 L1774.5,735.6 L1769.1,733.5 L1769.3,731.6 L1772.9,729.8 L1773.7,725.7 L1773.5,722.3 L1771.5,718.8 L1771.6,717.8 L1769.2,715.6 L1765.3,711.0 L1763.2,707.2 L1765.0,706.8 L1767.8,709.8 L1771.6,711.1 L1773.1,715.8 Z"},
  {id:"papua_ng", name:"Papua N.G.", area:18, lx:1632.0, ly:566.8, borders:["indonesia", "australia"], d:"M1679.4,561.0 L1678.0,561.5 L1675.8,559.5 L1673.6,556.1 L1672.6,552.1 L1673.3,551.6 L1673.8,553.2 L1675.3,554.4 L1677.7,557.7 L1680.1,559.5 L1679.4,561.0 Z M1659.9,553.9 L1657.3,554.3 L1656.5,555.8 L1653.8,557.1 L1651.2,558.3 L1648.5,558.3 L1644.5,556.8 L1641.6,555.3 L1642.0,553.7 L1646.5,554.5 L1649.2,554.1 L1650.0,551.5 L1650.7,551.4 L1651.2,554.2 L1654.0,553.8 L1655.4,552.0 L1658.2,550.1 L1657.7,547.0 L1660.7,546.9 L1661.7,547.8 L1661.6,550.7 L1659.9,553.9 Z M1636.0,564.0 L1640.4,567.5 L1643.7,573.1 L1646.5,572.9 L1646.3,575.2 L1650.2,576.1 L1648.7,577.1 L1654.0,579.3 L1653.5,580.9 L1650.1,581.2 L1648.9,579.9 L1644.6,579.3 L1639.6,578.5 L1635.7,575.1 L1632.8,572.2 L1630.2,567.6 L1623.7,565.3 L1619.5,566.8 L1616.4,568.5 L1617.1,572.4 L1613.1,574.2 L1610.3,573.3 L1605.2,573.1 L1605.1,555.9 L1605.0,538.7 L1613.7,542.4 L1622.9,545.4 L1626.4,548.1 L1629.1,550.7 L1629.9,553.8 L1638.2,557.1 L1639.5,559.9 L1634.9,560.5 L1636.0,564.0 Z M1665.7,548.7 L1664.1,550.2 L1663.2,547.0 L1662.0,545.0 L1659.8,543.3 L1656.9,541.0 L1653.3,539.5 L1654.7,538.2 L1657.4,539.7 L1659.1,540.8 L1661.2,542.1 L1663.2,544.3 L1665.1,546.0 L1665.7,548.7 Z"},
];function buildAdj(){
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
  const [showNukeVideo, setShowNukeVideo] = useState(false);
  const [pendingNukeAction, setPendingNukeAction] = useState(null);
  const [screen,setScreen]=useState("home");
  const [droneDisplayMsg, setDroneDisplayMsg] = useState("");
  const droneTyping = useRef(null);
  const [droneMsg, setDroneMsg] = useState("");
  const [droneVisible, setDroneVisible] = useState(false);
  const droneTimer = useRef(null);
  const [showDev,setShowDev]=useState(false);
  const [showDevLogin,setShowDevLogin]=useState(false);
  const [devLoginUser,setDevLoginUser]=useState("");
  const [devLoginPass,setDevLoginPass]=useState("");
  const [devLoginError,setDevLoginError]=useState("");
  const [devData,setDevData]=useState({rooms:[],players:[],loading:false,lastRefresh:null});
  const [devSelectedPlayer,setDevSelectedPlayer]=useState(null);
  const [devConfirm,setDevConfirm]=useState(null); // {msg, onConfirm}
  const [droneyCount, setDroneyCount] = useState(0);
  const [droneyLockUntil, setDroneyLockUntil] = useState(0);
  const [menuTab,setMenuTab]=useState("main");
  const [globalLB,setGlobalLB]=useState([]);
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
  const [myInventory,setMyInventory]=useState({coins:5000,tank:10,bomb:6,plane:2,missile:2,bomber:0,artillery:0,drone:0,air_def:0,spy:0,satellite:0,chem_bomb:0,emp:0,mortar:0,devils_tank:0,stealth_bomber:0,droner_ghoster:0,hell_rainer:0,orbital_hi:0,dirty_bomb:0,lastDaily:"",wood:0,stone:0,iron:0,gold:0,oil:0,uranium:0,nuke_bomb:0,stealth_kit:0,shield:0,buildings:[],lastFactory:0,factoryCount:0,academySpies:0,lastAcademy:0,poisonedCountries:{},empCountries:{}});
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
  const [showGamblingDen,setShowGamblingDen]=useState(false);
  const [blackMarketItems,setBlackMarketItems]=useState([]);
  const [attackPlan,setAttackPlan]=useState(null);
  const [deploy,setDeploy]=useState({tank:0,bomb:0,plane:0,missile:0,bomber:0,artillery:0,drone:0,chem_bomb:0,emp:0,mortar:0,devils_tank:0,stealth_bomber:0,droner_ghoster:0,hell_rainer:0,orbital_hi:0,dirty_bomb:0});
  const [tutStep,setTutStep]=useState(0);
  const [isSingleplayer,setIsSingleplayer]=useState(false);
  const [blitzTimeLeft,setBlitzTimeLeft]=useState(0);
  const [activeCrisis,setActiveCrisis]=useState(null);
  const [worldWonders,setWorldWonders]=useState({}); // {wonderId: ownerUsername}
  const worldWondersRef=useRef({});
  const setWorldWondersSync=(w)=>{worldWondersRef.current=w;setWorldWonders(w);};
  const [showWonders,setShowWonders]=useState(false);
  const [showClanModal,setShowClanModal]=useState(false);
  const [showTrade,setShowTrade]=useState(false);
  const [tradePlayers,setTradePlayers]=useState([]); // players in room with trade post
  const [tradeTarget,setTradeTarget]=useState(null); // selected player to trade with
  const [tradeOffer,setTradeOffer]=useState({coins:0,tank:0,bomb:0,plane:0,missile:0,bomber:0,artillery:0,drone:0,chem_bomb:0,emp:0,mortar:0,devils_tank:0,stealth_bomber:0,wood:0,stone:0,iron:0,gold:0,oil:0,uranium:0});
  const [tradeRequest,setTradeRequest]=useState({coins:0,tank:0,bomb:0,plane:0,missile:0,bomber:0,artillery:0,drone:0,chem_bomb:0,emp:0,mortar:0,devils_tank:0,stealth_bomber:0,wood:0,stone:0,iron:0,gold:0,oil:0,uranium:0});
  const [pendingTrade,setPendingTrade]=useState(null); // incoming trade offer for me
  const [tradeStep,setTradeStep]=useState("pick"); // pick | configure | sent
  const [clanInput,setClanInput]=useState(""); // {event, expiresAt}
  const [crisisTimeLeft,setCrisisTimeLeft]=useState(0);
  const blitzTimerRef=useRef(null);
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
  const [unreadChat,setUnreadChat]=useState(0);
  const [customMsg,setCustomMsg]=useState("");
  const chatEndRef=useRef(null);
  const [showChat,setShowChat]=useState(true);
  const [attackEffects,setAttackEffects]=useState([]);
  const [hoveredCountry,setHoveredCountry]=useState(null);
  const [showCraftShop,setShowCraftShop]=useState(false);

  const DEV_USER="Fenyx2013";
  const DEV_PASS="Pluto2013";

  const fetchDevData=async()=>{
    setDevData(d=>({...d,loading:true}));
    try{
      // Fetch all world rooms
      const roomsRes=await fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({op:"select_all",table:"world",cols:"room_code,players,ownership"})}).then(r=>r.json());
      // Fetch all inventories
      const invRes=await fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({op:"select_all",table:"inventory",cols:"username,data"})}).then(r=>r.json());

      const now=Date.now();
      const rooms=(roomsRes.data||[]).filter(r=>r.room_code!=="__lobby__").map(r=>{
        const ps=Object.entries(r.players||{}).filter(([k])=>!k.startsWith("_"));
        const active=ps.filter(([,v])=>v.ts&&(now-v.ts)<90000); // 90s = must have heartbeated recently
        const territories=Object.values(r.ownership||{}).filter(v=>v&&v!=="__nuked__");
        return{code:r.room_code,totalPlayers:ps.length,activePlayers:active.map(([n])=>n),territories:territories.length};
      }).filter(r=>r.totalPlayers>0||r.territories>0); // show rooms with data even if no players online

      const allPlayers=(invRes.data||[]).map(r=>({
        username:r.username,
        coins:r.data?.coins||0,
        xp:r.data?._xp||0,
        lastSeen:r.data?._lastSeen||null,
        lastRoom:r.data?._lastRoom||null,
        clan:r.data?._clan||"",
        banned:r.data?._banned||false,
        roomHistory:r.data?._roomHistory||[]
      }));

      // Cross-ref rooms to find who is where
      const playerRoomMap={};
      (roomsRes.data||[]).forEach(r=>{
        if(r.room_code==="__lobby__")return;
        Object.entries(r.players||{}).forEach(([name,v])=>{
          if(!name.startsWith("_"))playerRoomMap[name]=r.room_code;
        });
      });

      setDevData({rooms,players:allPlayers,playerRoomMap,loading:false,lastRefresh:new Date().toLocaleTimeString()});
    }catch(e){
      setDevData(d=>({...d,loading:false,lastRefresh:"Error: "+e.message}));
    }
  };

  const devBanPlayer=(username,isBanned)=>{
    const action=isBanned?"UNBAN":"BAN";
    setDevConfirm({
      msg:action+" "+username+"?",
      color:isBanned?"#4ade80":"#f87171",
      onConfirm:async()=>{
        setDevConfirm(null);
        try{
          const {data}=await sb.from("inventory").select("data").eq("username",username).single();
          if(!data?.data){return;}
          const updated={...data.data,_banned:!isBanned};
          await sb.from("inventory").upsert({username,data:updated},{onConflict:"username"});
          fetchDevData();
        }catch(e){}
      }
    });
  };

  const devGiveCoins=(username,currentCoins)=>{
    setDevConfirm({
      msg:"Give 1000 coins to "+username+"?",
      color:"#f5c842",
      onConfirm:async()=>{
        setDevConfirm(null);
        try{
          const {data}=await sb.from("inventory").select("data").eq("username",username).single();
          if(!data?.data)return;
          const updated={...data.data,coins:safeCoins((data.data.coins||0)+1000)};
          await sb.from("inventory").upsert({username,data:updated},{onConflict:"username"});
          fetchDevData();
        }catch(e){}
      }
    });
  };

  const devDeleteRoom=(roomCode)=>{
    setDevConfirm({
      msg:"DELETE room #"+roomCode+"? Cannot be undone.",
      color:"#f87171",
      onConfirm:async()=>{
        setDevConfirm(null);
        try{
          await fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},
            body:JSON.stringify({op:"delete",table:"world",filter:{col:"room_code",val:roomCode}})});
          fetchDevData();
        }catch(e){}
      }
    });
  };

 const droneSay = (key) => {
  const list = DRONE_LINES[key];
  if (!list) return;

  const phrase = list[Math.floor(Math.random() * list.length)];

  setDroneVisible(true);
  setDroneDisplayMsg("");

  clearTimeout(droneTimer.current);
  clearInterval(droneTyping.current);

  let i = 0;

  droneTyping.current = setInterval(() => {
    i++;
    setDroneDisplayMsg(phrase.slice(0, i));

    if (i >= phrase.length) {
      clearInterval(droneTyping.current);

      droneTimer.current = setTimeout(() => {
        setDroneVisible(false);
      }, 2000);
    }
  }, 30);
};

  const gamble=(amount)=>{
    if((myInventory.coins||0)<amount){flash("Not enough coins!","error");return;}
    const win=Math.random()<0.5;
    if(win){
      const ni={...myInventory,coins:safeCoins(myInventory.coins+amount)};
      setMyInventory(ni);
      saveInv(ni);
      flash("🎰 You won "+amount+" coins!","info");
      droneSay("wonGamble");
    } else {
      const ni={...myInventory,coins:safeCoins(myInventory.coins-amount)};
      setMyInventory(ni);
      saveInv(ni);
      flash("🎰 You lost "+amount+" coins...","error");
      droneSay("lostGamble");
    }
  };

  // ── TRADE SYSTEM ──────────────────────────────────────────────────
  const TRADEABLE = ["coins","tank","bomb","plane","missile","bomber","artillery","drone","chem_bomb","emp","stealth_bomber","wood","stone","iron","gold","oil","uranium"];

  const openTrade=async()=>{
    if(isSingleplayer){flash("Trade only works in multiplayer!","error");return;}
    // find all players in room who have trade_post
    const eligible=[];
    for(const [name] of Object.entries(players)){
      if(name===username||name.startsWith("_"))continue;
      try{
        const {data}=await sb.from("inventory").select("data").eq("username",name).single();
        if(data?.data?._buildings?.includes("trade_post")||(data?.data?.buildings||[]).includes("trade_post")){
          eligible.push({name,inv:data.data});
        }
      }catch(e){}
    }
    setTradePlayers(eligible);
    setTradeTarget(null);
    setTradeStep("pick");
    const blank={coins:0,tank:0,bomb:0,plane:0,missile:0,bomber:0,artillery:0,drone:0,chem_bomb:0,emp:0,mortar:0,devils_tank:0,stealth_bomber:0,wood:0,stone:0,iron:0,gold:0,oil:0,uranium:0};
    setTradeOffer({...blank});
    setTradeRequest({...blank});
    setShowTrade(true);
  };

  const sendTradeOffer=async()=>{
    if(!tradeTarget){flash("Select a player first!","error");return;}
    // validate you have what you're offering
    for(const [k,v] of Object.entries(tradeOffer)){
      if(v>0&&(myInventory[k]||0)<v){flash("You don't have enough "+k+"!","error");return;}
    }
    // save trade offer to their inventory as _pendingTrade
    try{
      const {data}=await sb.from("inventory").select("data").eq("username",tradeTarget.name).single();
      if(!data?.data){flash("Player not found!","error");return;}
      const updated={...data.data,_pendingTrade:{
        from:username,
        offer:tradeOffer,    // what I give them
        request:tradeRequest, // what I want from them
        ts:Date.now()
      }};
      await sb.from("inventory").upsert({username:tradeTarget.name,data:updated},{onConflict:"username"});
      setTradeStep("sent");
      flash("Trade offer sent to "+tradeTarget.name+"!","success");
    }catch(e){flash("Failed to send trade offer.","error");}
  };

  const acceptTrade=async()=>{
    if(!pendingTrade)return;
    const {from,offer,request}=pendingTrade;
    // validate both sides have what they need
    for(const[k,v] of Object.entries(request)){
      if(v>0&&(myInventory[k]||0)<v){flash("You don't have enough "+k+" for this trade!","error");return;}
    }
    try{
      // fetch sender's inventory
      const {data:senderData}=await sb.from("inventory").select("data").eq("username",from).single();
      if(!senderData?.data){flash("Sender not found!","error");return;}
      // validate sender still has what they offered
      for(const[k,v] of Object.entries(offer)){
        if(v>0&&(senderData.data[k]||0)<v){flash(from+" no longer has enough "+k+"!","error");return;}
      }
      // update my inventory: receive offer, give request
      const myNew={...myInventory,_pendingTrade:null};
      for(const[k,v] of Object.entries(offer)) if(v>0){if(k==="coins"){myNew[k]=safeCoins((myNew[k]||0)+v);}else{myNew[k]=(myNew[k]||0)+v;}}
      for(const[k,v] of Object.entries(request)) if(v>0){if(k==="coins"){myNew[k]=safeCoins((myNew[k]||0)-v);}else{myNew[k]=Math.max(0,(myNew[k]||0)-v);}}
      // update sender inventory: receive request, give offer
      const senderNew={...senderData.data};
      for(const[k,v] of Object.entries(request)) if(v>0) senderNew[k]=(senderNew[k]||0)+v;
      for(const[k,v] of Object.entries(offer)) if(v>0) senderNew[k]=Math.max(0,(senderNew[k]||0)-v);
      senderNew._pendingTrade=null;
      // save both
      setMyInventory(myNew);await saveInv(myNew);
      await sb.from("inventory").upsert({username:from,data:senderNew},{onConflict:"username"});
      setPendingTrade(null);
      flash("Trade completed with "+from+"! 🤝","success");
    }catch(e){flash("Trade failed: "+e.message,"error");}
  };

  const declineTrade=async()=>{
    const myNew={...myInventory,_pendingTrade:null};
    setMyInventory(myNew);await saveInv(myNew);
    setPendingTrade(null);
    flash("Trade declined.","info");
  };

  const saveWorld=async(o,p)=>{
    if(isSingleplayer)return;
    const rc=roomCodeRef.current||roomCode;
    if(!rc)return;
    // always preserve __nuked__ entries so they are never lost on save
    const nuked=Object.fromEntries(Object.entries(ownershipRef.current||{}).filter(([,v])=>v==="__nuked__"));
    const safeO={...o,...nuked};
    try{await sb.from("world").upsert({room_code:rc,ownership:safeO,players:p},{onConflict:"room_code"});}catch(e){}
  };

  const saveInv=async(inv,name)=>{
    const n=name||username;
    if(!n||isSingleplayer)return;
    try{await sb.from("inventory").upsert({username:n,data:inv},{onConflict:"username"});}catch(e){}
  };

  const flash=(msg,type="info")=>{setNotif({msg,type});setTimeout(()=>setNotif(null),3500);};
  const safeCoins=(n)=>Math.max(0,Math.floor(n??0));

  useEffect(()=>{
    if(screen==="menu"){
      (async()=>{try{
        const {data}=await sb.from("inventory").select("username,data").order("username");
        if(data){
          const lb=data.map(r=>({name:r.username,conquests:r.data?._totalConquests||0,clan:r.data?._clan||""}))
            .filter(r=>r.conquests>0).sort((a,b)=>b.conquests-a.conquests).slice(0,10);
          setGlobalLB(lb);
        }
      }catch(e){}})();
    }
  },[screen]);

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
      // eliminated, color picker, or any other screen — stop all music
      if(menu){menu.pause();menu.currentTime=0;}
      if(map){map.pause();map.currentTime=0;}
    }
  },[screen]);

  useEffect(()=>{
    if(menuAudioRef.current)menuAudioRef.current.volume=musicMuted?0:musicVol;
    if(mapAudioRef.current)mapAudioRef.current.volume=musicMuted?0:musicVol;
  },[musicVol,musicMuted]);

  const CHAT_PROMPTS=[
    {id:"gg",     emoji:"🏆", label:"🏆 GG ",          msg:"GG! Good game everyone"},
    {id:"wp",     emoji:"👏", label:"Well played 👏",  msg:"Well played!"},
    {id:"ggs",    emoji:"😤", label:"EZ 😤",           msg:"Too easy 😤"},
    {id:"rip",    emoji:"💀", label:"RIP 💀",       msg:"RIP 💀"},
    {id:"noob",   emoji:"🫵", label:"Noob! 🫵",        msg:"What a noob 🫵"},
    {id:"truce",  emoji:"🤝", label:"Truce? 🤝",       msg:"Can we truce? 🤝"},
    {id:"letsgo", emoji:"🔥", label:"LET'S GO 🔥",     msg:"LET'S GOOO 🔥"},
    {id:"nice",   emoji:"🎯", label:"Nice one 🎯",     msg:"Nice attack! 🎯"},
    {id:"help",   emoji:"😰", label:"Leave me! 😰",    msg:"Everyone stop attacking me please 😰"},
    {id:"war",    emoji:"⚔",  label:"I declare war ⚔",msg:"⚔ I declare war on you!"},
    {id:"nuke",   emoji:"☢",  label:"☢ Incoming nuke ☢",msg:"☢ NUKE INCOMING!"},
    {id:"rich",   emoji:"💰", label:"I'm rich 💰💰",     msg:"I am filthy rich 💰"},
    {id:"alliance",emoji:"🛡",label:"Alliance? 🛡",    msg:"🛡 Want to form an alliance?"},
    {id:"betrayed",emoji:"😈",label:"Betrayed! 😈",    msg:"HOW DARE YOU BETRAY ME 😈"},
    {id:"soon",   emoji:"👀", label:"I'm coming 👀",   msg:"👀 I'm coming for you..."},
    {id:"tdronyt", emoji:"🤖", label:"🤖Droney", msg:"🤖Droney: Activating..."},
    {id:"hello", emoji:"👋", label:"👋 Hello", msg:"👋 HI!"},
    {id:"yeees", emoji:"✔", label:"Yes ✔", msg:"Yes ✔"},
    {id:"nope", emoji:"⛌", label:"No ⛌", msg:"No ⛌"},
    {id:"trade_chat", emoji:"🤝", label:"Trade?? 🤝", msg:"Who wants to trade?? 🤝"},
    {id:"gamblingme", emoji:"🎰", label:"Love gambling 🎰🎰🎰", msg:"I LOVE GAMBLING!!!!! 🎰🎰🎰"},
    {id:"b_2_bomberrr", emoji:"🖤🛦💣", label:"🖤🛦💣 B-2 Bomber", msg:"A shadow in the sky, and you die. 🖤🛦💣"},
  ];


  const NUKE_RECIPE={uranium:15,iron:17,gold:7,coins:20000};
  const craftNuke=async()=>{
    if((myInventory.uranium||0)<NUKE_RECIPE.uranium){flash("Need 15 Uranium!","error");return;}
    if((myInventory.iron||0)<NUKE_RECIPE.iron){flash("Need 17 Iron!","error");return;}
    if((myInventory.gold||0)<NUKE_RECIPE.gold){flash("Need 7 Gold!","error");return;}
    if((myInventory.coins||0)<NUKE_RECIPE.coins){flash("Need 20000 coins!","error");return;}
    const newInv={...myInventory,
      uranium:(myInventory.uranium||0)-15,
      iron:(myInventory.iron||0)-17,
      gold:(myInventory.gold||0)-7,
      coins:safeCoins((myInventory.coins||0)-20000),
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

  // ESC key cancels attack/satellite mode
  useEffect(()=>{
    const h=(e)=>{
      if(e.key==="Escape"){
        if(satelliteMode)setSatelliteMode(false);
        if(attackMode){setAttackMode(false);setAttackPlan(null);}
      }
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[satelliteMode,attackMode]);
  const [shockedCountries,setShockedCountries]=useState({});
  const [attackNotifs,setAttackNotifs]=useState([]); // [{id,msg,type,ts}]
  const notifIdRef=useRef(0);

  const pushNotif=(msg,type="info")=>{
    const id=++notifIdRef.current;
    setAttackNotifs(prev=>[...prev.slice(-4),{id,msg,type}]);
    setTimeout(()=>setAttackNotifs(prev=>prev.filter(n=>n.id!==id)),4000);
  };
  const [poisonedCountries,setPoisonedCountries]=useState({}); // {countryId: expiresAt} — -20% win for attacker
  const [empCountries,setEmpCountries]=useState({});           // {ownerUsername: expiresAt} — buildings disabled // {countryId: expiresAt timestamp}

  // Clean up expired shocks
  useEffect(()=>{
    // Resource crisis events
    const crisisInterval=isSingleplayer?300000:900000; // 5 min SP, 15 min MP
    const crisisTimer=setInterval(()=>{
      const evt=CRISIS_EVENTS[Math.floor(Math.random()*CRISIS_EVENTS.length)];
      setActiveCrisis({event:evt,expiresAt:Date.now()+(evt.duration||0)});
      if(evt.duration>0)setCrisisTimeLeft(Math.ceil(evt.duration/1000));
      pushNotif("🌐 CRISIS: "+evt.label+" — "+evt.desc,"error");
      // resource_drop: give everyone materials
      if(evt.effect==="resource_drop"){
        setMyInventory(inv=>{
          const n={...inv,wood:(inv.wood||0)+3,stone:(inv.stone||0)+3,iron:(inv.iron||0)+3,gold:(inv.gold||0)+3};
          saveInv(n);return n;
        });
      }
      // Auto-clear after duration
      if(evt.duration>0){
        setTimeout(()=>{
          setActiveCrisis(null);setCrisisTimeLeft(0);
          pushNotif("✅ Crisis resolved: "+evt.label,"success");
        },evt.duration);
      }
    },crisisInterval);

    const t=setInterval(()=>{
      const now=Date.now();
      // crisis countdown
      setCrisisTimeLeft(prev=>prev>0?prev-1:0);
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
    if(!targetOwner||targetOwner===username||targetOwner==="__nuked__"){flash("Must target an enemy country!","error");return;}
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

  const sendCustomChat=async(text)=>{
    if(!text.trim()||isSingleplayer)return;
    await sendChat({msg:text.trim().slice(0,80)});
    setCustomMsg("");
  };

  const sendChat=async(prompt)=>{
    if(isSingleplayer)return;
    const msg={u:username,t:prompt.msg,ts:Date.now()};
    setPlayers(prev=>{
      const next={...prev,_chat:[...(prev._chat||[]).slice(-19),msg]};
      setChatMsgs(next._chat);
      (async()=>{
        try{
          const {data:cur}=await sb.from("world").select("ownership,players").eq("room_code",roomCode).single();
          if(cur)await sb.from("world").upsert({room_code:roomCode,ownership:cur.ownership,players:next},{onConflict:"room_code"});
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
        // check my inventory for pending trades
        if(username&&!isSingleplayer){
          const {data:myData}=await sb.from("inventory").select("data").eq("username",username).single();
          if(myData?.data?._pendingTrade&&myData.data._pendingTrade.ts&&(Date.now()-myData.data._pendingTrade.ts)<300000){
            setPendingTrade(myData.data._pendingTrade);
          } else if(pendingTrade&&(!myData?.data?._pendingTrade)){
            // trade was cleared externally
          }
          if(myData?.data){
            setMyInventory(prev=>({...prev,...myData.data,_name:prev._name,_pwd:prev._pwd}));
          }
        }
        const {data}=await sb.from("world").select("ownership,players").eq("room_code",roomCode).single();
        if(data){
          setOwnership(prev=>{
            const inc=data.ownership||{};
            const nukedFromPrev=Object.fromEntries(Object.entries(prev).filter(([,v])=>v==="__nuked__"));
            const merged={...inc,...nukedFromPrev};
            if(JSON.stringify(prev)===JSON.stringify(merged))return prev;
            // Attack notifications — always fire, radar adds detail
            const lost=Object.keys(prev).filter(id=>prev[id]===username&&merged[id]&&merged[id]!==username&&merged[id]!=="__nuked__");
            const gained=Object.keys(merged).filter(id=>merged[id]===username&&prev[id]&&prev[id]!==username&&prev[id]!=="__nuked__");
            const nuked=Object.keys(merged).filter(id=>prev[id]===username&&merged[id]==="__nuked__");
            if(lost.length>0){
              const attacker=Object.values(merged).filter(v=>v&&v!==username&&v!=="__nuked__").find(v=>lost.some(id=>merged[id]===v))||"Someone";
              const hasRadar=(myInventory.buildings||[]).includes("radar");
              const msg=hasRadar?"⚡ "+attacker+" took "+lost.length+" of your territories!":"🔴 You lost "+lost.length+" territor"+(lost.length===1?"y":"ies")+"!";
              setTimeout(()=>pushNotif(msg,"error"),200);
            }
            if(nuked.length>0){
              setTimeout(()=>pushNotif("☢ One of your territories was nuked!","error"),200);
            }
            if(gained.length>0){
              setTimeout(()=>pushNotif("🟢 You gained "+gained.length+" territor"+(gained.length===1?"y":"ies")+"!","success"),200);
            }
            ownershipRef.current=merged;
            return merged;
          });
          const inc=data.players||{};
          setPlayers(prev=>{
            if(JSON.stringify(prev)===JSON.stringify(inc))return prev;
            // New player joined?
            const prevNames=Object.keys(prev).filter(k=>!k.startsWith("_"));
            const newNames=Object.keys(inc).filter(k=>!k.startsWith("_"));
            const joined=newNames.filter(n=>!prevNames.includes(n)&&n!==username);
            const left=prevNames.filter(n=>!newNames.includes(n)&&n!==username);
            if(joined.length>0)setTimeout(()=>pushNotif("👋 "+joined.join(", ")+" joined the room","info"),200);
            if(left.length>0)setTimeout(()=>pushNotif("👋 "+left.join(", ")+" left the room","info"),200);
            return inc;
          });
          const msgs=inc._chat||[];
          if(inc._wonders)setWorldWondersSync(inc._wonders);
          // check for incoming trade offer
          if(myInv?._pendingTrade&&myInv._pendingTrade.ts&&(Date.now()-myInv._pendingTrade.ts)<300000){
            setPendingTrade(myInv._pendingTrade);
          }
          setChatMsgs(prev=>{
            if(JSON.stringify(prev)===JSON.stringify(msgs))return prev;
            // count new msgs for unread badge
            const newCount=msgs.length-prev.length;
            if(newCount>0){
              setUnreadChat(u=>u+newCount);
              setTimeout(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},100);
            }
            return msgs;
          });
        }
      }catch(e){}
    },3000);
    return()=>clearInterval(poll);
  },[roomCode,screen]);

  useEffect(()=>{
    if(!username||screen!=="map")return;
    const tick=setInterval(()=>{
      setMyInventory(inv=>{
        // EMP disables all buildings including coin factory
      const myBldDisabled=empCountries[username]&&empCountries[username]>Date.now();
      if(myBldDisabled)return inv;
      const fc=(inv.buildings||[]).filter(b=>b==="coin_factory").length;
        const crisisBoost=activeCrisis?.event?.effect==="coins_double"?2:1;
        // oil rig generates oil
        const oilRigs=(inv.buildings||[]).filter(b=>b==="oil_rig").length;
        if(oilRigs>0){
          const now=Date.now();
          const last=inv.lastOilTick||0;
          if(now-last>=120000){// every 2 min
            const gained=oilRigs;
            return {...inv,oil:(inv.oil||0)+gained,lastOilTick:now};
          }
        }
        // bomber factory generates bomber
        const Bomberfactory=(inv.buildings||[]).filter(b=>b==="bomber_factory").length;
        if(Bomberfactory>0){
          const now=Date.now();
          const last=inv.lastBomberTick||0;
          if(now-last>=120000){// every 2 min
            const gained=Bomberfactory;
            return {...inv,bomber:(inv.bomber||0)+gained,lastBomberTick:now};
          }
        }
         // HR bomber factory generates 1 HR bomber
        const HRBomberfactory=(inv.buildings||[]).filter(b=>b==="hell_rainer_factory").length;
        if(HRBomberfactory>0){
          const now=Date.now();
          const last=inv.lastHRBomberTick||0;
          if(now-last>=120000){// every 2 min
            const gained=HRBomberfactory;
            return {...inv,hell_rainer:(inv.hell_rainer||0)+gained,lastHRBomberTick:now};
          }
        }
        // territory taxation: 1 coin per 5 territories every 2 min
        const myTerritories=Object.values(ownershipRef.current||{}).filter(v=>v===username).length;
        if(myTerritories>0){
          const taxNow=Date.now();
          const lastTax=inv.lastTax||0;
          if(taxNow-lastTax>=120000&&myTerritories>=5){
            const tax=Math.floor(myTerritories/5);
            return {...inv,coins:safeCoins(inv.coins+tax),lastTax:taxNow};
          }
        }
        if(fc===0)return inv;
        const vc=(inv.buildings||[]).filter(b=>b==="vault").length;
        const perF=COIN_FACTORY_YIELD+(vc*2);
        const earned=perF*fc;
        const newInv={...inv,coins:safeCoins(inv.coins+earned),lastFactory:Date.now()};
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

      const activeBots=BOT_NAMES;
      let currentO={...o};
      let currentBInv={...bInv};
      activeBots.forEach(bot=>{
        const bMine=Object.keys(currentO).filter(id=>currentO[id]===bot);
        if(bMine.length===0)return;
        if(Math.random()>cfg.attackChance)return;
        const reach=getReachable(bMine,2);
        const targets=[...reach].filter(id=>currentO[id]!==bot);
        if(targets.length===0)return;
        let target;
        const playerTargets=targets.filter(id=>currentO[id]===username);
        if(difficulty==="hard"){
          target=(playerTargets.length>0&&Math.random()<0.6)?playerTargets[Math.floor(Math.random()*playerTargets.length)]:targets[Math.floor(Math.random()*targets.length)];
        }else if(difficulty==="easy"){
          target=targets[Math.floor(Math.random()*targets.length)];
        }else{
          target=targets.sort((a,b)=>{const ca=COUNTRIES.find(c=>c.id===a);const cb=COUNTRIES.find(c=>c.id===b);return (ca?.area||99)-(cb?.area||99);})[0];
        }
        currentO[target]=bot;
        const inv=currentBInv[bot]||{coins:cfg.startCoins,tank:cfg.startTank,bomb:cfg.startBomb,plane:1,missile:cfg.startMissile,bomber:cfg.startBomber};
        const newInv={...inv,coins:inv.coins+cfg.coinsPerTick};
        currentBInv={...currentBInv,[bot]:newInv};
      });
      ownershipRef.current=currentO;
      setOwnership({...currentO});
      botInvRef.current=currentBInv;
      setBotInventories({...currentBInv});

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

  // Intel spy: reveal enemy inventory
  const [intelTarget,setIntelTarget]=useState(null);
  const [intelData,setIntelData]=useState(null);
  const [showIntel,setShowIntel]=useState(false);

  const runIntel=async(country)=>{
    if((myInventory.spy||0)<1&&(myInventory.academySpies||0)<1){flash("Need at least 1 spy for Intel!","error");return;}
    const newInv={...myInventory};
    if((newInv.spy||0)>0)newInv.spy--;else newInv.academySpies=Math.max(0,(newInv.academySpies||0)-1);
    setMyInventory(newInv);await saveInv(newInv);
    const owner=ownership[country.id];
    if(!owner||owner===username){flash("No enemy to spy on!","error");return;}
    try{
      const {data}=await sb.from("inventory").select("data").eq("username",owner).single();
      if(data?.data){setIntelData({owner,inv:data.data});setShowIntel(true);flash("Intel on "+owner+" gathered!","success");addXP(10);unlockAchievement("intel_op");progressMission("intelOps",1);}
      else flash("Could not retrieve intel.","error");
    }catch(e){flash("Intel op failed.","error");}
    setAttackPlan(null);setAttackMode(false);
  };

  // Buy from black market
  const buyBlackMarket=async(item)=>{
    const inv=myInventory;
    // Check cost
    for(const[res,amt] of Object.entries(item.cost)){
      if((inv[res]||0)<amt){flash("Not enough "+res+"!","error");return;}
    }
    const newInv={...inv};
    for(const[res,amt] of Object.entries(item.cost)){if(res==="coins"){newInv[res]=safeCoins((newInv[res]||0)-amt);}else{newInv[res]=Math.max(0,(newInv[res]||0)-amt);}}
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
    if(!amount||amount<=0)return;
    setMissionProgress(prev=>{
      const next={...prev,[stat]:(prev[stat]||0)+amount};
      // Check for newly completed missions (compare before/after)
      const today=getTodayMissions();
      today.forEach(m=>{
        const wasComplete=(prev[m.stat]||0)>=m.goal;
        const nowComplete=next[m.stat]>=m.goal;
        if(nowComplete&&!wasComplete){
          setTimeout(()=>{
            flash("Mission complete: "+m.label+" — open Daily to claim!","success");
          },100);
        }
      });
      // Persist to inventory
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
          if(ownership[id]==="__nuked__")return; // irradiated
          if(shockedCountries[id]&&shockedCountries[id]>now)return; // paralyzed
          const c=COUNTRIES.find(x=>x.id===id);
          if(c?.bonus?.coins) coins+=c.bonus.coins;
        });
        // Wonders coin bonus
        Object.entries(worldWondersRef.current||{}).forEach(([wid,owner])=>{
          if(owner!==username)return;
          const w=WORLD_WONDERS.find(x=>x.id===wid);
          if(w?.bonus?.coins)coins+=w.bonus.coins;
        });
        if(coins===0)return inv;
        return{...inv,coins:safeCoins((inv.coins||0)+coins)};
      });
    },1000);
    // Materials + troops tick every 60s
    const matTick=setInterval(async()=>{
      setMyInventory(inv=>{
        const owned=Object.keys(ownership).filter(id=>ownership[id]===username);
        let wood=0,stone=0,iron=0,gold=0,troops=0,devils1=0,uranium=0,goldCost=0,oil=0;
        owned.forEach(id=>{
          const c=COUNTRIES.find(x=>x.id===id);
          if(!c?.bonus)return;
          if(c.bonus.wood)wood+=c.bonus.wood;
          if(c.bonus.stone)stone+=c.bonus.stone;
          if(c.bonus.iron)iron+=c.bonus.iron;
          if(c.bonus.gold)gold+=c.bonus.gold;
          if(c.bonus.oil)oil+=c.bonus.oil;
          if(c.bonus.troops)troops+=c.bonus.troops;
          if(c.bonus.devils1)devils1+=c.bonus.devils1;
          const mines=(inv.buildings||[]).filter(b=>b==="mine").length;
          if(mines>0){iron+=mines;stone+=mines;}
        });
        // Uranium Extractor: spend 1 gold -> gain 1 uranium
        if((inv.buildings||[]).includes("uranium_ext")){
          const availableGold=(inv.gold||0)+gold;
          if(availableGold>=1){goldCost=1;uranium=1;}
        }
        // World Wonders bonuses
        Object.entries(worldWondersRef.current||{}).forEach(([wid,owner])=>{
          if(owner!==username)return;
          const w=WORLD_WONDERS.find(x=>x.id===wid);
          if(!w)return;
          if(w.bonus.troops)troops+=w.bonus.troops;
          if(w.bonus.devils1)devils1+=w.bonus.devils1;
          if(w.bonus.gold)gold+=w.bonus.gold;
           if(w.bonus.stone)stone+=w.bonus.stone;
          if(w.bonus.wood)wood+=w.bonus.wood;
          if(w.bonus.oil)oil+=w.bonus.oil;
           if(w.bonus.iron)iron+=w.bonus.iron;
          // Dracula's Castle: +3 spies every 8 hours
          if(w.id==="dracula"&&w.bonus.spy){
            const now=Date.now();
            const last=inv._lastDraculaSpy||0;
            if(now-last>=8*60*60*1000){
              inv={...inv,spy:(inv.spy||0)+3,_lastDraculaSpy:now};
              flash("🧛 Dracula's Castle granted you 3 spies!","success");
            }
          }
        });
        if(wood===0&&stone===0&&iron===0&&gold===0&&troops===0&&devils1===0&&uranium===0&&oil===0)return inv;
        const next={...inv,
          wood:(inv.wood||0)+wood,
          stone:(inv.stone||0)+stone,
          iron:(inv.iron||0)+iron,
          gold:(inv.gold||0)+gold-goldCost,
          tank:(inv.tank||0)+troops,
          devils_tank:(inv.devils_tank||0)+devils1,
          uranium:(inv.uranium||0)+uranium,
          oil:(inv.oil||0)+oil,
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

  // While in-game: heartbeat ts into the room players object + save _lastSeen to inventory
  useEffect(()=>{
    if(!username||screen!=="map"||isSingleplayer)return;
    const heartbeat=async()=>{
      try{
        const rc=roomCodeRef.current||roomCode;
        if(!rc)return;
        // Update ts in world room
        const {data}=await sb.from("world").select("ownership,players").eq("room_code",rc).single();
        if(data){
          const newP={...data.players,[username]:{...(data.players[username]||{}),ts:Date.now()}};
          await sb.from("world").upsert({room_code:rc,ownership:data.ownership,players:newP},{onConflict:"room_code"});
        }
        // Save _lastSeen + _lastRoom to inventory
        setMyInventory(inv=>{
          const n={...inv,_lastSeen:Date.now(),_lastRoom:rc};
          setTimeout(()=>saveInv(n),0);
          return n;
        });
      }catch(e){}
    };
    heartbeat();
    const t=setInterval(heartbeat,30000);
    return()=>clearInterval(t);
  },[username,screen,roomCode,isSingleplayer]);

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
        if(saved._banned){setLoginError("❌ This account has been banned.");return;}
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
    // Normalize — fill in any missing keys from new updates
    const defaults={chem_bomb:0,emp:0,stealth_bomber:0,orbital_hi:0,dirty_bomb:0,oil:0,satellite:0,artillery:0,drone:0,air_def:0,spy:0,nuke_bomb:0,stealth_kit:0,shield:0,academySpies:0};
    let changed=false;
    Object.entries(defaults).forEach(([k,v])=>{if(inv[k]===undefined){inv[k]=v;changed=true;}});
    if(changed){setMyInventory({...inv});saveInv(inv);}
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
      ownershipRef.current=o;setOwnership(o);setPlayers(p);
      roomCodeRef.current=code;setRoomCode(code);
      setRecentRooms(prev=>[code,...prev.filter(r=>r!==code)].slice(0,5));
      setScreen("login");
    }catch(e){setRoomError("Error connecting: "+e.message);}
  };

  const startGame=async()=>{
    const rc=roomCodeRef.current||roomCode;
    const uname=usernameRef.current||username;
    if(!rc||!uname){flash("Connection error - please re-enter room code","error");return;}
    // Fetch fresh world state from DB right before saving
    let baseO={};
    let basePlayers={};
    let fetchOk=false;
    try{
      const {data:fresh,error}=await sb.from("world").select("ownership,players").eq("room_code",rc).single();
      if(fresh&&!error){
        baseO=fresh.ownership||{};
        basePlayers=fresh.players||{};
        ownershipRef.current=baseO;
        setOwnership(baseO);
        fetchOk=true;
      }
    }catch(e){}
    if(!fetchOk&&Object.keys(ownershipRef.current).length>0){
      baseO={...ownershipRef.current};
    }
    const newO={...baseO};
    // Only assign new territory if player doesn't already own any countries
    const alreadyOwns=Object.values(newO).some(v=>v===uname);
    if(!alreadyOwns){
      const terr=startTerr(newO);
      terr.forEach(id=>{newO[id]=uname;});
    }
    ownershipRef.current=newO;
    const newP={...basePlayers,[uname]:{cidx,joinedAt:Date.now()}};
    try{
      await sb.from("world").upsert({room_code:rc,ownership:newO,players:newP},{onConflict:"room_code"});
    }catch(e){flash("Save error: "+e.message,"error");}
    setOwnership(newO);setPlayers(newP);
    roomCodeRef.current=rc;
    setRoomCode(rc);
    // Track room history in inventory
    setMyInventory(inv=>{
      const prev=inv._roomHistory||[];
      const updated=[rc,...prev.filter(r=>r!==rc)].slice(0,20); // keep last 20 unique rooms
      const n={...inv,_roomHistory:updated,_lastRoom:rc};
      setTimeout(()=>saveInv(n),0);
      return n;
    });
    if(myInventory.lastDaily!==todayStr())setShowDaily(true);
    // load wonders from room
    setWorldWondersSync(basePlayers?._wonders||{});
    // Daily BM refresh — same items all day, new ones tomorrow
    const bmDate=myInventory._bmDate||"";
    if(bmDate===todayStr()&&myInventory._bmItems&&myInventory._bmItems.length>0){
      setBlackMarketItems(myInventory._bmItems.map(id=>BLACK_MARKET_POOL.find(x=>x.id===id)).filter(Boolean));
    } else {
      const shuffled=[...BLACK_MARKET_POOL].sort(()=>Math.random()-0.5).slice(0,3);
      setBlackMarketItems(shuffled);
      setMyInventory(inv=>{const n={...inv,_bmDate:todayStr(),_bmItems:shuffled.map(x=>x.id)};saveInv(n);return n;});
    }
    setScreen("map");
  };

  const DIFF={
    easy:  {tickMs:3500, startCoins:200,  startTank:1,  startBomb:0, startMissile:0, startBomber:0, coinsPerTick:5,  attackChance:0.2},
    normal:{tickMs:2000, startCoins:400,  startTank:3,  startBomb:1, startMissile:1, startBomber:0, coinsPerTick:12,  attackChance:0.5},
    hard:  {tickMs:1000, startCoins:750, startTank:8, startBomb:4, startMissile:2, startBomber:1, coinsPerTick:20, attackChance:0.75},
    blitz: {tickMs:500,  startCoins:2500, startTank:10, startBomb:6, startMissile:3, startBomber:2, coinsPerTick:75, attackChance:1.0},
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
    const bmDate2=myInventory._bmDate||"";
    if(bmDate2===todayStr()&&myInventory._bmItems&&myInventory._bmItems.length>0){
      setBlackMarketItems(myInventory._bmItems.map(id=>BLACK_MARKET_POOL.find(x=>x.id===id)).filter(Boolean));
    } else {
      const shuffled2=[...BLACK_MARKET_POOL].sort(()=>Math.random()-0.5).slice(0,3);
      setBlackMarketItems(shuffled2);
      setMyInventory(inv=>{const n={...inv,_bmDate:todayStr(),_bmItems:shuffled2.map(x=>x.id)};saveInv(n);return n;});
    }
    setIsSingleplayer(true);
    if(diff==="blitz"){
      setBlitzTimeLeft(600); // 10 minutes
      const t=setInterval(()=>{
        setBlitzTimeLeft(prev=>{
          if(prev<=1){
            clearInterval(t);
            return 0;
          }
          return prev-1;
        });
      },1000);
      blitzTimerRef.current=t;
    }
    setScreen("map");
  };


  const claimDaily=async()=>{
    const vaultCount=(myInventory.buildings||[]).filter(b=>b==="vault").length;
    const vaultBonus=vaultCount*500;
    const total=DAILY_REWARD+vaultBonus;
    const newInv={...myInventory,coins:safeCoins(myInventory.coins+total),lastDaily:todayStr(),_dailyCount:(myInventory._dailyCount||0)+1};
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
    if(r.type==="coins")newInv={...newInv,coins:safeCoins(newInv.coins+r.amount)};
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
    // Arms embargo crisis: +50% prices
    if(activeCrisis?.event?.effect==="shop_expensive")price=Math.floor(price*1.5);
    return price;
  };

  const buyItem=async(item)=>{
    const buildings=myInventory.buildings||[];
    const price=getItemPrice(item,buildings);
    if(myInventory.coins<price){flash("Not enough coins!","error");return;}
    if(item.oilCost&&(myInventory.oil||0)<item.oilCost){flash("Need "+item.oilCost+" Oil to buy "+item.label+"!","error");return;}
    if(item.id==="air_def"&&(myInventory.air_def||0)>=5){flash("Air Defence is maxed at 5!","error");return;}
    const newInv={...myInventory,coins:safeCoins(myInventory.coins-price),[item.id]:(myInventory[item.id]||0)+1};
    if(item.oilCost)newInv.oil=Math.max(0,(myInventory.oil||0)-item.oilCost);
    setMyInventory(newInv);
    await saveInv(newInv);
    playSound("buy");
    flash("Bought "+item.label+"!","success");
    progressMission("weaponsBought",1);
    if(item.id==="bomber")progressMission("bombersUsed",1);
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
    for(const[mat,qty]of Object.entries(cost)){if(mat==="coins"){newInv[mat]=safeCoins((newInv[mat]||0)-qty);}else{newInv[mat]=Math.max(0,(newInv[mat]||0)-qty);}}
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
    {id:"gold",  label:"Gold",  color:"#f59e0b", prices:[{qty:1,cost:800},{qty:5,cost:3500},{qty:10,cost:6500}]}];

  const buyMaterial=async(matId,qty,cost)=>{
    if(myInventory.coins<cost){flash("Not enough coins!","error");return;}
    const newInv={...myInventory,coins:safeCoins(myInventory.coins-cost),[matId]:(myInventory[matId]||0)+qty};
    setMyInventory(newInv);
    await saveInv(newInv);
    flash("Bought "+qty+"x "+matId+"!","success");
    progressMission("coinsEarned",0);
    checkAchievements(newInv,ownership);
  };

  const startAttack=(country)=>{
    if(!attackMode)return;
    if(ownership[country.id]==="__nuked__"){flash(country.name+" is irradiated - permanently uninhabitable!","error");return;}
    if(shockedCountries[country.id]&&shockedCountries[country.id]>Date.now()){flash(country.name+" is paralyzed by satellite strike!","error");return;}
    const mine=Object.keys(ownership).filter(id=>ownership[id]===username);
    const reach=getReachable(mine,myInventory.plane>0?3:2);
    if(!reach.has(country.id)||ownership[country.id]===username)return;
    setAttackPlan({country});
    setDeploy({tank:0,bomb:0,plane:0,missile:0,bomber:0,artillery:0,drone:0,chem_bomb:0,emp:0,stealth_bomber:0,droner_ghoster:0,hell_rainer:0,orbital_hi:0,dirty_bomb:0});
  };

  const confirmAttack=async()=>{
    if(!attackPlan)return;
    const country=attackPlan.country;
    // Validate: can't deploy more than owned
    const weaponKeys=["tank","bomb","plane","missile","bomber","artillery","drone","chem_bomb","emp","mortar","devils_tank","stealth_bomber","droner_ghoster","hell_rainer","nuke_bomb","orbital_hi","dirty_bomb"];
    for(const[id,qty]of Object.entries(deploy)){
      if(!weaponKeys.includes(id))continue;
      if(qty>0&&qty>(myInventory[id]||0)){
        flash("Not enough "+id.replace("_"," ")+"!","error");
        setDeploy(d=>({...d,[id]:myInventory[id]||0}));
        return;
      }
    }
    playSound("attack");
    // EMP strike — disable defender buildings
    if((deploy.emp||0)>0){
      const newInv={...myInventory,emp:(myInventory.emp||0)-(deploy.emp||0)};
      setMyInventory(newInv);
      await saveInv(newInv);
      const defender=ownership[country.id];
      if(defender&&defender!==username){
        const expires=Date.now()+4*60*1000;
        setEmpCountries(prev=>({...prev,[defender]:expires}));
        flash("EMP strike! "+country.name+"'s owner has all buildings disabled for 4 minutes!","success");unlockAchievement("emp_used");progressMission("empsUsed",1);
      }
      setAttackPlan(null);setAttackMode(false);
      return;
    }
   if((deploy.orbital_hi||0)>0){
  if(!(myInventory.buildings||[]).includes("watchtower")){flash("Orbital Railgun requires a Watchtower!","error");return;}
  const newInv={...myInventory,orbital_hi:(myInventory.orbital_hi||0)-1};
  setMyInventory(newInv);await saveInv(newInv);
  const newO={...ownership,[country.id]:username};
  ownershipRef.current=newO;
  setOwnership(newO);
  await saveWorld(newO,players);
  triggerAttackEffect(country);
  flash("🛰️⚡ ORBITAL RAILGUN fired on "+country.name+"! Territory captured!","success");
  setAttackPlan(null);setAttackMode(false);
  return;
}
    // Dirty Bomb — poisons target + ALL adjacent countries for 10 min
    if((deploy.dirty_bomb||0)>0){
      const newInv={...myInventory,dirty_bomb:(myInventory.dirty_bomb||0)-1};
      const won2=Math.random()<0.75; // 75% base win chance
      if(won2){
        const newO={...ownership,[country.id]:username};
        ownershipRef.current=newO;setOwnership(newO);
        await saveWorld(newO,players);
        const expires=Date.now()+10*60*1000;
        const poisoned={[country.id]:expires};
        const adj=(country.borders||[]);
        adj.forEach(id=>{if(ownership[id]&&ownership[id]!==username&&ownership[id]!=="__nuked__")poisoned[id]=expires;});
        setPoisonedCountries(prev=>({...prev,...poisoned}));
        flash("☣ DIRTY BOMB on "+country.name+"! "+Object.keys(poisoned).length+" countries poisoned for 10 min!","success");
      } else {
        flash("☣ Dirty Bomb fizzled — attack failed on "+country.name+".","error");
      }
      setMyInventory(newInv);await saveInv(newInv);
      setAttackPlan(null);setAttackMode(false);
      return;
    }
    if((deploy.nuke_bomb||0)>0){
  const newInv={...myInventory,nuke_bomb:(myInventory.nuke_bomb||0)-1};
  setMyInventory(newInv);
  await saveInv(newInv);
  const newO={...ownership};
  delete newO[country.id];
  setOwnership(newO);
  ownershipRef.current=newO;
  newO[country.id]="__nuked__";
  await saveWorld(newO,players);
  triggerAttackEffect(country);
  playSound("nuke");
  // Store what we need to do after video, then show video
  setPendingNukeAction({country, newInv});
  setShowNukeVideo(true);
  setAttackPlan(null);
  setAttackMode(false);
  return;
}
    const hasReactor=(myInventory.buildings||[]).includes("nuclear_reactor");
    // stealth bomber bypasses air defence
    const hasStealthBomber=(deploy.stealth_bomber||0)>0;
    if(hasStealthBomber&&!(myInventory.buildings||[]).includes("airbase")){
      flash("B-2 Stealth Bomber requires an Airbase to deploy!","error");return;
    }
      const rawDamage=calcDamage(deploy);
    const damage=hasReactor?Math.round(rawDamage*1.5*10)/10:rawDamage;
    const embassyBonus=((myInventory.buildings||[]).includes("embassy"))?0.05:0;
    const defenderOwnerKey=ownership[country.id];
    const defenderHasFortress=false; // can't read opponent buildings in multiplayer
    // Dracula's Castle: -15% for all attackers against wonder owner's territories
    const draculaOwner=Object.entries(worldWondersRef.current||{}).find(([id])=>id==="dracula");
    const draculaPenalty=draculaOwner&&draculaOwner[1]&&draculaOwner[1]===ownership[country.id]?-0.15:0;
    // EMP: if the current player's buildings are disabled, coin factory etc don't apply
    const myBuildingsDisabled=empCountries[username]&&empCountries[username]>Date.now();
    const stealthKit=(myInventory.stealth_kit||0)>0;
    // poison penalty on target country
    const isPoisoned=poisonedCountries[country.id]&&poisonedCountries[country.id]>Date.now();
    const poisonPenalty=isPoisoned?-0.20:0;
    // stealth bomber ignores air defence
    const effectiveAirDef=hasStealthBomber?0:(myInventory.air_def||0);
    const chance=Math.max(0.02,Math.min(0.97,calcWinChance(country.area||20,damage,myInventory.spy||0,myInventory.academySpies||0,effectiveAirDef,defenderHasFortress,stealthKit)+embassyBonus+poisonPenalty+draculaPenalty));
    const pct=Math.round(Math.min(0.97,chance)*100);
    const usedSpy=(myInventory.spy||0)>0||(myInventory.academySpies||0)>0;
    const newInv={...myInventory};
    for(const[id,qty]of Object.entries(deploy)){if(qty>0)newInv[id]=Math.max(0,(newInv[id]||0)-qty);}
    if(stealthKit)newInv.stealth_kit=Math.max(0,(newInv.stealth_kit||0)-1);
    const won=Math.random()<chance;
    triggerAttackEffect(country);
    if(won){
      droneSay("wonAttack");
      playSound("win");
      if(ownership[country.id]==="__nuked__"){flash("Can't conquer irradiated territory!","error");setAttackPlan(null);return;}
      const newO={...ownership,[country.id]:username};
      ownershipRef.current=newO;
      setOwnership(newO);
      await saveWorld(newO,players);
      // chem bomb: poison the country for 2 minutes
      if((deploy.chem_bomb||0)>0){
        const poisonExpires=Date.now()+2*60*1000;
        setPoisonedCountries(prev=>({...prev,[country.id]:poisonExpires}));
        flash("[Win] Conquered "+country.name+"! Poisoned for 2 min — next attacker gets -20% win chance.","success");
      } else {
        flash("[Win] Conquered "+country.name+"! "+damage+" dmg, "+pct+"% chance"+(usedSpy?" [Spy]":"")+(stealthKit?" [Stealth]":""),"success");
      }
      progressMission("wins",1);
      progressMission("conquests",1);
      addXP(20);
      // Update global leaderboard
      (async()=>{try{
        const {data:cur}=await sb.from("inventory").select("data").eq("username",username).single();
        if(cur){const d=cur.data||{};const n={...d,_totalConquests:(d._totalConquests||0)+1};await sb.from("inventory").upsert({username,data:n},{onConflict:"username"});}
      }catch(e){}})();
      checkAchievements(newInv,newO);
    }else{
      droneSay("lostAttack");
    playSound("lose");
      const hasHospital=(myInventory.buildings||[]).includes("hospital");
      if(hasHospital){
        const recoverableWeapons=["tank","bomb","plane","missile","artillery","drone","bomber"];
        let recoveryMsg=[];
        recoverableWeapons.forEach(w=>{
          const deployed=deploy[w]||0;
          if(deployed>0){
            const recovered=Math.floor(deployed*0.3);
            if(recovered>0){newInv[w]=(newInv[w]||0)+recovered;recoveryMsg.push(recovered+" "+w);}
          }
        });
        if(recoveryMsg.length>0){
          flash("[Loss] Failed on "+country.name+" — Hospital recovered: "+recoveryMsg.join(", ")+"!","error");
        } else {
          flash("[Loss] Failed attack on "+country.name+". "+damage+" dmg, "+pct+"% chance - try more firepower!","error");
        }
      } else {
        flash("[Loss] Failed attack on "+country.name+". "+damage+" dmg, "+pct+"% chance - try more firepower!","error");
      }
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
  const lb=Object.entries(Object.values(ownership).filter(o=>o&&o!=="__nuked__").reduce((a,o)=>{a[o]=(a[o]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const canClaimDaily=myInventory.lastDaily!==todayStr();
  const vaultCount=(myInventory.buildings||[]).filter(b=>b==="vault").length;
  const vaultBonus=vaultCount*500;
  const totalDaily=DAILY_REWARD+vaultBonus;
  const curLevel=Math.max(0,TERRA_PASS.findLastIndex(p=>playerXP>=p.xpNeeded));
  const nextLevelData=TERRA_PASS[curLevel+1]||null;
  const prevXP=TERRA_PASS[curLevel]?.xpNeeded||0;
  const xpPct=nextLevelData?Math.round(((playerXP-prevXP)/(nextLevelData.xpNeeded-prevXP))*100):100;
  const todayMissions=getTodayMissions();

  // Blitz winner computation (for render)
  const blitzCounts={};
  if(isSingleplayer&&difficulty==="blitz"&&blitzTimeLeft===0){
    Object.values(ownership).forEach(o=>{if(o&&o!=="__nuked__")blitzCounts[o]=(blitzCounts[o]||0)+1;});
  }
  const blitzWinner=Object.entries(blitzCounts).sort((a,b)=>b[1]-a[1])[0]||null;
  const isBlitzWinner=blitzWinner&&blitzWinner[0]===username;
  // Reset mission progress automatically when day changes
  const todayStr2=todayStr();
  const [lastMissionDate,setLastMissionDate]=useState(todayStr2);
  if(lastMissionDate!==todayStr2&&screen==="map"){
    setLastMissionDate(todayStr2);
    setMissionProgress({});
    setClaimedMissions([]);
  }
  const hasWeapons=(deploy.tank||0)+(deploy.bomb||0)+(deploy.plane||0)+(deploy.missile||0)+(deploy.bomber||0)+(deploy.artillery||0)+(deploy.drone||0)+(deploy.chem_bomb||0)+(deploy.emp||0)+(deploy.mortar||0)+(deploy.devils_tank||0)+(deploy.stealth_bomber||0)+(deploy.droner_ghoster||0)+(deploy.hell_rainer||0)+(deploy.orbital_hi||0)>0;
  const hasReactor=(myInventory.buildings||[]).includes("nuclear_reactor");
  const hasFortress=(myInventory.buildings||[]).includes("fortress");
  const stealthKit=(myInventory.stealth_kit||0)>0;
  const atkDamage=attackPlan?(()=>{const raw=calcDamage(deploy);return hasReactor?Math.round(raw*1.5*10)/10:raw;})():0;
  const defenderOwner=attackPlan?ownership[attackPlan.country.id]:null;
  const atkHasStealthBomber=attackPlan&&(deploy.stealth_bomber||0)>0;
  const atkEffectiveAirDef=atkHasStealthBomber?0:(myInventory.air_def||0);
  const atkIsPoisoned=attackPlan&&poisonedCountries[attackPlan.country.id]&&poisonedCountries[attackPlan.country.id]>Date.now();
  const atkChance=attackPlan?Math.max(0.02,Math.min(0.97,calcWinChance(attackPlan.country.area||20,atkDamage,myInventory.spy||0,myInventory.academySpies||0,atkEffectiveAirDef,false,stealthKit)+(atkIsPoisoned?-0.20:0))):0;
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
          <button onClick={()=>{setShockedCountries({});setScreen("menu");setMenuTab("multiplayer");setOwnership({});setPlayers({});roomCodeRef.current="";setRoomCode("");setIsSingleplayer(false);setBotInventories({});}}
            style={{padding:"13px 32px",background:"linear-gradient(135deg,#1e3a5f,#2563eb)",border:"none",borderRadius:"12px",color:"white",fontSize:"14px",fontWeight:"bold",cursor:"pointer",letterSpacing:"2px",fontFamily:"Georgia,serif"}}>
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // ── DEV DASHBOARD ──────────────────────────────────────────────────
  if(showDev){
    const {rooms,players,playerRoomMap,loading,lastRefresh}=devData;
    const onlinePlayers=players.filter(p=>playerRoomMap?.[p.username]);
    const offlinePlayers=players.filter(p=>!playerRoomMap?.[p.username]);
    return(
      <div style={{minHeight:"100vh",background:"#0a0a0a",fontFamily:"'Courier New',monospace",color:"#00ff88",padding:"0"}}>
        <style>{"@keyframes blink{0%,100%{opacity:1}50%{opacity:0}} .dev-row:hover{background:rgba(0,255,136,.05)!important}"}</style>
        {/* Header */}
        <div style={{background:"#000",borderBottom:"1px solid #00ff88",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#00ff88",animation:"blink 1.5s infinite"}}/>
            <span style={{color:"#00ff88",fontWeight:"bold",letterSpacing:"3px",fontSize:"14px"}}>TERRA CONQUEST // DEV CONSOLE</span>
            <span style={{color:"rgba(0,255,136,.4)",fontSize:"11px"}}>logged as {DEV_USER}</span>
          </div>
          <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
            {lastRefresh&&<span style={{color:"rgba(0,255,136,.4)",fontSize:"11px"}}>last refresh: {lastRefresh}</span>}
            <button onClick={fetchDevData} disabled={loading}
              style={{padding:"5px 14px",background:"transparent",border:"1px solid #00ff88",borderRadius:"4px",color:"#00ff88",cursor:"pointer",fontSize:"11px",fontFamily:"'Courier New',monospace",letterSpacing:"1px"}}>
              {loading?"LOADING...":"⟳ REFRESH"}
            </button>
            <button onClick={()=>setShowDev(false)}
              style={{padding:"5px 14px",background:"transparent",border:"1px solid rgba(0,255,136,.3)",borderRadius:"4px",color:"rgba(0,255,136,.5)",cursor:"pointer",fontSize:"11px",fontFamily:"'Courier New',monospace"}}>
              EXIT
            </button>
          </div>
        </div>

        {devConfirm&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{background:"#0a0a0a",border:"1px solid "+devConfirm.color,borderRadius:"10px",padding:"24px",width:"320px",fontFamily:"'Courier New',monospace",textAlign:"center"}}>
              <div style={{color:devConfirm.color,fontSize:"13px",fontWeight:"bold",marginBottom:"20px",letterSpacing:"1px"}}>{devConfirm.msg}</div>
              <div style={{display:"flex",gap:"10px",justifyContent:"center"}}>
                <button onClick={devConfirm.onConfirm}
                  style={{padding:"8px 24px",background:"rgba(0,0,0,0)",border:"1px solid "+devConfirm.color,borderRadius:"6px",color:devConfirm.color,cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:"12px",fontWeight:"bold",letterSpacing:"1px"}}>
                  CONFIRM
                </button>
                <button onClick={()=>setDevConfirm(null)}
                  style={{padding:"8px 24px",background:"transparent",border:"1px solid rgba(255,255,255,.15)",borderRadius:"6px",color:"rgba(255,255,255,.4)",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:"12px"}}>
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{padding:"24px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",maxWidth:"1400px",margin:"0 auto"}}>

          {/* Active Rooms */}
          <div style={{background:"rgba(0,255,136,.04)",border:"1px solid rgba(0,255,136,.2)",borderRadius:"8px",padding:"18px"}}>
            <div style={{color:"#00ff88",fontWeight:"bold",letterSpacing:"2px",fontSize:"12px",marginBottom:"14px",display:"flex",justifyContent:"space-between"}}>
              <span>◈ ACTIVE ROOMS</span>
              <span style={{color:"rgba(0,255,136,.5)"}}>{rooms.length} rooms</span>
            </div>
            {rooms.length===0
              ?<div style={{color:"rgba(0,255,136,.3)",fontSize:"12px"}}>No active rooms</div>
              :<div>{rooms.map(r=>(
                <div key={r.code} className="dev-row" style={{borderBottom:"1px solid rgba(0,255,136,.08)",padding:"10px 8px",display:"flex",flexDirection:"column",gap:"5px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{color:"#f5c842",fontWeight:"bold",letterSpacing:"2px",fontSize:"13px"}}>#{r.code}</span>
                    <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
                      <span style={{color:"rgba(0,255,136,.6)",fontSize:"11px"}}>{r.activePlayers.length} online</span>
                      <span style={{color:"rgba(0,255,136,.4)",fontSize:"11px"}}>{r.territories} territories</span>
                      <button onClick={()=>devDeleteRoom(r.code)}
                        style={{padding:"2px 8px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:"4px",color:"#f87171",cursor:"pointer",fontSize:"9px",fontFamily:"'Courier New',monospace",letterSpacing:"1px"}}>
                        DELETE
                      </button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {r.activePlayers.map(p=>(
                      <span key={p} style={{background:"rgba(0,255,136,.1)",border:"1px solid rgba(0,255,136,.2)",borderRadius:"3px",padding:"1px 7px",fontSize:"10px",color:"#00ff88"}}>{p}</span>
                    ))}
                  </div>
                </div>
              ))}</div>
            }
          </div>

          {/* Online Players */}
          <div style={{background:"rgba(0,255,136,.04)",border:"1px solid rgba(0,255,136,.2)",borderRadius:"8px",padding:"18px"}}>
            <div style={{color:"#00ff88",fontWeight:"bold",letterSpacing:"2px",fontSize:"12px",marginBottom:"14px",display:"flex",justifyContent:"space-between"}}>
              <span>◉ ONLINE NOW</span>
              <span style={{color:"rgba(0,255,136,.5)"}}>{onlinePlayers.length} players</span>
            </div>
            {onlinePlayers.length===0
              ?<div style={{color:"rgba(0,255,136,.3)",fontSize:"12px"}}>Nobody online</div>
              :<div>{onlinePlayers.map(p=>(
                <div key={p.username} className="dev-row" style={{borderBottom:"1px solid rgba(0,255,136,.08)",padding:"8px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#00ff88",animation:"blink 2s infinite"}}/>
                    <span style={{color:"white",fontSize:"12px"}}>{p.clan?<span style={{color:"#f5c842"}}>[{p.clan}]</span>:null} {p.username}</span>
                  </div>
                  <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
                    <span style={{color:"#f5c842",fontSize:"11px"}}>#{playerRoomMap?.[p.username]}</span>
                    <span style={{color:"rgba(0,255,136,.5)",fontSize:"10px"}}>{p.coins.toLocaleString()} coins</span>
                  </div>
                </div>
              ))}
              </div>
            }
          </div>

          {/* All Players Table */}
          <div style={{gridColumn:"1/-1",background:"rgba(0,255,136,.04)",border:"1px solid rgba(0,255,136,.2)",borderRadius:"8px",padding:"18px"}}>
            <div style={{color:"#00ff88",fontWeight:"bold",letterSpacing:"2px",fontSize:"12px",marginBottom:"14px",display:"flex",justifyContent:"space-between"}}>
              <span>◎ ALL ACCOUNTS</span>
              <span style={{color:"rgba(0,255,136,.5)"}}>{players.length} total</span>
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px"}}>
                <thead>
                  <tr style={{borderBottom:"1px solid rgba(0,255,136,.3)"}}>
                    {["STATUS","USERNAME","CLAN","COINS","XP","ROOM","ACTION"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"6px 10px",color:"rgba(0,255,136,.6)",letterSpacing:"1px",fontWeight:"normal"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...players].sort((a,b)=>b.xp-a.xp).map(p=>{
                    const inRoom=playerRoomMap?.[p.username];
                    return(
                      <tr key={p.username} className="dev-row" onClick={()=>setDevSelectedPlayer(p)} style={{borderBottom:"1px solid rgba(0,255,136,.06)",cursor:"pointer"}}>
                        <td style={{padding:"7px 10px"}}>
                          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:inRoom?"#00ff88":"rgba(0,255,136,.2)",animation:inRoom?"blink 2s infinite":undefined}}/>
                        </td>
                        <td style={{padding:"7px 10px",color:p.banned?"#f87171":inRoom?"white":"rgba(255,255,255,.5)"}}>{p.banned?"🔴 ":""}{p.username}</td>
                        <td style={{padding:"7px 10px",color:"#f5c842"}}>{p.clan||"—"}</td>
                        <td style={{padding:"7px 10px",color:"rgba(0,255,136,.8)"}}>{p.coins.toLocaleString()}</td>
                        <td style={{padding:"7px 10px",color:"rgba(0,255,136,.8)"}}>{p.xp}</td>
                        <td style={{padding:"7px 10px",color:"#f5c842"}}>{inRoom?"#"+inRoom:"offline"}</td>
                        <td style={{padding:"7px 10px",display:"flex",gap:"5px",alignItems:"center"}}>
                          <button onClick={e=>{e.stopPropagation();devBanPlayer(p.username,!!p.banned);}}
                            style={{padding:"2px 8px",background:p.banned?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",border:"1px solid "+(p.banned?"rgba(34,197,94,.3)":"rgba(239,68,68,.3)"),borderRadius:"4px",color:p.banned?"#4ade80":"#f87171",cursor:"pointer",fontSize:"9px",fontFamily:"'Courier New',monospace",letterSpacing:"1px"}}>
                            {p.banned?"UNBAN":"BAN"}
                          </button>
                          <button onClick={e=>{e.stopPropagation();devGiveCoins(p.username,p.coins);}}
                            style={{padding:"2px 8px",background:"rgba(245,200,66,.1)",border:"1px solid rgba(245,200,66,.3)",borderRadius:"4px",color:"#f5c842",cursor:"pointer",fontSize:"9px",fontFamily:"'Courier New',monospace",letterSpacing:"1px"}}>
                            +1000
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Player detail modal */}
        {devSelectedPlayer&&(()=>{
          const p=devSelectedPlayer;
          const inRoom=devData.playerRoomMap?.[p.username];
          return(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}
              onClick={()=>setDevSelectedPlayer(null)}>
              <div style={{background:"#0a0a0a",border:"1px solid #00ff88",borderRadius:"12px",padding:"28px",width:"420px",fontFamily:"'Courier New',monospace"}}
                onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}}>
                  <div style={{color:"#00ff88",fontSize:"14px",fontWeight:"bold",letterSpacing:"2px"}}>{p.username}</div>
                  <button onClick={()=>setDevSelectedPlayer(null)}
                    style={{background:"transparent",border:"none",color:"rgba(0,255,136,.4)",cursor:"pointer",fontSize:"16px"}}>✕</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"16px"}}>
                  {[
                    {label:"STATUS",val:p.banned?"🔴 BANNED":inRoom?"🟢 ONLINE":"⚫ OFFLINE",color:p.banned?"#f87171":inRoom?"#00ff88":"rgba(255,255,255,.3)"},
                    {label:"CURRENT ROOM",val:inRoom?"#"+inRoom:"—",color:"#f5c842"},
                    {label:"COINS",val:(p.coins||0).toLocaleString(),color:"#f5c842"},
                    {label:"XP",val:p.xp||0,color:"#a78bfa"},
                    {label:"CLAN",val:p.clan||"none",color:"#00ff88"},
                    {label:"LAST ROOM",val:p.lastRoom?"#"+p.lastRoom:"—",color:"rgba(255,255,255,.5)"},
                    {label:"LAST SEEN",val:p.lastSeen?new Date(p.lastSeen).toLocaleString():"never",color:"rgba(255,255,255,.4)"},
                  ].map(({label,val,color})=>(
                    <div key={label} style={{background:"rgba(0,255,136,.04)",border:"1px solid rgba(0,255,136,.1)",borderRadius:"6px",padding:"8px 10px"}}>
                      <div style={{color:"rgba(0,255,136,.4)",fontSize:"9px",letterSpacing:"1px",marginBottom:"3px"}}>{label}</div>
                      <div style={{color:color,fontSize:"11px",fontWeight:"bold"}}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{borderTop:"1px solid rgba(0,255,136,.15)",paddingTop:"14px"}}>
                  <div style={{color:"rgba(0,255,136,.4)",fontSize:"9px",letterSpacing:"2px",marginBottom:"8px"}}>CURRENTLY IN ROOM</div>
                  {inRoom
                    ?<div style={{background:"rgba(245,200,66,.08)",border:"1px solid rgba(245,200,66,.2)",borderRadius:"6px",padding:"8px 12px",color:"#f5c842",fontSize:"12px",fontWeight:"bold"}}>#{inRoom}</div>
                    :<div style={{color:"rgba(255,255,255,.25)",fontSize:"11px"}}>Not in any active room</div>
                  }
                  {p.roomHistory&&p.roomHistory.length>0&&(
                    <div style={{marginTop:"12px"}}>
                      <div style={{color:"rgba(0,255,136,.4)",fontSize:"9px",letterSpacing:"2px",marginBottom:"8px"}}>ALL ROOMS JOINED ({p.roomHistory.length})</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
                        {p.roomHistory.map(r=>(
                          <span key={r} style={{background:r===inRoom?"rgba(245,200,66,.15)":"rgba(0,255,136,.06)",border:"1px solid "+(r===inRoom?"rgba(245,200,66,.4)":"rgba(0,255,136,.15)"),borderRadius:"4px",padding:"3px 8px",color:r===inRoom?"#f5c842":"rgba(0,255,136,.7)",fontSize:"10px",fontFamily:"'Courier New',monospace"}}>
                            #{r}{r===inRoom?" ●":""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
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
          <svg width="72" height="72" viewBox="0 0 64 64" style={{marginBottom:"12px",filter:"drop-shadow(0 0 24px rgba(245,200,66,.5))",animation:"pu 3s ease infinite"}}><circle cx="32" cy="32" r="28" fill="rgba(245,200,66,.06)" stroke="#f5c842" strokeWidth="2"/><ellipse cx="32" cy="32" rx="14" ry="28" fill="none" stroke="#f5c842" strokeWidth="1.5" opacity=".5"/><line x1="4" y1="32" x2="60" y2="32" stroke="#f5c842" strokeWidth="1.5" opacity=".5"/><line x1="32" y1="4" x2="32" y2="60" stroke="#f5c842" strokeWidth="1.5" opacity=".3"/><ellipse cx="32" cy="32" rx="28" ry="10" fill="none" stroke="#f5c842" strokeWidth="1" opacity=".25"/><circle cx="32" cy="32" r="4" fill="#f5c842" opacity=".6"/></svg>
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
      {/* Dev access button */}
      <button onClick={()=>{setShowDevLogin(true);setDevLoginError("");}}
        style={{position:"fixed",bottom:"12px",right:"16px",background:"rgba(0,255,136,.08)",border:"1px solid rgba(0,255,136,.25)",borderRadius:"6px",color:"rgba(0,255,136,.5)",cursor:"pointer",fontSize:"10px",fontFamily:"'Courier New',monospace",letterSpacing:"2px",padding:"4px 10px",zIndex:999}}>
        DEV
      </button>

      {showDevLogin&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{background:"#0a0a0a",border:"1px solid #00ff88",borderRadius:"12px",padding:"28px",width:"300px",fontFamily:"'Courier New',monospace"}}>
            <div style={{color:"#00ff88",letterSpacing:"2px",fontSize:"12px",marginBottom:"18px"}}>◈ DEV ACCESS</div>
            <input value={devLoginUser} onChange={e=>setDevLoginUser(e.target.value)}
              placeholder="username" autoFocus
              style={{width:"100%",padding:"8px 10px",background:"rgba(0,255,136,.05)",border:"1px solid rgba(0,255,136,.3)",borderRadius:"6px",color:"#00ff88",fontSize:"12px",fontFamily:"'Courier New',monospace",marginBottom:"8px",boxSizing:"border-box",outline:"none"}}/>
            <input value={devLoginPass} onChange={e=>setDevLoginPass(e.target.value)}
              type="password" placeholder="password"
              onKeyDown={e=>{if(e.key==="Enter"){if(devLoginUser===DEV_USER&&devLoginPass===DEV_PASS){setShowDevLogin(false);setShowDev(true);fetchDevData();}else{setDevLoginError("Access denied.");}}}}
              style={{width:"100%",padding:"8px 10px",background:"rgba(0,255,136,.05)",border:"1px solid rgba(0,255,136,.3)",borderRadius:"6px",color:"#00ff88",fontSize:"12px",fontFamily:"'Courier New',monospace",marginBottom:"8px",boxSizing:"border-box",outline:"none"}}/>
            {devLoginError&&<div style={{color:"#ff4444",fontSize:"11px",marginBottom:"8px"}}>{devLoginError}</div>}
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{
                if(devLoginUser===DEV_USER&&devLoginPass===DEV_PASS){setShowDevLogin(false);setShowDev(true);fetchDevData();}
                else setDevLoginError("Access denied.");
              }} style={{flex:1,padding:"8px",background:"rgba(0,255,136,.1)",border:"1px solid #00ff88",borderRadius:"6px",color:"#00ff88",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:"11px",letterSpacing:"1px"}}>
                LOGIN
              </button>
              <button onClick={()=>{setShowDevLogin(false);setDevLoginUser("");setDevLoginPass("");setDevLoginError("");}}
                style={{padding:"8px 14px",background:"transparent",border:"1px solid rgba(0,255,136,.2)",borderRadius:"6px",color:"rgba(0,255,136,.4)",cursor:"pointer",fontFamily:"'Courier New',monospace",fontSize:"11px"}}>
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }


              
    


  if(screen==="menu"){
    const TUTORIAL_STEPS=[
  {title:"Welcome to Terra Conquest",text:"Conquer the world by capturing countries on the map. You start with a few territories and grow your empire through combat, buildings, economy, and strategy. Be the last player standing — or the first to dominate the map."},
  {title:"The Map",text:"The world map has 100 countries. Your territories glow in your color. Enemy countries are colored by their owner. Dark blue countries are unclaimed — easy pickings early on. Hover any country to see its name, owner, and any bonuses it gives."},
  {title:"Attacking",text:"Press the red ATTACK button in the top bar, then click an enemy or neutral country next to yours. A deploy screen opens — pick your weapons and hit Confirm. Your win chance is shown before you commit. Planes extend your attack range to 3 countries away. Press ESC to cancel."},
  {title:"Standard Weapons",text:"Buy weapons in the War Shop: Tanks (0.5 dmg, cheapest), Bombs (2 dmg), Planes (3 dmg + extended range), Missiles (6 dmg), Artillery (4 dmg), Drones (8 dmg), Bombers (10 dmg, most expensive). Stack weapons for higher damage and better win chance."},
  {title:"Advanced Weapons",text:"Three powerful weapons are bought directly from the War Shop: Chem Bomb (12 dmg, poisons the country for 2 min so the next attacker gets -20% win chance — requires 3 Oil), EMP (0 dmg but disables ALL enemy buildings for 4 minutes — requires 2 Oil), Stealth Bomber (55 dmg, highest in the game, completely bypasses Air Defence). Oil is earned by owning Iraq, Iran, Venezuela, or building an Oil Rig."},
  {title:"Weapons Lab (W LAB)",text:"Click W LAB in the top bar to craft the two most powerful weapons in the game. Nuclear Bomb (10 Uranium + 7 Iron + 2 Gold + 2000 coins) permanently irradiates a country — it turns dark green with a radiation symbol and nobody can ever own it again. Satellite (5 Uranium + 10 Iron + 2 Gold, requires a Watchtower building) paralyzes any enemy country for 5 minutes. Chem Bomb, EMP, and Ghost Bomber are bought directly from the War Shop."},
  {title:"Satellite Strike",text:"Once you craft a Satellite (needs a Watchtower building first), a SAT button appears in the top bar showing how many you have. Click it, then click any enemy country — it goes dark with a purple border and is paralyzed for 5 minutes. The owner cannot attack from it or receive its bonuses during this time."},
  {title:"Oil & Resources",text:"Oil is a new resource used to buy and craft advanced weapons. Earn Oil by: owning Iraq (+2/min), Iran (+1/min), or Venezuela (+1/min), building an Oil Rig (+1 every 2 min per rig, max 2). Oil appears in your Resources panel in the sidebar. Plan ahead — Chem Bombs and EMPs both need it."},
  {title:"Materials",text:"Materials (Wood, Stone, Iron, Gold, Uranium) are gathered passively from country bonuses and buildings. Wood & Stone come from building Mines. Gold is produced by Saudi Arabia and South Africa. Uranium is extracted by the Uranium Extractor building (costs 1 Gold per Uranium). Materials are used to build structures and craft advanced weapons."},
  {title:"Buildings",text:"Open Build Shop in the sidebar to construct buildings using materials. Key buildings: Barracks (cheaper tanks), Airbase (cheaper planes), Coin Factory (passive income), Watchtower (unlocks Satellite + reveals attacker weapons), Fortress (enemies get -10% win chance against you), Oil Rig (+1 Oil/2 min), Hospital (recover 30% of tanks after a loss), Radar Station (see incoming attack weapon counts), Black Market (unlocks rare deals)."},
  {title:"Nuclear Reactor & Economy",text:"Build a Nuclear Reactor to boost ALL your weapon damage by 50% — extremely powerful late game. Earn coins from: Coin Factory buildings (5 coins/sec each), country bonuses (USA +50/sec, Japan +35/sec), territory taxation (1 coin per 5 territories every 2 min), and the daily reward. Vault buildings give +2 coins/sec per factory and boost your daily reward."},
  {title:"Country Bonuses",text:"Certain countries give powerful bonuses when you own them. Coins: USA (+50/sec), Japan (+35/sec). Troops: Russia (+3 tanks/min), China (+2 tanks/min). Resources: Canada (+2 wood/min), Brazil (+1 wood/min), South Africa & Saudi Arabia (+1 gold/min), DRC (+1 stone/min). Oil: Iraq (+2/min), Iran & Venezuela (+1/min). Hover any country to see its bonus."},
  {title:"Spies & Intel",text:"Buy Air Defence to reduce enemy win chance by 5% per unit (max 5). Train Spies via the Spy Academy building. In the attack panel you have two spy options: Spy Thief (steals 500 coins from the enemy) and Intel (reveals the enemy's full inventory — coins, weapons, nukes, everything). Intel costs 1 spy and is your best strategic tool."},
  {title:"Daily Missions & Terra Pass",text:"Three daily missions refresh every day — complete them to earn coins and XP. XP levels up your Terra Pass, unlocking rewards like weapons, coins, and rare materials at each level. Claim your Daily Reward each day for a base 3000 coins plus bonuses from Gold Vault buildings. Don't miss it — it resets daily."}];
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
                  {diff:"hard",   label:"HARD",   sub:"Aggressive - Targets you",      grad:"linear-gradient(135deg,#7f1d1d,#dc2626)", glow:"rgba(220,38,38,.4)",   desc:"Attack every 1s, hunts your territories"}].map(({diff,label,sub,grad,glow,desc})=>(
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
            {menuTab==="leaderboard"&&(
              <div>
                <button onClick={()=>setMenuTab("main")} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",fontSize:"11px",cursor:"pointer",fontFamily:"Georgia,serif",textAlign:"left",padding:"0 0 8px",display:"flex",alignItems:"center",gap:"4px"}}>← Back</button>
                <div style={{textAlign:"center",marginBottom:"14px"}}>
                  <div style={{color:"#f5c842",fontSize:"14px",fontWeight:"bold",letterSpacing:"2px"}}>🏆 GLOBAL LEADERBOARD</div>
                  <div style={{color:"rgba(255,255,255,.3)",fontSize:"10px",marginTop:"3px"}}>Top conquerors of all time</div>
                </div>
                {globalLB.length===0
                  ?<div style={{color:"rgba(255,255,255,.2)",textAlign:"center",fontSize:"12px",padding:"20px"}}>No data yet — go conquer!</div>
                  :<div>{globalLB.map((p,i)=>{
                    const medals=["🥇","🥈","🥉"];
                    const isMe=p.name===username;
                    return(
                      <div key={p.name} style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",background:isMe?"rgba(245,200,66,.08)":"rgba(255,255,255,.03)",border:"1px solid "+(isMe?"rgba(245,200,66,.25)":"rgba(255,255,255,.07)"),borderRadius:"10px",marginBottom:"6px"}}>
                        <span style={{fontSize:"14px",width:"20px"}}>{medals[i]||<span style={{color:"rgba(255,255,255,.3)",fontSize:"11px"}}>{i+1}</span>}</span>
                        <div style={{flex:1}}>
                          <div style={{color:isMe?"#f5c842":"white",fontSize:"12px",fontWeight:isMe?"bold":"normal"}}>
                            {p.clan&&<span style={{color:"#f5c842",fontSize:"10px",opacity:.7}}>[{p.clan}] </span>}{p.name}
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{color:"#f5c842",fontWeight:"bold",fontSize:"13px"}}>{p.conquests.toLocaleString()}</div>
                          <div style={{color:"rgba(255,255,255,.3)",fontSize:"9px"}}>territories</div>
                        </div>
                      </div>
                    );
                  })}</div>
                }
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
          <h2 style={{color:"#f5c842",fontSize:"20px",margin:"0 0 6px",letterSpacing:"4px",textShadow:"0 0 30px rgba(245,200,66,.4)"}}>PICK YOUR COLOR</h2>
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
            ⚔ ENTER THE WORLD
          </button>
        </div>
      </div>
    );
  }

  return(
    <div style={{position:"fixed",inset:0,width:"100%",height:"100%",background:"#060d1a",display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:"Georgia,serif",userSelect:"none"}}>
      <audio ref={menuAudioRef} src="/menu.mp3" loop preload="auto"/>
      <audio ref={mapAudioRef} src="/map.mp3" loop preload="auto"/>
      <style>{"@keyframes pr{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0),0 0 0 0 rgba(239,68,68,0)}50%{box-shadow:0 0 0 8px rgba(239,68,68,.15),0 0 20px rgba(239,68,68,.35)}} @keyframes prBlue{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0)}50%{box-shadow:0 0 0 8px rgba(99,102,241,.2),0 0 20px rgba(99,102,241,.3)}} @keyframes coinIn{from{opacity:0;transform:translateY(-10px) scale(.88)}to{opacity:1;transform:translateY(0) scale(1)}} @keyframes modalIn{from{opacity:0;transform:translateY(-16px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}} @keyframes nukeShake{0%,100%{transform:translate(0)}20%{transform:translate(-3px,2px)}40%{transform:translate(3px,-2px)}60%{transform:translate(-2px,3px)}80%{transform:translate(2px,-1px)}} .cp{transition:all .15s ease} .cp:hover{filter:brightness(1.18);transform:scale(1.04)} button{transition:all .15s ease}"}</style>

      {notif&&(
        <div style={{position:"fixed",top:"60px",left:"50%",transform:"translateX(-50%)",zIndex:9999,
          padding:"10px 22px 10px 16px",borderRadius:"12px",fontSize:"12px",fontWeight:"bold",fontFamily:"Georgia,serif",
          background:notif.type==="success"?"linear-gradient(135deg,#14532d,#16a34a)":notif.type==="error"?"linear-gradient(135deg,#7f1d1d,#dc2626)":"linear-gradient(135deg,#1e3a5f,#2563eb)",
          color:"white",boxShadow:"0 12px 40px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.1)",animation:"coinIn .25s cubic-bezier(.34,1.56,.64,1)",whiteSpace:"nowrap",letterSpacing:".3px",display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"50%",background:notif.type==="success"?"#4ade80":notif.type==="error"?"#fca5a5":"#93c5fd",flexShrink:0,boxShadow:"0 0 8px currentColor"}}/>
          {notif.msg}
        </div>
      )}

      {/* Incoming trade offer */}
      {pendingTrade&&(
        <div style={{position:"fixed",bottom:"80px",right:"244px",zIndex:3000,width:"300px",background:"linear-gradient(135deg,#0a1a0a,#001a00)",border:"1px solid rgba(245,158,11,.5)",borderRadius:"16px",padding:"18px",boxShadow:"0 20px 60px rgba(0,0,0,.7)",animation:"modalIn .3s ease"}}>
          <div style={{color:"#f59e0b",fontWeight:"bold",fontSize:"13px",marginBottom:"10px",letterSpacing:"1px"}}>🤝 Trade Offer from {pendingTrade.from}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
            <div style={{background:"rgba(34,197,94,.06)",border:"1px solid rgba(34,197,94,.15)",borderRadius:"8px",padding:"8px"}}>
              <div style={{color:"rgba(0,255,136,.5)",fontSize:"9px",letterSpacing:"1px",marginBottom:"5px"}}>THEY OFFER YOU</div>
              {Object.entries(pendingTrade.offer).filter(([,v])=>v>0).map(([k,v])=>(
                <div key={k} style={{color:"#4ade80",fontSize:"11px"}}>+{v} {k}</div>
              ))}
              {Object.values(pendingTrade.offer).every(v=>v===0)&&<div style={{color:"rgba(255,255,255,.3)",fontSize:"10px"}}>nothing</div>}
            </div>
            <div style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.15)",borderRadius:"8px",padding:"8px"}}>
              <div style={{color:"rgba(255,100,100,.5)",fontSize:"9px",letterSpacing:"1px",marginBottom:"5px"}}>THEY WANT FROM YOU</div>
              {Object.entries(pendingTrade.request).filter(([,v])=>v>0).map(([k,v])=>(
                <div key={k} style={{color:"#f87171",fontSize:"11px"}}>-{v} {k}</div>
              ))}
              {Object.values(pendingTrade.request).every(v=>v===0)&&<div style={{color:"rgba(255,255,255,.3)",fontSize:"10px"}}>nothing</div>}
            </div>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={acceptTrade} style={{flex:1,padding:"8px",background:"linear-gradient(135deg,#14532d,#16a34a)",border:"none",borderRadius:"8px",color:"white",cursor:"pointer",fontWeight:"bold",fontSize:"12px",fontFamily:"Georgia,serif"}}>ACCEPT</button>
            <button onClick={declineTrade} style={{flex:1,padding:"8px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:"8px",color:"#f87171",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>DECLINE</button>
          </div>
        </div>
      )}

      {/* Trade modal */}
      {showTrade&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setShowTrade(false);}}>
          <div style={{background:"linear-gradient(160deg,#0a1000,#001a00)",border:"1px solid rgba(245,158,11,.3)",borderRadius:"22px",padding:"28px",width:"560px",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 40px 80px rgba(0,0,0,.8)",animation:"modalIn .25s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <div>
                <h2 style={{color:"#f59e0b",fontSize:"18px",margin:"0 0 3px",letterSpacing:"2px"}}>🤝 Trade Post</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Both players need a Trade Post to trade</p>
              </div>
              <button onClick={()=>setShowTrade(false)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"5px 10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>X</button>
            </div>
            {tradeStep==="sent"
              ?<div style={{textAlign:"center",padding:"40px 20px"}}>
                <div style={{fontSize:"48px",marginBottom:"12px"}}>📨</div>
                <div style={{color:"#4ade80",fontSize:"16px",fontWeight:"bold",marginBottom:"8px"}}>Offer Sent!</div>
                <div style={{color:"rgba(255,255,255,.4)",fontSize:"12px",marginBottom:"24px"}}>Waiting for {tradeTarget?.name} to respond...</div>
                <button onClick={()=>{setTradeStep("pick");setTradeTarget(null);}} style={{padding:"10px 24px",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:"12px"}}>
                  New Trade
                </button>
              </div>
              :tradeStep==="pick"
                ?<div>
                  <div style={{color:"rgba(255,255,255,.4)",fontSize:"11px",marginBottom:"12px",letterSpacing:"1px"}}>SELECT A PLAYER</div>
                  {tradePlayers.length===0
                    ?<div style={{textAlign:"center",padding:"30px",color:"rgba(255,255,255,.3)",fontSize:"13px"}}>
                        No other players with a Trade Post in this room.
                      </div>
                    :<div>{tradePlayers.map(p=>(
                        <div key={p.name} onClick={()=>{setTradeTarget(p);setTradeStep("configure");}}
                          style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"rgba(245,158,11,.06)",border:"1px solid rgba(245,158,11,.15)",borderRadius:"12px",marginBottom:"8px",cursor:"pointer"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(245,158,11,.14)"}
                          onMouseLeave={e=>e.currentTarget.style.background="rgba(245,158,11,.06)"}>
                          <div>
                            <div style={{color:"white",fontSize:"13px",fontWeight:"bold"}}>{p.name}</div>
                            <div style={{color:"rgba(255,255,255,.4)",fontSize:"10px",marginTop:"2px"}}>{(p.inv.coins||0).toLocaleString()} coins</div>
                          </div>
                          <div style={{color:"#f59e0b",fontSize:"12px"}}>Trade →</div>
                        </div>
                      ))}</div>
                  }
                </div>
                :<div>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"}}>
                    <button onClick={()=>setTradeStep("pick")} style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>← Back</button>
                    <div style={{color:"#f59e0b",fontSize:"13px",fontWeight:"bold"}}>Trading with {tradeTarget?.name}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginBottom:"16px"}}>
                    <div>
                      <div style={{color:"#4ade80",fontSize:"10px",letterSpacing:"1px",marginBottom:"8px",fontWeight:"bold"}}>YOU OFFER</div>
                      {["coins","tank","bomb","plane","missile","bomber","artillery","drone","chem_bomb","emp","stealth_bomber","wood","stone","iron","gold","oil","uranium"].map(k=>{
                        const have=myInventory[k]||0;
                        if(have===0)return null;
                        return(
                          <div key={k} style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"5px"}}>
                            <span style={{color:"rgba(255,255,255,.5)",fontSize:"10px",flex:1,textTransform:"capitalize"}}>{k}</span>
                            <span style={{color:"rgba(255,255,255,.3)",fontSize:"9px"}}>/{have}</span>
                            <input type="number" min="0" max={have} value={tradeOffer[k]||0}
                              onChange={e=>{const v=Math.min(have,Math.max(0,parseInt(e.target.value)||0));setTradeOffer(prev=>({...prev,[k]:v}));}}
                              style={{width:"52px",padding:"3px 6px",background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",borderRadius:"6px",color:"#4ade80",fontSize:"11px",fontFamily:"Georgia,serif",textAlign:"center",outline:"none"}}/>
                          </div>
                        );
                      })}
                    </div>
                    <div>
                      <div style={{color:"#f87171",fontSize:"10px",letterSpacing:"1px",marginBottom:"8px",fontWeight:"bold"}}>YOU REQUEST</div>
                      {["coins","tank","bomb","plane","missile","bomber","artillery","drone","chem_bomb","emp","stealth_bomber","wood","stone","iron","gold","oil","uranium"].map(k=>{
                        const theyHave=tradeTarget?.inv?.[k]||0;
                        if(theyHave===0)return null;
                        return(
                          <div key={k} style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"5px"}}>
                            <span style={{color:"rgba(255,255,255,.5)",fontSize:"10px",flex:1,textTransform:"capitalize"}}>{k}</span>
                            <span style={{color:"rgba(255,255,255,.3)",fontSize:"9px"}}>/{theyHave}</span>
                            <input type="number" min="0" max={theyHave} value={tradeRequest[k]||0}
                              onChange={e=>{const v=Math.min(theyHave,Math.max(0,parseInt(e.target.value)||0));setTradeRequest(prev=>({...prev,[k]:v}));}}
                              style={{width:"52px",padding:"3px 6px",background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:"6px",color:"#f87171",fontSize:"11px",fontFamily:"Georgia,serif",textAlign:"center",outline:"none"}}/>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={sendTradeOffer}
                    style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#92400e,#f59e0b)",border:"none",borderRadius:"12px",color:"white",fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:"13px",letterSpacing:"2px"}}>
                    SEND TRADE OFFER
                  </button>
                </div>
            }
          </div>
        </div>
      )}
      {showWonders&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setShowWonders(false);}}>
          <div style={{background:"linear-gradient(160deg,#0a0a00,#1a1400)",border:"1px solid rgba(245,200,66,.3)",borderRadius:"22px",padding:"28px",width:"520px",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 40px 80px rgba(0,0,0,.8)",animation:"modalIn .25s ease"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
              <div>
                <h2 style={{color:"#f5c842",fontSize:"18px",margin:"0 0 3px",letterSpacing:"2px"}}>🏛 World Wonders</h2>
                <p style={{color:"rgba(255,255,255,.35)",fontSize:"11px",margin:0}}>Build in the listed country for a permanent empire-wide bonus</p>
              </div>
              <button onClick={()=>setShowWonders(false)} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:"8px",padding:"5px 10px",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:"12px",fontFamily:"Georgia,serif"}}>X</button>
            </div>
            {WORLD_WONDERS.map(w=>{
              const owner=worldWonders[w.id];
              const isMine=owner===username;
              const canBuild=ownership[w.country]===username&&!owner;
              const costMet=canBuild&&Object.entries(w.cost).every(([res,amt])=>(myInventory[res]||0)>=amt);
              const countryName=COUNTRIES.find(c=>c.id===w.country)?.name||w.country;
              return(
                <div key={w.id} style={{background:w.special?"rgba(220,38,38,.06)":isMine?"rgba(245,200,66,.08)":"rgba(255,255,255,.03)",border:"1px solid "+(w.special?"rgba(220,38,38,.3)":isMine?"rgba(245,200,66,.35)":canBuild?"rgba(34,197,94,.3)":"rgba(255,255,255,.08)"),borderRadius:"14px",padding:"14px 16px",marginBottom:"10px"}}>
                  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"6px"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
                        <span style={{color:w.color,fontWeight:"bold",fontSize:"13px"}}>{w.name}</span>
                        {w.special&&<span style={{background:"rgba(220,38,38,.2)",border:"1px solid rgba(220,38,38,.4)",borderRadius:"10px",padding:"1px 8px",color:"#fca5a5",fontSize:"9px",fontWeight:"bold",letterSpacing:"1px"}}>SPECIAL</span>}
                        {isMine&&<span style={{background:"rgba(245,200,66,.15)",border:"1px solid rgba(245,200,66,.3)",borderRadius:"10px",padding:"1px 8px",color:"#f5c842",fontSize:"9px",fontWeight:"bold"}}>YOURS</span>}
                        {owner&&!isMine&&<span style={{color:"rgba(255,255,255,.4)",fontSize:"9px"}}>{owner}</span>}
                      </div>
                      <div style={{color:"rgba(255,255,255,.4)",fontSize:"10px",marginBottom:"4px"}}>{w.desc}</div>
                      <div style={{color:w.color,fontSize:"10px",fontWeight:"bold",marginBottom:"4px"}}>{w.bonus.label}</div>
                      <div style={{color:"rgba(255,255,255,.25)",fontSize:"9px"}}>Must own: {countryName}</div>
                    </div>
                    <div style={{marginLeft:"12px",flexShrink:0}}>
                      {!owner&&canBuild&&(
                        <button onClick={async()=>{
                          if(!costMet){flash("Not enough resources!","error");return;}
                          const n={...myInventory};
                          Object.entries(w.cost).forEach(([res,amt])=>{if(res==="coins"){n[res]=safeCoins((n[res]||0)-amt);}else{n[res]=Math.max(0,(n[res]||0)-amt);}});
                          setMyInventory(n);await saveInv(n);
                          const newW={...worldWondersRef.current,[w.id]:username};
                          setWorldWondersSync(newW);
                          if(roomCode){try{const d2=await sb.from("world").select("players").eq("room_code",roomCode).single();if(d2.data)await sb.from("world").upsert({room_code:roomCode,ownership:ownershipRef.current,players:{...d2.data.players,_wonders:newW}},{onConflict:"room_code"});}catch(e){}}
                          flash("🏛 "+w.name+" built! "+w.bonus.label+" active!","success");addXP(50);
                        }} style={{padding:"8px 14px",background:costMet?"linear-gradient(135deg,#d4a017,#f5c842)":"rgba(255,255,255,.06)",border:"none",borderRadius:"8px",color:costMet?"#000":"rgba(255,255,255,.2)",cursor:costMet?"pointer":"not-allowed",fontSize:"11px",fontWeight:"bold",fontFamily:"Georgia,serif"}}>
                          BUILD
                        </button>
                      )}
                      {!owner&&!canBuild&&<div style={{color:"rgba(255,255,255,.2)",fontSize:"9px",textAlign:"right"}}>Need<br/>{countryName}</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                    {Object.entries(w.cost).map(([res,amt])=>(
                      <span key={res} style={{fontSize:"9px",color:(myInventory[res]||0)>=amt?"#a3e635":"#f87171",background:"rgba(255,255,255,.06)",padding:"2px 7px",borderRadius:"4px"}}>{res}: {amt}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
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
                        setMyInventory(inv=>{const ni={...inv,coins:safeCoins(inv.coins+m.coins),_claimedMissions:next,_missionProgress:missionProgress};(async()=>{try{await saveInv(ni);}catch(e){}})();return ni;});
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
                <h2 style={{color:"white",fontSize:"18px",margin:"0 0 3px",letterSpacing:"1px"}}>=✪= War Shop =✪=</h2>
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
              <div style={{color:"#4ade80",fontSize:"14px",fontWeight:"bold",letterSpacing:"2px",textTransform:"uppercase"}}>⚗ Weapons Lab</div>
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
              {[["uranium","Uranium",15,"#4ade80"],["iron","Iron",17,"#6b7280"],["gold","Gold",7,"#f59e0b"],["coins","Coins",20000,"#f5c842"]].map(([id,label,req,color])=>{
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
              disabled={(myInventory.uranium||0)<15||(myInventory.iron||0)<17||(myInventory.gold||0)<7||(myInventory.coins||0)<20000}
              style={{width:"100%",padding:"10px",background:(myInventory.uranium||0)>=15&&(myInventory.iron||0)>=17&&(myInventory.gold||0)>=7&&(myInventory.coins||0)>=20000?"linear-gradient(135deg,#052010,#166534)":"rgba(255,255,255,.04)",border:"1px solid "+((myInventory.uranium||0)>=10&&(myInventory.iron||0)>=7&&(myInventory.gold||0)>=2&&(myInventory.coins||0)>=2000?"rgba(34,197,94,.5)":"rgba(255,255,255,.08)"),borderRadius:"8px",color:(myInventory.uranium||0)>=10&&(myInventory.iron||0)>=7&&(myInventory.gold||0)>=2&&(myInventory.coins||0)>=2000?"#22c55e":"rgba(255,255,255,.2)",cursor:(myInventory.uranium||0)>=10&&(myInventory.iron||0)>=7&&(myInventory.gold||0)>=2&&(myInventory.coins||0)>=2000?"pointer":"not-allowed",fontWeight:"bold",fontSize:"12px",fontFamily:"Georgia,serif",letterSpacing:"1px"}}>
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
              {id:"tank",      label:"\u{1FA96} Tanks",      dmg:DMG.tank,      color:"#f59e0b"},
              {id:"bomb",      label:"\u{1F4A3} Bombs",      dmg:DMG.bomb,      color:"#ef4444"},
              {id:"plane",     label:"✈️ Planes ",     dmg:DMG.plane,     color:"#3b82f6"},
              {id:"missile",   label:"🚀 Missiles",   dmg:DMG.missile,   color:"#f97316"},
              {id:"artillery", label:"🛦🔥 Artillery",  dmg:DMG.artillery, color:"#a78bfa"},
              {id:"drone",     label:"🛰 Drones",     dmg:DMG.drone,     color:"#06b6d4"},
              {id:"bomber",    label:"🛦💣 Bombers",    dmg:DMG.bomber,    color:"#dc2626"},
              {id:"chem_bomb",    label:"💣☣️ Chem Bomb", dmg:DMG.chem_bomb,   color:"#84cc16"},
              {id:"emp",          label:"⚡📡 EMP",  dmg:0,               color:"#f0abfc"},
              {id:"mortar",          label:"🌀🌫️💣 Fading Reboot Mortar",  dmg:DMG.mortar,               color:"#565051"},
              {id:"devils_tank",          label:"😈🔥\u{1FA96} Devil's Troops",  dmg:DMG.devils_tank,               color:"#FF6A00"},
              {id:"droner_ghoster",    label:"🛰🔍❌ L.O.S.T Drone",    dmg:DMG.droner_ghoster,    color:"#A020F0"},
              {id:"hell_rainer",    label:"💣🌧😈🔥 H.E.L.L R.A.I.N. BOMBER",    dmg:DMG.hell_rainer,    color:"#880808"},
              {id:"stealth_bomber",label:"🖤🛦💣 B-2 Stealth Bomber",  dmg:DMG.stealth_bomber, color:"#c084fc"},
              {id:"orbital_hi",label:"🛰️⚡💥Orbital Railgun",  dmg:DMG.orbital_hi, color:"##0096FF"},
              {id:"nuke_bomb", label:"☢️ Nuke ☢️",       dmg:999,           color:"#22c55e"}].map(({id,label,dmg,color})=>{
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
      <div style={{position:"fixed",top:0,left:0,right:0,height:"48px",background:"linear-gradient(180deg,rgba(4,10,22,.99) 0%,rgba(4,10,22,.95) 100%)",borderBottom:"1px solid rgba(255,255,255,.08)",padding:"0 14px",display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:100,backdropFilter:"blur(12px)"}}>
        {/* left: player badge */}
        <div style={{display:"flex",alignItems:"center",gap:"8px",minWidth:"180px"}}>
          <div style={{width:"28px",height:"28px",borderRadius:"8px",background:"rgba(255,255,255,.06)",border:"1px solid "+myC.bg+"66",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <div style={{width:"10px",height:"10px",borderRadius:"50%",background:myC.bg,boxShadow:"0 0 8px "+myC.bg}}/>
          </div>
          <div>
            <div style={{color:"white",fontSize:"12px",fontWeight:"bold",letterSpacing:".3px",lineHeight:1}}>{username}</div>
            <div style={{display:"flex",gap:"6px",marginTop:"2px"}}>
              <span style={{color:myC.light,fontSize:"9px",opacity:.8}}>{mine.length} territories</span>
              <span style={{color:"#f5c842",fontSize:"10px",fontWeight:"bold"}}>{myInventory.coins.toLocaleString()}<span style={{color:"rgba(255,200,50,.4)",fontSize:"8px",marginLeft:"2px"}}>coins</span></span>
            </div>
          </div>
        </div>

        {/* center: weapon quick-bar */}
        <div style={{display:"flex",alignItems:"center",gap:"3px",flex:1,justifyContent:"center",overflow:"hidden",padding:"0 8px"}}>
          {[
            {id:"tank",icon:"T",color:"#f59e0b"},{id:"bomb",icon:"B",color:"#ef4444"},
            {id:"plane",icon:"P",color:"#3b82f6"},{id:"missile",icon:"M",color:"#f97316"},
            {id:"artillery",icon:"A",color:"#e879f9"},{id:"drone",icon:"D",color:"#06b6d4"},
            {id:"bomber",icon:"X",color:"#dc2626"},{id:"air_def",icon:"AD",color:"#6366f1"},
            {id:"spy",icon:"S",color:"#10b981"},
            {id:"emp",icon:"E",color:"#f0abfc"},
            {id:"droner_ghoster",icon:"L",color:"#A020F0"},
            {id:"devils_tank",icon:"D",color:"#FF6A00"},
            {id:"stealth_bomber",icon:"SB",color:"#c084fc"},
            {id:"chem_bomb",icon:"CB",color:"#84cc16"},
            {id:"hell_rainer",icon:"HR",color:"#880808"},
            {id:"mortar",icon:"FRM",color:"#565051"},
            {id:"orbital_hi",icon:"ORB",color:"#0096FF"},
            {id:"nuke_bomb",icon:"N",color:"#22c55e"}].filter(w=>(myInventory[w.id]||0)>0).map(w=>(
            <div key={w.id} title={w.id} style={{display:"flex",alignItems:"center",gap:"2px",padding:"3px 6px",background:"rgba(255,255,255,.05)",borderRadius:"5px",border:"1px solid "+w.color+"33",flexShrink:0}}>
              <span style={{color:w.color,fontSize:"8px",fontWeight:"bold",letterSpacing:".5px"}}>{w.icon}</span>
              <span style={{color:"rgba(255,255,255,.8)",fontWeight:"bold",fontSize:"10px"}}>{myInventory[w.id]}</span>
            </div>
          ))}
        </div>

        {/* right: action buttons */}
        <div style={{display:"flex",alignItems:"center",gap:"6px",minWidth:"fit-content"}}>
          <button onClick={()=>setShowCraftShop(s=>!s)}
            style={{padding:"5px 11px",height:"30px",background:showCraftShop?"linear-gradient(135deg,rgba(34,197,94,.25),rgba(34,197,94,.1))":"rgba(255,255,255,.05)",border:"1px solid "+(showCraftShop?"rgba(34,197,94,.5)":"rgba(255,255,255,.1)"),borderRadius:"7px",color:showCraftShop?"#4ade80":"rgba(255,255,255,.45)",cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif",letterSpacing:"1px",fontWeight:"bold",transition:"all .2s"}}>
            ⚗ W LAB
          </button>
          {(myInventory.satellite||0)>0&&(
            <button onClick={()=>{setSatelliteMode(s=>!s);setAttackMode(false);setAttackPlan(null);}}
              style={{padding:"5px 11px",height:"30px",background:satelliteMode?"linear-gradient(135deg,rgba(99,102,241,.4),rgba(99,102,241,.2))":"rgba(99,102,241,.08)",border:"1px solid "+(satelliteMode?"#6366f1":"rgba(99,102,241,.25)"),borderRadius:"7px",color:satelliteMode?"#c7d2fe":"rgba(99,102,241,.6)",cursor:"pointer",fontSize:"10px",fontFamily:"Georgia,serif",letterSpacing:".5px",fontWeight:"bold",animation:satelliteMode?"pr 1.5s infinite":undefined,transition:"all .2s"}}>
              ◈ SAT ({myInventory.satellite})
            </button>
          )}
          <button onClick={()=>{setAttackMode(m=>!m); droneSay("attack")}}
            style={{padding:"5px 14px",height:"30px",background:attackMode?"linear-gradient(135deg,#991b1b,#dc2626)":"rgba(239,68,68,.08)",border:"1px solid "+(attackMode?"#ef4444":"rgba(239,68,68,.2)"),borderRadius:"7px",color:attackMode?"white":"rgba(239,68,68,.7)",cursor:"pointer",fontSize:"10px",fontWeight:"bold",fontFamily:"Georgia,serif",letterSpacing:"1px",animation:attackMode?"pr 1.5s infinite":undefined,transition:"all .2s",whiteSpace:"nowrap"}}>
            {attackMode?"✕ CANCEL":"⚔ ATTACK"}
          </button>
          <button onClick={()=>{setAttackMode(false);setSatelliteMode(false);setShockedCountries({});setScreen("menu");setRoomInput("");roomCodeRef.current="";setRoomCode("");ownershipRef.current={};setOwnership({});setPlayers({});setMenuTab("multiplayer");setIsSingleplayer(false);setBotInventories({});}}
            style={{padding:"5px 10px",height:"30px",background:"transparent",border:"1px solid rgba(255,255,255,.08)",borderRadius:"7px",color:"rgba(255,255,255,.3)",cursor:"pointer",fontSize:"11px",fontFamily:"Georgia,serif",transition:"all .2s"}}>
            ← Exit
          </button>
        </div>
      </div>

      {/* main area: map + right sidebar */}
      <div style={{flex:1,display:"flex",flexDirection:"row",overflow:"hidden",minHeight:0}}>

        {/* map */}
        <div style={{position:"fixed",top:"48px",left:0,right:"230px",bottom:0,overflow:"hidden",background:"radial-gradient(ellipse at 50% 40%,#061428 0%,#030810 60%,#020608 100%)"}}>

          {/* Attack flash effects */}
          {satelliteMode&&(
            <div style={{position:"absolute",top:"12px",left:"50%",transform:"translateX(-50%)",zIndex:500,background:"linear-gradient(135deg,rgba(49,46,129,.95),rgba(67,56,202,.95))",border:"1px solid rgba(99,102,241,.7)",borderRadius:"12px",padding:"9px 22px",color:"#e0e7ff",fontSize:"11px",fontWeight:"bold",letterSpacing:"1.5px",pointerEvents:"none",animation:"prBlue 1.5s infinite",boxShadow:"0 8px 32px rgba(99,102,241,.4)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{animation:"pu 1s ease infinite",display:"inline-block"}}>◈</span>
              SATELLITE TARGETING — Click enemy country
              <span style={{fontSize:"9px",color:"rgba(255,255,255,.4)",letterSpacing:"0"}}>ESC to cancel</span>
            </div>
          )}
          {attackMode&&!satelliteMode&&(
            <div style={{position:"absolute",top:"12px",left:"50%",transform:"translateX(-50%)",zIndex:500,background:"linear-gradient(135deg,rgba(127,29,29,.95),rgba(185,28,28,.95))",border:"1px solid rgba(239,68,68,.5)",borderRadius:"12px",padding:"9px 22px",color:"#fecaca",fontSize:"11px",fontWeight:"bold",letterSpacing:"1.5px",pointerEvents:"none",animation:"pr 1.5s infinite",boxShadow:"0 8px 32px rgba(239,68,68,.3)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{animation:"pu 1.2s ease infinite",display:"inline-block"}}>⚔</span>
              ATTACK MODE — Click a highlighted country
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
          <svg ref={svgRef} viewBox="0 0 1800 950" preserveAspectRatio="xMinYMin meet" style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",display:"block",background:"#091929"}}
            onMouseMove={e=>{
              const r=svgRef.current?.getBoundingClientRect();
              if(r)setTip(t=>({...t,x:e.clientX-r.left,y:e.clientY-r.top}));
            }}
            onMouseLeave={()=>{setHovered(null);setTip(t=>({...t,show:false}));}}>
            <defs>
              {/* Deep ocean gradient */}
              <radialGradient id="ocean" cx="50%" cy="45%" r="75%">
                <stop offset="0%" stopColor="#1a4a6e"/>
                <stop offset="35%" stopColor="#0d3356"/>
                <stop offset="70%" stopColor="#072240"/>
                <stop offset="100%" stopColor="#030f1e"/>
              </radialGradient>
              {/* Land base color for unowned territories - earthy tone */}
              <linearGradient id="landBase" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4a6741"/>
                <stop offset="50%" stopColor="#3d5c38"/>
                <stop offset="100%" stopColor="#2e4a2a"/>
              </linearGradient>
              {/* Terrain texture overlay */}
              <filter id="terrain" x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="2" result="noise"/>
                <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
                <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blend"/>
                <feComposite in="blend" in2="SourceGraphic" operator="in"/>
              </filter>
              {/* Shadow/depth for countries */}
              <filter id="countryDepth" x="-8%" y="-8%" width="116%" height="116%">
                <feDropShadow dx="1.5" dy="2" stdDeviation="2.5" floodColor="rgba(0,0,0,0.55)" floodOpacity="1"/>
              </filter>
              {/* Owned country glow */}
              <filter id="ownedGlow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(255,255,255,0.25)" floodOpacity="1"/>
              </filter>
              {/* Ocean shimmer */}
              <filter id="oceanShimmer">
                <feTurbulence type="turbulence" baseFrequency="0.02 0.06" numOctaves="4" seed="5" result="waveNoise"/>
                <feDisplacementMap in="SourceGraphic" in2="waveNoise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
              </filter>
              {/* Vignette overlay */}
              <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
                <stop offset="50%" stopColor="rgba(0,0,0,0)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0.55)"/>
              </radialGradient>
              {/* Arctic/polar ice gradient */}
              <linearGradient id="polarIce" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#cce8f4"/>
                <stop offset="100%" stopColor="#a8d4eb"/>
              </linearGradient>
              {/* Equatorial warm glow */}
              <radialGradient id="equatorialWarm" cx="50%" cy="60%" r="50%">
                <stop offset="0%" stopColor="rgba(180,120,40,0.08)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
              </radialGradient>
            </defs>

            {/* Ocean base */}
            <rect width="1800" height="950" fill="#072030"/>
            <rect width="1800" height="950" fill="url(#ocean)"/>

            {/* Equatorial atmospheric warmth */}
            <rect width="1800" height="950" fill="url(#equatorialWarm)" opacity="0.6"/>

            {/* Graticule lines (lat/lon grid) - aligned to real geo projection */}
            <g opacity="0.09" stroke="#8ab4d4" strokeWidth="0.5" fill="none">
              {/* Latitude lines at 70,60,50,40,30,20,10,0,-10,-20,-35 */}
              {[88,155,222,290,357,425,492,559,627,694,795].map((y,i)=>(
                <line key={`lat${i}`} x1="0" y1={y} x2="1800" y2={y}/>
              ))}
              {/* Longitude lines every 30° */}
              {[0,30,60,90,120,150,180,210,240,270,300,330].map(lon=>{
                const x = Math.round((lon + 180) / 360 * 1800);
                return <line key={`lon${lon}`} x1={x} y1="0" x2={x} y2="950"/>;
              })}
              {/* Equator — brighter */}
              <line x1="0" y1="559" x2="1800" y2="559" stroke="#aaccee" strokeWidth="0.9" opacity="0.35"/>
              {/* Tropics of Cancer (23.5°N ≈ 411px) and Capricorn (23.5°S ≈ 707px) */}
              <line x1="0" y1="411" x2="1800" y2="411" strokeDasharray="10,7" opacity="0.55"/>
              <line x1="0" y1="707" x2="1800" y2="707" strokeDasharray="10,7" opacity="0.55"/>
              {/* Arctic/Antarctic circles (66.5°N ≈ 108px, 66.5°S ≈ 810px) */}
              <line x1="0" y1="108" x2="1800" y2="108" strokeDasharray="4,8" opacity="0.3"/>
              <line x1="0" y1="810" x2="1800" y2="810" strokeDasharray="4,8" opacity="0.3"/>
            </g>

            {/* Ocean depth shading - darker patches for deep ocean */}
            <ellipse cx="500" cy="500" rx="300" ry="200" fill="rgba(0,15,35,0.3)" opacity="0.4"/>
            <ellipse cx="1300" cy="450" rx="280" ry="180" fill="rgba(0,15,35,0.3)" opacity="0.4"/>
            <ellipse cx="900" cy="250" rx="200" ry="120" fill="rgba(0,15,35,0.25)" opacity="0.35"/>

            {/* Subtle ocean shimmer/waves (very light) */}
            <rect width="1800" height="950" fill="none" stroke="none" opacity="0.04"
              style={{backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(120,180,255,0.06) 18px,rgba(120,180,255,0.06) 19px)"}}/>

            {[...COUNTRIES].sort((a,b)=>b.area-a.area).map(c=>{
              const owner=ownership[c.id]==="__nuked__"?null:ownership[c.id];
              const isMe=owner===username;
              const ownerIdx=owner&&players[owner]?players[owner].cidx:null;
              const ownerColor=owner?(CLRS[ownerIdx%CLRS.length]?.bg||"#555"):null;
              const inReach=reachable.has(c.id);
              const isHovered=hovered===c.id;
              const isShocked=shockedCountries[c.id]&&shockedCountries[c.id]>Date.now();
              const shockSecsLeft=isShocked?Math.ceil((shockedCountries[c.id]-Date.now())/1000):0;
              const isNuked=ownership[c.id]==="__nuked__";

              // Realistic terrain colors based on latitude (new equirectangular projection)
              // ly: 83°N=0px, 60°N=155px, 50°N=222px, 30°N=357px, 0°=559px, -35°S=795px, -58°S=950px
              const ly=c.ly||400;
              let baseFill;
              if(ly<88){baseFill="#c8dde8";}// polar/arctic ≥70°N - icy
              else if(ly<155){baseFill="#8ab89c";}// sub-arctic 60-70°N - tundra
              else if(c.id==="greenland"){baseFill="#c2dce8";}// ice sheet
              else if(c.id==="mali"||c.id==="niger"||c.id==="chad"||c.id==="mauritania"||c.id==="libya"||c.id==="egypt"||c.id==="saudi"||c.id==="mongolia"||c.id==="kazakhstan"||c.id==="iraq"||c.id==="iran"||c.id==="afghanistan"||c.id==="algeria"||c.id==="oman"||c.id==="yemen"||c.id==="uae"||c.id==="pakistan"||c.id==="namibia"||c.id==="botswana"){
                baseFill="#c4a96b";}// desert/arid - sandy tan
              else if(c.id==="brazil"||c.id==="colombia"||c.id==="venezuela"||c.id==="indonesia"||c.id==="malaysia"||c.id==="myanmar"||c.id==="laos"||c.id==="vietnam"||c.id==="cambodia"||c.id==="thailand"||c.id==="nigeria"||c.id==="cameroon"||c.id==="drc"||c.id==="guinea"){
                baseFill="#4e8c45";}// tropical jungle - deep green
              else if(c.id==="russia"||c.id==="canada"||c.id==="norway"||c.id==="sweden"||c.id==="finland"){
                baseFill="#6e9970";}// boreal forest - muted green
              else if(c.id==="australia"){baseFill="#b89c60";}// outback/scrub
              else if(ly>795){baseFill="#9db87a";}// southern temperate ≤-35°S
              else if(ly>694){baseFill="#8aad7a";}// southern mid-lat -20 to -35
              else if(ly>222&&ly<559){baseFill="#6b9e5c";}// northern temperate 0-50°N
              else{baseFill="#5a8f5a";}// default green

              let fill, stroke, sw, opacity, filterAttr;

              if(isNuked){
                fill="#1a2e1a"; stroke="#00dd44"; sw=1.2; opacity=0.88; filterAttr=undefined;
              } else if(isShocked){
                fill="#10103a"; stroke="#6366f1"; sw=1.5; opacity=0.7; filterAttr=undefined;
              } else if(owner){
                // Owned: blend player color with a slight terrain tint
                fill=ownerColor; stroke=isMe?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.22)";
                sw=isMe?1.4:0.8; opacity=isMe?0.88:0.78;
                filterAttr=isMe?"url(#ownedGlow)":"url(#countryDepth)";
              } else {
                // Unowned: realistic terrain
                fill=baseFill; stroke="rgba(80,60,30,0.55)"; sw=0.7; opacity=0.82;
                filterAttr="url(#countryDepth)";
              }

              if(!isShocked&&!isNuked&&attackMode&&inReach&&!isMe){
                stroke="#ff3333"; sw=1.8;
                fill=isHovered?(owner?ownerColor+"dd":baseFill):(owner?ownerColor:baseFill);
                opacity=isHovered?1:0.88;
              }
              if(!isShocked&&!isNuked&&isHovered){opacity=1;}

              const showLabel=c.area>=8;
              const fontSize=c.area>=120?12:c.area>=50?11:c.area>=20?10:c.area>=10?9:8;

              // Highlight/shimmer on hover
              const brightnessFilter=isHovered&&!isNuked&&!isShocked?"brightness(1.18) saturate(1.2)":undefined;

              return(
                <g key={c.id} filter={filterAttr}>
                  {/* Main country path */}
                  <path d={c.d} fill={fill} stroke={stroke} strokeWidth={sw} opacity={opacity}
                    style={{cursor:isNuked?"not-allowed":(satelliteMode&&owner&&owner!==username&&!isShocked)?"cell":(!isShocked&&!isNuked&&attackMode&&inReach&&!isMe)?"crosshair":"default",transition:"fill .25s ease,opacity .2s ease,stroke-width .15s ease",filter:brightnessFilter}}
                    onMouseEnter={e=>{
                      setHovered(c.id);
                      const r=svgRef.current?.getBoundingClientRect();
                      if(r)setTip({show:true,x:e.clientX-r.left,y:e.clientY-r.top,c,owner:owner||null,inReach:!isShocked&&attackMode&&inReach&&!isMe});
                    }}
                    onMouseLeave={()=>{setHovered(null);setTip(t=>({...t,show:false}));}}
                    onClick={()=>{
                      if(isNuked){flash(c.name+" is irradiated! ☢️","error");return;}
                      if(isShocked)return;
                      if(satelliteMode)launchSatellite(c);
                      else startAttack(c);
                    }}
                  />
                  {/* Terrain highlight overlay on unowned land */}
                  {!owner&&!isNuked&&!isShocked&&(
                    <path d={c.d} fill="rgba(255,255,255,0.04)" stroke="none" pointerEvents="none" opacity={isHovered?0.15:0.06}
                      style={{transition:"opacity .2s"}}/>
                  )}
                  {/* Top-edge light bevel for 3D land feel */}
                  {!isNuked&&!isShocked&&(
                    <path d={c.d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={isMe?1.2:0.5}
                      pointerEvents="none" opacity={isHovered?0.4:0.15} strokeLinejoin="round"/>
                  )}
                  {isShocked&&(
                    <text x={c.lx} y={c.ly} textAnchor="middle" dominantBaseline="middle"
                      fontSize={c.area>=50?11:9} fill="#818cf8" fontFamily="monospace"
                      fontWeight="bold" pointerEvents="none" opacity="0.95"
                      paintOrder="stroke" stroke="rgba(0,0,0,.8)" strokeWidth="2" strokeLinejoin="round">
                      ⚡{shockSecsLeft}s
                    </text>
                  )}
                  {isNuked&&(
                    <g pointerEvents="none">
                      <text x={c.lx} y={c.ly-3} textAnchor="middle" dominantBaseline="middle"
                        fontSize={c.area>=50?11:c.area>=20?9:7} fill="#22ff66" fontFamily="monospace"
                        fontWeight="bold" opacity="0.95"
                        paintOrder="stroke" stroke="rgba(0,0,0,.85)" strokeWidth="2.5" strokeLinejoin="round">
                        ☢️ RAD ☢️
                      </text>
                    </g>
                  )}
                  {showLabel&&!isShocked&&!isNuked&&(
                    <text x={c.lx} y={c.ly} textAnchor="middle" dominantBaseline="middle"
                      fontSize={fontSize}
                      fill={owner?(isMe?"rgba(255,255,255,1)":"rgba(255,255,255,0.92)"):"rgba(240,235,220,0.9)"}
                      fontFamily="Georgia,serif"
                      fontWeight="bold" pointerEvents="none" paintOrder="stroke"
                      stroke={owner?"rgba(0,0,0,0.7)":"rgba(30,20,10,0.75)"} strokeWidth="2.5" strokeLinejoin="round"
                      style={{letterSpacing:"0.2px",textShadow:isMe?"0 0 8px rgba(255,255,255,0.5)":undefined}}>
                      {c.name}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Vignette overlay for depth */}
            <rect width="1800" height="950" fill="url(#vignette)" pointerEvents="none"/>

            {/* Atmospheric haze at top (polar) */}
            <rect x="0" y="0" width="1800" height="80" fill="url(#polarIce)" opacity="0.06" pointerEvents="none"/>
            <rect x="0" y="870" width="1800" height="80" fill="url(#polarIce)" opacity="0.04" pointerEvents="none"/>
          </svg>

          {tip.show&&tip.c&&(
            <div style={{position:"absolute",left:tip.x+16,top:tip.y-12,pointerEvents:"none",zIndex:100,
              background:"linear-gradient(160deg,rgba(6,14,28,.98),rgba(4,10,20,.98))",border:"1px solid rgba(255,255,255,.12)",borderRadius:"12px",padding:"11px 15px",minWidth:"180px",boxShadow:"0 8px 32px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04)",backdropFilter:"blur(8px)"}}>
              <div style={{color:"white",fontWeight:"bold",fontSize:"13px",marginBottom:"2px",letterSpacing:".2px"}}>{tip.c.name}</div>
              {tip.c.continent&&<div style={{color:"rgba(255,255,255,.3)",fontSize:"8px",letterSpacing:"1.5px",marginBottom:"5px",textTransform:"uppercase"}}>{tip.c.continent}</div>}
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
        <div style={{position:"fixed",top:"48px",right:0,bottom:0,width:"230px",background:"linear-gradient(180deg,rgba(3,8,20,.99) 0%,rgba(4,10,22,.99) 100%)",borderLeft:"1px solid rgba(255,255,255,.07)",display:"flex",flexDirection:"column",overflowY:"auto",padding:"10px 9px",gap:"7px",zIndex:50}}>

          {/* player card */}
          <div style={{background:"linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.02))",border:"1px solid rgba(255,255,255,.09)",borderRadius:"12px",padding:"11px 13px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"9px",background:"linear-gradient(135deg,"+myC.bg+"33,"+myC.bg+"11)",border:"1px solid "+myC.bg+"44",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <div style={{width:"11px",height:"11px",borderRadius:"50%",background:myC.bg,boxShadow:"0 0 8px "+myC.bg}}/>
              </div>
              <div style={{flex:1,overflow:"hidden"}}>
                <div style={{color:"white",fontSize:"12px",fontWeight:"bold",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{username}</div>
                <div style={{color:myC.light,fontSize:"9px",opacity:.7}}>{myC.name} · {mine.length} terr</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"baseline",gap:"4px",marginBottom:"8px"}}>
              <span style={{color:"#f5c842",fontWeight:"bold",fontSize:"16px",letterSpacing:"-0.5px"}}>{myInventory.coins.toLocaleString()}</span>
              <span style={{color:"rgba(245,200,66,.4)",fontSize:"9px"}}>coins</span>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                <span style={{color:"rgba(255,255,255,.3)",fontSize:"8px",letterSpacing:"1px",textTransform:"uppercase"}}>Pass Lv {curLevel+1}</span>
                <span style={{color:"#c4b5fd",fontSize:"8px",fontWeight:"bold"}}>{playerXP} XP</span>
              </div>
              <div style={{height:"5px",background:"rgba(255,255,255,.06)",borderRadius:"3px",overflow:"hidden"}}>
                <div style={{height:"100%",width:xpPct+"%",background:"linear-gradient(90deg,#6d28d9,#a78bfa,#c4b5fd)",borderRadius:"3px",transition:"width .6s ease",boxShadow:"0 0 6px rgba(167,139,250,.4)"}}/>
              </div>
            </div>
          </div>

          {/* daily reward - pulsing gold */}
          {canClaimDaily&&(
            <button onClick={()=>setShowDaily(true)} className="sidebar-btn"
              style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#78350f,#b45309,#d97706)",border:"1px solid rgba(245,158,11,.4)",borderRadius:"10px",color:"#fef3c7",fontSize:"11px",fontWeight:"bold",cursor:"pointer",fontFamily:"Georgia,serif",letterSpacing:"1.5px",boxShadow:"0 4px 20px rgba(217,119,6,.3)",animation:"pu 2s ease infinite"}}>
              ✦ DAILY REWARD
            </button>
          )}




          {/* action buttons */}
          {[
            {label:"War Shop",      icon:"⚔",color:"#f87171",bg:"rgba(239,68,68,.1)",  border:"rgba(239,68,68,.25)",  action:()=>{setShowShop(true); droneSay("warShop");}},
            {label:"Material Shop", icon:"⛏",color:"#a3e635",bg:"rgba(132,204,22,.1)", border:"rgba(132,204,22,.25)", action:()=>{setShowMatShop(true); droneSay("materialShop");}},
            {label:"Build Shop",    icon:"🏗",color:"#4ade80",bg:"rgba(34,197,94,.1)",  border:"rgba(34,197,94,.25)",  action:()=>{setShowBuildShop(true); droneSay("buildShop");}},
            {label:"Black Market",  icon:"◈", color:"#a78bfa",bg:"rgba(139,92,246,.1)", border:"rgba(139,92,246,.25)", action:()=>{setShowBlackMarket(true); droneSay("blackmarketShop")}, disabled:!(myInventory.buildings||[]).includes("black_market")},
            {label:"Gambling Den",icon:"🎰",color:"gold",bg:"rgba(139,92,246,.06)",border:"rgba(139,92,246,.15)",action:()=>setShowGamblingDen(true),disabled:!(myInventory.buildings||[]).includes("casino_place")},
            {label:"Terra Pass",    icon:"★", color:"#c4b5fd",bg:"rgba(139,92,246,.08)",border:"rgba(139,92,246,.2)",  action:()=>{setShowTerraPass(true); droneSay("terrapassShop")}},
            {label:"World Wonders",  icon:"🏛", color:"#f5c842",bg:"rgba(245,200,66,.08)",border:"rgba(245,200,66,.2)",  action:()=>{droneSay("worldwondersShop"); setShowWonders(true)}},
            {label:"Trade",  icon:"🤝", color:"#f59e0b",bg:"rgba(245,158,11,.08)",border:"rgba(245,158,11,.2)",  action:()=>openTrade(), disabled:!(myInventory.buildings||[]).includes("trade_post")}].map(btn=>(
            <button key={btn.label} onClick={btn.disabled?undefined:btn.action} className="sidebar-btn"
              style={{width:"100%",padding:"9px 11px",background:btn.bg,border:"1px solid "+btn.border,borderRadius:"9px",color:btn.disabled?"rgba(255,255,255,.18)":btn.color,fontSize:"11px",fontWeight:"bold",cursor:btn.disabled?"not-allowed":"pointer",fontFamily:"Georgia,serif",textAlign:"left",letterSpacing:".3px",opacity:btn.disabled?0.45:1,display:"flex",alignItems:"center",gap:"7px"}}>
              <span style={{fontSize:"12px",opacity:.85}}>{btn.icon}</span>
              {btn.label}{btn.disabled&&<span style={{marginLeft:"auto",fontSize:"8px",color:"rgba(255,255,255,.2)",letterSpacing:"1px"}}>LOCKED</span>}
            </button>
          ))}

          {showGamblingDen&&(
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4000}}
    onClick={e=>{if(e.target===e.currentTarget)setShowGamblingDen(false);}}>
    <div style={{background:"linear-gradient(160deg,#1a1000,#2a1800)",border:"1px solid rgba(245,158,11,.3)",borderRadius:"16px",padding:"28px",minWidth:"300px",color:"white",fontFamily:"Georgia,serif",boxShadow:"0 0 40px rgba(245,158,11,.15)"}}>
      <div style={{textAlign:"center",marginBottom:"20px"}}>
        <div style={{fontSize:"32px",marginBottom:"6px"}}>🎰</div>
        <div style={{fontSize:"18px",fontWeight:"bold",color:"#f5c842",letterSpacing:"2px"}}>GAMBLING DEN</div>
        <div style={{fontSize:"12px",color:"rgba(255,255,255,.4)",marginTop:"4px"}}>50% chance — double or nothing</div>
      </div>
      <div style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:"10px",padding:"12px",textAlign:"center",marginBottom:"18px"}}>
        <span style={{color:"rgba(255,255,255,.5)",fontSize:"12px"}}>Your coins: </span>
        <span style={{color:"#f5c842",fontWeight:"bold",fontSize:"16px"}}>{(myInventory.coins||0).toLocaleString()}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"18px"}}>
        {[500,1000,2500,5000].map(amt=>(
          <button key={amt} onClick={()=>gamble(amt)}
            disabled={(myInventory.coins||0)<amt}
            style={{padding:"12px",borderRadius:"8px",border:"1px solid rgba(245,158,11,.3)",background:(myInventory.coins||0)>=amt?"rgba(245,158,11,.15)":"rgba(255,255,255,.03)",color:(myInventory.coins||0)>=amt?"#f5c842":"rgba(255,255,255,.2)",fontSize:"13px",fontWeight:"bold",cursor:(myInventory.coins||0)>=amt?"pointer":"not-allowed",letterSpacing:"1px"}}>
            Bet {amt.toLocaleString()} coins → win {amt.toLocaleString()} or lose {amt.toLocaleString()}
          </button>
        ))}
      </div>
      <button onClick={()=>setShowGamblingDen(false)}
        style={{width:"100%",padding:"10px",borderRadius:"8px",border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"rgba(255,255,255,.5)",fontSize:"12px",cursor:"pointer"}}>
        Leave
      </button>
    </div>
  </div>
)}

          {/* divider */}
          <div style={{borderTop:"1px solid rgba(255,255,255,.06)",margin:"1px 0"}}/>

          {/* materials strip */}
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"10px",padding:"9px 11px"}}>
            <div style={{color:"rgba(255,255,255,.25)",fontSize:"8px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"8px"}}>Resources</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
              {MATERIALS.map(m=>{
                const qty=myInventory[m.id]||0;
                return(
                  <div key={m.id} style={{display:"flex",alignItems:"center",gap:"5px",padding:"4px 6px",background:"rgba(255,255,255,.02)",borderRadius:"6px",border:"1px solid "+(qty>0?m.color+"22":"rgba(255,255,255,.04)")}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"2px",background:qty>0?m.color:"rgba(255,255,255,.15)",flexShrink:0,boxShadow:qty>0?"0 0 4px "+m.color+"80":undefined}}/>
                    <span style={{color:qty>0?"rgba(255,255,255,.6)":"rgba(255,255,255,.2)",fontSize:"8px",flex:1}}>{m.label}</span>
                    <span style={{color:qty>0?m.color:"rgba(255,255,255,.2)",fontSize:"10px",fontWeight:"bold"}}>{qty}</span>
                  </div>
                );
              })}

            </div>
          </div>

          {/* leaderboard */}
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"10px",padding:"9px 11px",flex:1}}>
            <div style={{color:"rgba(255,255,255,.25)",fontSize:"8px",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"9px"}}>Leaderboard</div>
            {lb.map(([name,cnt],i)=>{
              const pl=players[name];
              const color=pl?CLRS[pl.cidx%CLRS.length].bg:"#555";
              const isMe=name===username;
              const pct=Math.round((cnt/COUNTRIES.length)*100);
              const medals=["🥇","🥈","🥉"];
              return(
                <div key={name} style={{marginBottom:"9px",animation:"floatUp .3s ease both",animationDelay:(i*0.05)+"s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"3px"}}>
                    <span style={{fontSize:"10px",width:"14px",textAlign:"center"}}>{medals[i]||<span style={{color:"rgba(255,255,255,.2)",fontSize:"9px"}}>{i+1}</span>}</span>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:color,boxShadow:isMe?"0 0 6px "+color:undefined,flexShrink:0}}/>
                    <span style={{color:isMe?"#f5c842":"rgba(255,255,255,.7)",fontSize:"10px",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:isMe?"bold":"normal"}}>{name}</span>
                    <span style={{color:isMe?"#f5c842":"rgba(255,255,255,.4)",fontSize:"10px",fontWeight:isMe?"bold":"normal"}}>{cnt}</span>
                  </div>
                  <div style={{height:"3px",background:"rgba(255,255,255,.05)",borderRadius:"2px",overflow:"hidden",marginLeft:"19px"}}>
                    <div style={{height:"100%",width:pct+"%",background:isMe?"linear-gradient(90deg,"+color+",#f5c842)":color,opacity:isMe?1:0.65,borderRadius:"2px",transition:"width .6s ease"}}/>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
       {/* 👇 ADD THIS AT THE END */}
    {droneVisible && (
      <div style={{
        position: "fixed",
        bottom: "300px",
        left: "20px",
        background: "rgba(0,0,0,0.8)",
        padding: "12px 16px",
        borderRadius: "10px",
        color: "cyan",
        fontSize: "12px",
        maxWidth: "260px",
        zIndex: 5000
      }}>
        🤖Droney: {droneDisplayMsg}|
      </div>
    )}

    {/* DRONEYSS button — only unlocked by Droneys Factory building */}
    {(myInventory.buildings||[]).includes("droneys_factory") && (()=>{
      const now = Date.now();
      const locked = droneyLockUntil > now;
      const hoursLeft = locked ? Math.ceil((droneyLockUntil - now) / 3600000) : 0;
      return (
        <div style={{position:"fixed",bottom:"685px",right:"270px",zIndex:5001,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"3px"}}>
          {locked && (
            <div style={{fontSize:"9px",color:"rgba(0,200,255,0.5)",fontFamily:"'Courier New',monospace",letterSpacing:"1px",textAlign:"right"}}>
              🔒 LOCKED — {hoursLeft}h left
            </div>
          )}
          <button
            disabled={locked}
            onClick={()=>{
              const newCount = droneyCount + 1;
              if (newCount >= 1000) {
                const newInv = {...myInventory, drone: (myInventory.drone || 0) + 10};
                setMyInventory(newInv);
                saveInv(newInv);
                setDroneyCount(0);
                setDroneyLockUntil(Date.now() + 24 * 60 * 60 * 1000);
                droneSay("Droneyssss");
              } else {
                setDroneyCount(newCount);
                if (newCount === 1) { droneSay("Droneys"); }
                else if (newCount === 100) { droneSay("Droneyss"); }
                else if (newCount === 500) { droneSay("Droneysss"); }
              }
            }}
            style={{
              padding:"5px 13px",
              background: locked ? "rgba(255,255,255,0.03)" : "rgba(0,10,30,0.88)",
              border: locked ? "1px solid rgba(0,140,255,0.15)" : "1px solid rgba(0,180,255,0.6)",
              borderRadius:"10px",
              color: locked ? "rgba(0,200,255,0.25)" : "cyan",
              cursor: locked ? "not-allowed" : "pointer",
              fontSize:"12px",
              fontFamily:"'Courier New',monospace",
              letterSpacing:"1px",
              zIndex:5001,
              boxShadow: locked ? "none" : "0 0 10px rgba(0,180,255,0.2)",
              transition:"all .2s",
              opacity: locked ? 0.5 : 1
            }}>
            🤖 DRONEYSS {droneyCount}/1000
          </button>
        </div>
      );
    })()}

    {/* Nuke animation overlay - rendered INSIDE the App component */}
    {showNukeVideo && (
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "black"
      }}>
        <video
          key="nukeVideo"
          id="nukeVideo"
          autoPlay
          muted
          playsInline
          src="/Animation.mp4"
          style={{ width: "100vw", height: "100vh", objectFit: "fill" }}
          onEnded={() => {
            setShowNukeVideo(false);
            if(pendingNukeAction){
              flash("\u2622 NUCLEAR STRIKE on "+pendingNukeAction.country.name+"! Permanently uninhabitable.","success");
              unlockAchievement("nuke_used");
              setPendingNukeAction(null);
            }
          }}
          onError={(e) => {
            console.error("Nuke video failed to load:", e);
            setShowNukeVideo(false);
            if(pendingNukeAction){
              flash("\u2622 NUCLEAR STRIKE on "+pendingNukeAction.country.name+"! Permanently uninhabitable.","success");
              unlockAchievement("nuke_used");
              setPendingNukeAction(null);
            }
          }}
        />
        <button
          onClick={()=>{
            setShowNukeVideo(false);
            if(pendingNukeAction){
              flash("\u2622 NUCLEAR STRIKE on "+pendingNukeAction.country.name+"! Permanently uninhabitable.","success");
              unlockAchievement("nuke_used");
              setPendingNukeAction(null);
            }
          }}
          style={{
            position:"absolute", bottom:"30px", right:"30px",
            padding:"10px 24px",
            background:"rgba(0,255,136,.1)",
            border:"1px solid rgba(0,255,136,.25)",
            borderRadius:"8px", color:"rgba(0,255,136,.6)",
            cursor:"pointer", fontSize:"13px",
            fontFamily:"'Courier New',monospace", letterSpacing:"2px"
          }}
        >
          Skip {"\u25B6\u25B6"}
        </button>
      </div>
    )}

  </div>
);
}