import { ItemInput } from "../shared/Item";
import { Item } from "../shared/Item";
import {
  AddInputTransform,
  OutputTransform,
  transformAddItemInput,
  transformItem,
} from "../shared/transforms";
import { v4 as uuid } from "uuid";
import { Mutate as DataMutate } from "@mattb.tech/billio-data";

export default function resolveAddItem<
  TItem extends Item<TShelfId>,
  TShelfId extends string,
  TAddItemInput extends ItemInput<TShelfId>,
>(
  type: string,
  inputTransform: AddInputTransform<TAddItemInput, TShelfId>,
  outputTransform: OutputTransform<TItem, TShelfId>,
) {
  return async (_: unknown, { item }: { item: TAddItemInput }) => {
    const outputItem = await DataMutate.createItem(
      await transformAddItemInput(uuid(), type, item, inputTransform),
    );
    return transformItem<TItem, TShelfId>(outputItem, outputTransform);
  };
}
