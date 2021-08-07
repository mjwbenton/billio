import { ImageInput } from "../generated/graphql";

export interface UpdateItemInput {
  id: string;
  title?: string | null;
  shelfId?: string | null;
  rating?: number | null;
  image?: ImageInput | null;
  notes?: string | null;
  addedAt?: Date | null;
  movedAt?: Date | null;
}

export interface AddItemInput {
  title: string;
  shelfId: string;
  rating?: number | null;
  image?: ImageInput | null;
  notes?: string | null;
  addedAt?: Date | null;
  movedAt?: Date | null;
}

export type ItemOverrides<T> = {
  [P in keyof T]?: T[P] | null;
};
