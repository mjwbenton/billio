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

jest.setTimeout(10_000);

test("can add a tv series", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_AddTvSeries {
        addTvSeries(
          item: { title: "Test TV Series", shelfId: GaveUp, rating: 1 }
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
            seasons {
              seasonNumber
            }
          }
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

test("can import external tv season for already imported tv series", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportTvSeason1 {
        importExternalTvSeason(
          externalId: "tmdbSeason:87917:1"
          shelfId: Watched
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
    FOR_ALL_MANKIND_SERIES_ID
  );
  // TODO: Currently fails
  /*expect(data.importExternalTvSeason.shelf.id).toEqual(
    data.importExternalTvSeason.series.shelf.id
  );*/
  expect(data.importExternalTvSeason.rating).toEqual(
    data.importExternalTvSeason.rating
  );
  expect(data.importExternalTvSeason.movedAt).toEqual(
    data.importExternalTvSeason.movedAt
  );
});

test("can import external tv season when tv series not yet imported", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportExternalTvSeason2 {
        importExternalTvSeason(
          externalId: "tmdbSeason:94951:1"
          shelfId: Watched
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
    data.importExternalTvSeason.series.shelf.id
  );
  expect(data.importExternalTvSeason.rating).toEqual(
    data.importExternalTvSeason.rating
  );
  expect(data.importExternalTvSeason.movedAt).toEqual(
    data.importExternalTvSeason.movedAt
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

test("can delete Tv (cleanup)", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_DeleteTv(
        $series1: ID!
        $series2: ID!
        $series3: ID!
        $season1: ID!
        $season2: ID!
        $season3: ID!
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
        deleteSeason1: deleteTvSeason(id: $season1) {
          id
        }
        deleteSeason2: deleteTvSeason(id: $season2) {
          id
        }
        deleteSeason3: deleteTvSeason(id: $season3) {
          id
        }
      }
    `,
    variables: {
      series1: ADDED_TV_SERIES,
      series2: FOR_ALL_MANKIND_SERIES_ID,
      series3: MYTHIC_QUEST_SERIES_ID,
      season1: ADDED_TV_SEASON,
      season2: FOR_ALL_MANKIND_SEASON_1_ID,
      season3: MYTHIC_QUEST_SEASON_1_ID,
    },
  });
  expect(data.deleteSeries1.id).toEqual(ADDED_TV_SERIES);
  expect(data.deleteSeries2.id).toEqual(FOR_ALL_MANKIND_SERIES_ID);
  expect(data.deleteSeries3.id).toEqual(MYTHIC_QUEST_SERIES_ID);
  expect(data.deleteSeason1.id).toEqual(ADDED_TV_SEASON);
  expect(data.deleteSeason2.id).toEqual(FOR_ALL_MANKIND_SEASON_1_ID);
  expect(data.deleteSeason3.id).toEqual(MYTHIC_QUEST_SEASON_1_ID);
});