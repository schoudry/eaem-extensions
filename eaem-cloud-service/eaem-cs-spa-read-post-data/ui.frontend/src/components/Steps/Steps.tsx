import { MapTo } from "@adobe/aem-react-editable-components";
import React, { FC, useState, useEffect } from "react";
import "./StepsStyles.css";

type StepsProps = {
    [x: string]: any
};

const StepsEditConfig = {
    emptyLabel: "Steps - Experience AEM",

    isEmpty: function (props: any) {
        return !props || !props["jcr:title"];
    }
};

const AEMSteps: FC<StepsProps> = props => {
    return (
        <div>
            <h1 style={{ textAlign: "center", color: "maroon" }}>
                {props["jcr:title"]}
            </h1>

            {
                props.showName &&
                <div className='eaem-info'>
                    <span>Enter name</span>
                    <input name='eaemName'></input>
                </div>
            }
            {
                props.showEmail &&
                <div className='eaem-info'>
                    <span>Enter email</span>
                    <input name='eaemEmail'></input>
                </div>
            }
            {
                props.showSSN &&
                <div className='eaem-info'>
                    <span>Enter SSN</span>
                    <input name='eaemSSN'></input>
                </div>
            }
            {
                props.showCompany &&
                <div className='eaem-info'>
                    <span>Enter company</span>
                    <input name='eaemCompany'></input>
                </div>
            }
        </div>
    );
};

export default MapTo("eaem-cs-spa-read-post-data/components/steps")(AEMSteps, StepsEditConfig);
