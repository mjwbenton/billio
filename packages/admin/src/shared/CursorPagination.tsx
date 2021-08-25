import { useListPaginationContext } from "react-admin";
import { Button, Grid, Toolbar, Typography } from "@material-ui/core";

const PER_PAGE_INCREASE = 50;

export default function CursorPagination() {
  const { perPage, setPerPage, total } = useListPaginationContext();
  if (!total) {
    return null;
  }
  const loaded = Math.min(perPage, total);
  return (
    <Toolbar>
      <Grid container direction="row" spacing={2}>
        <Grid item xs={6}>
          {loaded < total ? (
            <Button onClick={() => setPerPage(perPage + PER_PAGE_INCREASE)}>
              Load More
            </Button>
          ) : null}
        </Grid>
        <Grid item xs={6}>
          <Typography>
            {loaded} of {total}
          </Typography>
        </Grid>
      </Grid>
    </Toolbar>
  );
}
