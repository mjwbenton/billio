import { Query as DataQuery } from "@mattb.tech/billio-data";
import { Item } from "../shared/Item";
import { OutputTransform, transformItem } from "../shared/transforms";

export default function resolveImportedItem<
  TItem extends Item<TShelfId>,
  TShelfId extends string
>(transform: OutputTransform<TItem, TShelfId>) {
  return async ({ id }: { id?: string }) => {
    const [item] = await DataQuery.withExternalId({ externalId: id ?? "" });
    if (!item) {
      return null;
    }
    return transformItem(item, transform);
  };
}
