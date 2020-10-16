import { MapTo } from "@adobe/cq-react-editable-components";
import React, { FC, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  IconButton,
  Typography,
  createStyles,
  makeStyles,
  Theme,
  Portal,
  Collapse
} from "@material-ui/core";
import { EAEMCloseIcon } from "icons";
import CSS from "csstype";

type AlertProps = {
  showAlert: string;
  text: string;
  linkURL: string;
};

const AlertEditConfig = {
  emptyLabel: "Alert (Eyebrow) - Shows banner at the top of page",

  isEmpty: function (props: any) {
    return !props || !props.text || props.text.trim().length < 1;
  }
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    closeIcon: {
      fontSize: 12,
      color: "white",
      [theme.breakpoints.up("sm")]: {
        fontSize: 16
      }
    },
    container: {
      alignItems: "center",
      background: "black",
      display: "flex"
    },
    content: {
      color: "white",
      paddingTop: "15px",
      paddingBottom: "15px",
      flex: "1 1",
      fontFamily: '"CaslonRH-Thin", minion-pro, Times, serif',
      fontSize: 16,
      textAlign: "center",
      "& a": { color: "white", textDecoration: "none" }
    }
  })
);

const EAEMAlert: FC<AlertProps> = props => {
  const classes = useStyles();

  const [open, setOpen] = useState(true);
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRoot(document.getElementById("eaem-alert-banner"));
  }, [root]);

  const handleClose = () => {
    setOpen(false);
  };

  if (!props.text || props.showAlert != "true") {
    return null;
  }

  let text = props.text.trim();

  if (text.startsWith("<p>") && text.endsWith("</p>")) {
    text = text.substring(3, text.lastIndexOf("</p>"));
  }

  return (
    <Portal container={root}>
      <Collapse in={open}>
        <Typography className={classes.container} component={"div"}>
          <div
            className={classes.content}
            dangerouslySetInnerHTML={{ __html: text }}
          />
          <IconButton onClick={handleClose}>
            <EAEMCloseIcon className={classes.closeIcon} />
          </IconButton>
        </Typography>
      </Collapse>
    </Portal>
  );
};

export default MapTo("eaem-sites-spa-how-to-react/components/alert")(EAEMAlert, AlertEditConfig);
