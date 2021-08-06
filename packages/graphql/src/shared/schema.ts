import { gql } from "apollo-server-lambda";
import Rating from "./Rating";
import { DateTimeResolver as DateTime } from "graphql-scalars";

export const typeDefs = gql`
  type Query

  type Mutation

  scalar DateTime

  scalar Rating

  interface Item {
    id: ID!
    addedAt: DateTime!
    movedAt: DateTime!
    notes: String
    title: String!
    externalId: ID
    rating: Rating
    image: Image
  }

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
  DateTime,
};
