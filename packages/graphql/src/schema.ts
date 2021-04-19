import "reflect-metadata";
import { buildSchema } from "type-graphql";

import { resolvers as videoGameResolvers } from "./videoGame";

export default buildSchema({
  resolvers: [...videoGameResolvers],
});
