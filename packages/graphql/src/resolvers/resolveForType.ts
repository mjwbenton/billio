import { Query as DataQuery } from "@mattb.tech/billio-data";
import { Item } from "../shared/Item";
import { OutputTransform, transformItem } from "../shared/transforms";

export default function resolveForType<
  TItem extends Item<TShelfId>,
  TShelfId extends string
>(type: string, transform: OutputTransform<TItem, TShelfId>) {
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
