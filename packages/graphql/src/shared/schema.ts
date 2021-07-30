import { gql } from "apollo-server-lambda";
import Rating from "./Rating";

export const typeDefs = gql`
  type Query

  type Mutation

  scalar DateTime

  scalar Rating

  type Image {
    url: String!
    width: Float
    height: Float
  }

  input ImageInput {
    url: String!
    width: Float
    height: Float
  }

  type DeleteItemOutput {
    id: ID!
  }

  input DeleteItemInput {
    id: ID!
  }
`;

export const resolvers = {
  Rating,
};
