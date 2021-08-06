import { ImageInput } from "../generated/graphql";

export interface UpdateItemInput {
  id: string;
  title?: string | null;
  shelfId?: string | null;
  rating?: number | null;
  image?: ImageInput | null;
  notes?: string | null;
  addedAt?: Date;
  movedAt?: Date;
}

export interface AddItemInput {
  title: string;
  shelfId: string;
  rating?: number | null;
  image?: ImageInput | null;
  notes?: string | null;
  addedAt?: Date;
  movedAt?: Date;
}
