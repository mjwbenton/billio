import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import { ReactElement } from "react";
import { Title } from "react-admin";

const ImportPage = ({ children }: { children: ReactElement }) => {
  return (
    <Card>
      <Title title="Import" />
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default ImportPage;
