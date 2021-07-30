import Item, { UpdateItemInput } from "./Item";
import {
  FieldTransform,
  transformItem,
  transformUpdateItemInput,
} from "../transforms";
import {
  Mutate as DataMutate,
  Item as DataItem,
} from "@mattb.tech/billio-data";

export default function resolveUpdateItem<
  TItem extends Item,
  TUpdateItemInput extends UpdateItemInput
>(
  type: string,
  inputTransform: FieldTransform<DataItem, TUpdateItemInput>,
  outputTransform: FieldTransform<TItem, DataItem>
) {
  return async (_: unknown, { item }: { item: TUpdateItemInput }) => {
    const outputItem = await DataMutate.updateItem({
      type,
      ...transformUpdateItemInput(item, inputTransform),
    });
    return transformItem<TItem>(outputItem, outputTransform);
  };
}
