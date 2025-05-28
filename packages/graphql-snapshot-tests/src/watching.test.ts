import client from "./client";
import { gql } from "@apollo/client";

let FEATURE_ID: string = "";
let SERIES_ID: string = "";
let SEASON_ID: string = "";

jest.setTimeout(20_000);

test("import data (setup)", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportData {
        importExternalFeature(externalId: "tmdb:153", shelfId: Watched) {
          id
        }
        importExternalTvSeason(
          externalId: "tmdbSeason:87917:1"
          shelfId: FinishedSeason
        ) {
          id
          series {
            id
          }
        }
      }
    `,
  });
  FEATURE_ID = data.importExternalFeature.id;
  SEASON_ID = data.importExternalTvSeason.id;
  SERIES_ID = data.importExternalTvSeason.series.id;
});

test("watching returns both features and Tv", async () => {
  const { data } = await client.query({
    query: gql`
      query Test_Watching {
        watching(first: 10) {
          total
          items {
            __typename
            ... on Feature {
              title
              releaseYear
            }
            ... on TvSeries {
              title
              releaseYear
              seasons {
                title
                seasonNumber
                rewatch
              }
            }
          }
        }
      }
    `,
  });
  expect(data).toMatchSnapshot();
});

test("can delete data (cleanup)", async () => {
  await client.mutate({
    mutation: gql`
      mutation Test_DeleteFeature($id: ID!) {
        deleteFeature(id: $id) {
          id
        }
      }
    `,
    variables: {
      id: FEATURE_ID,
    },
  });
  await client.mutate({
    mutation: gql`
      mutation Test_DeleteSeason($id: ID!) {
        deleteTvSeason(id: $id) {
          id
        }
      }
    `,
    variables: {
      id: SEASON_ID,
    },
  });
  await client.mutate({
    mutation: gql`
      mutation Test_DeleteSeries($id: ID!) {
        deleteTvSeries(id: $id) {
          id
        }
      }
    `,
    variables: {
      id: SERIES_ID,
    },
  });
});
