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
import Item from "./Item";
import lowerFirst from "./util/lowerFirst";
import { Query as DataQuery } from "@mattb.tech/billio-data";
import { FieldTransform, transformItem } from "./transforms";

export default interface Page<TItem extends Item> {
  total: number;
  items: Array<TItem>;
  hasNextPage: boolean;
  nextPageCursor?: string;
}

export function PageTypeFactory<TItem extends Item>(
  TItem: () => ClassType<TItem>
) {
  @ObjectType(`${TItem().name}Page`)
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
  TItem: ClassType<TItem>,
  TPage: ClassType<Page<TItem>>,
  fieldTransforms?: FieldTransform<TItem>
) {
  @Resolver()
  class PageResolverImpl {
    @Query((returns) => TPage, { name: `${lowerFirst(TItem.name)}s` })
    async itemsForType(
      @Arg("first", (type) => Int) first: number,
      @Arg("after", (type) => ID, { nullable: true }) after?: string
    ): Promise<Page<TItem>> {
      const { count, items, lastKey } = await DataQuery.ofType(
        { type: TItem.name },
        {
          first,
          after,
        }
      );
      return {
        total: count,
        hasNextPage: !!lastKey,
        nextPageCursor: lastKey,
        items: items.map((i) => transformItem<TItem>(i, fieldTransforms)),
      };
    }
  }
  return PageResolverImpl;
}
