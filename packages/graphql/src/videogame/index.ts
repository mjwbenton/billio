import gql from "graphql-tag";
import {
  AddVideoGameInput,
  UpdateVideoGameInput,
  VideoGame,
  VideoGameDeviceId,
  VideoGamePlatformId,
  VideoGameShelfId,
} from "../generated/graphql";
import { IgdbApi } from "./IgdbApi";
import {
  AddInputTransform,
  ExternalToInputTransform,
  OutputTransform,
  UpdateInputTransform,
} from "../shared/transforms";
import resolveForId from "../resolvers/resolveForId";
import resolveForType from "../resolvers/resolveForType";
import {
  resolveShelfArgs,
  resolveShelfParent,
} from "../resolvers/resolveShelf";
import resolveExternal from "../resolvers/resolveExternal";
import resolveShelfItems from "../resolvers/resolveShelfItems";
import resolveImportExternal from "../resolvers/resolveImportExternal";
import resolveDeleteItem from "../resolvers/resolveDeleteItem";
import resolveAddItem from "../resolvers/resolveAddItem";
import resolveUpdateItem from "../resolvers/resolveUpdateItem";
import { ExternalVideoGame } from "./types";
import resolveImportedItem from "../resolvers/resolveImportedItem";
import { PartialResolvers } from "../shared/types";
import GqlModule from "../shared/gqlModule";

const typeDefs = gql`
  extend type Query {
    videoGame(id: ID!): VideoGame
    videoGameShelf(id: VideoGameShelfId!): VideoGameShelf
    videoGames(
      after: ID
      first: Int!
      searchTerm: String
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
      rating: RatingFilter
    ): VideoGamePage!
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
    devices: [VideoGameDevice!]!
    replay: Boolean!
    hoursPlayed: Int
  }

  type VideoGameShelf {
    id: VideoGameShelfId!
    name: String!
    items(
      after: ID
      first: Int!
      startDate: DateTime
      endDate: DateTime
      sortBy: SortBy
      rating: RatingFilter
    ): VideoGamePage!
  }

  enum VideoGameShelfId {
    Playing
    Played
    Completed
    GaveUp
    Paused
  }

  type VideoGamePage {
    total: Int!
    items: [VideoGame!]!
    hasNextPage: Boolean!
    nextPageCursor: ID
  }

  type VideoGameDevice {
    id: VideoGameDeviceId!
    name: String!
  }

  enum VideoGameDeviceId {
    SteamDeck
    Playstation4
    NintendoSwitch
    Nintendo3DS
    Playstation3
    NintendoSwitch2
    IOS
    TrimUiBrick
    RetroidPocketMiniV2
    RetroidPocketFlip2
  }

  type VideoGamePlatform {
    id: VideoGamePlatformId!
    name: String!
  }

  enum VideoGamePlatformId {
    Steam
    NintendoGameBoy
    NintendoGameBoyColor
    NintendoGameBoyAdvance
    NintendoSNES
    NintendoWiiU
    NintendoSwitch
    NintendoDS
    Nintendo3DS
    Nintendo64
    NintendoGameCube
    SegaMegaDrive
    SegaSaturn
    SegaDreamcast
    Playstation1
    Playstation2
    Playstation3
    Playstation4
    IOS
    TurboGrafx16
  }

  type ExternalVideoGame {
    id: ID!
    title: String!
    previewImageUrl: String
    imageUrl: String
    importedItem: VideoGame
  }
`;

const mutationTypeDefs = gql`
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
    deviceIds: [VideoGameDeviceId!]
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
    replay: Boolean
    hoursPlayed: Int
  }

  input UpdateVideoGameInput {
    title: String
    shelfId: VideoGameShelfId
    rating: Rating
    imageUrl: String
    platformIds: [VideoGamePlatformId!]
    deviceIds: [VideoGameDeviceId!]
    addedAt: DateTime
    movedAt: DateTime
    notes: String
    externalId: ID
    replay: Boolean
    hoursPlayed: Int
  }
`;

const TYPE = "VideoGame";

const SHELF_NAMES: { [key in VideoGameShelfId]: string } = {
  Playing: "Playing",
  Played: "Played",
  Completed: "Completed",
  GaveUp: "Gave Up",
  Paused: "Paused",
};

