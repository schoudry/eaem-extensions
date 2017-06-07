(function ($, $document) {
    "use strict";

    //id assetfinder-filter and class .assetfilter.type are defined in
    ///libs/wcm/core/content/editor/jcr:content/sidepanels/edit/items/assetsTab/items/filterPanel/items/views/items/search/items/searchpanel
    var PAGE_CONTROLLER = "Pages",
        ASSET_FINDER_FILTER = "#assetfinder-filter",
        ASSET_FILTER_SELECTOR = ".assetfilter.type";

    $document.on("cq-content-frame-loaded", makePageOptionDefault);

    function makePageOptionDefault(){
        var $assetFinderFilter = $(ASSET_FINDER_FILTER),
            $assetFinderType = $assetFinderFilter.find(ASSET_FILTER_SELECTOR),
            cuiSelect = $assetFinderType.data("select");

        cuiSelect.setValue(PAGE_CONTROLLER);

        $assetFinderType.trigger($.Event('selected', {
            selected: PAGE_CONTROLLER
        }));
    }
})(jQuery, jQuery(document));