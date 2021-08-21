export default function transform(innerTransform?: (data: any) => any) {
  return (data: any) => {
    const { shelf, image, movedAt, addedAt, _overrideDates, ...rest } = data;
    const transformed = {
      ...rest,
      shelfId: shelf.id,
      ...(_overrideDates ? { movedAt, addedAt } : {}),
    };
    return innerTransform?.(transformed) ?? transformed;
  };
}
