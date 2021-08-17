import { App } from "@aws-cdk/core";
import BillioAdminStack from "./BillioAdminStack";
import BillioApiStack from "./BillioApiStack";
import BillioAuthStack from "./BillioAuthStack";
import BillioDataStack from "./BillioDataStack";
import BillioImageStack from "./BillioImageStack";

const app = new App();

// Production Stacks
const dataStack = new BillioDataStack(app, "BillioData");
const imageStack = new BillioImageStack(app, "BillioImage");
const authStack = new BillioAuthStack(app, "BillioAuth");
const apiStack = new BillioApiStack(app, "BillioAPI", {
  dataStack,
  imageStack,
  domainName: "api.billio.mattb.tech",
  enableIam: true,
  enableMutations: true,
});
apiStack.grantCall(authStack.authenticatedUserRole);
new BillioAdminStack(app, "BillioAdmin");
new BillioApiStack(app, "BillioReadonlyAPI", {
  dataStack,
  domainName: "api-readonly.billio.mattb.tech",
  enableIam: false,
  enableMutations: false,
});

// Integration test stacks
const integrationDataStack = new BillioDataStack(app, "BillioTestData");
const integrationImageStack = new BillioImageStack(app, "BillioTestImage");
new BillioApiStack(app, "BillioTestAPI", {
  dataStack: integrationDataStack,
  imageStack: integrationImageStack,
  domainName: "api-test.billio.mattb.tech",
  enableIam: false,
  enableMutations: true,
});
