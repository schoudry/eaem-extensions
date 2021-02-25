(function ($, $document) {
    "use strict";

    var ASSET_DETAILS_PAGE = "/assetdetails.html",
        initialized = false,
        REPROCESS_ACTIVATOR = "dam-asset-reprocessassets-action-activator",
        BESIDE_ACTIVATOR = "cq-damadmin-admin-actions-download-activator",
        PROCESS_NEW_SMART_CROPS_ACT_URL = "/bin/eaem/update-smart-crops?path=",
        PROCESS_NEW_SMART_CROPS_BUT_URL = "/apps/eaem-cs-process-new-smart-crops/clientlibs/update-smart-crops/content/process-smart-crops-but.html";

    if (!isAssetDetailsPage()) {
        return;
    }

    $document.on("foundation-contentloaded", addActionBarButtons);

    function addActionBarButtons(){
        if (initialized) {
            return;
        }

        initialized = true;

        if(!getAssetMimeType().startsWith("image/")){
            return;
        }

        $.ajax(PROCESS_NEW_SMART_CROPS_BUT_URL).done(addProcessNewSmartCropsButton);
    }

    function getAssetMimeType(){
        return $("#image-preview").data("assetMimetype") || "";
    }

    function addProcessNewSmartCropsButton(html) {
        var $eActivator = $("." + REPROCESS_ACTIVATOR);

        if ($eActivator.length == 0) {
            $eActivator = $("." + BESIDE_ACTIVATOR);
        }

        var $smartCropProcessBut = $(html).insertAfter($eActivator);

        $smartCropProcessBut.find("coral-button-label").css("padding-left", "7px");
        $smartCropProcessBut.click(updateSmartCrops);
    }

    function updateSmartCrops() {
        var assetUrl = window.location.pathname.substring(ASSET_DETAILS_PAGE.length);

        $.ajax({url: PROCESS_NEW_SMART_CROPS_ACT_URL + assetUrl});

        showAlert("Processing new smart crops...", "Smart Crop", "Default");
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