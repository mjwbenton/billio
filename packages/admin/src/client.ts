import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { Auth } from "@aws-amplify/auth";

const CLIENT = new ApolloClient({
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "network-only",
    },
  },
  link: new HttpLink({
    uri: "http://localhost:4000",
    fetch: async (uri, options) => {
      try {
        const credentials = await Auth.currentCredentials();
        console.log(credentials);
      } catch (err) {
        console.log(err);
      }
      return fetch(uri, options);
    },
  }),
});

export default CLIENT;
