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
  SvgIcon,
  SvgIconProps,
  Collapse
} from "@material-ui/core";
import CSS from "csstype";
import classNames from "classnames";

const iconStyles = makeStyles(() =>
  createStyles({
    root: {
      fontSize: 20
    }
  })
);

const EAEMCloseIcon: FC<SvgIconProps> = props => {
  const classes = iconStyles();

  return (
    <SvgIcon
      viewBox="0 0 20 20"
      {...props}
      className={classNames(classes.root, props.className)}
    >
      <title>Combined Shape</title>
      <desc>Created with Sketch.</desc>
      <g
        id="Symbols"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Grommet/X-Close" transform="translate(-15.000000, -15.000000)">
          <rect id="Rectangle" x="0" y="0" width="50" height="50"></rect>
          <path
            d="M34.3548387,15 L35,15.6451613 L25.645,24.999 L35,34.3548387 L34.3548387,35 L25,25.645 L15.6451613,35 L15,34.3548387 L24.354,25 L15,15.6451613 L15.6451613,15 L25,24.354 L34.3548387,15 Z"
            id="Combined-Shape"
            fill="currentColor"
          ></path>
        </g>
      </g>
    </SvgIcon>
  );
};

type AlertProps = {
  showAlert: string;
  text: string;
  linkURL: string;
};

const AlertEditConfig = {
  emptyLabel: "Alert - Shows banner at the top of page",

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
      fontFamily: 'Times, serif',
      fontSize: 16,
      textAlign: "center"
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
