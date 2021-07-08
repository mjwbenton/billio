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
