import { App } from "@aws-cdk/core";
import BillioAdminStack from "./BillioAdminStack";
import BillioApiStack from "./BillioApiStack";
import BillioAuthStack from "./BillioAuthStack";
import BillioDataStack from "./BillioDataStack";

const app = new App();
const dataStack = new BillioDataStack(app, "BillioData");
const authStack = new BillioAuthStack(app, "BillioAuth");
const apiStack = new BillioApiStack(app, "BillioAPI", {
  dataStack,
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