const PLATFORM_DEVICE_NAMES: {
  [key in VideoGamePlatformId | VideoGameDeviceId]: string;
} = {
  SteamDeck: "Steam Deck",
  Playstation4: "Playstation 4",
  NintendoSwitch: "Nintendo Switch",
  NintendoDS: "Nintendo DS",
  Nintendo3DS: "Nintendo 3DS",
  Playstation3: "Playstation 3",
  NintendoSwitch2: "Nintendo Switch 2",
  IOS: "iOS",
  TrimUiBrick: "Trim UI Brick",
  RetroidPocketMiniV2: "Retroid Pocket Mini V2",
  RetroidPocketFlip2: "Retroid Pocket Flip 2",
  NintendoGameBoy: "Game Boy",
  NintendoGameBoyAdvance: "Game Boy Advance",
  NintendoGameBoyColor: "Game Boy Color",
  NintendoSNES: "Super Nintendo",
  NintendoWiiU: "Nintendo WiiU",
  Nintendo64: "Nintendo 64",
  NintendoGameCube: "Nintendo GameCube",
  Steam: "Steam",
  SegaMegaDrive: "Sega Mega Drive",
  SegaSaturn: "Sega Saturn",
  SegaDreamcast: "Sega Dreamcast",
  Playstation1: "Playstation 1",
  Playstation2: "Playstation 2",
  TurboGrafx16: "TurboGrafx-16",
};

const IGDB_API = new IgdbApi();

const OUTPUT_TRANSFORM: OutputTransform<VideoGame, VideoGameShelfId> = (
  data,
) => {
  const platformIds: Array<VideoGamePlatformId> = data.platforms ?? [];
  const deviceIds: Array<VideoGameDeviceId> = data.devices ?? [];
  return {
    replay: data.replay ?? false,
    platforms: platformIds.map((id: VideoGamePlatformId) => ({
      id,
      name: PLATFORM_DEVICE_NAMES[id],
    })),
    devices: deviceIds.map((id: VideoGameDeviceId) => ({
      id,
      name: PLATFORM_DEVICE_NAMES[id],
    })),
    hoursPlayed: data.hoursPlayed ?? null,
  };
};

const ADD_INPUT_TRANSFORM: AddInputTransform<
  AddVideoGameInput,
  VideoGameShelfId
> = (input) => ({
  platforms: input.platformIds,
  devices: input.deviceIds,
  replay: input.replay,
  hoursPlayed: input.hoursPlayed,
});

const UPDATE_INPUT_TRANSFORM: UpdateInputTransform<
  UpdateVideoGameInput,
  VideoGameShelfId
> = (input) => ({
  ...(input.platformIds != null ? { platforms: input.platformIds } : {}),
  ...(input.deviceIds != null ? { devices: input.deviceIds } : {}),
  ...(input.replay != null ? { replay: input.replay } : {}),
  ...(input.hoursPlayed != null ? { hoursPlayed: input.hoursPlayed } : {}),
});

const EXTERNAL_TRANSFORM: ExternalToInputTransform<
  ExternalVideoGame,
  AddVideoGameInput,
  VideoGameShelfId
> = () => ({
  platformIds: [],
  deviceIds: [],
  replay: false,
});

const resolvers: PartialResolvers = {
  Query: {
    videoGame: resolveForId<VideoGame, VideoGameShelfId>(
      TYPE,
      OUTPUT_TRANSFORM,
    ),
    videoGames: resolveForType<VideoGame, VideoGameShelfId>(
      TYPE,
      OUTPUT_TRANSFORM,
    ),
    videoGameShelf: resolveShelfArgs<VideoGameShelfId>(SHELF_NAMES),
    searchExternalVideoGame: resolveExternal(IGDB_API),
  },
  VideoGame: {
    shelf: resolveShelfParent<VideoGameShelfId>(SHELF_NAMES),
  },
  VideoGameShelf: {
    items: resolveShelfItems<VideoGame, VideoGameShelfId>(
      TYPE,
      OUTPUT_TRANSFORM,
    ),
  },
  ExternalVideoGame: {
    importedItem: resolveImportedItem(OUTPUT_TRANSFORM),
  },
};

const mutationResolvers: PartialResolvers["Mutation"] = {
  importExternalVideoGame: resolveImportExternal<
    VideoGame,
    VideoGameShelfId,
    AddVideoGameInput,
    ExternalVideoGame
  >(TYPE, OUTPUT_TRANSFORM, ADD_INPUT_TRANSFORM, EXTERNAL_TRANSFORM, IGDB_API),
  addVideoGame: resolveAddItem<VideoGame, VideoGameShelfId, AddVideoGameInput>(
    TYPE,
    ADD_INPUT_TRANSFORM,
    OUTPUT_TRANSFORM,
  ),
  updateVideoGame: resolveUpdateItem<
    VideoGame,
    VideoGameShelfId,
    UpdateVideoGameInput
  >(TYPE, UPDATE_INPUT_TRANSFORM, OUTPUT_TRANSFORM),
  deleteVideoGame: resolveDeleteItem(TYPE),
};

export default new GqlModule({
  typeDefs,
  resolvers,
  mutationTypeDefs,
  mutationResolvers,
});
