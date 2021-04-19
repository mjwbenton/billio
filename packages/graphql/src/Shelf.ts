import {
  Arg,
  ClassType,
  Field,
  FieldResolver,
  ID,
  Int,
  ObjectType,
  Query,
  Resolver,
  ResolverInterface,
  Root,
} from "type-graphql";
import { Query as DataQuery } from "@mattb.tech/billio-data";
import Item, { transformItem } from "./Item";
import Page from "./Page";
import { StringKey, upperFirst } from "./util";

export default interface Shelf<TItem extends Item, TShelfEnum extends object> {
  id: StringKey<TShelfEnum>;
  name: string;
  items: Page<TItem>;
}

export function ShelfTypeFactory<TItem extends Item, TShelfEnum extends object>(
  type: string,
  TPage: () => ClassType<Page<TItem>>,
  TShelfEnum: () => TShelfEnum
) {
  @ObjectType(`${upperFirst(type)}Shelf`)
  class ShelfImpl implements Shelf<TItem, TShelfEnum> {
    @Field((type) => TShelfEnum())
    id: StringKey<TShelfEnum>;
    @Field()
    name: string;
    @Field((type) => TPage())
    items: Page<TItem>;
  }

  return ShelfImpl;
}

export function ShelfResolverFactory<
  TItem extends Item,
  TShelfEnum extends object
>(
  type: string,
  TShelf: ClassType<Shelf<TItem, TShelfEnum>>,
  TShelfEnum: TShelfEnum
) {
  @Resolver(TShelf)
  class ShelfResolverImpl
    implements ResolverInterface<Shelf<TItem, TShelfEnum>> {
    @Query((returns) => TShelf, { nullable: true, name: `${type}Shelf` })
    async shelf(
      @Arg("id", (type) => TShelfEnum) id: StringKey<TShelfEnum>
    ): Promise<Pick<Shelf<TItem, TShelfEnum>, "id"> | null> {
      const { count } = await DataQuery.onShelf(
        { type, shelf: id },
        { first: 0 }
      );
      if (count) {
        return {
          id,
        };
      }
      return null;
    }

    @FieldResolver()
    name(@Root() { id }: Pick<Shelf<TItem, TShelfEnum>, "id">) {
      return id;
    }

    @FieldResolver()
    async items(
      @Root() { id }: Pick<Shelf<TItem, TShelfEnum>, "id">,
      @Arg("first", (type) => Int) first: number,
      @Arg("after", (type) => ID, { nullable: true }) after?: string
    ): Promise<Page<TItem>> {
      const { count, items, lastKey } = await DataQuery.onShelf(
        { type, shelf: id },
        {
          first,
          after,
        }
      );
      return {
        total: count,
        hasNextPage: !!lastKey,
        nextPageCursor: lastKey,
        items: items.map((i) => transformItem<TItem>(i)),
      };
    }
  }
  return ShelfResolverImpl;
}
