import React from "react";
import ErrorBoundary from "react-error-boundary";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import ExtensionRegistration from "./ExtensionRegistration";
import HtmlContainerField from "./HtmlContainerField";
import HtmlContainerModalEditor from "./HtmlContainerModalEditor";

function App() {
  return (
    <Router>
      <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
        <Routes>
          <Route index element={<ExtensionRegistration />} />
          <Route exact path="index.html" element={<ExtensionRegistration />} />
          <Route exact path="eaem-html-container" element={<HtmlContainerField />} />
          <Route exact path="eaem-html-container-editor" element={<HtmlContainerModalEditor />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  )

  function onError(e, componentStack) {}

  function fallbackComponent({ componentStack, error }) {
    return (
      <React.Fragment>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>
          Phly, phly... Something went wrong :(
        </h1>
        <pre>{componentStack + "\n" + error.message}</pre>
      </React.Fragment>
    )
  }
}

export default App
