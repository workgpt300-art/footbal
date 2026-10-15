export type Position = "GK" | "CB" | "LB" | "RB" | "CDM" | "CM" | "CAM" | "LW" | "RW" | "ST";
export type TrainingFocus = "finish" | "passing" | "dribbling" | "pace" | "strength" | "defending" | "vision";
export type MatchEventKind = "kickoff" | "pass" | "shot" | "goal" | "save" | "corner" | "foul" | "yellow" | "red" | "halftime" | "fulltime";
export interface LeagueDefinition { id: string; name: string; country: string; shortName: string; }
export interface Club { id: string; name: string; city: string; country: string; leagueId: string; strength: number; colors: [string, string]; initials: string; }
export interface PlayerStats { matches: number; starts: number; goals: number; assists: number; minutes: number; yellowCards: number; averageRating: number; }
export interface CareerPlayer {
  id: string; name: string; age: number; nationality: string; position: Position; preferredFoot: "Права" | "Ліва";
  height: number; weight: number; number: number; rating: number; potential: number; fitness: number; morale: number;
  form: number; value: number; wage: number; attributes: Record<string, number>; stats: PlayerStats;
  lastTrainingDate: string | null; clubId: string; joinedAt: string;
}
export interface VirtualPlayer { id: string; name: string; position: Position; rating: number; clubId: string; }
export interface MatchEvent { minute: number; kind: MatchEventKind; clubId: string; description: string; playerName?: string; }
export interface MatchStats {
  possessionHome: number; possessionAway: number; shotsHome: number; shotsAway: number; shotsOnTargetHome: number; shotsOnTargetAway: number;
  xgHome: number; xgAway: number; passesHome: number; passesAway: number; passAccuracyHome: number; passAccuracyAway: number;
  cornersHome: number; cornersAway: number; foulsHome: number; foulsAway: number; yellowsHome: number; yellowsAway: number;
  redsHome: number; redsAway: number; savesHome: number; savesAway: number;
}
export interface Fixture {
  id: string; date: string; round: number; homeClubId: string; awayClubId: string; status: "scheduled" | "played";
  homeScore: number | null; awayScore: number | null; events: MatchEvent[]; stats: MatchStats | null; playerRating?: number | null; seed: number;
}
export interface TransferOffer { id: string; clubId: string; createdAt: string; fee: number; wage: number; contractYears: number; status: "pending" | "accepted" | "rejected" | "expired"; type: "transfer" | "loan"; }
export interface NewsItem { id: string; date: string; category: "match" | "training" | "transfer" | "system"; title: string; body: string; }
export interface TryoutApplication {
  id: string;
  clubId: string;
  requestedAt: string;
  status: "invited" | "rejected" | "completed";
  score?: number;
  message?: string;
}
export type TryoutPhase = "shooting" | "passing" | "dribbling" | "complete";
export interface TryoutSession {
  id: string;
  clubId: string;
  phase: TryoutPhase;
  attemptsInPhase: number;
  totalAttempts: number;
  score: number;
  lastResult: string;
}
export interface ContractNegotiation {
  clubId: string;
  proposedWage: number;
  requestedWage: number;
  years: number;
  status: "open" | "signed" | "rejected";
  tryoutScore: number;
}
export interface SeasonSummary { season: string; clubId: string; finishedAt: string; tablePosition: number | null; careerMatches: number; careerGoals: number; careerAssists: number; }
export interface CareerSave {
  id: string; name: string; createdAt: string; updatedAt: string; date: string; season: string; player: CareerPlayer; clubId: string;
  fixtures: Fixture[]; offers: TransferOffer[]; news: NewsItem[]; trainingFocus: TrainingFocus;
  difficulty: "Нормальна" | "Складна" | "Легенда"; lastEvent: string; isDemoWorld: boolean;
  contractStatus?: "active" | "free-agent"; contractEndDate?: string; seasonHistory?: SeasonSummary[];
  tryoutApplications?: TryoutApplication[]; activeTryout?: TryoutSession | null; contractNegotiation?: ContractNegotiation | null;
}
export interface StandingRow { clubId: string; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; goalDifference: number; points: number; form: string[]; }