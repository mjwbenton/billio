import { Mutate, UpdateItem } from "@mattb.tech/billio-data";
import chunk from "lodash.chunk";

const BATCH = 10;

export type Success = {
  success: true;
  id: string;
};

export type Failure = {
  success: false;
  id: string;
  error: unknown;
};

export async function writeAll(data: any[]): Promise<Array<Success | Failure>> {
  const results = await Promise.all(
    chunk(data, BATCH).map(async (chunk) => {
      const results = [];
      for (const item of chunk) {
        try {
          const { movedAt, addedAt, ...rest } = item;
          delete rest["type:id"];
          delete rest["type:shelf"];
          await Mutate.createItem(
            {
              movedAt: new Date(movedAt),
              addedAt: new Date(addedAt),
              ...rest,
            },
            { updateIfExists: true }
          );
          results.push({
            success: true as const,
            id: item.id,
          });
        } catch (error) {
          results.push({
            success: false as const,
            id: item.id,
            error,
          });
        }
      }
      return results;
    })
  );
  return results.flat();
}
