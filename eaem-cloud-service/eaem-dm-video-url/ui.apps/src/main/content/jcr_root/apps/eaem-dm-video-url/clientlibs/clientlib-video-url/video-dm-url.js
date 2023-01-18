(function ($, $document) {
    "use strict";

    var ASSET_DETAILS_PAGE = "/assetdetails.html",
        initialized = false,
        BESIDE_ACTIVATOR = "cq-damadmin-admin-actions-download-activator",
        VIDEO_BUTTON_URL = "/apps/eaem-dm-video-url/clientlibs/content/show-video-url-but.html";

    if (!isAssetDetailsPage()) {
        return;
    }

    $document.on("foundation-contentloaded", addActionBarButtons);

    function addActionBarButtons(){
        if (initialized) {
            return;
        }

        initialized = true;

        if(!window.s7viewers.VideoViewer){
            return;
        }

        $.ajax(VIDEO_BUTTON_URL).done(addVideoUrlButton);
    }

    function addVideoUrlButton(html) {
        const $eActivator = $("." + BESIDE_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        const $videoUrlBUt = $(html).insertAfter($eActivator);

        $videoUrlBUt.find("coral-button-label").css("padding-left", "7px");
        $videoUrlBUt.click(showVidoeUrl);
    }

    function showVidoeUrl(){

    }

    function showAlert(message, title, type, callback) {
        const fui = $(window).adaptTo("foundation-ui"),
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