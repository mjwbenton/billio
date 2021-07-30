import { FieldTransform, transformItem } from "../transforms";
import { Item as DataItem, Query as DataQuery } from "@mattb.tech/billio-data";
import Item from "./Item";

export default function resolveForId<TItem extends Item>(
  type: string,
  transform: FieldTransform<TItem, DataItem>
) {
  return async (_: unknown, { id }: { id: string }): Promise<TItem> => {
    const data = await DataQuery.withId({ type, id });
    return transformItem(data, transform);
  };
}
