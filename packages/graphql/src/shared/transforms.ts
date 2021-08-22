import { Item as DataItem } from "@mattb.tech/billio-data";
import { ItemInput, ItemOverrides } from "./Item";
import { Item } from "../generated/graphql";
import { storeImage, selectImage } from "./Image";

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
  const selectedImage = selectImage(image);
  // Cast to TItem isn't validated here, but will be validated on output by the GraphQL engine
  return cleanUndefined({
    ...rest,
    ...(selectedImage
      ? {
          image: {
            ...selectedImage,
            url: `${IMAGE_DOMAIN}/${selectedImage.url}`,
          },
        }
      : {}),
    ...transformed,
    shelf: {
      id: input.shelf,
    },
  }) as unknown as TItem;
}

export async function transformUpdateItemInput<
  T extends ItemOverrides<ItemInput>
>(input: T, fieldTransform: FieldTransform<DataItem, T> = () => ({})) {
  const { shelfId, imageUrl, ...rest } = input;
  const transformed = fieldTransform(input);
  return cleanUndefined({
    ...rest,
    ...transformed,
    ...(imageUrl
      ? {
          image: await storeImage({ imageUrl }),
        }
      : {}),
    ...(shelfId ? { shelf: shelfId } : {}),
  });
}

export async function transformAddItemInput<T extends ItemInput>(
  input: T,
  fieldTransform: FieldTransform<DataItem, T> = () => ({})
) {
  const { shelfId, imageUrl, ...rest } = input;
  const transformed = fieldTransform(input);
  return cleanUndefined({
    ...rest,
    ...transformed,
    ...(imageUrl
      ? {
          image: await storeImage({ imageUrl }),
        }
      : {}),
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
