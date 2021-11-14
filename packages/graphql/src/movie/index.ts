import { gql } from "apollo-server-lambda";
import {
  AddMovieInput,
  Movie,
  MovieShelfId,
  Resolvers,
  UpdateMovieInput,
} from "../generated/graphql";
import resolveAddItem from "../resolvers/resolveAddItem";
import resolveDeleteItem from "../resolvers/resolveDeleteItem";
import resolveExternal from "../resolvers/resolveExternal";
import resolveForId from "../resolvers/resolveForId";
import resolveForType from "../resolvers/resolveForType";
import resolveImportExternal from "../resolvers/resolveImportExternal";
import { resolveShelfParent } from "../resolvers/resolveShelf";
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
import { ExternalMovie } from "./types";
import { PartialResolvers } from "../shared/types";

export const typeDefs = gql`
  extend type Query {
    movie(id: ID!): Movie
    movies(after: ID, first: Int!): MoviePage!
    searchExternalMovie(term: String!): [ExternalMovie!]!
  }

  type Movie implements Item {
    id: ID!
    externalId: ID
    addedAt: DateTime!
    movedAt: DateTime!
    notes: String
    title: String!
    rating: Rating
    image: Image
    shelf: MovieShelf!
    releaseYear: String!
  }

  type MovieShelf {
    id: MovieShelfId!
    name: String!
    items(after: ID, first: Int!): MoviePage!
  }

  enum MovieShelfId {
    Watched
  }

  type MoviePage {
    total: Int!
    items: [Movie!]!
    hasNextPage: Boolean!
    nextPageCursor: ID
  }

  type ExternalMovie {
    id: ID!
    title: String!
    releaseYear: String!
    imageUrl: String
    importedItem: Movie
  }

  extend type Mutation {
    addMovie(item: AddMovieInput!): Movie!
    updateMovie(id: ID!, item: UpdateMovieInput!): Movie!
    deleteMovie(id: ID!): DeleteItemOutput!
    importExternalMovie(
      externalId: ID!
      shelfId: MovieShelfId!
      overrides: UpdateMovieInput
    ): Movie!
  }

  input AddMovieInput {
    title: String!
    releaseYear: String!
    shelfId: MovieShelfId!
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
  }

  input UpdateMovieInput {
    title: String
    releaseYear: String
    shelfId: MovieShelfId
    rating: Rating
    imageUrl: String
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
  }
`;

const TYPE = "Movie";

const SHELF_NAMES: { [key in MovieShelfId]: string } = {
  Watched: "Watched",
};

const OUTPUT_TRANSFORM: OutputTransform<Movie, MovieShelfId> = (input) => ({
  releaseYear: input.releaseYear,
});

const EXTERNAL_TRANSFORM: ExternalToInputTransform<
  ExternalMovie,
  AddMovieInput,
  MovieShelfId
> = (external) => ({
  releaseYear: external.releaseYear,
});

const ADD_INPUT_TRANSFORM: AddInputTransform<AddMovieInput, MovieShelfId> = (
  input
) => ({
  releaseYear: input.releaseYear,
});

const UPDATE_INPUT_TRANSFORM: UpdateInputTransform<
  UpdateMovieInput,
  MovieShelfId
> = (input) => ({
  ...(input.releaseYear ? { releaseYear: input.releaseYear } : {}),
});

const TMDB_API = new TmdbApi();

export const resolvers: PartialResolvers = {
  Query: {
    movie: resolveForId<Movie, MovieShelfId>(TYPE, OUTPUT_TRANSFORM),
    movies: resolveForType<Movie, MovieShelfId>(TYPE, OUTPUT_TRANSFORM),
    searchExternalMovie: resolveExternal<ExternalMovie>(TMDB_API),
  },
  Movie: {
    shelf: resolveShelfParent<MovieShelfId>(SHELF_NAMES),
  },
  MovieShelf: {
    items: resolveShelfItems<Movie, MovieShelfId>(TYPE, OUTPUT_TRANSFORM),
  },
  ExternalMovie: {
    importedItem: resolveImportedItem(OUTPUT_TRANSFORM),
  },
  Mutation: {
    importExternalMovie: resolveImportExternal<
      Movie,
      MovieShelfId,
      AddMovieInput,
      ExternalMovie
    >(
      TYPE,
      OUTPUT_TRANSFORM,
      ADD_INPUT_TRANSFORM,
      EXTERNAL_TRANSFORM,
      TMDB_API
    ),
    addMovie: resolveAddItem<Movie, MovieShelfId, AddMovieInput>(
      TYPE,
      ADD_INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    updateMovie: resolveUpdateItem<Movie, MovieShelfId, UpdateMovieInput>(
      TYPE,
      UPDATE_INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    deleteMovie: resolveDeleteItem(TYPE),
  },
};
