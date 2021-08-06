import { AddItemInput } from "../shared/Item";
import { Item } from "../generated/graphql";
import {
  FieldTransform,
  transformAddItemInput,
  transformItem,
} from "../shared/transforms";
import { v4 as uuid } from "uuid";
import {
  Mutate as DataMutate,
  Item as DataItem,
} from "@mattb.tech/billio-data";

export default function resolveAddItem<
  TItem extends Item,
  TAddItemInput extends AddItemInput
>(
  type: string,
  inputTransform: FieldTransform<DataItem, TAddItemInput>,
  outputTransform: FieldTransform<TItem, DataItem>
) {
  return async (_: unknown, { item }: { item: TAddItemInput }) => {
    const outputItem = await DataMutate.createItem({
      ...transformAddItemInput(item, inputTransform),
      id: uuid(),
      type,
    });
    return transformItem<TItem>(outputItem, outputTransform);
  };
}
