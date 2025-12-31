import { Query as DataQuery } from "@mattb.tech/billio-data";
import { SortBy } from "../generated/graphql";
import { Item } from "../shared/Item";
import { OutputTransform, transformItem } from "../shared/transforms";

export default function resolveForType<
  TItem extends Item<TShelfId>,
  TShelfId extends string,
>(type: string, transform: OutputTransform<TItem, TShelfId>) {
  return async (
    _: unknown,
    {
      first,
      after,
      searchTerm,
      startDate,
      endDate,
      sortBy,
      rating,
    }: {
      first: number;
      after?: string | null;
      searchTerm?: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
      sortBy?: SortBy | null;
      rating?: { gte?: number | null; lte?: number | null } | null;
    },
  ) => {
    if (searchTerm && (startDate || endDate)) {
      throw new Error("Cannot combine search and date queries");
    }
    const ratingFilter = rating
      ? {
          gte: rating.gte ?? undefined,
          lte: rating.lte ?? undefined,
        }
      : undefined;
    const { count, items, lastKey } = searchTerm
      ? await DataQuery.searchType(
          { type: type },
          {
            first,
            after: after ?? undefined,
            query: searchTerm,
            rating: ratingFilter,
          },
        )
      : await DataQuery.ofType(
          { type: type },
          {
            first,
            after: after ?? undefined,
            startDate: startDate ?? undefined,
            endDate: endDate ?? undefined,
            sortBy: sortBy ?? undefined,
            rating: ratingFilter,
          },
        );
    return {
      total: count,
      hasNextPage: !!lastKey,
      nextPageCursor: lastKey ?? null,
      items: items.map((i) => transformItem(i, transform)),
    };
  };
}
