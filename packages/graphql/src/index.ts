require("dotenv").config();
import schema from "./schema";
import { ApolloServer } from "apollo-server-lambda";
import { APIGatewayProxyHandler } from "aws-lambda";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";

let innerHandler: any;

export const handler: APIGatewayProxyHandler = async (event, context) => {
  if (!innerHandler) {
    const server = new ApolloServer({
      schema,
      plugins: [ApolloServerPluginLandingPageGraphQLPlayground()],
    });
    innerHandler = server.createHandler();
  }
  return innerHandler(event, context);
};
