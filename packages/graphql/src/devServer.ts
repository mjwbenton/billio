process.env.AWS_PROFILE = "mattb.tech-deploy";
process.env.AWS_REGION = "us-east-1";

import schema from "./schema";
import { ApolloServer } from "apollo-server";

(async () => {
  const server = new ApolloServer({ schema: await schema });
  const { url } = await server.listen(4000);
  console.log(`Server running on ${url}`);
})();
