import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import {
  AbstractItem,
  AddItemInput,
  ItemResolverFactory,
  UpdateItemInput,
} from "./Item";
import { PageResolverFactory, PageTypeFactory } from "./Page";
import { ShelfResolverFactory, ShelfTypeFactory } from "./Shelf";

const VIDEO_GAME = "videogame";

enum ShelfId {
  Playing = "Playing",
  Played = "Played",
  Completed = "Completed",
  GaveUp = "Gave Up",
}
registerEnumType(ShelfId, { name: "VideoGameShelfId" });

enum Platform {
  Playstation4 = "Playstation 4",
  NintendoSwitch = "Nintendo Switch",
  Nintendo3DS = "Nintendo 3DS",
}
registerEnumType(Platform, { name: "VideoGamePlatform" });

@ObjectType()
class VideoGame extends AbstractItem {
  @Field((type) => Shelf)
  shelf: { id: ShelfId };
  @Field((type) => [Platform])
  platforms: Platform[];
}

const Page = PageTypeFactory(VIDEO_GAME, () => VideoGame);
const Shelf = ShelfTypeFactory(
  VIDEO_GAME,
  () => Page,
  () => ShelfId
);

@InputType()
class AddVideoGameInput extends AddItemInput {
  @Field((type) => [String])
  platforms: string[];
}

@InputType()
class UpdateVideoGameInput extends UpdateItemInput {
  @Field((type) => [String], { nullable: true })
  platforms: string[];
}

const ItemResolver = ItemResolverFactory(
  VIDEO_GAME,
  VideoGame,
  AddVideoGameInput,
  UpdateVideoGameInput
);
const ShelfResolver = ShelfResolverFactory(VIDEO_GAME, Shelf, ShelfId);
const PageResolver = PageResolverFactory(VIDEO_GAME, Page);

export const resolvers = [ItemResolver, ShelfResolver, PageResolver] as const;
