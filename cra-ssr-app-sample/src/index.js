import React from "react";
import ReactDOM from "react-dom";
import Hello from "./Hello";

ReactDOM.hydrate(
  <Hello name={window.eaemInitialData.name} />,
  document.getElementById("root")
);