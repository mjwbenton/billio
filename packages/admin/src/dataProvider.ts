import { ApolloClient, InMemoryCache } from "@apollo/client";
import gql from "graphql-tag";
import { GetListResult } from "react-admin";
import { ItemFragment, ListItemsQuery } from "./generated/graphql";

const CLIENT = new ApolloClient({
  uri: "http://localhost:4000/",
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "network-only",
    },
  },
});

const GET_LIST = gql`
  query ListItems($type: ItemType!, $first: Int!) {
    type(id: $type) {
      items(first: $first) {
        total
        items {
          ...Item
        }
      }
    }
  }
  fragment Item on Item {
    id
    shelf {
      id
      name
    }
    title
    createdAt
    updatedAt
  }
`;

async function unsupported(): Promise<any> {
  throw new Error("Unsupported");
}

const dataProvider = {
  create: unsupported,
  delete: unsupported,
  deleteMany: unsupported,
  async getList(resource, params): Promise<GetListResult<ItemFragment>> {
    const result = await CLIENT.query<ListItemsQuery>({
      query: GET_LIST,
      variables: {
        type: resource,
        first: params.pagination.perPage,
      },
    });
    if (result.error) {
      throw new Error(`Graphql Error ${result.error}`);
    }
    return {
      data: result.data.type.items.items.map(stripTypename),
      total: result.data.type.items.total,
    };
  },
  getMany: unsupported,
  getManyReference: unsupported,
  getOne: unsupported,
  update: unsupported,
  updateMany: unsupported,
};

function stripTypename<T>(obj: T): T {
  const copy = {};
  Object.keys(obj)
    .filter((key) => key !== "__typename")
    .forEach((key) => {
      if (typeof obj[key] === "object") {
        copy[key] = stripTypename(obj[key]);
      } else {
        copy[key] = obj[key];
      }
    });
  return copy as T;
}

export default dataProvider;
