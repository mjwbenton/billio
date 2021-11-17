import client from "./client";
import { gql } from "@apollo/client";

const ITEM_MATCHER = {
  id: expect.any(String),
};

let ADDED_ID: string = "";
let IMPORTED_ID: string = "";

test("can add a movie", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_AddMovie {
        addMovie(
          item: {
            title: "Test Movie"
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
        }
      }
    `,
  });
  expect(data).toMatchSnapshot({
    addMovie: ITEM_MATCHER,
  });
  ADDED_ID = data.addMovie.id;
});

test("can import external movie", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_ImportMovie {
        importExternalMovie(externalId: "tmdb:153", shelfId: Watched) {
          id
          externalId
          title
          releaseYear
          shelf {
            id
          }
        }
      }
    `,
  });
  expect(data).toMatchSnapshot({
    importExternalMovie: ITEM_MATCHER,
  });
  IMPORTED_ID = data.importExternalMovie.id;
});

test("can query single movie", async () => {
  const { data } = await client.query({
    query: gql`
      query Test_QuerySingleMovie($id: ID!) {
        movie(id: $id) {
          id
          title
          releaseYear
          shelf {
            id
            name
          }
          rating
        }
      }
    `,
    variables: {
      id: ADDED_ID,
    },
  });
  expect(data).toMatchSnapshot({
    movie: ITEM_MATCHER,
  });
});

test("can fetch second page of movies", async () => {
  const query = gql`
    query Test_MoviePagination($after: ID) {
      movies(first: 1, after: $after) {
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
    movies: {
      nextPageCursor: expect.any(String),
      hasNextPage: true,
    },
  });

  const { data: second } = await client.query({
    query,
    variables: {
      after: first.movies.nextPageCursor,
    },
  });
  expect(second).toMatchSnapshot({
    movies: {
      nextPageCursor: null,
      hasNextPage: false,
    },
  });
});

test("can search for external movies", async () => {
  const { data } = await client.query({
    query: gql`
      {
        searchExternalMovie(term: "Lost in Translation") {
          id
          title
        }
      }
    `,
  });
  expect(data.searchExternalMovie.length).toBeGreaterThan(0);
  data.searchExternalMovie.forEach((result: unknown) => {
    expect(result).toMatchSnapshot({
      id: expect.stringMatching(/^tmdb:/),
      title: expect.any(String),
    });
  });
});

test("can mutate title on movie without change to other fields", async () => {
  const updatedTitle = "Test Movie 2";
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MutateTitle($id: ID!, $title: String!) {
        updateMovie(id: $id, item: { title: $title }) {
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
      movie: { movedAt },
    },
  } = await client.query<any>({
    query: gql`
      query Test_FetchMovedAt($id: ID!) {
        movie(id: $id) {
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
        updateMovie(id: $id, item: { rating: 10 }) {
          movedAt
          rating
        }
      }
    `,
    variables: { id: ADDED_ID },
  });
  expect(data.updateMovie.rating).toEqual(10);
  expect(data.updateMovie.movedAt).toEqual(movedAt);
});

test("cannot rate movie more than 10", async () => {
  expect.assertions(1);
  try {
    await client.mutate({
      mutation: gql`
        mutation Test_InvalidRating($id: ID!) {
          updateMovie(id: $id, item: { rating: 11 }) {
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

test("can add note to a movie", async () => {
  const NOTE = "Test Note";
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_AddNote($id: ID!, $note: String!) {
        updateMovie(id: $id, item: { notes: $note }) {
          notes
        }
      }
    `,
    variables: {
      id: ADDED_ID,
      note: NOTE,
    },
  });
  expect(data.updateMovie.notes).toEqual(NOTE);
});

test("can delete movies (cleanup)", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_DeleteMovie($id1: ID!, $id2: ID!) {
        delete1: deleteMovie(id: $id1) {
          id
        }
        delete2: deleteMovie(id: $id2) {
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
