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
import { FieldTransform } from "./transforms";
import {
  AddItemInput,
  UpdateItemInput,
  ItemMutationResolverFactory,
} from "./ItemMutation";
import { PageResolverFactory, PageTypeFactory } from "./Page";
import { ShelfResolverFactory, ShelfTypeFactory } from "./Shelf";
import { Service } from "typedi";

enum ShelfId {
  Playing = "Playing",
  Played = "Played",
  Completed = "Completed",
  GaveUp = "GaveUp",
}
registerEnumType(ShelfId, { name: "VideoGameShelfId" });

const SHELF_NAMES = {
  Playing: "Playing",
  Played: "Played",
  Completed: "Completed",
  GaveUp: "Gave Up",
};

enum PlatformId {
  Playstation4 = "Playstation4",
  NintendoSwitch = "NintendoSwitch",
  Nintendo3DS = "Nintendo3DS",
}
registerEnumType(PlatformId, { name: "VideoGamePlatform" });

const PLATFORM_NAMES = {
  Playstation4: "Playstation 4",
  NintendoSwitch: "Nintendo Switch",
  Nintendo3DS: "Nintendo 3DS",
};

@ObjectType()
class Platform {
  @Field((type) => PlatformId)
  id: PlatformId;
  @Field()
  name: string;
}

@Service()
@Resolver(Platform)
class PlatformResolver {
  @FieldResolver()
  name(@Root() { id }: Pick<Platform, "id">) {
    return PLATFORM_NAMES[id];
  }
}

@ObjectType()
class VideoGame extends AbstractItem {
  @Field((type) => Shelf)
  shelf: { id: ShelfId };
  @Field((type) => [Platform])
  platforms: Pick<Platform, "id">[];
}

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

const OUTPUT_TRANSFORM: FieldTransform<VideoGame> = ({ platforms }) => ({
  platforms: platforms.map((id: PlatformId) => ({ id })),
});

const INPUT_TRANSFORMS: FieldTransform<
  any,
  AddVideoGameInput | UpdateVideoGameInput
> = ({ platformIds }) => ({
  platforms: platformIds,
});

const Page = PageTypeFactory(() => VideoGame);
const Shelf = ShelfTypeFactory(
  () => VideoGame,
  () => Page,
  () => ShelfId
);

const ItemResolver = ItemResolverFactory(VideoGame, OUTPUT_TRANSFORM);
const ItemMutationResolver = ItemMutationResolverFactory(
  VideoGame,
  AddVideoGameInput,
  UpdateVideoGameInput,
  OUTPUT_TRANSFORM,
  INPUT_TRANSFORMS
);
const ShelfResolver = ShelfResolverFactory(
  VideoGame,
  Shelf,
  ShelfId,
  SHELF_NAMES,
  OUTPUT_TRANSFORM
);
const PageResolver = PageResolverFactory(VideoGame, Page, OUTPUT_TRANSFORM);

export const queryResolvers = [
  ItemResolver,
  ShelfResolver,
  PageResolver,
  PlatformResolver,
] as const;

export const mutationResolvers = [ItemMutationResolver] as const;
