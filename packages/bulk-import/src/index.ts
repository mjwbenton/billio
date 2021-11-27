import chunk from "lodash.chunk";

export interface ImportItem {
  id: string;
  title: string;
  shelf: string;
  addedAt: string;
  movedAt: string;
  notes: string;
  rating: number | null;
}

export interface Source {
  fetch(): Promise<Array<ImportItem>>;
}

export interface SuccessfulImport {
  success: true;
  id: string;
  title: string;
  externalId: string;
}

export interface FailedImport {
  success: false;
  title: string;
  error: unknown;
  externalId: string;
}

export interface Importer {
  importItem(item: ImportItem): Promise<SuccessfulImport | FailedImport>;
}

export async function runImport(source: Source, importer: Importer) {
  const items = await source.fetch();
  const chunks = chunk(items, 50);
  for (let i = 0; i < chunks.length; i++) {
    await Promise.all(
      chunks[i].map(async (item) => {
        const result = await importer.importItem(item);
        if (result.success) {
          console.log(`Imported ${result.title} as ${result.id}`);
        } else {
          console.log(
            `Failed to import ${result.title} with externalId ${result.externalId}`
          );
          console.log(JSON.stringify(result.error, null, 2));
        }
      })
    );
  }
}
