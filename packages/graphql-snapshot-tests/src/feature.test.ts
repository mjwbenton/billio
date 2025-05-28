import client from "./client";
import { gql } from "@apollo/client";

const ITEM_MATCHER = {
  id: expect.any(String),
};

let ADDED_ID: string = "";
let IMPORTED_ID: string = "";

test("can add a feature", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_AddFeature {
        addFeature(
          item: {
            title: "Test Feature"
            releaseYear: "2021"
            shelfId: Watched
            rating: 1
          }
        ) {
          id
          title
          releaseYear
          shelf {
            name
          }
          rating
          rewatch
        }
      }
    `,
  });
  expect(data).toMatchSnapshot({
    addFeature: ITEM_MATCHER,
  });
  ADDED_ID = data.addFeature.id;
});

test("can import external feature", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportFeature {
        importExternalFeature(externalId: "tmdb:153", shelfId: Watched) {
          id
          externalId
          title
          releaseYear
          shelf {
            id
          }
          rewatch
        }
      }
    `,
  });
  expect(data).toMatchSnapshot({
    importExternalFeature: ITEM_MATCHER,
  });
  IMPORTED_ID = data.importExternalFeature.id;
});

test("can query single feature", async () => {
  const { data } = await client.query({
    query: gql`
      query Test_QuerySingleFeature($id: ID!) {
        feature(id: $id) {
          id
          title
          releaseYear
          shelf {
            id
            name
          }
          rating
          rewatch
        }
      }
    `,
    variables: {
      id: ADDED_ID,
    },
  });
  expect(data).toMatchSnapshot({
    feature: ITEM_MATCHER,
  });
});

test("can fetch second page of features", async () => {
  const query = gql`
    query Test_FeaturePagination($after: ID) {
      features(first: 1, after: $after) {
        items {
          title
        }
        hasNextPage
        nextPageCursor
      }
    }
  `;

  const { data: first } = await client.query({
    query,
  });
  expect(first).toMatchSnapshot({
    features: {
      nextPageCursor: expect.any(String),
      hasNextPage: true,
    },
  });

  const { data: second } = await client.query({
    query,
    variables: {
      after: first.features.nextPageCursor,
    },
  });
  expect(second).toMatchSnapshot({
    features: {
      nextPageCursor: null,
      hasNextPage: false,
    },
  });
});

test("can search for external features", async () => {
  const { data } = await client.query({
    query: gql`
      {
        searchExternalFeature(term: "Lost in Translation") {
          id
          title
        }
      }
    `,
  });
  expect(data.searchExternalFeature.length).toBeGreaterThan(0);
  data.searchExternalFeature.forEach((result: unknown) => {
    expect(result).toMatchSnapshot({
      id: expect.stringMatching(/^tmdb:/),
      title: expect.any(String),
    });
  });
});

test("can mutate title on feature without change to other fields", async () => {
  const updatedTitle = "Test Feature 2";
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MutateTitle($id: ID!, $title: String!) {
        updateFeature(id: $id, item: { title: $title }) {
          title
          releaseYear
          rating
          externalId
          notes
          image {
            url
            width
            height
          }
        }
      }
    `,
    variables: {
      id: ADDED_ID,
      title: updatedTitle,
    },
  });
  expect(data).toMatchSnapshot();
});

test("movedAt doesn't change on rating", async () => {
  const {
    data: {
      feature: { movedAt },
    },
  } = await client.query<any>({
    query: gql`
      query Test_FetchMovedAt($id: ID!) {
        feature(id: $id) {
          id
          movedAt
        }
      }
    `,
    variables: { id: ADDED_ID },
  });
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MutateRating($id: ID!) {
        updateFeature(id: $id, item: { rating: 10 }) {
          movedAt
          rating
        }
      }
    `,
    variables: { id: ADDED_ID },
  });
  expect(data.updateFeature.rating).toEqual(10);
  expect(data.updateFeature.movedAt).toEqual(movedAt);
});

test("cannot rate feature more than 10", async () => {
  expect.assertions(1);
  try {
    await client.mutate({
      mutation: gql`
        mutation Test_InvalidRating($id: ID!) {
          updateFeature(id: $id, item: { rating: 11 }) {
            id
          }
        }
      `,
      variables: {
        id: ADDED_ID,
      },
    });
  } catch (e) {
    expect(JSON.stringify(e)).toMatch("Invalid rating: 11");
  }
});

test("can add note to a feature", async () => {
  const NOTE = "Test Note";
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_AddNote($id: ID!, $note: String!) {
        updateFeature(id: $id, item: { notes: $note }) {
          notes
        }
      }
    `,
    variables: {
      id: ADDED_ID,
      note: NOTE,
    },
  });
  expect(data.updateFeature.notes).toEqual(NOTE);
});

test("can delete features (cleanup)", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_DeleteFeature($id1: ID!, $id2: ID!) {
        delete1: deleteFeature(id: $id1) {
          id
        }
        delete2: deleteFeature(id: $id2) {
          id
        }
      }
    `,
    variables: {
      id1: ADDED_ID,
      id2: IMPORTED_ID,
    },
  });
  expect(data.delete1.id).toEqual(ADDED_ID);
  expect(data.delete2.id).toEqual(IMPORTED_ID);
});
