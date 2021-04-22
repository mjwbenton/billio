import { ApolloClient, InMemoryCache } from "@apollo/client";

const CLIENT = new ApolloClient({
  uri: "http://localhost:4000/",
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "network-only",
    },
  },
});

export default CLIENT;
