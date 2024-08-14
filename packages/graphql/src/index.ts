require("dotenv").config();
import schema from "./schema";
import {
  handlers,
  startServerAndCreateLambdaHandler,
} from "@as-integrations/aws-lambda";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { ApolloServer } from "@apollo/server";

export const handler = startServerAndCreateLambdaHandler(
  new ApolloServer({
    schema: buildSubgraphSchema(schema),
  }),
  handlers.createAPIGatewayProxyEventRequestHandler(),
);
