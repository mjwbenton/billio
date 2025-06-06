import { OutputTransform, transformItem } from "../shared/transforms";
import { Query as DataQuery } from "@mattb.tech/billio-data";
import { Item } from "../shared/Item";

export default function resolveForId<
  TItem extends Item<TShelfId>,
  TShelfId extends string,
>(type: string, transform: OutputTransform<TItem, TShelfId>) {
  return async (_: unknown, { id }: { id: string }) => {
    const data = await DataQuery.withId({ type, id });
    if (!data) {
      return null;
    }
    return transformItem(data, transform);
  };
}
