import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";
import {
  AbstractItem,
  AddItemInput,
  ItemResolverFactory,
  UpdateItemInput,
} from "./Item";
import { PageResolverFactory, PageTypeFactory } from "./Page";
import { ShelfResolverFactory, ShelfTypeFactory } from "./Shelf";

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

const Page = PageTypeFactory(() => VideoGame);
const Shelf = ShelfTypeFactory(
  () => VideoGame,
  () => Page,
  () => ShelfId
);

@InputType()
class AddVideoGameInput extends AddItemInput {
  @Field((type) => ShelfId)
  shelfId: ShelfId;
  @Field((type) => [Platform])
  platforms: Platform[];
}

@InputType()
class UpdateVideoGameInput extends UpdateItemInput {
  @Field((type) => ShelfId, { nullable: true })
  shelfId: ShelfId;
  @Field((type) => [String], { nullable: true })
  platforms: string[];
}

const ItemResolver = ItemResolverFactory(
  VideoGame,
  AddVideoGameInput,
  UpdateVideoGameInput
);
const ShelfResolver = ShelfResolverFactory(VideoGame, Shelf, ShelfId);
const PageResolver = PageResolverFactory(VideoGame, Page);

export const resolvers = [ItemResolver, ShelfResolver, PageResolver] as const;
