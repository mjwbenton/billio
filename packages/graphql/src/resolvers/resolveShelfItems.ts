import Item from "../shared/Item";
import { Item as DataItem, Query as DataQuery } from "@mattb.tech/billio-data";
import { FieldTransform, transformItem } from "../shared/transforms";

export default function resolveShelfItems<
  TItem extends Item,
  TShelfId extends string
>(type: string, transform: FieldTransform<TItem, DataItem>) {
  return async (
    { id }: { id?: TShelfId },
    { first, after }: { first: number; after?: string | null }
  ) => {
    if (!id) {
      throw new Error(`Missing id`);
    }
    const { count, items, lastKey } = await DataQuery.onShelf(
      { type, shelf: id },
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
