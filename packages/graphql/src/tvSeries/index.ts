import { gql } from "apollo-server-lambda";
import {
  AddTvSeasonInput,
  ExternalTvSeries,
  ExternalTvSeason,
  Resolvers,
  TvSeason,
  TvShelfId,
  UpdateTvSeasonInput,
  TvSeries,
  AddTvSeriesInput,
  UpdateTvSeriesInput,
} from "../generated/graphql";
import { Item as DataItem, Query as DataQuery } from "@mattb.tech/billio-data";
import resolveAddItem from "../resolvers/resolveAddItem";
import resolveDeleteItem from "../resolvers/resolveDeleteItem";
import resolveExternal from "../resolvers/resolveExternal";
import resolveForId from "../resolvers/resolveForId";
import resolveForType from "../resolvers/resolveForType";
import resolveImportExternal from "../resolvers/resolveImportExternal";
import resolveShelf from "../resolvers/resolveShelf";
import resolveShelfItems from "../resolvers/resolveShelfItems";
import resolveShelfName from "../resolvers/resolveShelfName";
import resolveUpdateItem from "../resolvers/resolveUpdateItem";
import { FieldTransform, transformItem } from "../shared/transforms";
import {
  seriesExternalIdForSeasonExternalId,
  TmdbSeasonApi,
  TmdbSeriesApi,
} from "./TmdbApi";
import resolveImportedItem from "../resolvers/resolveImportedItem";
import { ItemOverrides } from "../shared/Item";
import parseNamespacedId, {
  buildNamespacedId,
} from "../shared/parseNamespacedId";

export const typeDefs = gql`
  extend type Query {
    tvSeason(id: ID!): TvSeason
    tvSeriesSingle(id: ID!): TvSeries
    tvSeasons(after: ID, first: Int!): TvSeasonPage!
    tvSeries(after: ID, first: Int!): TvSeriesPage!
    tvSeasonShelf(id: TvShelfId!): TvSeasonShelf
    tvSeriesShelf(id: TvShelfId!): TvSeriesShelf
    searchExternalTvSeries(term: String!): [ExternalTvSeries!]!
  }

  type TvSeason implements Item {
    id: ID!
    externalId: ID
    addedAt: DateTime!
    movedAt: DateTime!
    notes: String
    title: String!
    rating: Rating
    image: Image
    seasonNumber: Int!
    seasonTitle: String
    shelf: TvSeasonShelf!
    series: TvSeries!
  }

  type TvSeries implements Item {
    id: ID!
    externalId: ID
    addedAt: DateTime!
    movedAt: DateTime!
    notes: String
    title: String!
    rating: Rating
    image: Image
    shelf: TvSeriesShelf!
    seasons: [TvSeason!]!
  }

  type TvSeasonShelf {
    id: TvShelfId!
    name: String!
    items(after: ID, first: Int!): TvSeasonPage!
  }

  type TvSeriesShelf {
    id: TvShelfId!
    name: String!
    items(after: ID, first: Int!): TvSeriesPage!
  }

  enum TvShelfId {
    Watching
    Watched
    GaveUp
  }

  type TvSeasonPage {
    total: Int!
    items: [TvSeason!]!
    hasNextPage: Boolean!
    nextPageCursor: ID
  }

  type TvSeriesPage {
    total: Int!
    items: [TvSeries!]!
    hasNextPage: Boolean!
    nextPageCursor: ID
  }

  type ExternalTvSeries {
    id: ID!
    title: String!
    imageUrl: String
    seasons: [ExternalTvSeason!]!
    importedItem: TvSeries
  }

  type ExternalTvSeason {
    id: ID!
    seasonTitle: String
    seasonNumber: Int!
    imageUrl: String
    title: String!
    importedItem: TvSeason
  }

  extend type Mutation {
    addTvSeason(item: AddTvSeasonInput!): TvSeason!
    addTvSeries(item: AddTvSeriesInput!): TvSeries!
    updateTvSeason(id: ID!, item: UpdateTvSeasonInput!): TvSeason!
    updateTvSeries(id: ID!, item: UpdateTvSeriesInput!): TvSeries!
    deleteTvSeason(id: ID!): DeleteItemOutput!
    deleteTvSeries(id: ID!): DeleteItemOutput!
    importExternalTvSeason(
      externalId: ID!
      shelfId: TvShelfId!
      overrides: UpdateTvSeasonInput
    ): TvSeason!
    importExternalTvSeries(
      externalId: ID!
      shelfId: TvShelfId!
      overrides: UpdateTvSeriesInput
    ): TvSeries!
  }

  input AddTvSeasonInput {
    title: String!
    seriesId: ID!
    seasonNumber: Int!
    seasonTitle: String
    shelfId: TvShelfId!
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }

  input AddTvSeriesInput {
    title: String!
    shelfId: TvShelfId!
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }

  input UpdateTvSeasonInput {
    title: String
    releaseYear: String
    seasonNumber: Int
    seasonTitle: String
    seriesId: ID
    shelfId: TvShelfId
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }

  input UpdateTvSeriesInput {
    title: String
    shelfId: TvShelfId
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }
`;

const TV_SEASON = "TvSeason";
const TV_SERIES = "TvSeries";

const SHELF_NAMES: { [key in TvShelfId]: string } = {
  Watching: "Watching",
  Watched: "Watched",
  GaveUp: "Gave Up",
};

const INPUT_TRANSFORM: FieldTransform<
  DataItem,
  | AddTvSeasonInput
  | UpdateTvSeasonInput
  | AddTvSeriesInput
  | UpdateTvSeriesInput
