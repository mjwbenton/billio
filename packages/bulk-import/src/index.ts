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

export interface Importer {
  importItem(item: ImportItem): Promise<void>;
}

export async function runImport(source: Source, importer: Importer) {
  const items = await source.fetch();
  const chunks = chunk(items, 50);
  for (let i = 0; i < chunks.length; i++) {
    await Promise.all(chunks[i].map((item) => importer.importItem(item)));
  }
}
