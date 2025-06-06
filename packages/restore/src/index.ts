import { CreateItem, Mutate } from "@mattb.tech/billio-data";
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
    }),
  );
  return results.flat();
}

function transform(data: any): CreateItem {
  const { movedAt, addedAt, type, platforms, ...rest } = data;
  return {
    type,
    movedAt: new Date(movedAt),
    addedAt: new Date(addedAt),
    ...rest,
    // Movies being renamed to Features
    ...(type === "Movie"
      ? {
          type: "Feature",
          "type:id": `Feature:${rest.id}`,
          "type:shelf": `Feature:${rest.shelf}`,
        }
      : {}),
    // Splitting out platforms and devices for VideoGames
    ...(platforms ? { devices: platforms, platforms: [] } : {}),
  };
}
