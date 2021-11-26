import { source, importer } from "../imdbMovieImport";
import { runImport } from "../index";

(async () => {
  await runImport(source, importer);
})();
