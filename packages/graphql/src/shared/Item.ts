import { ImageInput } from "../generated/graphql";

export default interface Item {
  id: string;
  shelf: { id: string };
  addedAt: Date;
  movedAt: Date;
  title: string;
}

export interface UpdateItemInput {
  id: string;
  title?: string | null;
  shelfId?: string | null;
  rating?: number | null;
  image?: ImageInput | null;
  addedAt?: Date;
  movedAt?: Date;
}

export interface AddItemInput {
  title: string;
  shelfId: string;
  rating?: number | null;
  image?: ImageInput | null;
  addedAt?: Date;
  movedAt?: Date;
}
