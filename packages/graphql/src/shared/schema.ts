import { gql } from "apollo-server-lambda";
import Rating from "./Rating";
import { DateTimeResolver as DateTime } from "graphql-scalars";
import GqlModule from "./gqlModule";

const typeDefs = gql`
  type Query

  type Mutation

  scalar DateTime

  scalar Rating

  enum SortBy {
    MOVED_AT
    ADDED_AT
  }

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

  type DeleteItemOutput {
    id: ID!
  }
`;

const resolvers = {
  Rating,
  DateTime,
};

export default new GqlModule({
  typeDefs,
  resolvers,
});
