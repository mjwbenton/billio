import { Item as DataItem } from "@mattb.tech/billio-data";
import { ItemInput, ItemOverrides } from "./Item";
import { Item } from "../generated/graphql";

const IMAGE_DOMAIN = process.env.BILLIO_IMAGE_DOMAIN!;

export type FieldTransform<OutType, InType = any> = (
  given: InType
) => Partial<OutType>;

export function transformExternalItem<
  TExternalItem,
  TAddItemInput extends ItemInput
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
  const { shelf, type, image, ...rest } = input;
  const transformed = fieldTransform(input);
  // Cast to TItem isn't validated here, but will be validated on output by the GraphQL engine
  return cleanUndefined({
    ...rest,
    ...(image
      ? { image: { ...image, url: `${IMAGE_DOMAIN}/${image.url}` } }
      : {}),
    ...transformed,
    shelf: {
      id: input.shelf,
    },
  }) as unknown as TItem;
}

export function transformUpdateItemInput<T extends ItemOverrides<ItemInput>>(
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

export function transformAddItemInput<T extends ItemInput>(
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
