import { gql } from "apollo-server-lambda";
import {
  AddTvSeasonInput,
  TvSeason,
  TvShelfId,
  UpdateTvSeasonInput,
  TvSeries,
  AddTvSeriesInput,
  UpdateTvSeriesInput,
} from "../generated/graphql";
import { Query as DataQuery } from "@mattb.tech/billio-data";
import resolveAddItem from "../resolvers/resolveAddItem";
import resolveDeleteItem from "../resolvers/resolveDeleteItem";
import resolveExternal from "../resolvers/resolveExternal";
import resolveForId from "../resolvers/resolveForId";
import resolveForType from "../resolvers/resolveForType";
import resolveImportExternal from "../resolvers/resolveImportExternal";
import resolveShelfItems from "../resolvers/resolveShelfItems";
import resolveUpdateItem from "../resolvers/resolveUpdateItem";
import {
  AddInputTransform,
  ExternalToInputTransform,
  OutputTransform,
  transformItem,
  UpdateInputTransform,
} from "../shared/transforms";
import {
  seriesExternalIdForSeasonExternalId,
  TmdbSeasonApi,
  TmdbSeriesApi,
} from "./TmdbApi";
import resolveImportedItem from "../resolvers/resolveImportedItem";
import { ItemOverrides } from "../shared/Item";
import { ExternalTvSeason, ExternalTvSeries } from "./types";
import {
  resolveShelfArgs,
  resolveShelfParent,
} from "../resolvers/resolveShelf";
import { PartialResolvers } from "../shared/types";

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
    externalId: ID
  }

  input AddTvSeriesInput {
    title: String!
    shelfId: TvShelfId!
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
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
    externalId: ID
  }

  input UpdateTvSeriesInput {
    title: String
    shelfId: TvShelfId
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
  }
