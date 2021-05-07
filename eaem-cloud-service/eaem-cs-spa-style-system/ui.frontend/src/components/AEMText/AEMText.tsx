import { MapTo } from "@adobe/cq-react-editable-components";
import React, { FC, useState, useEffect } from "react";
import {
  makeStyles, Theme, createStyles
} from "@material-ui/core";
import { createMuiTheme } from "@material-ui/core/styles";
import createBreakpoints from "@material-ui/core/styles/createBreakpoints";

type TextProps = {
  cqPath: string;
  text?: string;
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

enum BREAKPOINTS {
  XS = 0,
  SM = 768,
  MD = 992,
  LG = 1200,
  XL = 1600
}

const eaemTheme = createMuiTheme({
  breakpoints: createBreakpoints({
    values: {
      xs: BREAKPOINTS.XS,
      sm: BREAKPOINTS.SM,
      md: BREAKPOINTS.MD,
      lg: BREAKPOINTS.LG,
      xl: BREAKPOINTS.XL
    },
    get down() {
      return (key : number | string) => {
        let values = this.values as any;
        return `@media (max-width: ${values[key]- 0.05}px)`;
      }
    },
    get between() {
      return (a : number | string, b : number | string) => {
        let values = this.values as any;
        return `@media (min-width:${values[a]}px) and (max-width:${values[b] - 0.05}px)`;
      }
    }
  })
});

const useStyles = makeStyles(() => {
  return createStyles({
    root: {
      fontFamily: 'AdobeCaslonPro, Times, serif !important',
      '& h1': {
        [eaemTheme.breakpoints.down("xl")]: {
          fontSize: '34px',
        },
        [eaemTheme.breakpoints.down("lg")]: {
          fontSize: '30px',
        },
        [eaemTheme.breakpoints.down("md")]: {
          fontSize: '26px',
        }
      },
      '& h2': {
        [eaemTheme.breakpoints.down("xl")]: {
          fontSize: '28px',
        },
        [eaemTheme.breakpoints.down("lg")]: {
          fontSize: '25px',
        },
        [eaemTheme.breakpoints.down("md")]: {
          fontSize: '22px',
        }
      },
      '& h3': {
        [eaemTheme.breakpoints.down("xl")]: {
          fontSize: '22px',
        },
        [eaemTheme.breakpoints.down("lg")]: {
          fontSize: '20px',
        },
        [eaemTheme.breakpoints.down("md")]: {
          fontSize: '18px',
        }
      },
      '& p': {
        fontSize: '13px',
      },
      "& a:hover": {
        textDecoration: "none"
      }
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
        __html: props.text || ""
      }}
    />
  );
};

export default MapTo("eaem-cs-spa-style-system/components/text")(AEMText, AEMTextEditConfig);
