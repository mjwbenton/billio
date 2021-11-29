import { makeExecutableSchema } from "@graphql-tools/schema";
import { wrapSchema, FilterRootFields, PruneSchema } from "@graphql-tools/wrap";
import {
  typeDefs as sharedTypeDefs,
  resolvers as sharedResolvers,
} from "./shared/schema";
import {
  typeDefs as watchingTypeDefs,
  resolvers as watchingResolvers,
} from "./watching";
import {
  typeDefs as videoGameTypeDefs,
  resolvers as videoGameResolvers,
} from "./videogame";
import {
  typeDefs as movieTypeDefs,
  resolvers as movieResolvers,
} from "./movie";
import { typeDefs as bookTypeDefs, resolvers as bookResolvers } from "./book";
import {
  typeDefs as tvSeriesTypeDefs,
  resolvers as tvSeriesResolvers,
} from "./tvSeries";
import merge from "lodash.merge";
import { Resolvers } from "./generated/graphql";

const schema = makeExecutableSchema({
  typeDefs: [
    sharedTypeDefs,
    videoGameTypeDefs,
    bookTypeDefs,
    movieTypeDefs,
    tvSeriesTypeDefs,
    watchingTypeDefs,
  ],
  resolvers: merge(
    sharedResolvers,
    videoGameResolvers,
    bookResolvers,
    movieResolvers,
    tvSeriesResolvers,
    watchingResolvers
  ) as Resolvers,
});

export default wrapSchema({
  schema,
  transforms: [
    new FilterRootFields((operationName, rootFieldName) => {
      return (
        !!parseInt(process.env.ENABLE_MUTATIONS ?? "0") ||
        (operationName !== "Mutation" &&
          !(rootFieldName ?? "").startsWith("searchExternal"))
      );
    }),
    new PruneSchema(),
  ],
});
