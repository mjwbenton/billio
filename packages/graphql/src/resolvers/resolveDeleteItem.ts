import { Mutate as DataMutate } from "@mattb.tech/billio-data";

export default function resolveDeleteItem(type: string) {
  return async (_: unknown, { id }: { id: string }) => {
    await DataMutate.deleteItem({ type, id });
    return { id };
  };
}
