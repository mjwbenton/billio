process.env.AWS_PROFILE = "mattb.tech-deploy";
process.env.AWS_REGION = "us-east-1";
process.env.BILLIO_TABLE = "BillioData-ItemTable276B2AC8-1HIYN64N2BKA1";
//process.env.BILLIO_TABLE = "BillioTestData-ItemTable276B2AC8-1L7WY9SA7KB61";

import { fetchAllForType } from "../index";
import fs from "fs/promises";

(async () => {
  await Promise.all([
    (async () => {
      const books = await fetchAllForType("Book");
      await fs.writeFile("./book.json", JSON.stringify(books, null, 2));
    })(),
    (async () => {
      const videoGames = await fetchAllForType("VideoGame");
      await fs.writeFile(
        "./videogame.json",
        JSON.stringify(videoGames, null, 2)
      );
    })(),
  ]);
})();
