export default function resolveShelfName<TShelfId extends string>(
  shelfNames: {
    [key in TShelfId]: string;
  }
) {
  return ({ id }: { id?: TShelfId }) => {
    if (!id || !shelfNames[id]) {
      throw new Error(`Invalid shelf: "${id}"`);
    }
    return shelfNames[id];
  };
}
