import { source, importer } from "../goodreads";
import { runImport } from "../index";

(async () => {
  await runImport(source, importer);
})();
