process.env.AWS_PROFILE = "mattb.tech-deploy";
process.env.AWS_REGION = "us-east-1";
process.env.BILLIO_TABLE = "BillioData-ItemTable276B2AC8-1HIYN64N2BKA1";

import { TYPES } from "@mattb.tech/billio-config";
import { fetchAllForType } from "../index";
import fs from "fs/promises";

(async () => {
  await Promise.all(
    TYPES.map(async (type) => {
      const result = await fetchAllForType(type);
      await fs.writeFile(
        `./local/${type}.json`,
        JSON.stringify(result, null, 2)
      );
    })
  );
})();
