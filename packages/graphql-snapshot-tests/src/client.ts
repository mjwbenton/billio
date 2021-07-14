import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import fetch from "cross-fetch";

const ENDPOINT = process.env.BILLIO_ENDPOINT;

if (!ENDPOINT) {
  throw new Error("Please configure BILLIO_ENDPOINT for tests");
}

const CLIENT = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: ENDPOINT,
    fetch,
  }),
});

export default CLIENT;
