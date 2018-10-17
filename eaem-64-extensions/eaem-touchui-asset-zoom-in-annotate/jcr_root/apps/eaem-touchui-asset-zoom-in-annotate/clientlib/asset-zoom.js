(function ($, $document) {
    "use strict";

    var _ = window._,
        eaemZoomAdded = false,
        ZOOM_CANVAS_ID = "dam-aasetdetail-zoom-canvas",
        ANNOTATION_CONTAINER = "asset-annotation",
        ASSET_DETAIL_CONTAINER = "asset-detail",
        ASSET_MAIN_IMAGE_ID = "asset-mainimage",
        ANNOTATION_CANVAS = ".asset-annotation canvas",
        ANNOTATE_PAGE_URL = "/mnt/overlay/dam/gui/content/assets/annotate.html",
        ZOOM_UI = "/apps/eaem-touchui-asset-zoom-in-annotate/ui/asset-zoom.html";

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

    function showZoomCanvas(){
        $("#" + ZOOM_CANVAS_ID).show();
    }

    function showMainImage(){
        $("#" + ASSET_MAIN_IMAGE_ID).css("display", "inline");

        $("#" + ZOOM_CANVAS_ID).hide();

        $("." + ANNOTATION_CONTAINER).find("canvas").not("#" + ZOOM_CANVAS_ID).show();
    }

    function reAddImageToCanvas(){
        var $mainImage = $("#" + ASSET_MAIN_IMAGE_ID),
            imageHtml = $mainImage[0].outerHTML;

        $mainImage.css("display", "none");

        $("." + ANNOTATION_CONTAINER).find("canvas").not("#" + ZOOM_CANVAS_ID).hide();

        $("#" + ZOOM_CANVAS_ID).show();

        $document.off(ANNOTATION_CANVAS);

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

    function addZoomUI(html){
        html = html.substring(html.indexOf("<div"));

        var $zoomContainer = $(html).appendTo($("betty-titlebar-primary"));

        $zoomContainer.find("coral-actionbar").css("background-color", "#f0f0f0")
            .width("200px").css("height" , "2.5rem").css("padding", "0");

        $("." + ANNOTATION_CONTAINER).addClass(ASSET_DETAIL_CONTAINER);

        $document.on("click", ".dam-asset-zoomIn", reAddImageToCanvas);

        $(document).on("click", ".dam-asset-zoomOut", showZoomCanvas);

        $document.on("click", ".dam-asset-reset", showMainImage);
    }

    function addAssetZoom(){
        if(!isAnnotatePage() || !!eaemZoomAdded){
            return;
        }

        eaemZoomAdded = true;

        $.ajax(ZOOM_UI + getAssetPath()).done(addZoomUI);
    }

    overrideAnnotate();

    $document.on("foundation-contentloaded", addAssetZoom);
}(jQuery, jQuery(document)));
