import { gql } from "apollo-server-lambda";
import {
  AddTvSeasonInput,
  ExternalTvSeries,
  Resolvers,
  TvSeason,
  TvSeasonShelfId,
  UpdateTvSeasonInput,
} from "../generated/graphql";
import { Item as DataItem } from "@mattb.tech/billio-data";
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
import { FieldTransform } from "../shared/transforms";
import { TmdbApi } from "./TmdbApi";

export const typeDefs = gql`
  extend type Query {
    tvSeason(id: ID!): TvSeason
    tvSeasons(after: ID, first: Int!): TvSeasonPage!
    tvSeasonShelf(id: TvSeasonShelfId!): TvSeasonShelf
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
    shelf: TvSeasonShelf!
    releaseYear: String!
  }

  type TvSeasonShelf {
    id: TvSeasonShelfId!
    name: String!
    items(after: ID, first: Int!): TvSeasonPage!
  }

  enum TvSeasonShelfId {
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

  type ExternalTvSeries {
    id: ID!
    title: String!
    imageUrl: String
    seasons: [ExternalTvSeason!]!
  }

  type ExternalTvSeason {
    id: ID!
    seriesId: ID!
    seriesTitle: String!
    number: Int!
    imageUrl: String
    title: String
  }

  extend type Mutation {
    addTvSeason(item: AddTvSeasonInput!): TvSeason!
    updateTvSeason(id: ID!, item: UpdateTvSeasonInput!): TvSeason!
    deleteTvSeason(id: ID!): DeleteItemOutput!
    importExternalTvSeason(
      externalId: ID!
      shelfId: TvSeasonShelfId!
      overrides: UpdateTvSeasonInput
    ): TvSeason!
  }

  input AddTvSeasonInput {
    title: String!
    releaseYear: String!
    seasonNumber: Int!
    shelfId: TvSeasonShelfId!
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }

  input UpdateTvSeasonInput {
    title: String
    releaseYear: String
    seasonNumber: Int!
    shelfId: TvSeasonShelfId
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }
`;

const TYPE = "TvSeason";

const SHELF_NAMES: { [key in TvSeasonShelfId]: string } = {
  Watching: "Watching",
  Watched: "Watched",
  GaveUp: "GaveUp",
};

const INPUT_TRANSFORM: FieldTransform<
  DataItem,
  AddTvSeasonInput | UpdateTvSeasonInput
> = () => ({});

const OUTPUT_TRANSFORM: FieldTransform<TvSeason, DataItem> = () => ({});

const EXTERNAL_TRANSFORM: FieldTransform<AddTvSeasonInput, ExternalTvSeries> =
  () => ({
    rating: null,
  });

const TMDB_API = new TmdbApi();

export const resolvers: Resolvers = {
  Query: {
    tvSeason: resolveForId<TvSeason>(TYPE, OUTPUT_TRANSFORM),
    tvSeasons: resolveForType<TvSeason>(TYPE, OUTPUT_TRANSFORM),
    tvSeasonShelf: resolveShelf<TvSeasonShelfId>(SHELF_NAMES),
    searchExternalTvSeries: resolveExternal<ExternalTvSeries>(TMDB_API),
  },
  TvSeasonShelf: {
    name: resolveShelfName<TvSeasonShelfId>(SHELF_NAMES),
    items: resolveShelfItems<TvSeason, TvSeasonShelfId>(TYPE, OUTPUT_TRANSFORM),
  },
  Mutation: {
    importExternalTvSeason: resolveImportExternal<
      TvSeason,
      TvSeasonShelfId,
      AddTvSeasonInput,
      ExternalTvSeries
    >(TYPE, OUTPUT_TRANSFORM, INPUT_TRANSFORM, EXTERNAL_TRANSFORM, TMDB_API),
    addTvSeason: resolveAddItem<TvSeason, AddTvSeasonInput>(
      TYPE,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    updateTvSeason: resolveUpdateItem<TvSeason, UpdateTvSeasonInput>(
      TYPE,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    deleteMovie: resolveDeleteItem(TYPE),
  },
};
