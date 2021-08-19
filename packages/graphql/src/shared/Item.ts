export interface ItemInput {
  title: string;
  shelfId: string;
  rating?: number | null;
  imageUrl?: string | null;
  notes?: string | null;
  addedAt?: Date | null;
  movedAt?: Date | null;
}

export type ItemOverrides<T extends ItemInput> = {
  [P in keyof T]?: T[P] | null;
};
