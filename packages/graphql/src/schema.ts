import { makeExecutableSchema } from "apollo-server";
import sharedTypeDefs from "./shared/schema";
import {
  typeDefs as videoGameTypeDefs,
  resolvers as videoGameResolvers,
} from "./videogame";
import { typeDefs as bookTypeDefs, resolvers as bookResolvers } from "./book";
import merge from "lodash.merge";

// TODO: Reintroduce ENABLE_MUTATIONS
export default makeExecutableSchema({
  typeDefs: [sharedTypeDefs, videoGameTypeDefs, bookTypeDefs],
  resolvers: merge(videoGameResolvers, bookResolvers),
});
