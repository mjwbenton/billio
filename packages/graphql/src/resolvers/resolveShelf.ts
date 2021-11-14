type ShelfNames<TShelfId extends string> = {
  [key in TShelfId]: string;
};

export function resolveShelfArgs<TShelfId extends string>(
  shelfNames: ShelfNames<TShelfId>
) {
  return (_: unknown, { id }: { id: TShelfId }) => shelfForId(id, shelfNames);
}

export function resolveShelfParent<TShelfId extends string>(
  shelfNames: ShelfNames<TShelfId>
) {
  return ({ shelfId }: { shelfId: TShelfId }) =>
    shelfForId(shelfId, shelfNames);
}

function shelfForId<TShelfId extends string>(
  id: TShelfId,
  shelfNames: ShelfNames<TShelfId>
) {
  if (!shelfNames[id]) {
    throw new Error(`Invalid shelf: "${id}"`);
  }
  return {
    id,
    name: shelfNames[id],
  };
}
