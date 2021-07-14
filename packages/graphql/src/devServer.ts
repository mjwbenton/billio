require("dotenv").config();
process.env.AWS_PROFILE = "mattb.tech-deploy";
process.env.AWS_REGION = "us-east-1";
process.env.BILLIO_TABLE = process.env.USE_TEST_TABLE
  ? "BillioTestData-ItemTable276B2AC8-1L7WY9SA7KB61"
  : "BillioData-ItemTable276B2AC8-1HIYN64N2BKA1";
process.env.ENABLE_MUTATIONS = "1";

import "reflect-metadata";
import schema from "./schema";
import { ApolloServer } from "apollo-server";

(async () => {
  const server = new ApolloServer({ schema: await schema });
  const { url } = await server.listen(4000);
  console.log(`Server running on ${url}`);
})();
