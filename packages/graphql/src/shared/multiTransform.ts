import { Item as DataItem } from "@mattb.tech/billio-data";
import { OutputTransform, transformItem } from "./transforms";

export type TransformsIndex = {
  [type: string]: OutputTransform<any, any>;
};

export function multiTransform(
  input: DataItem,
  transformsByType: TransformsIndex
) {
  const transform = transformsByType[input.type];
  if (!transform) {
    throw new Error(
      `Missing transform in multiTransform for type ${input.type}`
    );
  }
  return {
    ...transformItem(input, transform),
    __typename: input.type,
  };
}
