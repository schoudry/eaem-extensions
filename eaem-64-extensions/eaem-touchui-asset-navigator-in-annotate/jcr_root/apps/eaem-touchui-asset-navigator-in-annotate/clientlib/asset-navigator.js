(function ($, $document) {
    "use strict";

    var _ = window._,
        eaemNavigatorAdded = false,
        TITLE_BAR = ".granite-title",
        ANNOTATE_PAGE_URL = "/mnt/overlay/dam/gui/content/assets/annotate.html",
        ASSET_DETAILS_PAGE_URL = "/assetdetails.html",
        FOUNDATION_CONTENT_REL = ".foundation-content-path",
        NAVIGATION_EVENT = "asset-detail-navigation",
        NAVIGATOR_UI = "/apps/eaem-touchui-asset-navigator-in-annotate/ui/asset-navigator.html";

	$document.on("foundation-contentloaded", addAssetNavigation);

    function addAssetNavigation(){
        if(!isAnnotatePage() || !!eaemNavigatorAdded){
            return;
        }

        eaemNavigatorAdded = true;

        $.ajax(NAVIGATOR_UI + getAssetPath()).done(addNavigationUI);
    }

    function addNavigationUI(html){
        var $titleBar = $(TITLE_BAR);

        html = html.substring(html.indexOf("<div"));

        html = "<div class='assetdetails-title-container'>" + $titleBar.html() + html + "</div>";

        $titleBar.html(html);

        $document.trigger("foundation-contentloaded");

        $(FOUNDATION_CONTENT_REL).off(NAVIGATION_EVENT).on(NAVIGATION_EVENT, navigateTo);

        $document.on('keydown', handleHotKeyNavigation);
    }

    function handleHotKeyNavigation(event){
        var $mainImage = $("#asset-mainimage");

        if (event.keyCode == 37){
            navigateTo( { asset : getPathInAssetDetailsPage($mainImage.attr("prev"))} )
        }else if(event.keyCode == 39){
            navigateTo( { asset : getPathInAssetDetailsPage($mainImage.attr("next"))} )
        }
    }

    function getPathInAssetDetailsPage(path){
        if(_.isEmpty(path)){
            return;
        }

        return path.substring(path.indexOf(ASSET_DETAILS_PAGE_URL) + ASSET_DETAILS_PAGE_URL.length);
    }

    function navigateTo(data){
        if (_.isEmpty(data.asset)) {
            return;
        }

        window.location.href = Granite.HTTP.externalize(ANNOTATE_PAGE_URL + data.asset);
    }

    function isAnnotatePage() {
        return (window.location.pathname.indexOf(ANNOTATE_PAGE_URL) >= 0);
    }

    function getAssetPath() {
        var path = window.location.pathname;

        return (path.substring(path.indexOf(ANNOTATE_PAGE_URL) + ANNOTATE_PAGE_URL.length));
    }
})(jQuery, jQuery(document));
