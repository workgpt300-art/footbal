import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, CirclePlay, Crown, Database, Flame, Gamepad2, House, Settings, Shield, Shirt, Trophy, UserRound, Users, Zap } from "lucide-react";

type MainView = "home" | "player" | "squad" | "matches" | "calendar" | "leagues" | "transfers" | "market" | "training" | "tryouts" | "stats" | "news" | "finance" | "saves" | "settings" | "import" | "database";

type Props = {
  hasSave: boolean;
  playerName?: string;
  clubName?: string;
  season?: string;
  onContinue: () => void;
  onNewCareer: () => void;
  onNavigate: (view: MainView) => void;
};

type MenuOption = { id: string; title: string; subtitle: string; view?: MainView; variant: "career" | "match" | "club" | "world" };

const menuOptions: MenuOption[] = [
  { id: "continue", title: "ПРОДОВЖИТИ", subtitle: "ПОВЕРНУТИСЯ ДО КАР'ЄРИ", variant: "career" },
  { id: "new", title: "НОВА КАР'ЄРА", subtitle: "СТВОРИТИ ВЛАСНУ ІСТОРІЮ", variant: "career" },
  { id: "match", title: "МАТЧ-ЦЕНТР", subtitle: "ВИЙТИ НА ФУТБОЛЬНЕ ПОЛЕ", view: "matches", variant: "match" },
  { id: "player", title: "МІЙ ФУТБОЛІСТ", subtitle: "РОЗВИТОК ТА АТРИБУТИ", view: "player", variant: "club" },
  { id: "squad", title: "СКЛАД КОМАНДИ", subtitle: "ТАКТИКА Й РОЗСТАНОВКА", view: "squad", variant: "club" },
  { id: "transfers", title: "ТРАНСФЕРИ", subtitle: "НАСТУПНИЙ КРОК КАР'ЄРИ", view: "transfers", variant: "world" },
  { id: "leagues", title: "СВІТ ФУТБОЛУ", subtitle: "ЛІГИ, КЛУБИ ТА ГРАВЦІ", view: "database", variant: "world" },
];

