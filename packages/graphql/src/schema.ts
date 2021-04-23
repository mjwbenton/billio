import "reflect-metadata";
import { buildSchema } from "type-graphql";

import { resolvers as videoGameResolvers } from "./videoGame";
import { resolvers as bookResolvers } from "./book";

export default buildSchema({
  resolvers: [...videoGameResolvers, ...bookResolvers],
});
