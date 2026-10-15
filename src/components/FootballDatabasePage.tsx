import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Database, Globe2, LoaderCircle, Search, Shield, Users, UserRound, Trophy, RefreshCw, LockKeyhole, MapPin, CalendarDays, SlidersHorizontal } from "lucide-react";
import type { CSSProperties } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";

type Props = { signedIn: boolean; navigateToImport: () => void };
type TeamRow = { id: number; name: string; country: string | null; logo: string | null; league_id: number | null; founded: number | null; venue: Record<string, unknown> | null };
type PlayerRow = { id: number; name: string; age: number | null; nationality: string | null; photo: string | null; raw: Record<string, unknown> | null };
type LeagueRow = { id: number; name: string; country: string | null; logo: string | null; season: number; league_type: string | null };
type SquadRow = { team_id: number; player_id: number; season: number; position: string | null; shirt_number: number | null };
type Tab = "teams" | "players" | "leagues";

const text = (value: unknown) => typeof value === "string" ? value : "";
const num = (value: unknown) => typeof value === "number" ? value : Number(value) || 0;

export function FootballDatabasePage({ signedIn, navigateToImport }: Props) {
  const [tab, setTab] = useState<Tab>("teams");
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("Усі країни");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [leagues, setLeagues] = useState<LeagueRow[]>([]);
  const [squads, setSquads] = useState<SquadRow[]>([]);
  const [refreshedAt, setRefreshedAt] = useState("");

  async function load() {
    if (!supabase || !signedIn) return;
    setLoading(true);
    setError("");
    const [teamRes, playerRes, leagueRes, squadRes] = await Promise.all([
      supabase.from("football_teams").select("id,name,country,logo,league_id,founded,venue").order("name").limit(500),
      supabase.from("football_players").select("id,name,age,nationality,photo,raw").order("name").limit(1200),
      supabase.from("football_leagues").select("id,name,country,logo,season,league_type").order("name").limit(1500),
      supabase.from("football_squads").select("team_id,player_id,season,position,shirt_number").order("season", { ascending: false }).limit(2500),
    ]);
    if (teamRes.error || playerRes.error || leagueRes.error || squadRes.error) {
      setError([teamRes.error, playerRes.error, leagueRes.error, squadRes.error].filter(Boolean).map((e) => e!.message).join(" · "));
    } else {
      setTeams((teamRes.data ?? []) as TeamRow[]);
      setPlayers((playerRes.data ?? []) as PlayerRow[]);
      setLeagues((leagueRes.data ?? []) as LeagueRow[]);
      setSquads((squadRes.data ?? []) as SquadRow[]);
      setRefreshedAt(new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }));
    }
    setLoading(false);
  }

  useEffect(() => { void load(); }, [signedIn, supabaseConfigured]);

  const countries = useMemo(() => {
    const source = tab === "players" ? players.map((p) => p.nationality ?? "") : tab === "leagues" ? leagues.map((l) => l.country ?? "") : teams.map((t) => t.country ?? "");
    return ["Усі країни", ...Array.from(new Set(source.map((c) => c.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))];
  }, [tab, teams, players, leagues]);

  const visibleTeams = useMemo(() => teams.filter((t) => (country === "Усі країни" || t.country === country) && (!query.trim() || (t.name + " " + (t.country ?? "") + " " + t.id).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))), [teams, country, query]);
  const visiblePlayers = useMemo(() => players.filter((p) => {
    const raw = p.raw ?? {};
    const club = text(raw.teamName);
    const position = text(raw.position);
    const nationality = p.nationality ?? "";
    return (country === "Усі країни" || nationality.split(", ").includes(country)) && (!query.trim() || (p.name + " " + nationality + " " + club + " " + position).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  }), [players, country, query]);
  const visibleLeagues = useMemo(() => leagues.filter((l) => (country === "Усі країни" || l.country === country) && (!query.trim() || (l.name + " " + (l.country ?? "") + " " + l.season).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))), [leagues, country, query]);
  const latestSeason = squads.reduce((latest, squad) => Math.max(latest, squad.season), 0);
  const allCountries = new Set([...teams.map((t) => t.country), ...leagues.map((l) => l.country)].filter(Boolean)).size;
  const total = tab === "teams" ? visibleTeams.length : tab === "players" ? visiblePlayers.length : visibleLeagues.length;

  if (!supabaseConfigured) return <section className="fcdb-gate">
    <div className="fcdb-gate-icon"><Database size={28} /></div><span className="fcdb-kicker">FOOTBALL DATA CENTER</span><h2>Підключення футбольної бази</h2>
    <p>У грі є окрема база клубів, гравців і ліг у Supabase. Для читання її архіву потрібно налаштувати публічний клієнт у Render та авторизуватися — секретні ключі не мають потрапляти в браузер.</p>
    <button type="button" onClick={navigateToImport}>Відкрити акаунт і налаштування <ArrowUpRight size={15} /></button>
  </section>;

  if (!signedIn) return <section className="fcdb-gate">
    <div className="fcdb-gate-icon"><LockKeyhole size={28} /></div><span className="fcdb-kicker">AUTHENTICATED DATABASE</span><h2>Увійди, щоб відкрити базу</h2>
    <p>Дані про клуби, футболістів і склади захищені політиками доступу. Увійди або створи акаунт, після цього цей центр зможе їх читати.</p>
    <button type="button" onClick={navigateToImport}>Увійти / зареєструватися <ArrowUpRight size={15} /></button>
  </section>;

  return <div className="fcdb-page">
    <section className="fcdb-hero">
      <div className="fcdb-hero-grid" />
      <div className="fcdb-hero-copy"><span className="fcdb-kicker"><Database size={13} /> GLOBAL FOOTBALL DATABASE</span><h2>ФУТБОЛЬНИЙ<br /><em>ВСЕСВІТ.</em></h2><p>Клуби, ліги та гравці з реальної бази. Шукай, фільтруй і досліджуй архів перед наступним кроком у кар'єрі.</p><div className="fcdb-hero-meta"><span><i><Shield size={15} /></i><b>{teams.length}</b> клубів</span><span><i><Users size={15} /></i><b>{players.length}</b> футболістів</span><span><i><Globe2 size={15} /></i><b>{leagues.length}</b> записів ліг</span></div></div>
      <div className="fcdb-hero-stat"><small>АРХІВ СКЛАДІВ</small><strong>{latestSeason || "—"}</strong><span>останній сезон у таблиці складів</span><button type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={14} className={loading ? "fcdb-spin" : ""} /> Оновити дані</button></div>
    </section>

    <div className="fcdb-metrics"><div><Database size={16} /><span><small>КРАЇНИ</small><b>{allCountries}</b></span></div><div><Users size={16} /><span><small>ЗВ'ЯЗКИ СКЛАДІВ</small><b>{squads.length}</b></span></div><div><Trophy size={16} /><span><small>РЕЖИМ</small><b>Архів</b></span></div><div><CalendarDays size={16} /><span><small>ОНОВЛЕНО</small><b>{refreshedAt || "—"}</b></span></div></div>

    <section className="fcdb-browser">
      <div className="fcdb-browser-head"><div><span className="fcdb-kicker">EXPLORE THE GAME</span><h3>База даних</h3><p>Пошук працює за назвою, країною, клубом та ігровою позицією, якщо вона є в записі.</p></div><span className="fcdb-archive-badge"><i /> LIVE DATABASE CONNECTION</span></div>
      <div className="fcdb-tabs">
        <button type="button" className={tab === "teams" ? "active" : ""} onClick={() => { setTab("teams"); setCountry("Усі країни"); }}><Shield size={15} /> Клуби <b>{teams.length}</b></button>
        <button type="button" className={tab === "players" ? "active" : ""} onClick={() => { setTab("players"); setCountry("Усі країни"); }}><Users size={15} /> Гравці <b>{players.length}</b></button>
        <button type="button" className={tab === "leagues" ? "active" : ""} onClick={() => { setTab("leagues"); setCountry("Усі країни"); }}><Trophy size={15} /> Ліги <b>{leagues.length}</b></button>
      </div>
      <div className="fcdb-filters"><label className="fcdb-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "players" ? "Ім'я, клуб, позиція…" : "Назва, країна…"} /><kbd>⌕</kbd></label><label className="fcdb-country"><SlidersHorizontal size={14} /><select value={country} onChange={(e) => setCountry(e.target.value)}>{countries.map((item) => <option key={item}>{item}</option>)}</select></label><span>{total} результатів</span></div>
      {error && <div className="fcdb-error"><strong>Не вдалося завантажити дані.</strong><span>{error}</span><button type="button" onClick={() => void load()}>Повторити</button></div>}
      {loading && <div className="fcdb-loading"><LoaderCircle size={22} className="fcdb-spin" /> Підключаюсь до футбольної бази…</div>}
      {!loading && !error && tab === "teams" && <div className="fcdb-team-grid">{visibleTeams.slice(0, 180).map((team) => {
        const teamSquads = squads.filter((s) => s.team_id === team.id);
        const latestTeamSeason = teamSquads.reduce((latest, s) => Math.max(latest, s.season), 0);
        const venue = text(team.venue?.name);
        return <article className="fcdb-team-card" key={team.id}><div className="fcdb-team-top">{team.logo ? <img src={team.logo} loading="lazy" alt="" /> : <span className="fcdb-team-fallback"><Shield size={19} /></span>}<span className="fcdb-team-id">ID {team.id}</span></div><h4>{team.name}</h4><p><MapPin size={12} /> {team.country || "Країна не вказана"}</p><div className="fcdb-team-foot"><span>{venue || "Стадіон —"}</span><b>{latestTeamSeason || "Архів"}</b></div></article>;
      })}</div>}
      {!loading && !error && tab === "players" && <div className="fcdb-table-wrap"><table className="fcdb-table"><thead><tr><th>ГРАВЕЦЬ</th><th>ВІК</th><th>ПОЗИЦІЯ</th><th>КЛУБ</th><th>ГРОМАДЯНСТВО</th></tr></thead><tbody>{visiblePlayers.slice(0, 400).map((p) => {
        const raw = p.raw ?? {};
        return <tr key={p.id}><td><div className="fcdb-player-name">{p.photo ? <img src={p.photo} loading="lazy" alt="" /> : <span><UserRound size={15} /></span>}<div><b>{p.name}</b><small>PLAYER ID {p.id}</small></div></div></td><td>{p.age ?? "—"}</td><td><span className="fcdb-position">{text(raw.position) || "—"}</span></td><td>{text(raw.teamName) || "—"}</td><td>{p.nationality || "—"}</td></tr>;
      })}</tbody></table>{visiblePlayers.length > 400 && <p className="fcdb-table-foot">Показано 400 із {visiblePlayers.length} результатів. Уточни пошук, щоб знайти конкретного гравця.</p>}</div>}
      {!loading && !error && tab === "leagues" && <div className="fcdb-league-grid">{visibleLeagues.slice(0, 300).map((league) => <article className="fcdb-league-card" key={league.id}><span className="fcdb-league-mark">{league.logo ? <img src={league.logo} loading="lazy" alt="" /> : <Trophy size={17} />}</span><div><h4>{league.name}</h4><p>{league.country || "Країна не вказана"}</p><span>{league.league_type || "Змагання"} · сезон {league.season}</span></div><b>{league.season}</b></article>)}{visibleLeagues.length > 300 && <p className="fcdb-table-foot">Показано 300 із {visibleLeagues.length} результатів. Уточни пошук.</p>}</div>}
      {!loading && !error && total === 0 && <div className="fcdb-empty"><Search size={23} /><strong>Нічого не знайдено</strong><span>Зміни фільтри або пошуковий запит.</span></div>}
    </section>
    <p className="fcdb-disclaimer">Важливо: це вміст збереженої бази, а не гарантія актуальних складів сезону 2026/27. Актуальність залежить від останнього імпорту джерела.</p>
  </div>;
}
