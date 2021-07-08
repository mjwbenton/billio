import { Item as DataItem } from "@mattb.tech/billio-data";
import Item, { AddItemInput, UpdateItemInput } from "./Item";

export type FieldTransform<OutType, InType = any> = (
  given: InType
) => Partial<OutType>;

export function transformExternalItem<
  TExternalItem,
  TAddItemInput extends AddItemInput
>(
  input: TExternalItem,
  shelfId: string,
  fieldTransform: FieldTransform<TAddItemInput, TExternalItem> = () => ({})
): TAddItemInput {
  const transformed = fieldTransform(input);
  // Cast to TAddItemInput isn't validated here
  return cleanUndefined({
    ...input,
    ...transformed,
    shelfId,
  }) as unknown as TAddItemInput;
}

export function transformItem<TItem extends Item>(
  input: DataItem,
  fieldTransform: FieldTransform<TItem> = () => ({})
): TItem {
  const { shelf, type, ...rest } = input;
  const transformed = fieldTransform(input);
  // Cast to TItem isn't validated here, but will be validated on output by the GraphQL engine
  return cleanUndefined({
    ...rest,
    ...transformed,
    shelf: {
      id: input.shelf,
    },
  }) as TItem;
}

export function transformUpdateItemInput<T extends UpdateItemInput>(
  input: T,
  fieldTransform: FieldTransform<DataItem, T> = () => ({})
) {
  const { shelfId, ...rest } = input;
  const transformed = fieldTransform(input);
  return cleanUndefined({
    ...rest,
    ...transformed,
    ...(shelfId ? { shelf: shelfId } : {}),
  });
}

export function transformAddItemInput<T extends AddItemInput>(
  input: T,
  fieldTransform: FieldTransform<DataItem, T> = () => ({})
) {
  const { shelfId, ...rest } = input;
  const transformed = fieldTransform(input);
  return cleanUndefined({
    ...rest,
    ...transformed,
    shelf: shelfId,
  });
}

function cleanUndefined<T extends { [key: string]: any } = any>(input: T): T {
  Object.keys(input).forEach((key) => {
    if (input[key] === undefined) {
      delete input[key];
    }
  });
  return input;
}