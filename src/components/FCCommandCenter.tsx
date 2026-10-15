import { Activity, ArrowRight, CalendarDays, CirclePlay, Clock3, Dumbbell, Flame, Goal, Medal, Play, Shield, Sparkles, Star, Target, TrendingUp, Trophy, UserRound, Users, Zap } from "lucide-react";
import type { CareerSave, Fixture, Position, StandingRow } from "../types";
import { formatDate, formatMoney, getClub, getStandings, shortDate } from "../lib/game";

type HubView = "player" | "squad" | "matches" | "calendar" | "leagues" | "transfers" | "market" | "training" | "stats" | "news" | "finance" | "database";
type Props = {
  save: CareerSave;
  standing?: StandingRow;
  upcoming: Fixture[];
  nextDay: () => void;
  nextMatch: () => void;
  navigate: (view: HubView) => void;
  training: () => void;
};

const positionLabels: Record<Position, string> = {
  GK: "Воротар", CB: "Центральний захисник", LB: "Лівий захисник", RB: "Правий захисник",
  CDM: "Опорний півзахисник", CM: "Центральний півзахисник", CAM: "Атакувальний півзахисник",
  LW: "Лівий вінгер", RW: "Правий вінгер", ST: "Нападник",
};

function Mark({ clubId, size = "normal" }: { clubId: string; size?: "normal" | "large" }) {
  const club = getClub(clubId);
  return <span className={`fc-club-mark ${size === "large" ? "fc-club-mark-large" : ""}`} style={{ "--club-color": club.colors[0], "--club-alt": club.colors[1] } as React.CSSProperties}>{club.initials}</span>;
}

function Action({ children, onClick, variant = "primary" }: { children: React.ReactNode; onClick: () => void; variant?: "primary" | "subtle" }) {
  return <button type="button" className={`fc-action ${variant === "subtle" ? "fc-action-subtle" : ""}`} onClick={onClick}>{children}</button>;
}

