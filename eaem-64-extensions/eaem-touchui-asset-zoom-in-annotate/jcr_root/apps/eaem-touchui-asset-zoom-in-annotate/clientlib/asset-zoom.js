(function ($, $document) {
    "use strict";

    var _ = window._,
        eaemZoomAdded = false,
        TITLE_BAR = ".granite-title",
        ANNOTATE_PAGE_URL = "/mnt/overlay/dam/gui/content/assets/annotate.html",
        ZOOM_UI = "/apps/eaem-touchui-asset-zoom-in-annotate/ui/asset-zoom.html";

	$document.on("foundation-contentloaded", addAssetZoom);

    function addAssetZoom(){
        if(!isAnnotatePage() || !!eaemZoomAdded){
            return;
        }

        eaemZoomAdded = true;

        $.ajax(ZOOM_UI + getAssetPath()).done(addZoomUI);
    }

    function addZoomUI(html){
        var $titleBar = $(TITLE_BAR);

        var $zoomContainer = $(html).appendTo($("betty-titlebar-primary"));

        $zoomContainer.find("coral-actionbar").css("background-color", "#f0f0f0")
                        .width("165px").css("height" , "2.5rem").css("padding", "0");

        $document.trigger("foundation-contentloaded");
    }

    function isAnnotatePage() {
        return (window.location.pathname.indexOf(ANNOTATE_PAGE_URL) >= 0);
    }

    function getAssetPath() {
        var path = window.location.pathname;

        return (path.substring(path.indexOf(ANNOTATE_PAGE_URL) + ANNOTATE_PAGE_URL.length));
    }
})(jQuery, jQuery(document));
