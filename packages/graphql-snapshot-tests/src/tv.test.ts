import client from "./client";
import { gql } from "@apollo/client";

const ITEM_MATCHER = {
  id: expect.any(String),
  movedAt: expect.any(String),
};

let ADDED_TV_SERIES: string = "";
let ADDED_TV_SEASON: string = "";
let FOR_ALL_MANKIND_SERIES_ID: string = "";
let FOR_ALL_MANKIND_SEASON_1_ID: string = "";
let MYTHIC_QUEST_SERIES_ID: string = "";
let MYTHIC_QUEST_SEASON_1_ID: string = "";
let MYTHIC_QUEST_SEASON_2_ID: string = "";

jest.setTimeout(10_000);

test("can add a tv series", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_AddTvSeries {
        addTvSeries(
          item: {
            title: "Test TV Series"
            shelfId: GaveUp
            rating: 1
            releaseYear: "2021"
          }
        ) {
          id
          movedAt
          title
          shelf {
            name
          }
          rating
          seasons {
            seasonNumber
          }
        }
      }
    `,
  });
  ADDED_TV_SERIES = data.addTvSeries.id;
  expect(data).toMatchSnapshot({
    addTvSeries: ITEM_MATCHER,
  });
});

test("can add a tv season", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_AddTvSeries($seriesId: ID!) {
        addTvSeason(
          item: {
            title: "Test TV Series"
            shelfId: GaveUp
            rating: 1
            seriesId: $seriesId
            seasonNumber: 1
            releaseYear: "2021"
          }
        ) {
          id
          movedAt
          title
          shelf {
            name
          }
          rating
          series {
            title
            rating
            seasons {
              seasonNumber
            }
          }
          rewatch
        }
      }
    `,
    variables: {
      seriesId: ADDED_TV_SERIES,
    },
  });
  ADDED_TV_SEASON = data.addTvSeason.id;
  expect(data).toMatchSnapshot({
    addTvSeason: ITEM_MATCHER,
  });
});

test("can import external tv series", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportTvSeries {
        importExternalTvSeries(
          externalId: "tmdbSeries:87917"
          shelfId: Watching
        ) {
          id
          movedAt
          externalId
          title
          shelf {
            id
          }
          seasons {
            seasonNumber
          }
        }
      }
    `,
  });
  FOR_ALL_MANKIND_SERIES_ID = data.importExternalTvSeries.id;
  expect(data).toMatchSnapshot({
    importExternalTvSeries: ITEM_MATCHER,
  });
});

test("can import first tv season for already imported tv series", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportTvSeason1 {
        importExternalTvSeason(
          externalId: "tmdbSeason:87917:1"
          shelfId: FinishedSeason
          overrides: { rating: 9 }
        ) {
          id
          externalId
          title
          shelf {
            id
          }
          movedAt
          rating
          series {
            id
            seasons {
              seasonNumber
            }
            shelf {
              id
            }
            movedAt
            rating
          }
          rewatch
        }
      }
    `,
  });
  FOR_ALL_MANKIND_SEASON_1_ID = data.importExternalTvSeason.id;
  expect(data).toMatchSnapshot({
    importExternalTvSeason: {
      ...ITEM_MATCHER,
      series: ITEM_MATCHER,
    },
  });
  expect(data.importExternalTvSeason.series.id).toEqual(
    FOR_ALL_MANKIND_SERIES_ID,
  );
  expect(data.importExternalTvSeason.shelf.id).toEqual(
    data.importExternalTvSeason.series.shelf.id,
  );
  expect(data.importExternalTvSeason.rating).toEqual(
    data.importExternalTvSeason.rating,
  );
  expect(data.importExternalTvSeason.movedAt).toEqual(
    data.importExternalTvSeason.movedAt,
  );
});

