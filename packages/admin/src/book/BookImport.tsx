import { Grid, Typography } from "@material-ui/core";
import { SimpleForm } from "react-admin";
import { ExternalBookFragment } from "../generated/graphql";
import Import from "../import/Import";
import SearchExternalInput from "../import/SearchExternalInput";
import ShelfInput from "../shared/ShelfInput";
import SHELVES from "./BookShelves";
import BookIcon from "@material-ui/icons/Book";

const ExternalBookOption = ({
  title,
  author,
  imageUrl,
}: {
  title: string;
  author: string;
  imageUrl?: string | null;
}) => (
  <Grid container alignItems="center" spacing={2}>
    <Grid item xs={3}>
      {imageUrl ? <img src={imageUrl} alt={title} /> : <BookIcon />}
    </Grid>
    <Grid item container direction="column" spacing={2} xs={9}>
      <Grid item>{title}</Grid>
      <Grid item>
        <Typography variant="body2">{author}</Typography>
      </Grid>
    </Grid>
  </Grid>
);

const BookImport = () => (
  <Import>
    <SimpleForm>
      <SearchExternalInput<ExternalBookFragment>
        source="id"
        option={ExternalBookOption}
      />
      <ShelfInput shelves={SHELVES} />
    </SimpleForm>
  </Import>
);

export default BookImport;
