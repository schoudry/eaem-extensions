(function ($, $document) {
    "use strict";

    var _ = window._,
        eaemZoomAdded = false,
        ZOOM_CANVAS_ID = "dam-aasetdetail-zoom-canvas",
        ASSET_MAIN_IMAGE_ID = "asset-mainimage",
        ANNOTATE_PAGE_URL = "/mnt/overlay/dam/gui/content/assets/annotate.html",
        ZOOM_UI = "/apps/eaem-touchui-asset-zoom-in-annotate/ui/asset-zoom.html";

	$document.on("foundation-contentloaded", addAssetZoom);

    overrideAnnotate();

    function addAssetZoom(){
        if(!isAnnotatePage() || !!eaemZoomAdded){
            return;
        }

        eaemZoomAdded = true;

        $.ajax(ZOOM_UI + getAssetPath()).done(addZoomUI);
    }

    function addZoomUI(html){
        html = html.substring(html.indexOf("<div"));

        var $zoomContainer = $(html).appendTo($("betty-titlebar-primary"));

        $zoomContainer.find("coral-actionbar").css("background-color", "#f0f0f0")
                        .width("200px").css("height" , "2.5rem").css("padding", "0");

        $document.on("click", ".dam-asset-zoomIn", reAddImageToCanvas);

        $document.on("click", ".dam-asset-reset", showMainImage);
    }

    function showMainImage(){
        $("#" + ASSET_MAIN_IMAGE_ID).css("display", "inline");
    }

    function reAddImageToCanvas(){
        var $mainImage = $("#" + ASSET_MAIN_IMAGE_ID),
            imageHtml = $mainImage[0].outerHTML;

        $mainImage.css("display", "none");

        if(!_.isEmpty($(ZOOM_CANVAS_ID))){
            return;
        }

        $document.bind('DOMNodeInserted', function(e) {
            var element = e.target;

            if(element.id !== ZOOM_CANVAS_ID){
                return;
            }

            $(imageHtml).insertAfter($(element)).css("display", "none");
        });
    }

    function overrideAnnotate(){
        var origFn = $.Annotation.prototype._endDraw;

        $.Annotation.prototype._endDraw = function(e) {
            origFn.call(this, e);

            $("#" + ASSET_MAIN_IMAGE_ID).trigger("annotateEnd", [ e.data.self ]);
        };
    }

    function isAnnotatePage() {
        return (window.location.pathname.indexOf(ANNOTATE_PAGE_URL) >= 0);
    }

    function getAssetPath() {
        var path = window.location.pathname;

        return (path.substring(path.indexOf(ANNOTATE_PAGE_URL) + ANNOTATE_PAGE_URL.length));
    }
})(jQuery, jQuery(document));
