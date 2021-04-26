import { Auth } from "@aws-amplify/auth";

Auth.configure({
  identityPoolId: "us-east-1:89ecb914-9ab7-4df8-b36f-f396c5344e60",
  region: "us-east-1",
  userPoolId: "us-east-1_nIN7ZeVpN",
  userPoolWebClientId: "5e37nl6ki9c9qpjo6u8lngtlg9",
  mandatorySignIn: true,
  authenticatedFlowType: "USER_PASSWORD_AUTH",
});

const authProvider = {
  login({ username, password }) {
    return Auth.signIn(username, password);
  },
  logout() {
    return Auth.signOut();
  },
  async checkAuth() {
    await Auth.currentSession();
  },
  checkError() {
    return Promise.resolve();
  },
  getPermissions() {
    return Promise.resolve();
  },
};

export default authProvider;
