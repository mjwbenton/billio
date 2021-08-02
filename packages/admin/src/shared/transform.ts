export default function transform(innerTransform?: (data: any) => any) {
  return (data: any) => {
    const { movedAt, addedAt, shelf, ...rest } = data;
    const transformed = {
      ...rest,
      shelfId: shelf.id,
    };
    return innerTransform?.(transformed) ?? transformed;
  };
}
