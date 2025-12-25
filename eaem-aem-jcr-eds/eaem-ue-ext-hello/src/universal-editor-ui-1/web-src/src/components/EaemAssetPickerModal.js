import React, { useState, useEffect } from "react";
import { attach } from "@adobe/uix-guest";
import { Provider, defaultTheme, Content } from "@adobe/react-spectrum";
import { extensionId } from "./Constants";

export default function EaemAssetPickerModal() {
  const [token, setToken] = useState("");
  const [colorScheme, setColorScheme] = useState("dark");
  const [guestConnection, setGuestConnection] = useState();
  const [authorDomain, setAuthorDomain] = useState("");
  const [assetSelectorProps, setAssetSelectorProps] = useState({});
  const [AssetSelector, setAssetSelector] = useState(null);

  const handleSelection = (assets) => {
    console.log("Selected assets:", assets);
  };

  const init = async () => {
    // Dynamically import the asset selector module at runtime
    // Using dynamic string to prevent Parcel from resolving at build time
    const moduleName = "@assets" + "/" + "selectors";
    const assetSelectorModule = await import(/* @vite-ignore */ moduleName);
    setAssetSelector(() => assetSelectorModule.AssetSelectorWithAuthFlow);

    const connection = await attach({ id: extensionId });
    setGuestConnection(connection);

    const editorState = await connection.host.editorState.get();
    const location = new URL(editorState.location);
    const host = `${location.protocol}//${location.host}`;

    const imsToken = connection.sharedContext.get("token");
    setToken(imsToken);

    setAuthorDomain(host);

    const selectorProps = {
        repositoryId: "author-p10961-e880305.adobeaemcloud.com",
        apiKey: "asset_search_service",
        imsOrg: "2FBC7B975CFE21C40A495FBB@AdobeOrg",
        imsToken: imsToken,
        handleSelection,
        hideTreeNav: true,
    };

    console.log('selectorProps------------', selectorProps);

    setAssetSelectorProps(selectorProps);
  };

  useEffect(() => {
    init().catch((e) => console.log("Error loading asset picker modal--->", e));
  }, []);

  if (!AssetSelector) {
    return (
      <Provider theme={defaultTheme} colorScheme={colorScheme}>
        <Content>Loading Asset Selector...</Content>
      </Provider>
    );
  }

  return (
    <Provider theme={defaultTheme} colorScheme={colorScheme}>
      <Content>
        <AssetSelector {...assetSelectorProps} />
      </Content>
    </Provider>
  );
}
