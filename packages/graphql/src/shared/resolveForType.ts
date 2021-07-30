import { Item as DataItem, Query as DataQuery } from "@mattb.tech/billio-data";
import Item from "./Item";
import { FieldTransform, transformItem } from "../transforms";

export default function resolveForType<TItem extends Item>(
  type: string,
  transform: FieldTransform<TItem, DataItem>
) {
  return async (
    _: unknown,
    { first, after }: { first: number; after?: string | null }
  ) => {
    const { count, items, lastKey } = await DataQuery.ofType(
      { type: type },
      { first, after: after ?? undefined }
    );
    return {
      total: count,
      hasNextPage: !!lastKey,
      nextPageCursor: lastKey ?? null,
      items: items.map((i) => transformItem(i, transform)),
    };
  };
}
