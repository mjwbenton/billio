import {
  Field,
  FieldResolver,
  InputType,
  ObjectType,
  registerEnumType,
  Resolver,
  Root,
} from "type-graphql";
import { AbstractItem, ItemResolverFactory } from "./Item";
import {
  AddItemInput,
  UpdateItemInput,
  ItemMutationResolverFactory,
} from "./ItemMutation";
import { PageResolverFactory, PageTypeFactory } from "./Page";
import { ShelfResolverFactory, ShelfTypeFactory } from "./Shelf";

enum ShelfId {
  Playing = "Playing",
  Played = "Played",
  Completed = "Completed",
  GaveUp = "Gave Up",
}
registerEnumType(ShelfId, { name: "VideoGameShelfId" });

enum PlatformId {
  Playstation4 = "Playstation 4",
  NintendoSwitch = "Nintendo Switch",
  Nintendo3DS = "Nintendo 3DS",
}
registerEnumType(PlatformId, { name: "VideoGamePlatform" });

@ObjectType()
class Platform {
  @Field((type) => PlatformId)
  id: PlatformId;
  @Field()
  name: string;
}

@Resolver(Platform)
class PlatformResolver {
  @FieldResolver()
  name(@Root() { id }: Pick<Platform, "id">) {
    return id;
  }
}

@ObjectType()
class VideoGame extends AbstractItem {
  @Field((type) => Shelf)
  shelf: { id: ShelfId };
  @Field((type) => [Platform])
  platforms: Pick<Platform, "id">[];
}

const FIELD_TRANSFORMS = {
  platforms: (ids: Array<PlatformId>) => ids.map((id) => ({ id })),
};

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
  @Field((type) => [PlatformId])
  platformIds: PlatformId[];
}

@InputType()
class UpdateVideoGameInput extends UpdateItemInput {
  @Field((type) => ShelfId, { nullable: true })
  shelfId: ShelfId;
  @Field((type) => [PlatformId], { nullable: true })
  platformIds: PlatformId[];
}

const ItemResolver = ItemResolverFactory(VideoGame, FIELD_TRANSFORMS);
const ItemMutationResolver = ItemMutationResolverFactory(
  VideoGame,
  AddVideoGameInput,
  UpdateVideoGameInput
);
const ShelfResolver = ShelfResolverFactory(
  VideoGame,
  Shelf,
  ShelfId,
  FIELD_TRANSFORMS
);
const PageResolver = PageResolverFactory(VideoGame, Page, FIELD_TRANSFORMS);

export const queryResolvers = [
  ItemResolver,
  ShelfResolver,
  PageResolver,
  PlatformResolver,
] as const;

export const mutationResolvers = [ItemMutationResolver] as const;
