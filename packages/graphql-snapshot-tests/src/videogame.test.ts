import client from "./client";
import { gql } from "@apollo/client";

const ITEM_MATCHER = {
  id: expect.any(String),
};

let ADDED_ID: string = "";
let IMPORTED_ID: string = "";

jest.setTimeout(10_000);

test("can add a video game", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation {
        addVideoGame(
          item: {
            title: "Test Video Game"
            platformIds: [Nintendo3DS]
            shelfId: GaveUp
            rating: 1
            hoursPlayed: 10
          }
        ) {
          id
          title
          platforms {
            name
          }
          rating
          externalId
          notes
          image {
            url
            width
            height
          }
          replay
          hoursPlayed
        }
      }
    `,
  });
  expect(data).toMatchSnapshot({
    addVideoGame: ITEM_MATCHER,
  });
  ADDED_ID = data.addVideoGame.id;
});

test("can import external video game", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportVideoGame {
        importExternalVideoGame(externalId: "igdb:136149", shelfId: Completed) {
          id
          title
          shelf {
            id
          }
          replay
          hoursPlayed
        }
      }
    `,
  });
  expect(data).toMatchSnapshot({
    importExternalVideoGame: ITEM_MATCHER,
  });
  IMPORTED_ID = data.importExternalVideoGame.id;
});

test("can query single video game", async () => {
  const { data } = await client.query({
    query: gql`
      query Test_QuerySingleGame($id: ID!) {
        videoGame(id: $id) {
          id
          title
          shelf {
            id
            name
          }
          rating
          platforms {
            id
            name
          }
          replay
          hoursPlayed
        }
      }
    `,
    variables: {
      id: ADDED_ID,
    },
  });
  expect(data).toMatchSnapshot({
    videoGame: ITEM_MATCHER,
  });
});

test("can fetch second page of video games", async () => {
  const query = gql`
    query Test_VideoGamesPagination($after: ID) {
      videoGames(first: 1, after: $after) {
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
    videoGames: {
      nextPageCursor: expect.any(String),
      hasNextPage: true,
    },
  });

  const { data: second } = await client.query({
    query,
    variables: {
      after: first.videoGames.nextPageCursor,
    },
  });
  expect(second).toMatchSnapshot({
    videoGames: {
      nextPageCursor: null,
      hasNextPage: false,
    },
  });
});

test("can fetch video games by shelf", async () => {
  const { data } = await client.query({
    query: gql`
      {
        videoGameShelf(id: Completed) {
          name
          items(first: 1) {
            items {
              title
            }
          }
        }
      }
    `,
  });
  expect(data).toMatchSnapshot();
});

test("can search external video games", async () => {
  const { data } = await client.query({
    query: gql`
      {
        searchExternalVideoGame(term: "The Last of Us") {
          id
          title
        }
      }
    `,
  });
  expect(data.searchExternalVideoGame.length).toBeGreaterThan(0);
  data.searchExternalVideoGame.forEach((result: unknown) => {
    expect(result).toMatchSnapshot({
      id: expect.stringMatching(/^igdb:/),
      title: expect.any(String),
    });
  });
});

test("can mutate title on video game", async () => {
  const updatedTitle = "Test Video Game 2";
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MutateTitle($id: ID!, $title: String!) {
        updateVideoGame(id: $id, item: { title: $title }) {
          title
        }
      }
    `,
    variables: {
      id: ADDED_ID,
      title: updatedTitle,
    },
  });
  expect(data.updateVideoGame.title).toEqual(updatedTitle);
});

test("Can add platform to video game", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MutatePlatform($id: ID!) {
        updateVideoGame(id: $id, item: { platformIds: [Playstation4] }) {
          platforms {
            id
            name
          }
        }
      }
    `,
    variables: {
      id: ADDED_ID,
    },
  });
  expect(data).toMatchSnapshot();
});

test("can move video game between shelves", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MoveShelf($id: ID!) {
        updateVideoGame(id: $id, item: { shelfId: Played }) {
          shelf {
            id
            name
          }
        }
      }
    `,
    variables: {
      id: ADDED_ID,
    },
  });
  expect(data).toMatchSnapshot();
});

test("can delete video games (clean up)", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_VideoGame($id1: ID!, $id2: ID!) {
        delete1: deleteVideoGame(id: $id1) {
          id
        }
        delete2: deleteVideoGame(id: $id2) {
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
