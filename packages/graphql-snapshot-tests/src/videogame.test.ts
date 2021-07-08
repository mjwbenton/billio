import client from "./client";
import { gql } from "@apollo/client";

test("can query single video game", async () => {
  const { data } = await client.query({
    query: gql`
      {
        videoGame(id: "531f6e1e-8ed4-464b-96f9-a74c1eb751fd") {
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
          createdAt
          updatedAt
        }
      }
    `,
  });
  expect(data).toMatchSnapshot();
});

test("can fetch second page of video games", async () => {
  const query = gql`
    query VideoGamesPagination($after: ID) {
      videoGames(first: 1, after: $after) {
        items {
          title
          id
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
