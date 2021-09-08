import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import fetch from "cross-fetch";

const errorForwardingLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((data) => {
    if (data && data.errors && data.errors.length > 0) {
      throw new Error("GraphQL Operational Error");
    }
    return data;
  });
});

export default new ApolloClient({
  cache: new InMemoryCache(),
  link: new RetryLink().concat(errorForwardingLink).concat(
    new HttpLink({
      uri: "http://localhost:4000",
      fetch,
    })
  ),
});