test("can import external tv season when tv series not yet imported", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportTvSeason2 {
        importExternalTvSeason(
          externalId: "tmdbSeason:94951:1"
          shelfId: Watching
          overrides: { rating: 7 }
        ) {
          id
          externalId
          title
          shelf {
            id
          }
          movedAt
          rating
          series {
            id
            externalId
            seasons {
              seasonNumber
            }
            shelf {
              id
            }
            rating
            movedAt
          }
          rewatch
        }
      }
    `,
  });
  MYTHIC_QUEST_SEASON_1_ID = data.importExternalTvSeason.id;
  MYTHIC_QUEST_SERIES_ID = data.importExternalTvSeason.series.id;
  expect(data).toMatchSnapshot({
    importExternalTvSeason: {
      ...ITEM_MATCHER,
      series: ITEM_MATCHER,
    },
  });
  expect(data.importExternalTvSeason.shelf.id).toEqual(
    data.importExternalTvSeason.series.shelf.id,
  );
  expect(data.importExternalTvSeason.rating).toEqual(
    data.importExternalTvSeason.rating,
  );
  expect(data.importExternalTvSeason.movedAt).toEqual(
    data.importExternalTvSeason.movedAt,
  );
});

test("can import second tv season for already imported tv series", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportTvSeason3 {
        importExternalTvSeason(
          externalId: "tmdbSeason:94951:2"
          shelfId: Watching
          overrides: { rating: 6 }
        ) {
          id
          externalId
          title
          shelf {
            id
          }
          movedAt
          rating
          series {
            id
            externalId
            seasons {
              seasonNumber
            }
            shelf {
              id
            }
            rating
            movedAt
          }
          rewatch
        }
      }
    `,
  });
  MYTHIC_QUEST_SEASON_2_ID = data.importExternalTvSeason.id;
  expect(data).toMatchSnapshot({
    importExternalTvSeason: {
      ...ITEM_MATCHER,
      series: ITEM_MATCHER,
    },
  });
  expect(data.importExternalTvSeason.series.id).toEqual(MYTHIC_QUEST_SERIES_ID);
  expect(data.importExternalTvSeason.shelf.id).toEqual(
    data.importExternalTvSeason.series.shelf.id,
  );
  expect(data.importExternalTvSeason.rating).toEqual(
    data.importExternalTvSeason.rating,
  );
  expect(data.importExternalTvSeason.movedAt).toEqual(
    data.importExternalTvSeason.movedAt,
  );
});

test("can query seasons on tv series", async () => {
  const { data } = await client.query({
    query: gql`
      query Test_QuerySeasonOnTvSeries($id: ID!) {
        tvSeriesSingle(id: $id) {
          seasons {
            seasonNumber
          }
        }
      }
    `,
    variables: {
      id: FOR_ALL_MANKIND_SERIES_ID,
    },
  });
  expect(data).toMatchSnapshot();
});

test("can query series on tv season", async () => {
  const { data } = await client.query({
    query: gql`
      query Test_QuerySeriesOnTvSeason($id: ID!) {
        tvSeason(id: $id) {
          series {
            title
          }
        }
      }
    `,
    variables: {
      id: FOR_ALL_MANKIND_SEASON_1_ID,
    },
  });
  expect(data).toMatchSnapshot();
});

test("can search for external tv series", async () => {
  const { data } = await client.query({
    query: gql`
      {
        searchExternalTvSeries(term: "Mythic Quest") {
          id
          title
          seasons {
            id
            seasonNumber
          }
        }
      }
    `,
  });
  expect(data.searchExternalTvSeries.length).toBeGreaterThan(0);
  data.searchExternalTvSeries.forEach((result: unknown) => {
    expect(result).toMatchSnapshot({
      id: expect.stringMatching(/^tmdbSeries:/),
      title: expect.any(String),
      seasons: expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/^tmdbSeason:/),
          seasonNumber: expect.any(Number),
        }),
      ]),
    });
  });
});

test("When last seasons rating is updated, the series rating is updated", async () => {
  const rating = 8;
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_UpdateRating($id: ID!, $rating: Rating!) {
        updateTvSeason(id: $id, item: { rating: $rating }) {
          rating
          series {
            rating
          }
        }
      }
    `,
    variables: {
      id: MYTHIC_QUEST_SEASON_2_ID,
      rating,
    },
  });
  expect(data.updateTvSeason.rating).toEqual(rating);
  expect(data.updateTvSeason.series.rating).toEqual(rating);
});

test("When earlier seasons rating is updated, the series rating is not updated", async () => {
  const rating = 9;
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_UpdateRating($id: ID!, $rating: Rating!) {
        updateTvSeason(id: $id, item: { rating: $rating }) {
          rating
          series {
            rating
          }
        }
      }
    `,
    variables: {
      id: MYTHIC_QUEST_SEASON_1_ID,
      rating,
    },
  });
  expect(data.updateTvSeason.rating).toEqual(rating);
  expect(data.updateTvSeason.series.rating).not.toEqual(rating);
});

test("When the shelf of the last season is updated, the series movedAt and shelf is updated", async () => {
  const shelf = "FinishedSeason";
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_UpdateShelf($id: ID!, $shelf: TvSeasonShelfId!) {
        updateTvSeason(id: $id, item: { shelfId: $shelf }) {
          shelf {
            id
          }
          movedAt
          series {
            shelf {
              id
            }
            movedAt
          }
        }
      }
    `,
    variables: {
      id: MYTHIC_QUEST_SEASON_2_ID,
      shelf,
    },
  });
  expect(data.updateTvSeason.shelf.id).toEqual(shelf);
  expect(data.updateTvSeason.series.shelf.id).toEqual(shelf);
  expect(data.updateTvSeason.series.movedAt).toEqual(
    data.updateTvSeason.movedAt,
  );
});

test("When the last seasons movedAt is updated, the series movedAt is updated", async () => {
  const movedAt = new Date().toISOString();
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_UpdateMovedAt($id: ID!, $movedAt: DateTime!) {
        updateTvSeason(id: $id, item: { movedAt: $movedAt }) {
          movedAt
          series {
            movedAt
          }
        }
      }
    `,
    variables: {
      id: MYTHIC_QUEST_SEASON_2_ID,
      movedAt,
    },
  });
  expect(data.updateTvSeason.movedAt).toEqual(movedAt);
  expect(data.updateTvSeason.series.movedAt).toEqual(movedAt);
});

