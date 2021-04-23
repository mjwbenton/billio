import ReactDOM from "react-dom";
import App from "./App";
import Amplify from "aws-amplify";

Amplify.configure({
  Auth: {
    identityPoolId: "us-east-1:89ecb914-9ab7-4df8-b36f-f396c5344e60",
    region: "us-east-1",
    userPoolId: "us-east-1_nIN7ZeVpN",
    userPoolWebClientId: "5e37nl6ki9c9qpjo6u8lngtlg9",
    mandatorySignIn: true,
    authenticatedFlowType: "USER_PASSWORD_AUTH",
  },
});

ReactDOM.render(<App />, document.getElementById("root"));
