import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import fetch from "cross-fetch";

const ENDPOINT = "http://localhost:4000";

const CLIENT = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: ENDPOINT,
    fetch,
  }),
});

export default CLIENT;
