import { MapTo } from "@adobe/cq-react-editable-components";
import React, { FC, useState, useEffect } from "react";
import {
  makeStyles, Theme, createStyles
} from "@material-ui/core";
import { createMuiTheme } from "@material-ui/core/styles";
import createBreakpoints from "@material-ui/core/styles/createBreakpoints";

type TextProps = {
  cqPath: string;
  text: string;
};

const AEMTextEditConfig = {
  emptyLabel: "Text - Experience AEM",

  isEmpty: function (props: any) {
    return !props || !props.text || props.text.trim().length < 1;
  }
};

function extractModelId(path: string) {
  return path && path.replace(/\/|:/g, "_");
}

const useStyles = makeStyles(() => {
  return createStyles({
    root: {
      fontFamily: 'AdobeCaslonPro, Times, serif !important',
    }
  })
});

const AEMText: FC<TextProps> = props => {
  const classes = useStyles();

  return (
    <div
      className={classes.root}
      id={extractModelId(props.cqPath)}
      data-rte-editelement
      dangerouslySetInnerHTML={{
        __html: props.text
      }}
    />
  );
};

export default MapTo("eaem-sites-spa-how-to-react/components/text")(AEMText, AEMTextEditConfig);
