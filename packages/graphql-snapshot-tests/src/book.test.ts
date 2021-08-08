import client from "./client";
import { gql } from "@apollo/client";

const ITEM_MATCHER = {
  id: expect.any(String),
};

let TEST_ID: string = "";

test("can import external book", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test {
        importExternalBook(
          externalId: "googlebooks:CkVF9cg8daMC"
          shelfId: Reading
        ) {
          id
          externalId
          title
          author
          shelf {
            id
          }
        }
      }
    `,
  });
  expect(data).toMatchSnapshot({
    importExternalBook: ITEM_MATCHER,
  });
  TEST_ID = data.importExternalBook.id;
});

test("can query single book", async () => {
  const { data } = await client.query({
    query: gql`
      query Test_QuerySingleBook($id: ID!) {
        book(id: $id) {
          id
          title
          author
          shelf {
            id
            name
          }
          rating
        }
      }
    `,
    variables: {
      id: TEST_ID,
    },
  });
  expect(data).toMatchSnapshot({
    book: ITEM_MATCHER,
  });
});

test("can fetch second page of books", async () => {
  const query = gql`
    query Test_BookPagination($after: ID) {
      books(first: 1, after: $after) {
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
      after: first.books.nextPageCursor,
    },
  });
  expect(second).toMatchSnapshot();
});

test("can fetch books by shelf", async () => {
  const { data } = await client.query({
    query: gql`
      {
        bookShelf(id: Reading) {
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

test("can search for external books", async () => {
  const { data } = await client.query({
    query: gql`
      {
        searchExternalBook(term: "The Damned United") {
          id
          title
        }
      }
    `,
  });
  expect(data.searchExternalBook.length).toBeGreaterThan(0);
  data.searchExternalBook.forEach((result: unknown) => {
    expect(result).toMatchSnapshot({
      id: expect.stringMatching(/^googlebooks:/),
      title: expect.any(String),
    });
  });
});

test("can mutate title on book", async () => {
  const randomTitle = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 5);
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MutateTitle($id: ID!, $title: String!) {
        updateBook(id: $id, item: { title: $title }) {
          title
        }
      }
    `,
    variables: {
      id: TEST_ID,
      title: randomTitle,
    },
  });
  expect(data.updateBook.title).toEqual(randomTitle);
});

test("movedAt doesn't change on rating", async () => {
  const {
    data: {
      book: { movedAt },
    },
  } = await client.query<any>({
    query: gql`
      query Test_FetchMovedAt($id: ID!) {
        book(id: $id) {
          id
          movedAt
        }
      }
    `,
    variables: { id: TEST_ID },
  });
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MutateRating($id: ID!) {
        updateBook(id: $id, item: { rating: 10 }) {
          movedAt
          rating
        }
      }
    `,
    variables: { id: TEST_ID },
  });
  expect(data.updateBook.rating).toEqual(10);
  expect(data.updateBook.movedAt).toEqual(movedAt);
});

test("moving between shelves updates movedAt", async () => {
  const {
    data: { movedAt },
  } = await client.query({
    query: gql`
      query Test_FetchMovedAt($id: ID!) {
        book(id: $id) {
          id
          movedAt
        }
      }
    `,
    variables: { id: TEST_ID },
  });
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_MoveShelf($id: ID!) {
        updateBook(id: $id, item: { shelfId: Read }) {
          shelf {
            id
            name
          }
          movedAt
        }
      }
    `,
    variables: {
      id: TEST_ID,
    },
  });
  expect(data.updateBook.shelf.id).toEqual("Read");
  expect(data.updateBook.movedAt).not.toEqual(movedAt);
});

test("cannot rate book more than 10", async () => {
  expect.assertions(1);
  try {
    await client.mutate({
      mutation: gql`
        mutation Test_InvalidRating($id: ID!) {
          updateBook(id: $id, item: { rating: 11 }) {
            id
          }
        }
      `,
      variables: {
        id: TEST_ID,
      },
    });
  } catch (e) {
    expect(JSON.stringify(e)).toMatch("Invalid rating: 11");
  }
});

test("can add note to a book", async () => {
  const NOTE = "Test Note";
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_AddNote($id: ID!, $note: String!) {
        updateBook(id: $id, item: { notes: $note }) {
          notes
        }
      }
    `,
    variables: {
      id: TEST_ID,
      note: NOTE,
    },
  });
  expect(data.updateBook.notes).toEqual(NOTE);
});

test("can delete book", async () => {
  const { data } = await client.mutate({
    mutation: gql`
      mutation Test_DeleteBook($id: ID!) {
        deleteBook(id: $id) {
          id
        }
      }
    `,
    variables: {
      id: TEST_ID,
    },
  });
  expect(data.deleteBook.id).toEqual(TEST_ID);
});
