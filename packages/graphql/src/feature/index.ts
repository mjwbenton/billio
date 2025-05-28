import gql from "graphql-tag";
import {
  AddFeatureInput,
  Feature,
  FeatureShelfId,
  UpdateFeatureInput,
} from "../generated/graphql";

import resolveAddItem from "../resolvers/resolveAddItem";
import resolveDeleteItem from "../resolvers/resolveDeleteItem";
import resolveExternal from "../resolvers/resolveExternal";
import resolveForId from "../resolvers/resolveForId";
import resolveForType from "../resolvers/resolveForType";
import resolveImportExternal from "../resolvers/resolveImportExternal";
import {
  resolveShelfArgs,
  resolveShelfParent,
} from "../resolvers/resolveShelf";
import resolveShelfItems from "../resolvers/resolveShelfItems";
import resolveUpdateItem from "../resolvers/resolveUpdateItem";
import {
  AddInputTransform,
  ExternalToInputTransform,
  OutputTransform,
  UpdateInputTransform,
} from "../shared/transforms";
import { TmdbApi } from "./TmdbApi";
import resolveImportedItem from "../resolvers/resolveImportedItem";
import { ExternalFeature } from "./types";
import { PartialResolvers } from "../shared/types";
import { WATCHING } from "../watching/constants";
import GqlModule from "../shared/gqlModule";

const typeDefs = gql`
  extend type Query {
    feature(id: ID!): Feature
    featureShelf(id: FeatureShelfId!): FeatureShelf
    features(
      after: ID
      first: Int!
      searchTerm: String
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
    ): FeaturePage!
    searchExternalFeature(term: String!): [ExternalFeature!]!
  }

  type Feature implements Item {
    id: ID!
    externalId: ID
    addedAt: DateTime!
    movedAt: DateTime!
    notes: String
    title: String!
    rating: Rating
    image: Image
    shelf: FeatureShelf!
    releaseYear: String!
    rewatch: Boolean!
  }

  type FeatureShelf {
    id: FeatureShelfId!
    name: String!
    items(
      after: ID
      first: Int!
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
    ): FeaturePage!
  }

  enum FeatureShelfId {
    Watched
  }

  type FeaturePage {
    total: Int!
    items: [Feature!]!
    hasNextPage: Boolean!
    nextPageCursor: ID
  }

  type ExternalFeature {
    id: ID!
    title: String!
    releaseYear: String!
    imageUrl: String
    importedItem: Feature
  }
`;

const mutationTypeDefs = gql`
  extend type Mutation {
    addFeature(item: AddFeatureInput!): Feature!
    updateFeature(id: ID!, item: UpdateFeatureInput!): Feature!
    deleteFeature(id: ID!): DeleteItemOutput!
    importExternalFeature(
      externalId: ID!
      shelfId: FeatureShelfId!
      overrides: UpdateFeatureInput
    ): Feature!
  }

  input AddFeatureInput {
    title: String!
    releaseYear: String!
    shelfId: FeatureShelfId!
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
    rewatch: Boolean
  }

  input UpdateFeatureInput {
    title: String
    releaseYear: String
    shelfId: FeatureShelfId
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
    rewatch: Boolean
  }
`;

const TYPE = "Feature";

const SHELF_NAMES: { [key in FeatureShelfId]: string } = {
  Watched: "Watched",
};

export const OUTPUT_TRANSFORM: OutputTransform<Feature, FeatureShelfId> = (
  input,
) => ({
  releaseYear: input.releaseYear,
  rewatch: input.rewatch ?? false,
});

const EXTERNAL_TRANSFORM: ExternalToInputTransform<
  ExternalFeature,
  AddFeatureInput,
  FeatureShelfId
> = (external) => ({
  releaseYear: external.releaseYear,
  rewatch: false,
});

const ADD_INPUT_TRANSFORM: AddInputTransform<
  AddFeatureInput,
  FeatureShelfId
> = (input) => ({
  releaseYear: input.releaseYear,
  rewatch: input.rewatch,
  category: WATCHING,
});

const UPDATE_INPUT_TRANSFORM: UpdateInputTransform<
  UpdateFeatureInput,
  FeatureShelfId
> = (input) => ({
  ...(input.releaseYear != null ? { releaseYear: input.releaseYear } : {}),
  ...(input.rewatch != null ? { rewatch: input.rewatch } : {}),
});

const TMDB_API = new TmdbApi();

const resolvers: PartialResolvers = {
  Query: {
    feature: resolveForId<Feature, FeatureShelfId>(TYPE, OUTPUT_TRANSFORM),
    features: resolveForType<Feature, FeatureShelfId>(TYPE, OUTPUT_TRANSFORM),
    featureShelf: resolveShelfArgs<FeatureShelfId>(SHELF_NAMES),
    searchExternalFeature: resolveExternal<ExternalFeature>(TMDB_API),
  },
  Feature: {
    shelf: resolveShelfParent<FeatureShelfId>(SHELF_NAMES),
  },
  FeatureShelf: {
    items: resolveShelfItems<Feature, FeatureShelfId>(TYPE, OUTPUT_TRANSFORM),
  },
  ExternalFeature: {
    importedItem: resolveImportedItem(OUTPUT_TRANSFORM),
  },
};

const mutationResolvers: PartialResolvers["Mutation"] = {
  importExternalFeature: resolveImportExternal<
    Feature,
    FeatureShelfId,
    AddFeatureInput,
    ExternalFeature
  >(TYPE, OUTPUT_TRANSFORM, ADD_INPUT_TRANSFORM, EXTERNAL_TRANSFORM, TMDB_API),
  addFeature: resolveAddItem<Feature, FeatureShelfId, AddFeatureInput>(
    TYPE,
    ADD_INPUT_TRANSFORM,
    OUTPUT_TRANSFORM,
  ),
  updateFeature: resolveUpdateItem<Feature, FeatureShelfId, UpdateFeatureInput>(
    TYPE,
    UPDATE_INPUT_TRANSFORM,
    OUTPUT_TRANSFORM,
  ),
  deleteFeature: resolveDeleteItem(TYPE),
};

export default new GqlModule({
  typeDefs,
  resolvers,
  mutationTypeDefs,
  mutationResolvers,
});
