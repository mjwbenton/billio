import { Field, InputType, ObjectType } from "type-graphql";
import {
  AbstractItem,
  AddItemInput,
  ItemResolverFactory,
  UpdateItemInput,
} from "./Item";
import { PageResolverFactory, PageTypeFactory } from "./Page";
import { ShelfResolverFactory, ShelfTypeFactory } from "./Shelf";

const VIDEO_GAME = "videogame";
@ObjectType()
class VideoGame extends AbstractItem {
  @Field((type) => Shelf)
  shelf: { id: string };
  @Field()
  platform: string;
}

@InputType()
class AddVideoGameInput extends AddItemInput {
  @Field()
  platform: string;
}

@InputType()
class UpdateVideoGameInput extends UpdateItemInput {
  @Field({ nullable: true })
  platform: string;
}

const Page = PageTypeFactory(VIDEO_GAME, () => VideoGame);
const Shelf = ShelfTypeFactory(VIDEO_GAME, () => Page);

const ItemResolver = ItemResolverFactory(
  VIDEO_GAME,
  VideoGame,
  AddVideoGameInput,
  UpdateVideoGameInput
);
const ShelfResolver = ShelfResolverFactory(VIDEO_GAME, Shelf);
const PageResolver = PageResolverFactory(VIDEO_GAME, Page);

export const resolvers = [ItemResolver, ShelfResolver, PageResolver] as const;
