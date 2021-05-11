import { MapTo } from "@adobe/aem-react-editable-components";
import React, { FC, useState, useEffect } from "react";
import {Link} from "react-router-dom";
import "./StepsStyles.css";

type StepsProps = {
    [x: string]: any
};

declare global {
    interface Window {
        eaemInitialData: any;
    }
  }

const StepsEditConfig = {
    emptyLabel: "Steps - Experience AEM",

    isEmpty: function (props: any) {
        return !props || !props["jcr:title"];
    }
};

const AEMSteps: FC<StepsProps> = props => {
    const eaemInitialData = window.eaemInitialData;

    return (
        <div>
            <h1 style={{ textAlign: "center", color: "maroon" }}>
                {props["jcr:title"]}
            </h1>

            {
                props.showName &&
                <div className='eaem-info'>
                    <span>Enter name</span>
                    <input name='eaemName' value={eaemInitialData.eaemName}></input>
                </div>
            }
            {
                props.showEmail &&
                <div className='eaem-info'>
                    <span>Enter email</span>
                    <input name='eaemEmail' value={eaemInitialData.eaemEmail}></input>
                </div>
            }
            {
                props.showSSN &&
                <div className='eaem-info'>
                    <span>Enter SSN</span>
                    <input name='eaemSSN' value={eaemInitialData.eaemSSN}></input>
                </div>
            }
            {
                props.showCompany &&
                <div className='eaem-info'>
                    <span>Enter company</span>
                    <input name='eaemCompany' value={eaemInitialData.eaemCompany}></input>
                </div>
            }

            <div className='eaem-info'>
                {
                    props.previousLink &&                  
                    <Link to={props.previousLink}>
                        <button type="button">Previous</button>
                    </Link>
                }
                {
                    props.nextLink &&                  
                    <Link to={props.nextLink}>
                        <button type="button">Next</button>
                    </Link>
                }
            </div>
        </div>
    );
};

export default MapTo("eaem-cs-spa-read-post-data/components/steps")(AEMSteps, StepsEditConfig);
