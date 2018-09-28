(function ($, $document) {
    "use strict";

    var _ = window._,
        TITLE_BAR = ".granite-title",
        ANNOTATE_PAGE_URL = "/annotate.html",
        NAVIGATOR_UI = "/apps/eaem-touchui-asset-navigator-in-annotate/ui/asset-navigator.html";

	$document.on("foundation-contentloaded", addAssetNavigation);

    function addAssetNavigation(){
        if(!isAnnotatePage()){
            return;
        }

        $.ajax(NAVIGATOR_UI + getAssetPath()).done(addNavigationUI);
    }

    function addNavigationUI(html){
        var $titleBar = $(TITLE_BAR);

        html = html.substring(html.indexOf("<div"));

        html = "<div class='assetdetails-title-container'>" + $titleBar.html() + html + "</div>";

        $titleBar.html(html);
    }

    function isAnnotatePage() {
        return (window.location.pathname.indexOf(ANNOTATE_PAGE_URL) > 0);
    }

    function getAssetPath() {
        var path = window.location.pathname;

        return (path.substring(path.indexOf(ANNOTATE_PAGE_URL) + ANNOTATE_PAGE_URL.length));
    }

})(jQuery, jQuery(document));
