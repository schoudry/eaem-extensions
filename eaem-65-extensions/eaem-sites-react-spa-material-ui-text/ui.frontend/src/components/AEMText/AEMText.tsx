import { MapTo } from "@adobe/cq-react-editable-components";
import React, { FC, useState, useEffect } from "react";
import {
  makeStyles,
} from "@material-ui/core";


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

const useStyles = makeStyles({
  root: {
    '& h1': {
      fontSize: '26px'
    }
  },
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