export function FCMainMenu({ hasSave, playerName, clubName, season, onContinue, onNewCareer, onNavigate }: Props) {
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  const quickModes = useMemo(() => [
    { title: "КАР'ЄРА", desc: "Побудуй власний шлях", icon: Crown, view: "home" as MainView, number: "01", tint: "gold" },
    { title: "МАТЧІ", desc: "Грай. Перемагай. Повторюй.", icon: CirclePlay, view: "matches" as MainView, number: "02", tint: "lime" },
    { title: "КОМАНДА", desc: "Склад та тактика", icon: Shirt, view: "squad" as MainView, number: "03", tint: "blue" },
    { title: "ФУТБОЛЬНИЙ СВІТ", desc: "Ліги, клуби та гравці", icon: Trophy, view: "database" as MainView, number: "04", tint: "violet" },
  ], []);

  function activate(id = menuOptions[active].id) {
    if (id === "continue") onContinue();
    else if (id === "new") onNewCareer();
    else {
      const picked = menuOptions.find((item) => item.id === id);
      if (picked?.view) onNavigate(picked.view);
    }
  }

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
    const handle = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      const key = event.key.toLowerCase();
      if (["arrowdown", "s"].includes(key)) {
        event.preventDefault();
        setActive((value) => (value + 1) % menuOptions.length);
      } else if (["arrowup", "w"].includes(key)) {
        event.preventDefault();
        setActive((value) => (value - 1 + menuOptions.length) % menuOptions.length);
      } else if (key === "enter" && target === rootRef.current) {
        event.preventDefault();
        activate();
      } else if (key === "escape") {
        event.preventDefault();
        setActive(0);
      } else if (/^[1-7]$/.test(key)) {
        const idx = Number(key) - 1;
        setActive(idx);
        activate(menuOptions[idx].id);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [active]);

  return <main className="fc27-screen" ref={rootRef} tabIndex={-1} aria-label="Головне меню FOOTBALL 27">
    <div className="fc27-stadium-photo" />
    <div className="fc27-vignette" />
    <div className="fc27-light-beam fc27-light-beam-left" />
    <div className="fc27-light-beam fc27-light-beam-right" />
    <div className="fc27-grain" />
    <header className="fc27-header">
      <button className="fc27-brand" onClick={() => setActive(0)} aria-label="Головне меню">
        <span className="fc27-brand-mark"><Shield size={20} fill="currentColor" /></span>
        <span><b>FOOTBALL <em>27</em></b><small>THE NEXT CHAPTER</small></span>
      </button>
      <nav className="fc27-topnav" aria-label="Швидка навігація">
        <button className="active" onClick={onContinue}><House size={14} /> ГОЛОВНА</button>
        <button onClick={() => hasSave ? onNavigate("home") : onNewCareer()}>КАР'ЄРА</button>
        <button onClick={() => hasSave ? onNavigate("database") : onNewCareer()}>ФУТБОЛЬНИЙ СВІТ</button>
        <button onClick={() => hasSave ? onNavigate("settings") : onNewCareer()}><Settings size={14} /> НАЛАШТУВАННЯ</button>
      </nav>
      <div className="fc27-user">
        <span className="fc27-online"><i /></span>
        <span><b>{playerName || "ГОСТЬ ГРИ"}</b><small>{clubName || "НОВА КАР'ЄРА"}{season ? " · " + season : ""}</small></span>
        <span className="fc27-user-avatar"><UserRound size={18} /></span>
      </div>
    </header>

    <section className="fc27-hero">
      <div className="fc27-hero-copy">
        <div className="fc27-season-tag"><span /> SEASON 2026 / 27 <i /> CAREER & MATCHDAY</div>
        <h1>ТВОЯ ГРА.<br /><em>ТВОЄ ПРАВИЛО.</em></h1>
        <p>Кожен матч змінює історію. Кожне рішення наближає до вершини. Почни з малого — стань легендою.</p>
        <div className="fc27-hero-actions">
          <button className="fc27-play-button" onClick={hasSave ? onContinue : onNewCareer}><CirclePlay size={20} fill="currentColor" /> {hasSave ? "ПРОДОВЖИТИ КАР'ЄРУ" : "ПОЧАТИ КАР'ЄРУ"} <ArrowRight size={18} /></button>
          <button className="fc27-secondary-button" onClick={() => hasSave ? onNavigate("matches") : onNewCareer()}><Gamepad2 size={17} /> ШВИДКИЙ МАТЧ</button>
        </div>
        <div className="fc27-platform-hint"><span className="fc27-keycap">↑</span><span className="fc27-keycap">↓</span><span>НАВІГАЦІЯ</span><b>ENTER</b><span>ОБРАТИ</span><b>1–7</b><span>ШВИДКИЙ ДОСТУП</span></div>
      </div>
      <div className="fc27-player-art" aria-hidden="true">
        <div className="fc27-art-halo" />
        <div className="fc27-art-ring fc27-art-ring-one" /><div className="fc27-art-ring fc27-art-ring-two" />
        <div className="fc27-player-backdrop" />
        <svg className="fc27-player-silhouette" viewBox="0 0 450 670" role="presentation">
          <defs><linearGradient id="fc27-shirt" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f6f9f1"/><stop offset=".48" stopColor="#b6c3b9"/><stop offset="1" stopColor="#344842"/></linearGradient><linearGradient id="fc27-shorts" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#1b3031"/><stop offset="1" stopColor="#080e12"/></linearGradient></defs>
          <ellipse cx="230" cy="636" rx="153" ry="15" fill="#9fff6c" opacity=".18"/>
          <path d="M192 52 C170 49 154 66 157 93 L166 126 C177 148 211 153 232 132 C247 118 254 95 246 72 C239 51 215 42 192 52Z" fill="#141f22"/>
          <path d="M167 116 C180 132 219 139 235 119 L247 151 L211 171 L165 148Z" fill="#2a3b39"/>
          <path d="M149 148 Q122 151 104 176 L55 254 Q47 270 65 283 L84 296 Q98 303 108 284 L157 226 L161 318 Q215 348 282 318 L279 214 L323 291 Q336 310 355 294 L370 282 Q382 270 371 252 L329 172 Q312 152 284 149 L247 143 Q226 168 198 168 Q174 167 167 143Z" fill="url(#fc27-shirt)"/>
          <path d="M154 154 L119 209 L145 225 L169 190 M300 154 L331 216 L306 229 L282 188" fill="#a8b9ae" opacity=".75"/>
          <path d="M164 312 Q207 337 282 313 L290 373 L269 440 L244 492 L205 490 L185 442 L156 371Z" fill="url(#fc27-shorts)"/>
          <path d="M180 424 L225 441 L213 533 L200 604 L157 607 L166 535Z" fill="#172625"/>
          <path d="M238 425 L277 411 L286 501 L303 583 L275 603 L253 546 L226 489Z" fill="#263b36"/>
          <path d="M158 599 L202 597 L214 624 Q210 640 178 642 L118 651 Q101 646 118 631Z" fill="#0b1114"/>
          <path d="M272 589 L304 580 L324 603 L365 626 Q373 638 355 642 L292 637 L274 622Z" fill="#0b1114"/>
          <path d="M205 175 L233 177 L231 311 L210 317Z" fill="#9aaa9e" opacity=".35"/>
          <path d="M190 185 L250 185 L252 262 L190 262Z" fill="#e7eee6" opacity=".8"/>
          <path d="M192 201 L248 201 L248 241 L192 241Z" fill="#f8faf4"/>
          <text x="220" y="232" fill="#1a2824" fontSize="31" fontWeight="900" textAnchor="middle">27</text>
          <path d="M310 632 L338 642 L345 659 L309 662 L286 649Z M135 641 L161 648 L163 664 L104 664 L102 655Z" fill="#bfff80"/>
        </svg>
        <div className="fc27-player-rim" />
        <div className="fc27-ovr"><small>CAREER RATING</small><strong>{hasSave ? " " : "—"}{hasSave ? undefined : ""}</strong><span>{hasSave ? (clubName || "YOUR CLUB") : "CREATE YOUR LEGACY"}</span></div>
        <div className="fc27-player-label"><small>PLAYER CAREER / 01</small><strong>{playerName || "YOUR NAME"}</strong><span>{clubName || "CHOOSE YOUR CLUB"}</span></div>
      </div>
      <div className="fc27-side-note"><span>THE BEAUTIFUL GAME</span><i /></div>
    </section>

    <section className="fc27-mode-section">
      <div className="fc27-mode-heading"><div><span>ВИБИРАЙ СВІЙ ШЛЯХ</span><h2>ІГРОВІ РЕЖИМИ</h2></div><div className="fc27-mode-index">ГОЛОВНЕ МЕНЮ <i /> 01 / 04</div></div>
      <div className="fc27-mode-cards">{quickModes.map((mode) => {
        const Icon = mode.icon;
        return <button type="button" key={mode.number} className={`fc27-mode-card fc27-mode-${mode.tint}`} onClick={() => hasSave ? onNavigate(mode.view) : onNewCareer()}><span className="fc27-mode-number">{mode.number}</span><span className="fc27-mode-icon"><Icon size={22} /></span><span className="fc27-mode-title">{mode.title}</span><span className="fc27-mode-desc">{mode.desc}</span><ArrowRight className="fc27-mode-arrow" size={17} /></button>;
      })}</div>
    </section>

    <footer className="fc27-footer"><span><i /> УСІ СИСТЕМИ ПРАЦЮЮТЬ</span><span>FOOTBALL 27 · CAREER MODE</span><span>КЕРУВАННЯ: КЛАВІАТУРА / МИША</span></footer>
  </main>;
}
