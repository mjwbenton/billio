import { CreateButton, useListContext } from "react-admin";
import ImportButton from "../import/ImportButton";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";

export default function EmptyPage() {
  const { resource } = useListContext();
  return (
    <>
      <Box textAlign="center" m={10}>
        <Typography variant="h5" paragraph>
          No {resource}s available.
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-around" m={20}>
        <CreateButton variant="contained" color="secondary" size="large" />
        <ImportButton variant="contained" color="primary" size="large" />
      </Box>
    </>
  );
}
