import { Query as DataQuery } from "@mattb.tech/billio-data";
import { multiTransform, TransformsIndex } from "../shared/multiTransform";

export default function resolveForCategory(
  category: string,
  transforms: TransformsIndex,
) {
  return async (
    _: unknown,
    { first, after }: { first: number; after?: string | null },
  ) => {
    const { count, items, lastKey } = await DataQuery.forCategory(
      { category },
      { first, after: after ?? undefined },
    );
    return {
      total: count,
      hasNextPage: !!lastKey,
      nextPageCursor: lastKey ?? null,
      items: items.map((i) => multiTransform(i, transforms)),
    };
  };
}