export function FCCommandCenter({ save, standing, upcoming, nextDay, nextMatch, navigate, training }: Props) {
  const player = save.player;
  const club = getClub(save.clubId);
  const rank = getStandings(save.fixtures, club.leagueId).findIndex((row) => row.clubId === save.clubId) + 1;
  const next = upcoming.find((fixture) => fixture.status === "scheduled" && (fixture.homeClubId === save.clubId || fixture.awayClubId === save.clubId));
  const previous = [...save.fixtures]
    .filter((fixture) => fixture.status === "played" && (fixture.homeClubId === save.clubId || fixture.awayClubId === save.clubId))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const opponent = next ? getClub(next.homeClubId === save.clubId ? next.awayClubId : next.homeClubId) : null;
  const home = next?.homeClubId === save.clubId;
  const attributes = [
    ["Швидкість", player.attributes.speed ?? 70],
    ["Удар", player.attributes.finishing ?? 65],
    ["Пас", player.attributes.passing ?? 65],
    ["Дриблінг", player.attributes.dribbling ?? 65],
  ];
  const lastScore = previous ? (previous.homeClubId === save.clubId ? previous.homeScore : previous.awayScore) : null;
  const rivalScore = previous ? (previous.homeClubId === save.clubId ? previous.awayScore : previous.homeScore) : null;
  const result = lastScore === null || rivalScore === null ? "—" : lastScore > rivalScore ? "ПЕРЕМОГА" : lastScore === rivalScore ? "НІЧИЯ" : "ПОРАЗКА";

  return <div className="fc-hub">
    <section className="fc-feature">
      <div className="fc-feature-grain" />
      <div className="fc-feature-pitch-lines"><span /><i /><b /></div>
      <div className="fc-feature-copy">
        <div className="fc-kicker"><span className="fc-live-dot" /> КАР'ЄРА ГРАВЦЯ <i /> СЕЗОН {save.season}</div>
        <p className="fc-overline">ТВІЙ ШЛЯХ. ТВОЇ ПРАВИЛА.</p>
        <h2>ПИШИ<br /><em>ІСТОРІЮ.</em></h2>
        <p className="fc-feature-intro">Від першого виходу на поле до великої європейської ночі. Кожна дія наближає до вершини.</p>
        <div className="fc-feature-club"><Mark clubId={club.id} size="large" /><div><small>ТВОЯ КОМАНДА</small><strong>{club.name}</strong><span>{club.city} · {club.strength} OVR команди</span></div></div>
        <div className="fc-feature-actions">
          <Action onClick={() => navigate("matches")}><CirclePlay size={17} /> ЦЕНТР МАТЧІВ <ArrowRight size={15} /></Action>
          <Action onClick={nextDay} variant="subtle"><Clock3 size={15} /> Наступний день</Action>
        </div>
      </div>
      <div className="fc-feature-player" aria-hidden="true">
        <div className="fc-player-aura" />
        <div className="fc-player-orbit fc-player-orbit-one" />
        <div className="fc-player-orbit fc-player-orbit-two" />
        <div className="fc-player-silhouette"><UserRound strokeWidth={1.05} /></div>
        <div className="fc-ovr-card"><small>ЗАГАЛЬНИЙ</small><strong>{player.rating}</strong><span>{player.position}</span><i>{club.initials}</i></div>
        <div className="fc-card-name"><small>CAREER MODE</small><strong>{player.name}</strong><span>{positionLabels[player.position].toUpperCase()} · #{player.number}</span></div>
        <div className="fc-stadium-lights" />
      </div>
      <div className="fc-feature-bottom"><span><Sparkles size={13} /> PLAYER JOURNEY</span><span>01 <i /> 04</span></div>
    </section>

    <div className="fc-stat-strip">
      <div className="fc-stat-main"><span className="fc-stat-icon"><Star size={17} /></span><div><small>OVERALL</small><strong>{player.rating}<em>/99</em></strong></div><span className="fc-stat-up"><TrendingUp size={14} /> POT {player.potential}</span></div>
      <div><small>МАТЧІ</small><strong>{player.stats.matches}</strong><span>у кар'єрі</span></div>
      <div><small>ГОЛИ</small><strong>{player.stats.goals}</strong><span>забито</span></div>
      <div><small>АСИСТИ</small><strong>{player.stats.assists}</strong><span>гольові передачі</span></div>
      <div><small>РЕЙТИНГ</small><strong>{player.stats.averageRating ? player.stats.averageRating.toFixed(1) : "—"}</strong><span>середній за матч</span></div>
    </div>

    <div className="fc-main-grid">
      <section className="fc-panel fc-fixture-panel">
        <div className="fc-panel-head"><div><span className="fc-panel-kicker">NEXT CHALLENGE</span><h3>Наступний матч</h3></div><button type="button" className="fc-link" onClick={() => navigate("calendar")}>Календар <ArrowRight size={14} /></button></div>
        {next && opponent ? <>
          <div className="fc-fixture-meta"><span className="fc-competition"><Trophy size={13} /> {club.leagueId === "ukr-premier-league" ? "УКРАЇНСЬКА ПРЕМ'ЄР-ЛІГА" : "ЛІГА · СЕЗОН " + save.season}</span><span><CalendarDays size={13} /> {formatDate(next.date)}</span></div>
          <div className="fc-fixture-match">
            <div className="fc-team-lockup"><Mark clubId={home ? club.id : opponent.id} size="large" /><strong>{home ? club.name : opponent.name}</strong><small>{home ? "ГОСПОДАРІ" : "ГОСТІ"}</small></div>
            <div className="fc-kickoff"><span>VS</span><small>ТУР {next.round}</small></div>
            <div className="fc-team-lockup"><Mark clubId={home ? opponent.id : club.id} size="large" /><strong>{home ? opponent.name : club.name}</strong><small>{home ? "ГОСТІ" : "ГОСПОДАРІ"}</small></div>
          </div>
          <div className="fc-fixture-footer"><span><Clock3 size={14} /> Підготуйся до гри</span><Action onClick={() => navigate("matches")}>ВИЙТИ НА ПОЛЕ <ArrowRight size={14} /></Action></div>
        </> : <div className="fc-no-fixture"><CalendarDays size={25} /><strong>Поки немає запланованих матчів</strong><span>Просунь календар або відкрий повний сезон.</span><Action onClick={nextMatch}>До наступного матчу <ArrowRight size={14} /></Action></div>}
      </section>

      <section className="fc-panel fc-form-panel">
        <div className="fc-panel-head"><div><span className="fc-panel-kicker">PLAYER STATUS</span><h3>Твоя форма</h3></div><button type="button" className="fc-link" onClick={() => navigate("player")}>Профіль <ArrowRight size={14} /></button></div>
        <div className="fc-form-player"><span className="fc-player-icon"><UserRound size={26} /></span><div><strong>{player.name}</strong><small>{positionLabels[player.position]} · {player.age} років</small></div><span className="fc-form-overall">{player.rating}</span></div>
        <div className="fc-bars">{attributes.map(([label, value]) => <div className="fc-bar-row" key={label}><span>{label}</span><div><i style={{ width: Math.max(0, Math.min(100, Number(value))) + "%" }} /></div><b>{value}</b></div>)}</div>
        <div className="fc-condition-grid"><div><Activity size={14} /><span>ФІЗИЧНИЙ СТАН</span><strong>{player.fitness}%</strong></div><div><Zap size={14} /><span>МОРАЛЬ</span><strong>{player.morale}%</strong></div></div>
      </section>
    </div>

    <div className="fc-lower-grid">
      <section className="fc-panel fc-squad-preview">
        <div className="fc-panel-head"><div><span className="fc-panel-kicker">TACTICAL HUB</span><h3>Командна схема</h3></div><button type="button" className="fc-link" onClick={() => navigate("squad")}>Склад команди <ArrowRight size={14} /></button></div>
        <div className="fc-pitch"><div className="fc-pitch-center" /><div className="fc-pitch-box fc-pitch-box-top" /><div className="fc-pitch-box fc-pitch-box-bottom" />
          {[["GK",50,91],["LB",18,75],["CB",40,76],["CB",60,76],["RB",82,75],["CM",31,53],["CM",50,58],["CM",69,53],["LW",22,27],["ST",50,20],["RW",78,27]].map(([label,x,y], i) => <span className={`fc-pitch-player ${i === 9 ? "fc-pitch-player-star" : ""}`} key={i} style={{ left: x + "%", top: y + "%" }} title={String(label)}>{i === 9 ? <Star size={11} fill="currentColor" /> : String(label).slice(0, 1)}</span>)}
          <span className="fc-pitch-formation">4 - 3 - 3</span>
        </div>
        <div className="fc-pitch-footer"><span><Users size={14} /> 11 гравців на полі</span><Action onClick={() => navigate("squad")} variant="subtle">Керувати складом <ArrowRight size={14} /></Action></div>
      </section>
      <section className="fc-panel fc-quick-panel">
        <div className="fc-panel-head"><div><span className="fc-panel-kicker">YOUR NEXT MOVE</span><h3>Розвивай кар'єру</h3></div><span className="fc-quick-flare"><Flame size={16} /></span></div>
        <button type="button" className="fc-quick-link" onClick={training}><span className="fc-quick-icon"><Target size={18} /></span><span><strong>Тренування</strong><small>Покращуй атрибути та форму</small></span><ArrowRight size={16} /></button>
        <button type="button" className="fc-quick-link" onClick={() => navigate("transfers")}><span className="fc-quick-icon"><Medal size={18} /></span><span><strong>Трансферний ринок</strong><small>Новий клуб — нова можливість</small></span><ArrowRight size={16} /></button>
        <button type="button" className="fc-quick-link" onClick={() => navigate("database")}><span className="fc-quick-icon"><Shield size={18} /></span><span><strong>Світ футболу</strong><small>Клуби, ліги та гравці з бази</small></span><ArrowRight size={16} /></button>
        <div className="fc-last-result"><div><small>ОСТАННІЙ РЕЗУЛЬТАТ</small><strong>{result}</strong><span>{previous ? formatDate(previous.date) : "Матчів ще не зіграно"}</span></div><b>{previous && lastScore !== null && rivalScore !== null ? `${previous.homeClubId === save.clubId ? lastScore : rivalScore} : ${previous.homeClubId === save.clubId ? rivalScore : lastScore}` : "— : —"}</b></div>
      </section>
    </div>

    <div className="fc-hub-footer"><span><Shield size={13} /> {club.name}</span><span><Trophy size={13} /> {standing ? `${standing.points} очок · ${standing.played} матчів` : "Сезон ще не розпочато"}</span><span><TrendingUp size={13} /> {rank > 0 ? `Місце ${rank} у таблиці` : "Таблиця оновиться після матчів"}</span><span><Dumbbell size={13} /> Зарплата {formatMoney(player.wage)}/тиж.</span></div>
  </div>;
}
