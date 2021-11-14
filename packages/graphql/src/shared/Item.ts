import { Item as GQLItem } from "../generated/graphql";

export interface ItemInput<TShelfId extends string> {
  title: string;
  shelfId: TShelfId;
  rating: number | null;
  imageUrl: string | null;
  notes: string | null;
  externalId: string | null;
  addedAt: Date | null;
  movedAt: Date | null;
}

export type ItemOverrides<T extends ItemInput<string>> = {
  [P in keyof T]: T[P] | null;
};

/*
 * Extends the graphql item (which ignores shelf) to say that its present on all items
 */
export type Item<TShelfId extends string> = GQLItem & {
  shelf: {
    id: TShelfId;
  };
};
