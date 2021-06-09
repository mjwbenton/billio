import { Grid } from "@material-ui/core";
import { CreateButton, sanitizeListRestProps, TopToolbar } from "react-admin";
import ImportButton from "../import/ImportButton";

export default function ListActions(props: any) {
  const { className, exporter, filters, maxResults, ...rest } = props;
  return (
    <TopToolbar className={className} {...sanitizeListRestProps(rest)}>
      <Grid container direction="row" spacing={2}>
        <Grid item xs={6}>
          <CreateButton variant="text" color="secondary" />
        </Grid>
        <Grid item xs={6}>
          <ImportButton variant="text" color="primary" />
        </Grid>
      </Grid>
    </TopToolbar>
  );
}
