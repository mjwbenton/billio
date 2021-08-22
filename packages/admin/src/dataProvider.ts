import gql from "graphql-tag";
import client from "./client";
import { loader } from "graphql.macro";
import stripTypename from "./stripTypename";
import { DataProvider } from "ra-core";

const FRAGMENTS = {
  Book: loader("./book/Book.graphql"),
  VideoGame: loader("./videogame/VideoGame.graphql"),
};

const EXTERNAL_FRAGMENTS = {
  Book: loader("./book/ExternalBook.graphql"),
  VideoGame: loader("./videogame/ExternalVideoGame.graphql"),
};

const QUERIES = {
  GET_ONE: (resourceName: string) => gql`
    query GET_ONE_${resourceName}($id: ID!) {
      item: ${lowerFirst(resourceName)}(id: $id) {
        ...${resourceName}
      }
    }
    ${FRAGMENTS[resourceName]}`,

  GET_LIST: (resourceName: string) => gql`
    query GET_LIST_${resourceName}($first: Int!) {
      page: ${lowerFirst(resourceName)}s(first: $first) {
        total
        items: items {
          ...${resourceName}
        }
      }
    }
    ${FRAGMENTS[resourceName]}`,

  CREATE: (resourceName: string) => gql`
    mutation CREATE_${resourceName}($item: Add${resourceName}Input!) {
      item: add${resourceName}(item: $item) {
        ...${resourceName}
      }
    }
    ${FRAGMENTS[resourceName]}`,

  UPDATE: (resourceName: string) => gql`
    mutation UPDATE_${resourceName}($id: ID!, $item: Update${resourceName}Input!) {
      item: update${resourceName}(id: $id, item: $item) {
        ...${resourceName}
      }
    }
    ${FRAGMENTS[resourceName]}`,

  DELETE: (resourceName: string) => gql`
    mutation DELETE_${resourceName}($id: ID!) {
      item: delete${resourceName}(id: $id) {
        id
      }
    }`,

  IMPORT: (resourceName: string) => gql`
    mutation IMPORT_${resourceName}($id: ID!, $shelfId: ${resourceName}ShelfId!, $overrides: Update${resourceName}Input) {
      item: importExternal${resourceName}(externalId: $id, shelfId: $shelfId, overrides: $overrides) {
        ...${resourceName}
      }
    }
    ${FRAGMENTS[resourceName]}`,

  SEARCH_EXTERNAL: (resourceName: string) => gql`
    query SEARCH_EXTERNAL_${resourceName}($term: String!) {
      items: searchExternal${resourceName}(term: $term) {
        ...External${resourceName}
      }
    }
    ${EXTERNAL_FRAGMENTS[resourceName]}`,
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
    const { id, ...item } = params.data;
    const result = await client.mutate({
      mutation: QUERIES.CREATE(resourceName),
      variables: {
        id,
        item,
      },
    });
    return {
      data: stripTypename(result.data.item),
    };
  },
  async update(resourceName, params) {
    const { id, ...item } = params.data;
    const result = await client.mutate({
      mutation: QUERIES.UPDATE(resourceName),
      variables: {
        id,
        item,
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
        id: params.id,
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
    const results = await Promise.all(
      params.ids.map((id) =>
        client.mutate({
          mutation: QUERIES.DELETE(resourceName),
          variables: {
            id,
          },
        })
      )
    );
    return {
      data: results.map((result) => stripTypename(result.data.item)),
    };
  },
  async import(resourceName, params) {
    const { id, shelfId, ...overrides } = params;
    const result = await client.mutate({
      mutation: QUERIES.IMPORT(resourceName),
      variables: {
        id,
        shelfId,
        overrides,
      },
    });
    return {
      data: stripTypename(result.data.item),
    };
  },
  async searchExternal(resourceName, params) {
    const result = await client.query({
      query: QUERIES.SEARCH_EXTERNAL(resourceName),
      variables: {
        term: params.term,
      },
    });
    return {
      data: stripTypename(result.data.items),
    };
  },
};

export default dataProvider;
