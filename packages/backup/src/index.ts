import { Query } from "@mattb.tech/billio-data";

const FIRST = 50;

export async function fetchAllForType(type: string): Promise<unknown[]> {
  const result = [];
  let remaining = true;
  let after: string | undefined = undefined;
  while (remaining) {
    const { items, count, lastKey } = await Query.ofType(
      { type },
      { first: FIRST, after }
    );
    result.push(...items);
    if (count <= result.length) {
      remaining = false;
    } else {
      after = lastKey as string;
    }
  }
  return result;
}
