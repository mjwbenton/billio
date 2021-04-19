import {
  Arg,
  ClassType,
  Field,
  ID,
  Int,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import Item, { transformItem } from "./Item";
import { upperFirst } from "./util";
import { Query as DataQuery } from "@mattb.tech/billio-data";

export default interface Page<TItem extends Item> {
  total: number;
  items: Array<TItem>;
  hasNextPage: boolean;
  nextPageCursor?: string;
}

export function PageTypeFactory<TItem extends Item>(
  type: string,
  TItem: () => ClassType<TItem>
) {
  @ObjectType(`${upperFirst(type)}Page`)
  class PageImpl implements Page<TItem> {
    @Field((type) => Int)
    total: number;
    @Field((type) => [TItem()])
    items: Array<TItem>;
    @Field()
    hasNextPage: boolean;
    @Field((type) => ID, { nullable: true })
    nextPageCursor?: string;
  }
  return PageImpl;
}

export function PageResolverFactory<TItem extends Item>(
  type: string,
  TPage: ClassType<Page<TItem>>
) {
  @Resolver()
  class PageResolverImpl {
    @Query((returns) => TPage, { name: `${type}s` })
    async itemsForType(
      @Arg("first", (type) => Int) first: number,
      @Arg("after", (type) => ID, { nullable: true }) after?: string
    ): Promise<Page<TItem>> {
      const { count, items, lastKey } = await DataQuery.ofType(
        { type },
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
  return PageResolverImpl;
}
