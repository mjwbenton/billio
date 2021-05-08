require("dotenv").config();
import "reflect-metadata";
import schema from "./schema";
import { ApolloServer } from "apollo-server-lambda";
import { APIGatewayProxyHandler } from "aws-lambda";

let innerHandler: any;

export const handler: APIGatewayProxyHandler = async (event, context) => {
  if (!innerHandler) {
    const server = new ApolloServer({ schema: await schema });
    innerHandler = server.createHandler();
  }
  return innerHandler(event, context);
};
