import { Button, useResourceContext } from "react-admin";
import { Link } from "react-router-dom";
import AddIcon from "@material-ui/icons/Add";

export default function ImportButton() {
  const resource = useResourceContext();
  const location = {
    pathname: `/${resource}/import`,
    state: { _scrollToTop: true },
  };

  return (
    <Button component={Link} to={location} label="Import">
      <AddIcon />
    </Button>
  );
}
