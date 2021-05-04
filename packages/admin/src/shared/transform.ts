export default function transform(innerTransform?: (data: any) => any) {
  return (data: any) => {
    const { updatedAt, createdAt, shelf, ...rest } = data;
    const transformed = {
      ...rest,
      shelfId: shelf.id,
    };
    return innerTransform?.(transformed) ?? transformed;
  };
}
