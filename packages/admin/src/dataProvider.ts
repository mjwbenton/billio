import gql from "graphql-tag";
import client from "./client";
import { loader } from "graphql.macro";
import stripTypename from "./stripTypename";
import { DataProvider } from "ra-core";

const FRAGMENTS = {
  Book: loader("./book/Book.graphql"),
  VideoGame: loader("./videogame/VideoGame.graphql"),
};

const QUERIES = {
  GET_ONE: (resourceName: string) => gql`
    query GET_ONE_${resourceName}($id: ID!) {
      item: ${lowerFirst(resourceName)}(id: $id) {
        ...${resourceName}
      }
    }
    ${FRAGMENTS[resourceName]}
`,
  GET_LIST: (resourceName: string) => gql`
    query GET_LIST_${resourceName}($first: Int!) {
      page: ${lowerFirst(resourceName)}s(first: $first) {
        total
        items: items {
          ...${resourceName}
        }
      }
    }
    ${FRAGMENTS[resourceName]}
`,
  CREATE: (resourceName: string) => gql`
    mutation CREATE_${resourceName}($item: Add${resourceName}Input!) {
      item: add${resourceName}(item: $item) {
        ...${resourceName}
      }
    }
    ${FRAGMENTS[resourceName]}
`,
  UPDATE: (resourceName: string) => gql`
    mutation UPDATE_${resourceName}($item: Update${resourceName}Input!) {
      item: update${resourceName}(item: $item) {
        ...${resourceName}
      }
    }
    ${FRAGMENTS[resourceName]}
`,
  DELETE: (resourceName: string) => gql`
    mutation DELETE_${resourceName}($item: DeleteItemInput!) {
      item: delete${resourceName}(item: $item) {
        id
      }
    }
`,
};

function lowerFirst(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

const dataProvider: DataProvider = {
  async getList(resourceName, params) {
    const result = await client.query({
      query: QUERIES.GET_LIST(resourceName),
      variables: {
        first: params.pagination.perPage,
      },
    });
    return {
      total: result.data.page.total,
      data: stripTypename(result.data.page.items),
    };
  },
  async getOne(resourceName, params) {
    const result = await client.query({
      query: QUERIES.GET_ONE(resourceName),
      variables: params,
    });
    return {
      data: stripTypename(result.data.item),
    };
  },
  async create(resourceName, params) {
    const result = await client.mutate({
      mutation: QUERIES.CREATE(resourceName),
      variables: {
        item: params.data,
      },
    });
    return {
      data: stripTypename(result.data.item),
    };
  },
  async update(resourceName, params) {
    const result = await client.mutate({
      mutation: QUERIES.UPDATE(resourceName),
      variables: {
        item: params.data,
      },
    });
    return {
      data: stripTypename(result.data.item),
    };
  },
  async delete(resourceName, params) {
    const result = await client.mutate({
      mutation: QUERIES.DELETE(resourceName),
      variables: {
        item: { id: params.id },
      },
    });
    return {
      data: stripTypename(result.data.item),
    };
  },
  async getMany(resourceName, params) {
    throw new Error("GET_MANY Unsupported");
  },
  async getManyReference(resourceName, params) {
    throw new Error("GET_MANY_REFERENCE Unsupported");
  },
  async updateMany(resourceName, params) {
    throw new Error("UPDATE_MANY Unsupported");
  },
  async deleteMany(resourceName, params) {
    throw new Error("DELETE_MANY Unsupported");
  },
};

export default dataProvider;