> = () => ({});

const OUTPUT_TRANSFORM: FieldTransform<TvSeason & TvSeries, DataItem> =
  () => ({});

const EXTERNAL_SERIES_TRANSFORM: FieldTransform<
  AddTvSeriesInput,
  ExternalTvSeries
> = () => ({
  rating: null,
  seasons: undefined,
});

const EXTERNAL_SEASON_TRANSFORM: FieldTransform<
  AddTvSeasonInput,
  ExternalTvSeason
> = () => ({
  rating: null,
});

const SERIES_API = new TmdbSeriesApi();
const SEASON_API = new TmdbSeasonApi();

const importExternalTvSeries = resolveImportExternal<
  TvSeries,
  TvShelfId,
  AddTvSeriesInput,
  ExternalTvSeries
>(
  TV_SERIES,
  OUTPUT_TRANSFORM,
  INPUT_TRANSFORM,
  EXTERNAL_SERIES_TRANSFORM,
  SERIES_API
);

/*
 * Special case for TvSeason. We want to make sure we have the TvSeries imported whenever
 * we import a season of that series. If its not already imported, then we import it here
 * and set the seriesId field on the season.
 */
const importExternalTvSeason = async (
  _: unknown,
  {
    externalId,
    shelfId,
    overrides,
  }: {
    shelfId: TvShelfId;
    externalId: string;
    overrides?: ItemOverrides<AddTvSeasonInput> | null;
  }
) => {
  const seriesExternalId = seriesExternalIdForSeasonExternalId(externalId);

  // If we were provided as seriesId as part of the query, then use that. Otherwise see
  // if we've already got one imported with the same externalID. Otherwise import the
  // TvSeries.
  const seriesId =
    overrides?.seriesId ||
    (
      await DataQuery.withExternalId({
        externalId: seriesExternalId,
      })
    )[0]?.id ||
    (
      await importExternalTvSeries(_, {
        externalId: seriesExternalId,
        shelfId,
        overrides: {
          ...(overrides?.rating ? { rating: overrides?.rating } : {}),
          ...(overrides?.addedAt ? { addedAt: overrides?.addedAt } : {}),
          ...(overrides?.movedAt ? { movedAt: overrides?.movedAt } : {}),
        },
      })
    ).id;
  return await resolveImportExternal<
    TvSeason,
    TvShelfId,
    AddTvSeasonInput,
    ExternalTvSeason
  >(
    TV_SEASON,
    OUTPUT_TRANSFORM,
    INPUT_TRANSFORM,
    EXTERNAL_SEASON_TRANSFORM,
    SEASON_API
  )(_, { externalId, shelfId, overrides: { ...overrides, seriesId } });
};

export const resolvers: Resolvers = {
  Query: {
    tvSeason: resolveForId<TvSeason>(TV_SEASON, OUTPUT_TRANSFORM),
    tvSeriesSingle: resolveForId<TvSeries>(TV_SERIES, OUTPUT_TRANSFORM),
    tvSeasons: resolveForType<TvSeason>(TV_SEASON, OUTPUT_TRANSFORM),
    tvSeries: resolveForType<TvSeries>(TV_SERIES, OUTPUT_TRANSFORM),
    tvSeasonShelf: resolveShelf<TvShelfId>(SHELF_NAMES),
    tvSeriesShelf: resolveShelf<TvShelfId>(SHELF_NAMES),
    searchExternalTvSeries: resolveExternal<ExternalTvSeries>(SERIES_API),
  },
  TvSeasonShelf: {
    name: resolveShelfName<TvShelfId>(SHELF_NAMES),
    items: resolveShelfItems<TvSeason, TvShelfId>(TV_SEASON, OUTPUT_TRANSFORM),
  },
  TvSeriesShelf: {
    name: resolveShelfName<TvShelfId>(SHELF_NAMES),
    items: resolveShelfItems<TvSeries, TvShelfId>(TV_SERIES, OUTPUT_TRANSFORM),
  },
  ExternalTvSeason: {
    importedItem: resolveImportedItem(OUTPUT_TRANSFORM),
  },
  ExternalTvSeries: {
    importedItem: resolveImportedItem(OUTPUT_TRANSFORM),
  },
  TvSeason: {
    // TODO: Fix types here, put somewhere better
    series: async (parent) => {
      const seriesId = (parent as any).seriesId;
      const series = await resolveForId<TvSeries>(TV_SERIES, OUTPUT_TRANSFORM)(
        null,
        { id: seriesId }
      );
      if (!series) {
        throw new Error("Invalid link from season to series");
      }
      return series;
    },
  },
  TvSeries: {
    seasons: async ({ id }) => {
      if (!id) {
        throw new Error("missing id");
      }
      const seasons = await DataQuery.withSeriesId({ seriesId: id });
      return seasons.map((season) => transformItem(season, OUTPUT_TRANSFORM));
    },
  },
  Mutation: {
    importExternalTvSeason,
    importExternalTvSeries,
    addTvSeason: resolveAddItem<TvSeason, AddTvSeasonInput>(
      TV_SEASON,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    addTvSeries: resolveAddItem<TvSeries, AddTvSeriesInput>(
      TV_SERIES,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    updateTvSeason: resolveUpdateItem<TvSeason, UpdateTvSeasonInput>(
      TV_SEASON,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    updateTvSeries: resolveUpdateItem<TvSeries, UpdateTvSeriesInput>(
      TV_SERIES,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    deleteTvSeason: resolveDeleteItem(TV_SEASON),
    deleteTvSeries: resolveDeleteItem(TV_SERIES),
  },
};
