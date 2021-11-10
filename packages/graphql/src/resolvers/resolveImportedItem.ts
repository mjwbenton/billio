import { Item as DataItem, Query as DataQuery } from "@mattb.tech/billio-data";
import { Item } from "../generated/graphql";
import { FieldTransform, transformItem } from "../shared/transforms";

export default function resolveImportedItem<TItem extends Item>(
  transform: FieldTransform<TItem, DataItem>
) {
  return async ({ id }: { id?: string }): Promise<TItem | null> => {
    const [item] = await DataQuery.withExternalId({ externalId: id ?? "" });
    if (!item) {
      return null;
    }
    return transformItem(item, transform);
  };
}
