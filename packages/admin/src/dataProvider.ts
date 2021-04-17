import { ApolloClient, InMemoryCache } from "@apollo/client";
import gql from "graphql-tag";
import {
  GetListResult,
  GetOneResult,
  GetListParams,
  GetOneParams,
  UpdateParams,
  UpdateResult,
} from "react-admin";
import {
  ItemFragment,
  GetListQuery,
  GetOneQuery,
  UpdateMutation,
  UpdateItemInput,
} from "./generated/graphql";

const CLIENT = new ApolloClient({
  uri: "http://localhost:4000/",
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "network-only",
    },
  },
});

const ITEM_FRAGMENT = gql`
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

const GET_LIST = gql`
  query GetList($type: ItemType!, $first: Int!) {
    type(id: $type) {
      items(first: $first) {
        total
        items {
          ...Item
        }
      }
    }
  }
  ${ITEM_FRAGMENT}
`;

const GET_ONE = gql`
  query GetOne($type: ItemType!, $id: ID!) {
    item(id: $id, type: $type) {
      ...Item
    }
  }
  ${ITEM_FRAGMENT}
`;

const UPDATE = gql`
  mutation Update($type: ItemType!, $id: ID!, $updates: UpdateItemInput!) {
    updateItem(id: $id, type: $type, updates: $updates) {
      ...Item
    }
  }
  ${ITEM_FRAGMENT}
`;

async function unsupported(): Promise<any> {
  throw new Error("Unsupported");
}

const dataProvider = {
  create: unsupported,
  delete: unsupported,
  deleteMany: unsupported,
  async getList(
    resource: string,
    params: GetListParams
  ): Promise<GetListResult<ItemFragment>> {
    const result = await CLIENT.query<GetListQuery>({
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
  async getOne(
    resource: string,
    params: GetOneParams
  ): Promise<GetOneResult<ItemFragment>> {
    const result = await CLIENT.query<GetOneQuery>({
      query: GET_ONE,
      variables: {
        type: resource,
        id: params.id,
      },
    });
    if (!result.data.item) {
      throw new Error(`No item ${resource} ${params.id}`);
    }
    return {
      data: stripTypename(result.data.item),
    };
  },
  async update(
    resource: string,
    params: UpdateParams
  ): Promise<UpdateResult<ItemFragment>> {
    const result = await CLIENT.mutate<UpdateMutation>({
      mutation: UPDATE,
      variables: {
        type: resource,
        id: params.id,
        updates: updateParamsToUpdateInput(params),
      },
    });
    if (!result.data?.updateItem) {
      throw new Error(`Failed update on ${resource} ${params.id}`);
    }
    return {
      data: stripTypename(result.data.updateItem),
    };
  },
  getMany: unsupported,
  getManyReference: unsupported,
  updateMany: unsupported,
};

function updateParamsToUpdateInput({
  data: { shelf, title },
  previousData: { shelf: oldShelf, title: oldTitle },
}: UpdateParams): UpdateItemInput {
  return {
    shelfId: shelf.id !== oldShelf.id ? shelf.id : null,
    title: title !== oldTitle ? title : null,
  };
}

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
