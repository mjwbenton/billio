import { buildSchema } from "type-graphql";

import {
  queryResolvers as videoGameQueries,
  mutationResolvers as videoGameMutations,
} from "./videogame";
import {
  queryResolvers as bookQueries,
  mutationResolvers as bookMutations,
} from "./book";

const queries = [...videoGameQueries, ...bookQueries] as const;
const mutations = [...videoGameMutations, ...bookMutations] as const;

export default buildSchema({
  resolvers: parseInt(process.env.ENABLE_MUTATIONS!)
    ? [...queries, ...mutations]
    : queries,
});
