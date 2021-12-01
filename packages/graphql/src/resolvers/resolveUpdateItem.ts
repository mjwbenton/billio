import { ItemInput, ItemOverrides } from "../shared/Item";
import { Item } from "../shared/Item";
import {
  OutputTransform,
  transformItem,
  transformUpdateItemInput,
  UpdateInputTransform,
} from "../shared/transforms";
import { Mutate as DataMutate } from "@mattb.tech/billio-data";

export default function resolveUpdateItem<
  TItem extends Item<TShelfId>,
  TShelfId extends string,
  TUpdateItemInput extends ItemOverrides<ItemInput<TShelfId>>
>(
  type: string,
  inputTransform: UpdateInputTransform<TUpdateItemInput, TShelfId>,
  outputTransform: OutputTransform<TItem, TShelfId>
) {
  return async (
    _: unknown,
    { id, item }: { id: string; item: TUpdateItemInput }
  ) => {
    const outputItem = await DataMutate.updateItem(
      await transformUpdateItemInput(id, type, item, inputTransform)
    );
    return transformItem<TItem, TShelfId>(outputItem, outputTransform);
  };
}
