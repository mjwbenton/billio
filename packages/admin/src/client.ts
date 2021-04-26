import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { Auth } from "@aws-amplify/auth";
import aws4 from "aws4-tiny";

const ENDPOINT = "https://api.billio.mattb.tech";

const CLIENT = new ApolloClient({
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "network-only",
    },
  },
  link: new HttpLink({
    uri: ENDPOINT,
    fetch: async (uri, options) => {
      const credentials = await Auth.currentCredentials();
      return aws4.fetch(
        uri,
        {
          service: "execute-api",
          region: "us-east-1",
          ...options,
        },
        credentials
      );
    },
  }),
});

export default CLIENT;
