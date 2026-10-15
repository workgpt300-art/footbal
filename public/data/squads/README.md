# Historical squad data

## Current dataset

- Season convention: the season field is the start year (`2023` = `2023/24`).
- Premier League 2023/24 is stored in `2023/leagues/39.json`.
- The file contains 20 clubs and 853 player records, including name, position, date of birth, estimated age at season start, nationalities, height, preferred foot, and loan marker where available.
- Team `teamId` values are API-Football club IDs. `sourceClubId` records the ID used by the upstream dataset.
- `2023/manifest.json` tracks which leagues have data.

## Sources

- Squad data: [Samoilov2004/premier_league_dataset](https://github.com/Samoilov2004/premier_league_dataset/tree/main/dataset/DATA_JSON/Season_2023); its README says the squad data is sourced from Transfermarkt.
- Cross-check: [official Premier League 2023/24 squad lists (13 September 2023)](https://www.premierleague.com/en/news/3681595/202324-premier-league-squad-lists).

**Licensing note:** the third-party dataset repository does not present an explicit license. Before distributing this data publicly or commercially, review Transfermarkt's terms and any applicable database rights. Source metadata is included in the JSON.

## Data quality and next steps

- The upstream season files are season-scoped rosters, but fields such as `currentClub` and `marketValue` were intentionally omitted because they can reflect a later snapshot.
- `ageAtSeasonStart` is calculated from date of birth as of 1 August 2023.
- Unknown values should remain `null`; do not invent ratings, shirt numbers, or missing attributes.
- The data is committed to the repository, but `src/lib/game.ts` still needs a loader to read these files and map players into game career saves. Other leagues/seasons have not yet been populated.
