import { MapTo } from "@adobe/aem-react-editable-components";
import React, { FC, useState, useEffect } from "react";

const StepsEditConfig = {
    emptyLabel: "Steps - Experience AEM",

    isEmpty: function (props: any) {
        return !props || !props["jcr:title"];
    }
};

const AEMSteps: FC = props => {
    return (
      <div>
           This is sreekanth 
      </div>
    );
  };
  
  export default MapTo("eaem-cs-spa-read-post-data/components/text")(AEMSteps, StepsEditConfig);
  