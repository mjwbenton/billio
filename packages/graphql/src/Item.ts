import {
  Arg,
  ClassType,
  Field,
  ID,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { Query as DataQuery } from "@mattb.tech/billio-data";
import lowerFirst from "./util/lowerFirst";
import Rating from "./shared/Rating";
import Image from "./shared/Image";
import { FieldTransform, transformItem } from "./transforms";

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
  TItem: ClassType<TItem>,
  fieldTransforms?: FieldTransform<TItem>
) {
  @Resolver(TItem)
  class ItemResolverImpl {
    @Query((returns) => TItem, { nullable: true, name: lowerFirst(TItem.name) })
    async item(@Arg("id", (type) => ID) id: string): Promise<TItem | null> {
      const data = await DataQuery.withId({ type: TItem.name, id });
      return transformItem<TItem>(data, fieldTransforms);
    }
  }
  return ItemResolverImpl;
}
