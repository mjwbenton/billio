import gql from "graphql-tag";
import client from "./client";
import { loader } from "graphql.macro";
import stripTypename from "./stripTypename";
import { DataProvider } from "ra-core";

const RESOURCE_CONFIGURATION = {
  Book: {
    fragment: loader("./book/Book.graphql"),
    externalFragment: loader("./book/ExternalBook.graphql"),
    querySingle: "book",
    queryList: "books",
    capitalized: "Book",
    shelfType: "BookShelfId",
  },
  VideoGame: {
    fragment: loader("./videoGame/VideoGame.graphql"),
    externalFragment: loader("./videoGame/ExternalVideoGame.graphql"),
    querySingle: "videoGame",
    queryList: "videoGames",
    capitalized: "VideoGame",
    shelfType: "VideoGameShelfId",
  },
  Movie: {
    fragment: loader("./movie/Movie.graphql"),
    externalFragment: loader("./movie/ExternalMovie.graphql"),
    querySingle: "movie",
    queryList: "movies",
    capitalized: "Movie",
    shelfType: "MovieShelfId",
  },
  TvSeries: {
    fragment: loader("./tv/TvSeries.graphql"),
    externalFragment: loader("./tv/ExternalTvSeries.graphql"),
    querySingle: "tvSeriesSingle",
    queryList: "tvSeries",
    capitalized: "TvSeries",
    shelfType: "TvSeriesShelfId",
  },
  TvSeason: {
    fragment: loader("./tv/TvSeason.graphql"),
    querySingle: "tvSeason",
    queryList: "tvSeasons",
    capitalized: "TvSeason",
    shelfType: "TvSeasonShelfId",
  },
};

const QUERIES = {
  GET_ONE: (resourceName: string) => gql`
    query GET_ONE_${resourceName}($id: ID!) {
      item: ${RESOURCE_CONFIGURATION[resourceName].querySingle}(id: $id) {
        ...${resourceName}
      }
    }
    ${RESOURCE_CONFIGURATION[resourceName].fragment}`,

  GET_LIST: (resourceName: string) => gql`
    query GET_LIST_${resourceName}($first: Int!, $searchTerm: String) {
      page: ${RESOURCE_CONFIGURATION[resourceName].queryList}(first: $first, searchTerm: $searchTerm) {
        total
        items: items {
          ...${resourceName}
        }
      }
    }
    ${RESOURCE_CONFIGURATION[resourceName].fragment}`,

  CREATE: (resourceName: string) => gql`
    mutation CREATE_${resourceName}($item: Add${RESOURCE_CONFIGURATION[resourceName].capitalized}Input!) {
      item: add${RESOURCE_CONFIGURATION[resourceName].capitalized}(item: $item) {
        ...${resourceName}
      }
    }
    ${RESOURCE_CONFIGURATION[resourceName].fragment}`,

  UPDATE: (resourceName: string) => gql`
    mutation UPDATE_${resourceName}($id: ID!, $item: Update${RESOURCE_CONFIGURATION[resourceName].capitalized}Input!) {
      item: update${RESOURCE_CONFIGURATION[resourceName].capitalized}(id: $id, item: $item) {
        ...${resourceName}
      }
    }
    ${RESOURCE_CONFIGURATION[resourceName].fragment}`,

  DELETE: (resourceName: string) => gql`
    mutation DELETE_${resourceName}($id: ID!) {
      item: delete${RESOURCE_CONFIGURATION[resourceName].capitalized}(id: $id) {
        id
      }
    }`,

  IMPORT: (resourceName: string) => gql`
    mutation IMPORT_${resourceName}($id: ID!, $shelfId: ${RESOURCE_CONFIGURATION[resourceName].shelfType}!, $overrides: Update${RESOURCE_CONFIGURATION[resourceName].capitalized}Input) {
      item: importExternal${resourceName}(externalId: $id, shelfId: $shelfId, overrides: $overrides) {
        ...${resourceName}
      }
    }
    ${RESOURCE_CONFIGURATION[resourceName].fragment}`,

  SEARCH_EXTERNAL: (resourceName: string) => gql`
    query SEARCH_EXTERNAL_${resourceName}($term: String!) {
      items: searchExternal${resourceName}(term: $term) {
        ...External${resourceName}
      }
    }
    ${RESOURCE_CONFIGURATION[resourceName].externalFragment}`,
};

const dataProvider: DataProvider = {
  async getList(resourceName, params) {
    const result = await client.query({
      query: QUERIES.GET_LIST(resourceName),
      variables: {
        first: params.pagination.perPage,
        ...(params.filter.q ? { searchTerm: params.filter.q } : {}),
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
    const { id, shelfId, ...item } = params.data;
    const result = await client.mutate({
      mutation: QUERIES.UPDATE(resourceName),
      variables: {
        id,
        item: {
          ...item,
          // Do not send the shelfId on update unless it was different from the previous value
          // This avoids the dates being automatically updated when the shelf hasn't changed
          ...(shelfId && shelfId != params.previousData.shelf.id
            ? { shelfId }
            : {}),
        },
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
