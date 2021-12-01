import { CreateItem, Mutate, UpdateItem } from "@mattb.tech/billio-data";
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
          await Mutate.createItem(transform(item), { updateIfExists: true });
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

const CATEGORIES = {
  Movie: "Watching",
  TvSeries: "Watching",
};

function transform(data: any): CreateItem {
  const { movedAt, addedAt, type, ...rest } = data;
  // Fix for old bad code - remove platformIds from the data, data is stored in "platforms" instead
  delete rest.platformIds;
  // Data migration - include categories
  const category = CATEGORIES[type as keyof typeof CATEGORIES];
  return {
    type,
    movedAt: new Date(movedAt),
    addedAt: new Date(addedAt),
    ...(category ? { category } : {}),
    ...rest,
  };
}
