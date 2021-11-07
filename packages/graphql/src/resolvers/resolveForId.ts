import { FieldTransform, transformItem } from "../shared/transforms";
import { Item as DataItem, Query as DataQuery } from "@mattb.tech/billio-data";
import { Item } from "../generated/graphql";

export default function resolveForId<TItem extends Item>(
  type: string,
  transform: FieldTransform<TItem, DataItem>
) {
  return async (_: unknown, { id }: { id: string }): Promise<TItem | null> => {
    const data = await DataQuery.withId({ type, id });
    if (!data) {
      return null;
    }
    return transformItem(data, transform);
  };
}
