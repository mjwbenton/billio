import gql from "graphql-tag";
import client from "./client";
import buildGraphQLProvider from "ra-data-graphql";
import { loader } from "graphql.macro";
import stripTypename from "./stripTypename";

const FRAGMENTS = {
  Book: loader("./book/Book.graphql"),
  VideoGame: loader("./videogame/VideoGame.graphql"),
};

function lowerFirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

const GET_ONE = (resourceName: string, queryName: string) => gql`
  query ${queryName}($id: ID!) {
    data: ${queryName}(id: $id) {
      ...${resourceName}
    }
  }
  ${FRAGMENTS[resourceName]}
`;

const GET_LIST = (resourceName: string, queryName: string) => gql`
  query ${queryName}($first: Int!) {
    data: ${queryName}(first: $first) {
      total
      data: items {
        ...${resourceName}
      }
    }
  }
  ${FRAGMENTS[resourceName]}
`;

const CREATE = (resourceName: string, queryName: string) => gql`
  mutation ${queryName}($item: Add${resourceName}Input!) {
    data: ${queryName}(item: $item) {
      ...${resourceName}
    }
  }
  ${FRAGMENTS[resourceName]}
`;

const UPDATE = (resourceName: string, queryName: string) => gql`
  mutation ${queryName}($item: Update${resourceName}Input!) {
    data: ${queryName}(item: $item) {
      ...${resourceName}
    }
  }
  ${FRAGMENTS[resourceName]}
`;

const DELETE = (resourceName: string, queryName: string) => gql`
  mutation ${queryName}($item: DeleteItemInput!) {
    data: ${queryName}(item: $item) {
      id
    }
  }
`;

export default buildGraphQLProvider({
  client,
  introspection: {
    operationNames: {
      GET_LIST: (resource) => `${lowerFirst(resource.name)}s`,
      GET_ONE: (resource) => `${lowerFirst(resource.name)}`,
      CREATE: (resource) => `add${resource.name}`,
      UPDATE: (resource) => `update${resource.name}`,
      DELETE: (resource) => `delete${resource.name}`,
    },
  },
  buildQuery: ({ types, resources }) => {
    return (raFetchType, resourceName, params) => {
      const resource = resources.find((r) => r.type.name === resourceName);

      const queryName = resource[raFetchType].name;

      switch (raFetchType) {
        case "GET_ONE":
          return {
            query: GET_ONE(resourceName, queryName),
            variables: params,
            parseResponse: (response) => stripTypename(response.data),
          };
        case "GET_LIST":
          return {
            query: GET_LIST(resourceName, queryName),
            variables: { first: params.pagination.perPage },
            parseResponse: (response) => stripTypename(response.data.data),
          };
        case "CREATE": {
          const { updatedAt, createdAt, shelf, ...rest } = params.data;
          return {
            query: CREATE(resourceName, queryName),
            variables: {
              item: {
                id: params.id,
                ...rest,
                shelfId: shelf.id,
              },
            },
            parseResponse: (response) => stripTypename(response.data),
          };
        }
        case "UPDATE": {
          const { updatedAt, createdAt, shelf, ...rest } = params.data;
          return {
            query: UPDATE(resourceName, queryName),
            variables: {
              item: {
                id: params.id,
                ...rest,
                shelfId: shelf.id,
              },
            },
            parseResponse: (response) => stripTypename(response.data),
          };
        }
        case "DELETE":
          return {
            query: DELETE(resourceName, queryName),
            variables: { item: { id: params.id } },
            parseResponse: (response) => stripTypename(response.data),
          };
        default:
          throw new Error("Unsupported");
      }
    };
  },
});
