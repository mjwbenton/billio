import client from "./client";
import { gql } from "@apollo/client";

const ITEM_MATCHER = {
  id: expect.any(String),
};

let TEST_VIDEO_GAME: string = "";

test("can import external video game", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportOri {
        firstImport: importExternalVideoGame(
          externalId: "igdb:136149"
          shelfId: Completed
        ) {
          id
          title
          shelf {
            id
          }
        }
        secondImport: importExternalVideoGame(
          externalId: "igdb:19456"
          shelfId: Playing
        ) {
          id
          title
          shelf {
            id
          }
        }
      }
    `,
  });
  expect(data).toMatchSnapshot({
    firstImport: ITEM_MATCHER,
    secondImport: ITEM_MATCHER,
  });
  TEST_VIDEO_GAME = data.firstImport.id;
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
        }
      }
    `,
    variables: {
      id: TEST_VIDEO_GAME,
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
  expect(first).toMatchSnapshot();

  const { data: second } = await client.query({
    query,
    variables: {
      after: first.videoGames.nextPageCursor,
    },
  });
  expect(second).toMatchSnapshot();
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
  const randomTitle = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 5);
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MutateTitle($id: ID!, $title: String!) {
        updateVideoGame(id: $id, item: { title: $title }) {
          title
        }
      }
    `,
    variables: {
      id: TEST_VIDEO_GAME,
      title: randomTitle,
    },
  });
  expect(data.updateVideoGame.title).toEqual(randomTitle);
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
      id: TEST_VIDEO_GAME,
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
      id: TEST_VIDEO_GAME,
    },
  });
  expect(data).toMatchSnapshot();
});

test("can delete video game", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_VideoGame($id: ID!) {
        deleteVideoGame(id: $id) {
          id
        }
      }
    `,
    variables: {
      id: TEST_VIDEO_GAME,
    },
  });
  expect(data.deleteVideoGame.id).toEqual(TEST_VIDEO_GAME);
});
