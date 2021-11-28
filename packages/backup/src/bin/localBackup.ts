process.env.AWS_PROFILE = "mattb.tech-deploy";
process.env.AWS_REGION = "us-east-1";
process.env.BILLIO_TABLE = "BillioData-ItemTable276B2AC8-1HIYN64N2BKA1";

import { fetchAllForType, TYPES } from "../index";
import fs from "fs/promises";

(async () => {
  const date = new Date().toISOString();
  await Promise.all(
    TYPES.map(async (type) => {
      const result = await fetchAllForType(type);
      await fs.writeFile(`./${type}.json`, JSON.stringify(result, null, 2));
    })
  );
})();