`;

const TV_SEASON = "TvSeason";
const TV_SERIES = "TvSeries";

const SHELF_NAMES: { [key in TvShelfId]: string } = {
  Watching: "Watching",
  Watched: "Watched",
  GaveUp: "Gave Up",
};

const ADD_SEASON_INPUT_TRANSFORM: AddInputTransform<
  AddTvSeasonInput,
  TvShelfId
> = (input) => ({
  seriesId: input.seriesId,
  seasonNumber: input.seasonNumber,
  ...(input.seasonTitle ? { seasonTitle: input.seasonTitle } : {}),
});

const ADD_SERIES_INPUT_TRANSFORM: AddInputTransform<
  AddTvSeriesInput,
  TvShelfId
> = () => ({});

const UPDATE_SEASON_INPUT_TRANSFORM: UpdateInputTransform<
  UpdateTvSeasonInput,
  TvShelfId
> = (input) => ({
  ...(input.seriesId ? { seriesId: input.seriesId } : {}),
  ...(input.seasonNumber ? { seasonNumber: input.seasonNumber } : {}),
  ...(input.seasonTitle ? { seasonTitle: input.seasonTitle } : {}),
});

const UPDATE_SERIES_INPUT_TRANSFORM: UpdateInputTransform<
  UpdateTvSeriesInput,
  TvShelfId
> = () => ({});

const OUTPUT_SEASON_TRANSFORM: OutputTransform<TvSeason, TvShelfId> = (
  data
) => ({
  seasonNumber: data.seasonNumber,
  seasonTitle: data.seasonTitle ?? null,
  seriesId: data.seriesId,
});

const OUTPUT_SERIES_TRANSFORM: OutputTransform<TvSeries, TvShelfId> = (
  data
) => ({});

const EXTERNAL_SERIES_TRANSFORM: ExternalToInputTransform<
  ExternalTvSeries,
  AddTvSeriesInput,
  TvShelfId
> = (external) => ({});

const EXTERNAL_SEASON_TRANSFORM: ExternalToInputTransform<
  ExternalTvSeason,
  AddTvSeasonInput,
  TvShelfId
> = (external) => ({
  seasonNumber: external.seasonNumber,
  seasonTitle: external.seasonTitle,
  // This is fake because we know it gets overridden later in the custom import resolver
  seriesId: "",
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
  OUTPUT_SERIES_TRANSFORM,
  ADD_SERIES_INPUT_TRANSFORM,
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
    OUTPUT_SEASON_TRANSFORM,
    ADD_SEASON_INPUT_TRANSFORM,
    EXTERNAL_SEASON_TRANSFORM,
    SEASON_API
  )(_, {
    externalId,
    shelfId,
    overrides: {
      ...overrides,
      seriesId,
    },
  });
};

export const resolvers: PartialResolvers = {
  Query: {
    tvSeason: resolveForId<TvSeason, TvShelfId>(
      TV_SEASON,
      OUTPUT_SEASON_TRANSFORM
    ),
    tvSeriesSingle: resolveForId<TvSeries, TvShelfId>(
      TV_SERIES,
      OUTPUT_SERIES_TRANSFORM
    ),
    tvSeasons: resolveForType<TvSeason, TvShelfId>(
      TV_SEASON,
      OUTPUT_SEASON_TRANSFORM
    ),
    tvSeries: resolveForType<TvSeries, TvShelfId>(
      TV_SERIES,
      OUTPUT_SERIES_TRANSFORM
    ),
    tvSeasonShelf: resolveShelfArgs<TvShelfId>(SHELF_NAMES),
    tvSeriesShelf: resolveShelfArgs<TvShelfId>(SHELF_NAMES),
    searchExternalTvSeries: resolveExternal<ExternalTvSeries>(SERIES_API),
  },
  TvSeason: {
    shelf: resolveShelfParent<TvShelfId>(SHELF_NAMES),
    series: async ({ seriesId }) => {
      const series = await resolveForId<TvSeries, TvShelfId>(
        TV_SERIES,
        OUTPUT_SERIES_TRANSFORM
      )(null, { id: seriesId });
      if (!series) {
        throw new Error("Invalid link from season to series");
      }
      return series;
    },
  },
  TvSeries: {
    shelf: resolveShelfParent<TvShelfId>(SHELF_NAMES),
    seasons: async ({ id }) => {
      const seasons = await DataQuery.withSeriesId({ seriesId: id });
      return seasons.map((season) =>
        transformItem(season, OUTPUT_SEASON_TRANSFORM)
      );
    },
  },
  TvSeasonShelf: {
    items: resolveShelfItems<TvSeason, TvShelfId>(
      TV_SEASON,
      OUTPUT_SEASON_TRANSFORM
    ),
  },
  TvSeriesShelf: {
    items: resolveShelfItems<TvSeries, TvShelfId>(
      TV_SERIES,
      OUTPUT_SERIES_TRANSFORM
    ),
  },
  ExternalTvSeason: {
    importedItem: resolveImportedItem(OUTPUT_SEASON_TRANSFORM),
  },
  ExternalTvSeries: {
    importedItem: resolveImportedItem(OUTPUT_SERIES_TRANSFORM),
  },
  Mutation: {
    importExternalTvSeason,
    importExternalTvSeries,
    addTvSeason: resolveAddItem<TvSeason, TvShelfId, AddTvSeasonInput>(
      TV_SEASON,
      ADD_SEASON_INPUT_TRANSFORM,
      OUTPUT_SEASON_TRANSFORM
    ),
    addTvSeries: resolveAddItem<TvSeries, TvShelfId, AddTvSeriesInput>(
      TV_SERIES,
      ADD_SERIES_INPUT_TRANSFORM,
      OUTPUT_SERIES_TRANSFORM
    ),
    updateTvSeason: resolveUpdateItem<TvSeason, TvShelfId, UpdateTvSeasonInput>(
      TV_SEASON,
      UPDATE_SEASON_INPUT_TRANSFORM,
      OUTPUT_SEASON_TRANSFORM
    ),
    updateTvSeries: resolveUpdateItem<TvSeries, TvShelfId, UpdateTvSeriesInput>(
      TV_SERIES,
      UPDATE_SERIES_INPUT_TRANSFORM,
      OUTPUT_SERIES_TRANSFORM
    ),
    deleteTvSeason: resolveDeleteItem(TV_SEASON),
    deleteTvSeries: resolveDeleteItem(TV_SERIES),
  },
};
