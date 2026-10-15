import { describe, expect, it } from "vitest";
import { advanceOneDay, advanceToNextMatch, CLUBS, createCareer, getStandings, simulateFixture, trainPlayer } from "./game";

const makeCareer = () => createCareer({
  playerName: "Тестовий Гравець",
  clubId: "karpaty-lviv",
  position: "ST",
  age: 18,
  nationality: "Україна",
  preferredFoot: "Права",
  difficulty: "Нормальна",
});

describe("FOOTBALL CAREER game foundation", () => {
  it("creates a double round-robin calendar for every configured league", () => {
    const save = makeCareer();
    const expectedFixtures = [...new Set(CLUBS.map((club) => club.leagueId))].reduce((total, leagueId) => {
      const clubCount = CLUBS.filter((club) => club.leagueId === leagueId).length;
      return total + clubCount * (clubCount - 1);
    }, 0);
    expect(save.player.name).toBe("Тестовий Гравець");
    expect(save.fixtures).toHaveLength(expectedFixtures);
    expect(save.fixtures.every((fixture) => fixture.status === "scheduled")).toBe(true);
    expect(new Set(save.fixtures.map((fixture) => fixture.id)).size).toBe(expectedFixtures);
    for (const leagueId of new Set(CLUBS.map((club) => club.leagueId))) {
      const leagueClubs = new Set(CLUBS.filter((club) => club.leagueId === leagueId).map((club) => club.id));
      const leagueFixtures = save.fixtures.filter((fixture) => leagueClubs.has(fixture.homeClubId));
      expect(leagueFixtures.length).toBe(leagueClubs.size * (leagueClubs.size - 1));
      expect(leagueFixtures.every((fixture) => leagueClubs.has(fixture.awayClubId))).toBe(true);
    }
  });

  it("produces a match score consistent with goal events", () => {
    const save = makeCareer();
    const result = simulateFixture(save.fixtures[0], save);
    expect(result.status).toBe("played");
    expect(result.homeScore).toBe(result.events.filter((event) => event.kind === "goal" && event.clubId === result.homeClubId).length);
    expect(result.awayScore).toBe(result.events.filter((event) => event.kind === "goal" && event.clubId === result.awayClubId).length);
    expect((result.stats?.possessionHome ?? 0) + (result.stats?.possessionAway ?? 0)).toBe(100);
  });

  it("derives standings from completed fixtures only", () => {
    const save = makeCareer();
    expect(getStandings(save.fixtures).every((row) => row.played === 0 && row.points === 0)).toBe(true);
    const result = simulateFixture(save.fixtures[0], save);
    const standings = getStandings(save.fixtures.map((fixture) => fixture.id === result.id ? result : fixture));
    expect(standings.reduce((sum, row) => sum + row.played, 0)).toBe(2);
    expect(standings.reduce((sum, row) => sum + row.points, 0)).toBeGreaterThanOrEqual(2);
  });


  it("opens a fresh season after all world fixtures are finished", () => {
    const save = makeCareer();
    const completed = {
      ...save,
      fixtures: save.fixtures.map((fixture) => ({ ...fixture, status: "played" as const, homeScore: 0, awayScore: 0 })),
    };
    const next = advanceOneDay(completed);
    expect(next.season).toBe("2027/28");
    expect(next.seasonHistory).toHaveLength(1);
    expect(next.fixtures.length).toBe(save.fixtures.length);
    expect(next.fixtures.every((fixture) => fixture.status === "scheduled")).toBe(true);
    expect(next.player.age).toBe(save.player.age + 1);
  });

  it("does not apply a free agent's rating to their former club's result", () => {
    const save = makeCareer();
    const fixture = save.fixtures.find((item) => item.homeClubId === save.clubId || item.awayClubId === save.clubId);
    expect(fixture).toBeDefined();
    const lowRated = { ...save, contractStatus: "free-agent" as const, player: { ...save.player, rating: 25 } };
    const highRated = { ...save, contractStatus: "free-agent" as const, player: { ...save.player, rating: 99 } };
    const lowResult = simulateFixture(fixture!, lowRated);
    const highResult = simulateFixture(fixture!, highRated);
    expect([lowResult.homeScore, lowResult.awayScore]).toEqual([highResult.homeScore, highResult.awayScore]);
  });

  it("does not progress former-club fixtures or credit matches to a free agent", () => {
    const save = makeCareer();
    const fixture = save.fixtures.find((item) => item.homeClubId === save.clubId || item.awayClubId === save.clubId);
    expect(fixture).toBeDefined();
    const matchDay = new Date(fixture!.date + "T12:00:00.000Z");
    matchDay.setUTCDate(matchDay.getUTCDate() - 1);
    const freeAgent = {
      ...save,
      date: matchDay.toISOString().slice(0, 10),
      contractStatus: "free-agent" as const,
    };
    expect(advanceToNextMatch(freeAgent)).toBe(freeAgent);
    const next = advanceOneDay(freeAgent);
    expect(next.player.stats.matches).toBe(save.player.stats.matches);
    expect(next.player.stats.minutes).toBe(save.player.stats.minutes);
  });

  it("limits one training session to one attribute step and reduces fitness", () => {
    const save = makeCareer();
    const before = save.player.attributes.finishing;
    const trained = trainPlayer(save, "finish");
    expect(trained.save.player.attributes.finishing).toBe(before + 1);
    expect(trained.save.player.fitness).toBe(save.player.fitness - 6);
    const laterSameDay = trainPlayer(trained.save, "finish");
    expect(laterSameDay.save.player.attributes.finishing).toBe(before + 1);
  });
});