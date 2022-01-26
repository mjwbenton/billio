import { Query as DataQuery } from "@mattb.tech/billio-data";
import { Item } from "../shared/Item";
import { OutputTransform, transformItem } from "../shared/transforms";

export default function resolveForType<
  TItem extends Item<TShelfId>,
  TShelfId extends string
>(type: string, transform: OutputTransform<TItem, TShelfId>) {
  return async (
    _: unknown,
    {
      first,
      after,
      searchTerm,
    }: { first: number; after?: string | null; searchTerm?: string | null }
  ) => {
    const { count, items, lastKey } = searchTerm
      ? await DataQuery.searchType(
          { type: type },
          { first, after: after ?? undefined, query: searchTerm }
        )
      : await DataQuery.ofType(
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
