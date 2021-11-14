import { gql } from "apollo-server-lambda";
import {
  AddMovieInput,
  Movie,
  MovieShelfId,
  Resolvers,
  UpdateMovieInput,
} from "../generated/graphql";
import { Item as DataItem } from "@mattb.tech/billio-data";
import resolveAddItem from "../resolvers/resolveAddItem";
import resolveDeleteItem from "../resolvers/resolveDeleteItem";
import resolveExternal from "../resolvers/resolveExternal";
import resolveForId from "../resolvers/resolveForId";
import resolveForType from "../resolvers/resolveForType";
import resolveImportExternal from "../resolvers/resolveImportExternal";
import { resolveShelfArgs } from "../resolvers/resolveShelf";
import resolveShelfItems from "../resolvers/resolveShelfItems";
import resolveShelfName from "../resolvers/resolveShelfName";
import resolveUpdateItem from "../resolvers/resolveUpdateItem";
import { FieldTransform } from "../shared/transforms";
import { TmdbApi } from "./TmdbApi";
import resolveImportedItem from "../resolvers/resolveImportedItem";
import { ExternalMovie } from "./types";

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
  }
`;

const TYPE = "Movie";

const SHELF_NAMES: { [key in MovieShelfId]: string } = {
  Watched: "Watched",
};

const INPUT_TRANSFORM: FieldTransform<
  DataItem,
  AddMovieInput | UpdateMovieInput
> = () => ({});

const OUTPUT_TRANSFORM: FieldTransform<Movie, DataItem> = () => ({});

const EXTERNAL_TRANSFORM: FieldTransform<AddMovieInput, ExternalMovie> =
  () => ({
    rating: null,
  });

const TMDB_API = new TmdbApi();

export const resolvers: Resolvers = {
  Query: {
    movie: resolveForId<Movie>(TYPE, OUTPUT_TRANSFORM),
    movies: resolveForType<Movie>(TYPE, OUTPUT_TRANSFORM),
    searchExternalMovie: resolveExternal<ExternalMovie>(TMDB_API),
  },
  MovieShelf: {
    name: resolveShelfName<MovieShelfId>(SHELF_NAMES),
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
    >(TYPE, OUTPUT_TRANSFORM, INPUT_TRANSFORM, EXTERNAL_TRANSFORM, TMDB_API),
    addMovie: resolveAddItem<Movie, AddMovieInput>(
      TYPE,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    updateMovie: resolveUpdateItem<Movie, UpdateMovieInput>(
      TYPE,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    deleteMovie: resolveDeleteItem(TYPE),
  },
};
