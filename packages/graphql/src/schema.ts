import {
  makeExecutableSchema,
  transformSchema,
  FilterRootFields,
} from "apollo-server-lambda";
import {
  typeDefs as sharedTypeDefs,
  resolvers as sharedResolvers,
} from "./shared/schema";
import {
  typeDefs as videoGameTypeDefs,
  resolvers as videoGameResolvers,
} from "./videogame";
import { typeDefs as bookTypeDefs, resolvers as bookResolvers } from "./book";
import merge from "lodash.merge";

const schema = makeExecutableSchema({
  typeDefs: [sharedTypeDefs, videoGameTypeDefs, bookTypeDefs],
  resolvers: merge(sharedResolvers, videoGameResolvers, bookResolvers),
});

export default transformSchema(schema, [
  new FilterRootFields((operationName, rootFieldName) => {
    return (
      !!parseInt(process.env.ENABLE_MUTATIONS ?? "0") ||
      (operationName !== "Mutation" &&
        !rootFieldName.startsWith("searchExternal"))
    );
  }),
]);
