import { ItemInput, ItemOverrides } from "../shared/Item";
import { Item } from "../generated/graphql";
import {
  FieldTransform,
  transformItem,
  transformUpdateItemInput,
} from "../shared/transforms";
import {
  Mutate as DataMutate,
  Item as DataItem,
} from "@mattb.tech/billio-data";

export default function resolveUpdateItem<
  TItem extends Item,
  TUpdateItemInput extends ItemOverrides<ItemInput>
>(
  type: string,
  inputTransform: FieldTransform<DataItem, TUpdateItemInput>,
  outputTransform: FieldTransform<TItem, DataItem>
) {
  return async (
    _: unknown,
    { id, item }: { id: string; item: TUpdateItemInput }
  ) => {
    const outputItem = await DataMutate.updateItem({
      type,
      id,
      ...(await transformUpdateItemInput(item, inputTransform)),
    });
    return transformItem<TItem>(outputItem, outputTransform);
  };
}
