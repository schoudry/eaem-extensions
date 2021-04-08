(function ($, $document) {
    "use strict";

    var ASSET_DETAILS_PAGE = "/assetdetails.html",
        initialized = false,
        RENDITION_ACTIVE = ".rendition-active",
        IMAGE_SMART_CROPS_URL = "/apps/eaem-cs-smart-crop-open/extensions/image-smart-crops/renditions.html",
        VIDEO_ENCODES_URL = "/apps/eaem-cs-smart-crop-open/extensions/video-encodes/renditions.html",
        BESIDE_ACTIVATOR = "cq-damadmin-admin-actions-download-activator",
        PROXY_SERLVET = "/bin/eaem/proxy?dr=",
        SMART_CROP_BUTTON_URL = "/apps/eaem-cs-smart-crop-open/clientlibs/show-smart-crops-url/content/smart-crop-url-but.html";

    if (!isAssetDetailsPage()) {
        return;
    }

    $document.on("foundation-contentloaded", addActionBarButtons);

    function addActionBarButtons(){
        if (initialized) {
            return;
        }

        initialized = true;

        $.ajax(SMART_CROP_BUTTON_URL).done(addSmartCropUrlButton);
    }

    function addSmartCropUrlButton(html) {
        var $eActivator = $("." + BESIDE_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        var $smartCropBUt = $(html).insertAfter($eActivator);

        $smartCropBUt.find("coral-button-label").css("padding-left", "7px");
        $smartCropBUt.click(showSmartCropUrl);
    }

    function showSmartCropUrl() {
        var $activeRendition = $(RENDITION_ACTIVE);

        if (_.isEmpty($activeRendition)) {
            showAlert("Rendition not selected...", "Error");
            return;
        }

        var title = $activeRendition.attr("title"),
            assetUrl = window.location.pathname.substring(ASSET_DETAILS_PAGE.length),
            assetMimeType = $(RENDITION_ACTIVE).attr("data-type"),
            url = IMAGE_SMART_CROPS_URL;

        if (assetMimeType && assetMimeType.toLowerCase().startsWith("video")) {
            url = VIDEO_ENCODES_URL;
        } else {
            title = $activeRendition.find(".name").last().html();
        }

        return $.ajax({url: url + assetUrl}).done(function (data) {
            var drUrl = data[title];

            if (!drUrl) {
                showAlert("Dynamic rendition url not available", "Error");
                return;
            }

            var fui = $(window).adaptTo("foundation-ui"),
                options = [{
                    id: "DOWNLOAD",
                    text: "Download"
                },
                {
                    id: "OPEN_TAB",
                    text: "Open"
                },
                {
                    id: "ok",
                    text: "Ok",
                    primary: true
                }];

            fui.prompt("Rendition Url", drUrl["s7Url"], "default", options, function (actionId) {
                if (actionId === "OPEN_TAB") {
                    window.open(drUrl["s7Url"], '_blank');
                }else if (actionId === "DOWNLOAD") {
                    var downloadUrl = PROXY_SERLVET + drUrl["s7Url"];
                    window.open(downloadUrl, '_blank');
                }
            });
        });
    }

    function showAlert(message, title, type, callback) {
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "Ok",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";
        type = type || "warning";

        fui.prompt(title, message, type, options, callback);
    }

    function isAssetDetailsPage() {
        return (window.location.pathname.indexOf(ASSET_DETAILS_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));