export const config = { runtime: "edge" };

const SB_URL = process.env.SB_URL;
const SB_KEY = process.env.SB_KEY;

// Allowed tables and operations - whitelist to prevent abuse
const ALLOWED_TABLES = ["world", "inventory"];
const ALLOWED_OPS    = ["select", "upsert", "select_all"];

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { op, table, data, filter, cols, order } = body;

  // Whitelist checks
  if (!ALLOWED_TABLES.includes(table))
    return new Response(JSON.stringify({ error: "Forbidden table" }), { status: 403 });
  if (!ALLOWED_OPS.includes(op))
    return new Response(JSON.stringify({ error: "Forbidden op" }), { status: 403 });

  // select_all is only allowed from server context (dev dashboard)
  // It has no filter so we restrict cols to prevent data dumps
  if (op === "select_all") {
    const ALLOWED_ALL_COLS = {
      world:     "room_code,players,ownership",
      inventory: "username,data",
    };
    const safeCols = ALLOWED_ALL_COLS[table];
    const headers = {
      "apikey": SB_KEY,
      "Authorization": "Bearer " + SB_KEY,
      "Content-Type": "application/json",
    };
    try {
      const url = `${SB_URL}/rest/v1/${table}?select=${safeCols}`;
      const sbRes = await fetch(url, { headers });
      const rows = await sbRes.json();
      return new Response(JSON.stringify({ data: Array.isArray(rows) ? rows : [] }), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }

  // --- Server-side validation: prevent coin tampering on inventory writes ---
  if (op === "upsert" && table === "inventory" && data?.data) {
    const inv = data.data;
    const MAX_COINS = 9_999_999;
    if (typeof inv.coins === "number" && inv.coins > MAX_COINS) {
      return new Response(JSON.stringify({ error: "Invalid inventory" }), { status: 403 });
    }
    const ALLOWED_INV_KEYS = [
      "coins","tank","bomb","plane","missile","bomber","air_def","lastDaily",
      "wood","stone","iron","gold","uranium","nuke_bomb","buildings","lastFactory","factoryCount",
      "academySpies","lastAcademy","spy","satellite","artillery","drone","chem_bomb","emp",
      "stealth_bomber","orbital","dirty_bomb","oil","stealth_kit","shield",
      "_name","_pwd","_xp","_achievements","_dailyCount",
      "_missionProgress","_missionDate","_claimedMissions","_claimedPassLevels",
      "_bmDate","_bmItems","_clan","_totalConquests","_lastDraculaSpy","_lastSeen",
    ];
    const cleaned = {};
    for (const k of ALLOWED_INV_KEYS) {
      if (k in inv) cleaned[k] = inv[k];
    }
    data.data = cleaned;
  }

  const headers = {
    "apikey": SB_KEY,
    "Authorization": "Bearer " + SB_KEY,
    "Content-Type": "application/json",
  };

  let sbRes;
  try {
    if (op === "select") {
      const { col, val } = filter || {};
      const url = `${SB_URL}/rest/v1/${table}?${col}=eq.${encodeURIComponent(val)}&select=${cols || "*"}`;
      sbRes = await fetch(url, { headers });
      const rows = await sbRes.json();
      const row = Array.isArray(rows) ? rows[0] : rows;
      return new Response(JSON.stringify({ data: row || null }), { status: 200 });
    }

    if (op === "upsert") {
      const url = `${SB_URL}/rest/v1/${table}`;
      sbRes = await fetch(url, {
        method: "POST",
        headers: { ...headers, "Prefer": "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(data),
      });
      return new Response(JSON.stringify({ error: sbRes.ok ? null : "HTTP " + sbRes.status }), { status: 200 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}