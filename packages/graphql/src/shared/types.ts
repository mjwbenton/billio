import { Primitive } from "type-fest";
import { Book, Resolvers } from "../generated/graphql";

/*
 * Partial resolvers to allow bits of the resolvers set to be implemented in different places
 */
export type PartialResolvers = Partial<
  { [Type in keyof Resolvers]: Partial<Resolvers[Type]> }
>;

/*
 * Type that is applied to find the return type of all resolvers and the
 * anticipated parent type of the next resolver.
 *
 * Rules
 * 1. Certain fields are removed to be implemented in a lower down resolver, e.g. "importedItem"
 * 2. Certain fields are replaced with just returning the ID ("shelf" -> "shelfId", "series" -> "seriesId")
 * 3. UNIMPLEMENTED Certain fields are replaced with returning an Array of ID ("platforms" -> "platformIds")
 * 4. Fields called item of of a type that looks like a Page are excluded
 */
export type Unresolved<T> = T extends Primitive
  ? T
  : T extends Date
  ? T
  : T extends Array<infer ArrayInner>
  ? Array<Unresolved<ArrayInner>>
  : RemoveResolvableFields<T> &
      IdIfOriginalPresent<T, "shelf"> &
      IdIfOriginalPresent<T, "series"> &
      ItemsIfPageLike<T>;

type RemoveResolvableFields<T> = Omit<
  { [Key in keyof T]: Unresolved<T[Key]> },
  "shelf" | "series" | "items" | "importedItem" | "seasons"
>;

type IdIfOriginalPresent<T, Field extends string> = T extends Record<
  Field,
  { id: unknown }
>
  ? Record<`${Field}Id`, T[Field]["id"]>
  : {};

const x: Unresolved<Book> = {
  id: "whatever",
  title: "whatever",
  addedAt: new Date(),
  movedAt: new Date(),
  author: "whatever",
  notes: null,
  rating: null,
  externalId: null,
  image: null,
  shelfId: "Read",
};

type PageLike = { total: number; hasNextPage: boolean; items: unknown };
type ItemsIfPageLike<T> = T extends PageLike
  ? { items: Unresolved<T["items"]> }
  : {};
