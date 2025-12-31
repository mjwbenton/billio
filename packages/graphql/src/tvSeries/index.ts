import gql from "graphql-tag";
import {
  AddTvSeasonInput,
  TvSeason,
  UpdateTvSeasonInput,
  TvSeries,
  AddTvSeriesInput,
  UpdateTvSeriesInput,
  TvSeasonShelfId,
  TvSeriesShelfId,
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
import { WATCHING } from "../watching/constants";
import GqlModule from "../shared/gqlModule";

export const typeDefs = gql`
  extend type Query {
    tvSeason(id: ID!): TvSeason
    tvSeriesSingle(id: ID!): TvSeries
    tvSeasons(
      after: ID
      first: Int!
      searchTerm: String
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
      rating: RatingFilter
    ): TvSeasonPage!
    tvSeries(
      after: ID
      first: Int!
      searchTerm: String
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
      rating: RatingFilter
    ): TvSeriesPage!
    tvSeasonShelf(id: TvSeasonShelfId!): TvSeasonShelf
    tvSeriesShelf(id: TvSeriesShelfId!): TvSeriesShelf
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
    releaseYear: String!
    rewatch: Boolean!
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
    releaseYear: String!
  }

  type TvSeasonShelf {
    id: TvSeasonShelfId!
    name: String!
    items(
      after: ID
      first: Int!
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
      rating: RatingFilter
    ): TvSeasonPage!
  }

  type TvSeriesShelf {
    id: TvSeriesShelfId!
    name: String!
    items(
      after: ID
      first: Int!
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
      rating: RatingFilter
    ): TvSeriesPage!
  }

  enum TvSeriesShelfId {
    Watching
    FinishedSeason
    MidSeasonBreak
    GaveUp
    Finished
  }

  enum TvSeasonShelfId {
    Watching
    FinishedSeason
    MidSeasonBreak
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
    releaseYear: String!
    importedItem: TvSeries
  }

  type ExternalTvSeason {
    id: ID!
    seasonTitle: String
    seasonNumber: Int!
    imageUrl: String
    title: String!
    releaseYear: String!
    importedItem: TvSeason
  }
`;

const mutationTypeDefs = gql`
  extend type Mutation {
    addTvSeason(item: AddTvSeasonInput!): TvSeason!
    addTvSeries(item: AddTvSeriesInput!): TvSeries!
    updateTvSeason(id: ID!, item: UpdateTvSeasonInput!): TvSeason!
    updateTvSeries(id: ID!, item: UpdateTvSeriesInput!): TvSeries!
    deleteTvSeason(id: ID!): DeleteItemOutput!
    deleteTvSeries(id: ID!): DeleteItemOutput!
    importExternalTvSeason(
      externalId: ID!
      shelfId: TvSeasonShelfId!
      overrides: UpdateTvSeasonInput
    ): TvSeason!
    importExternalTvSeries(
      externalId: ID!
      shelfId: TvSeriesShelfId!
      overrides: UpdateTvSeriesInput
    ): TvSeries!
  }

  input AddTvSeasonInput {
    title: String!
    releaseYear: String!
    seriesId: ID!
    seasonNumber: Int!
    seasonTitle: String
    shelfId: TvSeasonShelfId!
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
    rewatch: Boolean
  }

  input AddTvSeriesInput {
    title: String!
    releaseYear: String!
    shelfId: TvSeriesShelfId!
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
    shelfId: TvSeasonShelfId
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
    rewatch: Boolean
  }

  input UpdateTvSeriesInput {
    title: String
    releaseYear: String
    shelfId: TvSeriesShelfId
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

const SERIES_SHELF_NAMES: { [key in TvSeriesShelfId]: string } = {
  Watching: "Watching",
  Finished: "Finished",
  FinishedSeason: "Between Seasons",
  MidSeasonBreak: "Mid-season Break",
  GaveUp: "Gave Up",
};

const SEASON_SHELF_NAMES: { [key in TvSeasonShelfId]: string } = {
  Watching: "Watching",
  FinishedSeason: "Finished",
  MidSeasonBreak: "Mid-season Break",
  GaveUp: "Gave Up",
};

const ADD_SEASON_INPUT_TRANSFORM: AddInputTransform<
  AddTvSeasonInput,
  TvSeasonShelfId
> = (input) => ({
  seriesId: input.seriesId,
  seasonNumber: input.seasonNumber,
  releaseYear: input.releaseYear,
  rewatch: input.rewatch,
  ...(input.seasonTitle ? { seasonTitle: input.seasonTitle } : {}),
});

const ADD_SERIES_INPUT_TRANSFORM: AddInputTransform<
  AddTvSeriesInput,
  TvSeriesShelfId
> = (input) => ({
  releaseYear: input.releaseYear,
  category: WATCHING,
});

const UPDATE_SEASON_INPUT_TRANSFORM: UpdateInputTransform<
  UpdateTvSeasonInput,
  TvSeasonShelfId
> = (input) => ({
  ...(input.seriesId != null ? { seriesId: input.seriesId } : {}),
  ...(input.seasonNumber != null ? { seasonNumber: input.seasonNumber } : {}),
  ...(input.seasonTitle != null ? { seasonTitle: input.seasonTitle } : {}),
  ...(input.releaseYear != null ? { releaseYear: input.releaseYear } : {}),
  ...(input.rewatch != null ? { rewatch: input.rewatch } : {}),
});

const UPDATE_SERIES_INPUT_TRANSFORM: UpdateInputTransform<
  UpdateTvSeriesInput,
  TvSeriesShelfId
> = (input) => ({
  ...(input.releaseYear != null ? { releaseYear: input.releaseYear } : {}),
});

const OUTPUT_SEASON_TRANSFORM: OutputTransform<TvSeason, TvSeasonShelfId> = (
  data,
) => ({
  seasonNumber: data.seasonNumber,
  seasonTitle: data.seasonTitle ?? null,
  seriesId: data.seriesId,
  releaseYear: data.releaseYear,
  rewatch: data.rewatch ?? false,
});

export const OUTPUT_SERIES_TRANSFORM: OutputTransform<
  TvSeries,
  TvSeriesShelfId
> = (data) => ({
  releaseYear: data.releaseYear,
});

const EXTERNAL_SERIES_TRANSFORM: ExternalToInputTransform<
  ExternalTvSeries,
  AddTvSeriesInput,
  TvSeriesShelfId
> = (external) => ({
  releaseYear: external.releaseYear,
  rewatch: false,
});

const EXTERNAL_SEASON_TRANSFORM: ExternalToInputTransform<
  ExternalTvSeason,
  AddTvSeasonInput,
  TvSeasonShelfId
> = (external) => ({
  seasonNumber: external.seasonNumber,
  seasonTitle: external.seasonTitle,
  releaseYear: external.releaseYear,
  rewatch: false,
  // This is fake because we know it gets overridden later in the custom import resolver
  seriesId: "",
});

const SERIES_API = new TmdbSeriesApi();
const SEASON_API = new TmdbSeasonApi();

const importExternalTvSeries = resolveImportExternal<
  TvSeries,
  TvSeriesShelfId,
  AddTvSeriesInput,
  ExternalTvSeries
>(
  TV_SERIES,
  OUTPUT_SERIES_TRANSFORM,
  ADD_SERIES_INPUT_TRANSFORM,
  EXTERNAL_SERIES_TRANSFORM,
  SERIES_API,
);

const updateTvSeries = resolveUpdateItem<
  TvSeries,
  TvSeriesShelfId,
  UpdateTvSeriesInput
>(TV_SERIES, UPDATE_SERIES_INPUT_TRANSFORM, OUTPUT_SERIES_TRANSFORM);

const addTvSeason = async (
  _: unknown,
  { item }: { item: AddTvSeasonInput },
) => {
  await assertTvSeriesExists(item.seriesId);
  const savedItem = await resolveAddItem<
    TvSeason,
    TvSeasonShelfId,
    AddTvSeasonInput
  >(
    TV_SEASON,
    ADD_SEASON_INPUT_TRANSFORM,
    OUTPUT_SEASON_TRANSFORM,
  )(_, { item });
  await updateTvSeriesToMatchLastSeason(item.seriesId);
  return savedItem;
};

const updateTvSeason = async (
  _: unknown,
  { id, item }: { id: string; item: UpdateTvSeasonInput },
) => {
  if (item.seriesId) {
    await assertTvSeriesExists(item.seriesId);
  }
  const savedItem = await resolveUpdateItem<
    TvSeason,
    TvSeasonShelfId,
    UpdateTvSeasonInput
  >(
    TV_SEASON,
    UPDATE_SEASON_INPUT_TRANSFORM,
    OUTPUT_SEASON_TRANSFORM,
  )(_, { id, item });
  await updateTvSeriesToMatchLastSeason(savedItem.seriesId);
  return savedItem;
};

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
    shelfId: TvSeasonShelfId;
    externalId: string;
    overrides?: ItemOverrides<AddTvSeasonInput> | null;
  },
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
      })
    ).id;

  // Import new season
  const newTvSeason = await resolveImportExternal<
    TvSeason,
    TvSeasonShelfId,
    AddTvSeasonInput,
    ExternalTvSeason
  >(
    TV_SEASON,
    OUTPUT_SEASON_TRANSFORM,
    ADD_SEASON_INPUT_TRANSFORM,
    EXTERNAL_SEASON_TRANSFORM,
    SEASON_API,
  )(_, {
    externalId,
    shelfId,
    overrides: {
      ...overrides,
      seriesId,
    },
  });

  // Make updates to the series
  await updateTvSeriesToMatchLastSeason(seriesId);

  return newTvSeason;
};

const deleteTvSeries = async (_: unknown, { id }: { id: string }) => {
  await assertNoTvSeasonsExist(id);
  return await resolveDeleteItem(TV_SERIES)(_, { id });
};

async function assertTvSeriesExists(seriesId: string): Promise<void> {
  const series = await DataQuery.withId({ type: TV_SERIES, id: seriesId });
  if (series == null) {
    throw new Error(`No series matching id: ${seriesId}`);
  }
}

async function assertNoTvSeasonsExist(seriesId: string): Promise<void> {
  const seasons = await DataQuery.withSeriesId({ seriesId });
  if (seasons.length) {
    throw new Error(
      `Series ${seriesId} has ${seasons.length} attached seasons`,
    );
  }
}

async function updateTvSeriesToMatchLastSeason(
  seriesId: string,
): Promise<void> {
  const seasons = await DataQuery.withSeriesId({ seriesId });
  const lastSeason = transformItem(
    seasons[seasons.length - 1],
    OUTPUT_SERIES_TRANSFORM,
  );
  await updateTvSeries(null, {
    id: seriesId,
    item: {
      rating: lastSeason.rating,
      movedAt: lastSeason.movedAt,
      shelfId: lastSeason.shelfId,
    },
  });
}

const resolvers: PartialResolvers = {
  Query: {
    tvSeason: resolveForId<TvSeason, TvSeasonShelfId>(
      TV_SEASON,
      OUTPUT_SEASON_TRANSFORM,
    ),
    tvSeriesSingle: resolveForId<TvSeries, TvSeriesShelfId>(
      TV_SERIES,
      OUTPUT_SERIES_TRANSFORM,
    ),
    tvSeasons: resolveForType<TvSeason, TvSeasonShelfId>(
      TV_SEASON,
      OUTPUT_SEASON_TRANSFORM,
    ),
    tvSeries: resolveForType<TvSeries, TvSeriesShelfId>(
      TV_SERIES,
      OUTPUT_SERIES_TRANSFORM,
    ),
    tvSeasonShelf: resolveShelfArgs<TvSeasonShelfId>(SEASON_SHELF_NAMES),
    tvSeriesShelf: resolveShelfArgs<TvSeriesShelfId>(SERIES_SHELF_NAMES),
    searchExternalTvSeries: resolveExternal<ExternalTvSeries>(SERIES_API),
  },
  TvSeason: {
    shelf: resolveShelfParent<TvSeasonShelfId>(SEASON_SHELF_NAMES),
    series: async ({ seriesId }) => {
      const series = await resolveForId<TvSeries, TvSeriesShelfId>(
        TV_SERIES,
        OUTPUT_SERIES_TRANSFORM,
      )(null, { id: seriesId });
      if (!series) {
        throw new Error("Invalid link from season to series");
      }
      return series;
    },
  },
  TvSeries: {
    shelf: resolveShelfParent<TvSeriesShelfId>(SERIES_SHELF_NAMES),
    seasons: async ({ id }) => {
      const seasons = await DataQuery.withSeriesId({ seriesId: id });
      return seasons.map((season) =>
        transformItem(season, OUTPUT_SEASON_TRANSFORM),
      );
    },
  },
  TvSeasonShelf: {
    items: resolveShelfItems<TvSeason, TvSeasonShelfId>(
      TV_SEASON,
      OUTPUT_SEASON_TRANSFORM,
    ),
  },
  TvSeriesShelf: {
    items: resolveShelfItems<TvSeries, TvSeriesShelfId>(
      TV_SERIES,
      OUTPUT_SERIES_TRANSFORM,
    ),
  },
  ExternalTvSeason: {
    importedItem: resolveImportedItem(OUTPUT_SEASON_TRANSFORM),
  },
  ExternalTvSeries: {
    importedItem: resolveImportedItem(OUTPUT_SERIES_TRANSFORM),
  },
};

const mutationResolvers: PartialResolvers["Mutation"] = {
  importExternalTvSeason,
  importExternalTvSeries,
  addTvSeason,
  addTvSeries: resolveAddItem<TvSeries, TvSeriesShelfId, AddTvSeriesInput>(
    TV_SERIES,
    ADD_SERIES_INPUT_TRANSFORM,
    OUTPUT_SERIES_TRANSFORM,
  ),
  updateTvSeason,
  updateTvSeries,
  deleteTvSeason: resolveDeleteItem(TV_SEASON),
  deleteTvSeries,
};

export default new GqlModule({
  typeDefs,
  resolvers,
  mutationTypeDefs,
  mutationResolvers,
});
