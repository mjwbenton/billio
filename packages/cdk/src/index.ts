import { App } from "@aws-cdk/core";
import BillioDataStack from "./BillioDataStack";

const app = new App();
new BillioDataStack(app, "BillioData");
