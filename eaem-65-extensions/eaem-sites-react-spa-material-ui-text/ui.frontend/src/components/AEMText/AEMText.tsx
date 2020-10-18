import { MapTo } from "@adobe/cq-react-editable-components";
import React, { FC, useState, useEffect } from "react";

type TextProps = {
  cqPath: string;
  text: string;
};

const AEMTextEditConfig = {
  emptyLabel: "Text - RH",

  isEmpty: function (props: any) {
    return !props || !props.text || props.text.trim().length < 1;
  }
};

function extractModelId(path: string) {
  return path && path.replace(/\/|:/g, "_");
}

const AEMText: FC<TextProps> = props => {

  return (
    <div
      id={extractModelId(props.cqPath)}
      data-rte-editelement
      dangerouslySetInnerHTML={{
        __html: props.text
      }}
    />
  );
};

export default MapTo("rh/components/content/text")(AEMText, AEMTextEditConfig);
