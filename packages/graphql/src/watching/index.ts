import gql from "graphql-tag";
import resolveForCategory from "../resolvers/resolveForCategory";
import { PartialResolvers } from "../shared/types";
import { OUTPUT_SERIES_TRANSFORM } from "../tvSeries";
import { OUTPUT_TRANSFORM as OUTPUT_FEATURE_TRANSFORM } from "../feature";
import { WATCHING } from "./constants";
import GqlModule from "../shared/gqlModule";

const typeDefs = gql`
  extend type Query {
    watching(after: ID, first: Int!): WatchingPage!
  }

  union WatchingItem = Feature | TvSeries

  type WatchingPage {
    total: Int!
    items: [WatchingItem!]!
    hasNextPage: Boolean!
    nextPageCursor: ID
  }
`;

const TRANSFORMS = {
  TvSeries: OUTPUT_SERIES_TRANSFORM,
  Feature: OUTPUT_FEATURE_TRANSFORM,
};

const resolvers: PartialResolvers = {
  Query: {
    watching: resolveForCategory(WATCHING, TRANSFORMS),
  },
};

export default new GqlModule({
  typeDefs,
  resolvers,
});
