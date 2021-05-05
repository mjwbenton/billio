import { buildSchema } from "type-graphql";
import { Container } from "typedi";

import {
  queryResolvers as videoGameQueries,
  mutationResolvers as videoGameMutations,
} from "./videoGame";
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
  container: Container,
});
