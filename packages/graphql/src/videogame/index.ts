import { gql } from "apollo-server-lambda";
import {
  AddVideoGameInput,
  Resolvers,
  UpdateVideoGameInput,
  VideoGame,
  VideoGamePlatformId,
  VideoGameShelfId,
} from "../generated/graphql";
import { Item as DataItem } from "@mattb.tech/billio-data";
import { IgdbApi } from "./IgdbApi";
import { FieldTransform } from "../shared/transforms";
import resolveForId from "../resolvers/resolveForId";
import resolveForType from "../resolvers/resolveForType";
import resolveShelf from "../resolvers/resolveShelf";
import resolveExternal from "../resolvers/resolveExternal";
import resolveShelfItems from "../resolvers/resolveShelfItems";
import resolveImportExternal from "../resolvers/resolveImportExternal";
import resolveDeleteItem from "../resolvers/resolveDeleteItem";
import resolveAddItem from "../resolvers/resolveAddItem";
import resolveUpdateItem from "../resolvers/resolveUpdateItem";
import resolveShelfName from "../resolvers/resolveShelfName";
import { ExternalVideoGame } from "./types";
import resolveImportedItem from "../resolvers/resolveImportedItem";

export const typeDefs = gql`
  extend type Query {
    videoGame(id: ID!): VideoGame
    videoGameShelf(id: VideoGameShelfId!): VideoGameShelf
    videoGames(after: ID, first: Int!): VideoGamePage!
    searchExternalVideoGame(term: String!): [ExternalVideoGame!]!
  }

  type VideoGame implements Item {
    id: ID!
    externalId: ID
    addedAt: DateTime!
    movedAt: DateTime!
    notes: String
    title: String!
    rating: Rating
    image: Image
    shelf: VideoGameShelf!
    platforms: [VideoGamePlatform!]!
  }

  type VideoGameShelf {
    id: VideoGameShelfId!
    name: String!
    items(after: ID, first: Int!): VideoGamePage!
  }

  enum VideoGameShelfId {
    Playing
    Played
    Completed
    GaveUp
  }

  type VideoGamePage {
    total: Int!
    items: [VideoGame!]!
    hasNextPage: Boolean!
    nextPageCursor: ID
  }

  type VideoGamePlatform {
    id: VideoGamePlatformId!
    name: String!
  }

  enum VideoGamePlatformId {
    Playstation4
    NintendoSwitch
    Nintendo3DS
    Playstation3
  }

  type ExternalVideoGame {
    id: ID!
    title: String!
    previewImageUrl: String
    imageUrl: String
    importedItem: VideoGame
  }

  extend type Mutation {
    addVideoGame(item: AddVideoGameInput!): VideoGame!
    updateVideoGame(id: ID!, item: UpdateVideoGameInput!): VideoGame!
    deleteVideoGame(id: ID!): DeleteItemOutput!
    importExternalVideoGame(
      externalId: ID!
      shelfId: VideoGameShelfId!
      overrides: UpdateVideoGameInput
    ): VideoGame!
  }

  input AddVideoGameInput {
    title: String!
    shelfId: VideoGameShelfId!
    rating: Rating
    imageUrl: String
    platformIds: [VideoGamePlatformId!]!
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }

  input UpdateVideoGameInput {
    title: String
    shelfId: VideoGameShelfId
    rating: Rating
    imageUrl: String
    platformIds: [VideoGamePlatformId!]
    addedAt: DateTime
    movedAt: DateTime
    notes: String
  }
`;

const TYPE = "VideoGame";

const SHELF_NAMES: { [key in VideoGameShelfId]: string } = {
  Playing: "Playing",
  Played: "Played",
  Completed: "Completed",
  GaveUp: "Gave Up",
};

const PLATFORM_NAMES: { [key in VideoGamePlatformId]: string } = {
  Playstation4: "Playstation 4",
  NintendoSwitch: "Nintendo Switch",
  Nintendo3DS: "Nintendo 3DS",
  Playstation3: "Playstation 3",
};

const IGDB_API = new IgdbApi();

const OUTPUT_TRANSFORM: FieldTransform<VideoGame, DataItem> = ({
  platforms,
}) => ({
  platforms: platforms.map((id: VideoGamePlatformId) => ({ id })),
});

const INPUT_TRANSFORM: FieldTransform<
  DataItem,
  AddVideoGameInput | UpdateVideoGameInput
> = ({ platformIds }) => ({
  platforms: platformIds,
});

const EXTERNAL_TRANSFORM: FieldTransform<AddVideoGameInput, ExternalVideoGame> =
  () => ({
    previewImageUrl: undefined,
    rating: null,
    platformIds: [],
  });

export const resolvers: Resolvers = {
  Query: {
    videoGame: resolveForId<VideoGame>(TYPE, OUTPUT_TRANSFORM),
    videoGames: resolveForType<VideoGame>(TYPE, OUTPUT_TRANSFORM),
    videoGameShelf: resolveShelf<VideoGameShelfId>(SHELF_NAMES),
    searchExternalVideoGame: resolveExternal(IGDB_API),
  },
  VideoGameShelf: {
    name: resolveShelfName<VideoGameShelfId>(SHELF_NAMES),
    items: resolveShelfItems<VideoGame, VideoGameShelfId>(
      TYPE,
      OUTPUT_TRANSFORM
    ),
  },
  VideoGamePlatform: {
    name: ({ id }: { id?: VideoGamePlatformId }) => {
      return PLATFORM_NAMES[id!];
    },
  },
  ExternalVideoGame: {
    importedItem: resolveImportedItem(OUTPUT_TRANSFORM),
  },
  Mutation: {
    importExternalVideoGame: resolveImportExternal<
      VideoGame,
      VideoGameShelfId,
      AddVideoGameInput,
      ExternalVideoGame
    >(TYPE, OUTPUT_TRANSFORM, INPUT_TRANSFORM, EXTERNAL_TRANSFORM, IGDB_API),
    addVideoGame: resolveAddItem<VideoGame, AddVideoGameInput>(
      TYPE,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    updateVideoGame: resolveUpdateItem<VideoGame, UpdateVideoGameInput>(
      TYPE,
      INPUT_TRANSFORM,
      OUTPUT_TRANSFORM
    ),
    deleteVideoGame: resolveDeleteItem(TYPE),
  },
};
