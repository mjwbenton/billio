export default function resolveShelf<TShelfId extends string>(
  shelfNames: {
    [key in TShelfId]: string;
  }
) {
  return (_: unknown, { id }: { id: TShelfId }) => {
    if (!shelfNames[id]) {
      throw new Error(`Invalid shelf: "${id}"`);
    }
    return {
      id,
    };
  };
}