test("When the shelf of an earlier season is updated, the series shelf is not updated", async () => {
  const shelf = "GaveUp";
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_UpdateShelf($id: ID!, $shelf: TvSeasonShelfId!) {
        updateTvSeason(id: $id, item: { shelfId: $shelf }) {
          shelf {
            id
          }
          movedAt
          series {
            shelf {
              id
            }
            movedAt
          }
        }
      }
    `,
    variables: {
      id: MYTHIC_QUEST_SEASON_1_ID,
      shelf,
    },
  });
  expect(data.updateTvSeason.shelf.id).toEqual(shelf);
  expect(data.updateTvSeason.series.shelf.id).not.toEqual(shelf);
  expect(data.updateTvSeason.series.movedAt).not.toEqual(
    data.updateTvSeason.movedAt,
  );
});

test("Cannot add a season without an attached series", async () => {
  const executeMutation = client.mutate({
    mutation: gql`
      mutation Test_AddWithInvalidSeries {
        createTvSeason(
          item: {
            title: "Test"
            seriesId: "INVALID"
            seasonNumber: 1
            shelfId: FinishedSeason
          }
        )
      }
    `,
  });
  expect(executeMutation).rejects.toBeTruthy();
});

test("Cannot move a season to an invalid series", async () => {
  const executeMutation = client.mutate({
    mutation: gql`
      mutation Test_UpdateToInvalidSeries($id: ID!) {
        updateTvSeason(id: $id, item: { seriesId: "INVALID" })
      }
    `,
    variables: {
      id: MYTHIC_QUEST_SEASON_2_ID,
    },
  });
  expect(executeMutation).rejects.toBeTruthy();
});

test("Cannot delete a series with an attached season", async () => {
  const executeMutation = client.mutate({
    mutation: gql`
      mutation Test_DeleteSeriesWithAttachedSeason($id: ID!) {
        updateTvSeries(id: $id) {
          id
        }
      }
    `,
    variables: {
      id: MYTHIC_QUEST_SERIES_ID,
    },
  });
  expect(executeMutation).rejects.toBeTruthy();
});

test("can delete Tv (cleanup)", async () => {
  const { data: seasonData } = await client.mutate({
    mutation: gql`
      mutation Test_DeleteTvSeasons(
        $season1: ID!
        $season2: ID!
        $season3: ID!
        $season4: ID!
      ) {
        deleteSeason1: deleteTvSeason(id: $season1) {
          id
        }
        deleteSeason2: deleteTvSeason(id: $season2) {
          id
        }
        deleteSeason3: deleteTvSeason(id: $season3) {
          id
        }
        deleteSeason4: deleteTvSeason(id: $season4) {
          id
        }
      }
    `,
    variables: {
      season1: ADDED_TV_SEASON,
      season2: FOR_ALL_MANKIND_SEASON_1_ID,
      season3: MYTHIC_QUEST_SEASON_1_ID,
      season4: MYTHIC_QUEST_SEASON_2_ID,
    },
  });
  expect(seasonData.deleteSeason1.id).toEqual(ADDED_TV_SEASON);
  expect(seasonData.deleteSeason2.id).toEqual(FOR_ALL_MANKIND_SEASON_1_ID);
  expect(seasonData.deleteSeason3.id).toEqual(MYTHIC_QUEST_SEASON_1_ID);
  expect(seasonData.deleteSeason4.id).toEqual(MYTHIC_QUEST_SEASON_2_ID);

  const { data: seriesData } = await client.mutate({
    mutation: gql`
      mutation Test_DeleteTvSeries(
        $series1: ID!
        $series2: ID!
        $series3: ID!
      ) {
        deleteSeries1: deleteTvSeries(id: $series1) {
          id
        }
        deleteSeries2: deleteTvSeries(id: $series2) {
          id
        }
        deleteSeries3: deleteTvSeries(id: $series3) {
          id
        }
      }
    `,
    variables: {
      series1: ADDED_TV_SERIES,
      series2: FOR_ALL_MANKIND_SERIES_ID,
      series3: MYTHIC_QUEST_SERIES_ID,
    },
  });
  expect(seriesData.deleteSeries1.id).toEqual(ADDED_TV_SERIES);
  expect(seriesData.deleteSeries2.id).toEqual(FOR_ALL_MANKIND_SERIES_ID);
  expect(seriesData.deleteSeries3.id).toEqual(MYTHIC_QUEST_SERIES_ID);
});
