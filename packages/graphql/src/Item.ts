import {
  Arg,
  ClassType,
  Field,
  ID,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { Query as DataQuery, Item as DataItem } from "@mattb.tech/billio-data";
import { lowerFirst } from "./util";
import Rating from "./Rating";
import Image from "./Image";

export default interface Item {
  id: string;
  shelf: { id: string };
  createdAt: Date;
  updatedAt: Date;
  title: string;
}

@ObjectType({ isAbstract: true })
export abstract class AbstractItem {
  @Field((type) => ID)
  id: string;
  @Field()
  createdAt: Date;
  @Field()
  updatedAt: Date;
  @Field()
  title: string;
  @Field((type) => Rating, { nullable: true })
  rating: number | null;
  @Field((type) => Image, { nullable: true })
  image: Image | null;
  // Shelf not included. Gets added by all subclasses to avoid a circular dependency.
}

export function ItemResolverFactory<TItem extends Item>(
  TItem: ClassType<TItem>
) {
  @Resolver(TItem)
  class ItemResolverImpl {
    @Query((returns) => TItem, { nullable: true, name: lowerFirst(TItem.name) })
    async item(@Arg("id", (type) => ID) id: string): Promise<TItem | null> {
      const data = await DataQuery.withId({ type: TItem.name, id });
      return transformItem<TItem>(data);
    }
  }
  return ItemResolverImpl;
}

export function transformItem<TItem extends Item>(input: DataItem): TItem {
  const { shelf, type, ...rest } = input;
  // Cast to TItem isn't validated here, but will be validated on output by the GraphQL engine
  return {
    ...rest,
    shelf: {
      id: input.shelf,
    },
  } as TItem;
}
