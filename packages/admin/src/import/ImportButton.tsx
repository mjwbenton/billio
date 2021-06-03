import { Button, useResourceContext } from "react-admin";
import { Link } from "react-router-dom";
import Icon from "@material-ui/icons/Input";
import { Fab, useMediaQuery, Theme } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

export default function ImportButton(props: any) {
  const isSmall = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const resource = useResourceContext();
  const location = {
    pathname: `/${resource}/import`,
    state: { _scrollToTop: true },
  };
  const classes = useStyles();

  if (isSmall) {
    return (
      <Fab
        component={Link}
        className={classes.floating}
        color="primary"
        to={location}
        aria-label="Import"
      >
        <Icon />
      </Fab>
    );
  }

  return (
    <Button component={Link} to={location} label="Import" {...props}>
      <Icon />
    </Button>
  );
}

const useStyles = makeStyles(
  () => ({
    floating: {
      position: "fixed",
      margin: 0,
      top: "auto",
      right: 20,
      bottom: 150,
      left: "auto",
      zIndex: 1000,
    },
  }),
  { name: "ImportButton" }
);
