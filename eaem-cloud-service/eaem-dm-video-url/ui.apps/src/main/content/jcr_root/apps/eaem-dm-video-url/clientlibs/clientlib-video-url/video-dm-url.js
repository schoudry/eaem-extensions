(function ($, $document) {
    "use strict";

    var ASSET_DETAILS_PAGE = "/assetdetails.html",
        initialized = false,
        BESIDE_ACTIVATOR = "cq-damadmin-admin-actions-download-activator",
        DATA_ENCODE_LINK = "data-video-encode-link",
        VIDEO_ENCODES_URL  = "/apps/eaem-dm-video-url/components/video-encodes/renditions.html",
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
        $videoUrlBUt.click(showVideoUrl);
    }

    function getCopyOpenLinks(link){
        return  "<div style='text-align: right'>" +
                        "<span style='margin-right: 10px; cursor: pointer' " + DATA_ENCODE_LINK + "='" + link + "'>Copy</span>" +
                        "<a style='text-decoration: none' href='" + link+ "' target='_blank'>Open</a>" +
                    "</div>";
    }

    function showVideoUrl(){
        const assetUrl = window.location.pathname.substring(ASSET_DETAILS_PAGE.length);

        jQuery.ajax({url: VIDEO_ENCODES_URL + assetUrl}).done(handler);

        function handler(data){
            let rendsText = "";

            jQuery.each(data,(index, rend) => {
                rendsText =  rendsText + "<div style='padding: 5px'><span>" + rend["s7Url"] + "</span>"
                                + getCopyOpenLinks(rend["s7Url"]) + "</div>";
            })

            const fui = $(window).adaptTo("foundation-ui"),
                    options = [
                    {
                        id: "ok",
                        text: "Close",
                        primary: true
                    }];

            fui.prompt("Renditions",rendsText, "default", options);

            $("[" + DATA_ENCODE_LINK + "]").click((event) => {
                navigator.clipboard.writeText(event.currentTarget.dataset.videoEncodeLink);
            })
        }
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