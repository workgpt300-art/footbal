import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const allowed = new Set(["/leagues", "/teams", "/players", "/players/squads", "/fixtures", "/standings", "/coachs", "/transfers"]);
const allowedParams = new Set(["id","team","league","season","page","search","country","name","current","date","from","to","last","next","timezone","round","status","venue","type","player","h2h"]);
const send = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return send({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const footballKey = Deno.env.get("API_FOOTBALL_KEY");
  if (!url || !anonKey || !serviceKey) return send({ error: "Server Supabase configuration is incomplete." }, 500);
  if (!footballKey) return send({ error: "API_FOOTBALL_KEY is not configured as an Edge Function secret." }, 503);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return send({ error: "Authentication required." }, 401);
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return send({ error: "A valid signed-in user is required." }, 401);

  let body: { endpoint?: unknown; params?: unknown };
  try { body = await request.json(); } catch { return send({ error: "Expected a JSON request body." }, 400); }
  if (typeof body.endpoint !== "string" || !allowed.has(body.endpoint)) return send({ error: "Endpoint is not allowlisted." }, 400);

  const params = new URLSearchParams();
  if (body.params && typeof body.params === "object" && !Array.isArray(body.params)) {
    for (const [key, value] of Object.entries(body.params as Record<string, unknown>)) {
      if (!allowedParams.has(key) || value === null || value === undefined) continue;
      if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") continue;
      const text = String(value).trim();
      if (!text || text.length > 120) continue;
      if ((key === "page" || key === "season") && (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > (key === "page" ? 20 : 2100))) {
        return send({ error: "Invalid " + key + " parameter." }, 400);
      }
      params.set(key, text);
    }
  }

  const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const logged = await service.from("football_import_runs").insert({
    user_id: authData.user.id,
    action: body.endpoint,
    status: "running",
    requested_count: 1,
    details: { params: Object.fromEntries(params.entries()) },
  }).select("id").maybeSingle();
  const runId = logged.data?.id as string | undefined;

  const providerUrl = new URL("https://v3.football.api-sports.io" + body.endpoint);
  params.forEach((value, key) => providerUrl.searchParams.set(key, value));
  let provider: Response;
  try {
    provider = await fetch(providerUrl.toString(), {
      headers: { "x-apisports-key": footballKey, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    if (runId) await service.from("football_import_runs").update({
      status: "failed", error_summary: "Network or timeout error", completed_at: new Date().toISOString(),
    }).eq("id", runId);
    return send({ error: "Could not reach API-Football. Check network access and retry." }, 502);
  }

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(await provider.text()) as Record<string, unknown>; }
  catch { payload = { message: "API-Football returned a non-JSON response." }; }
  const errors = payload.errors;
  const ok = provider.ok && (!errors || (typeof errors === "object" && Object.keys(errors as object).length === 0));
  const rows = Array.isArray(payload.response) ? payload.response : [];

  // First completed import step: save provider-supplied league metadata only.
  // Other allowlisted endpoints proxy the provider response but do not claim database import.
  if (ok && body.endpoint === "/leagues" && rows.length) {
    const season = Number(params.get("season") || new Date().getUTCFullYear());
    const leagues = rows.map((entry: any) => ({
      id: Number(entry?.league?.id),
      name: String(entry?.league?.name || "Unknown"),
      country: entry?.country?.name ? String(entry.country.name) : null,
      logo: entry?.league?.logo ? String(entry.league.logo) : null,
      league_type: entry?.league?.type ? String(entry.league.type) : null,
      season,
      raw: entry,
      imported_at: new Date().toISOString(),
    })).filter((entry) => Number.isFinite(entry.id) && entry.id > 0);
    if (leagues.length) {
      const { error } = await service.from("football_leagues").upsert(leagues, { onConflict: "id" });
      if (error && runId) await service.from("football_import_runs").update({
        status: "partial", imported_count: 0, error_summary: "Fetched data, but database upsert failed.",
        completed_at: new Date().toISOString(),
      }).eq("id", runId);
    }
  }
  if (runId) await service.from("football_import_runs").update({
    status: ok ? "succeeded" : "failed",
    requested_count: 1,
    imported_count: ok && body.endpoint === "/leagues" ? rows.length : 0,
    error_summary: ok ? null : "Provider returned an error.",
    details: { endpoint: body.endpoint, params: Object.fromEntries(params.entries()), provider_status: provider.status },
    completed_at: new Date().toISOString(),
  }).eq("id", runId);

  return send({
    ...payload,
    _meta: {
      providerStatus: provider.status,
      requestsRemaining: provider.headers.get("x-ratelimit-requests-remaining"),
      monthlyRequestsRemaining: provider.headers.get("x-ratelimit-requests-monthly-remaining"),
    },
  }, provider.ok ? 200 : 502);
});