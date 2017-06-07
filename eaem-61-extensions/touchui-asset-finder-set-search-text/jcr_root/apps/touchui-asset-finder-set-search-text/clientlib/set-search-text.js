(function ($, $document) {
    "use strict";

    //id "assetfinder-filter" and "assetsearch" are defined in
    ///libs/wcm/core/content/editor/jcr:content/sidepanels/edit/items/assetsTab/items/filterPanel/items/views/items/search/items/searchpanel
    var ASSET_FINDER_FILTER = "#assetfinder-filter",
        KEYWORD_SELECTOR = "#assetsearch",
        ASSET_FINDER_CONTAINER = ".assetfinder-content-container",
        PROFILE_SEARCH_KEYWORD = "searchKeyword";

    $document.on('cq-layer-activated', getDefaultKeyword);

    function getDefaultKeyword(ev){
        if ( ev.layer !== 'Edit' ) {
            return;
        }

        //Granite.author.ContentFrame.contentWindow.CQ.shared.User.getUserPropsUrl()
        $.ajax("/libs/cq/security/userinfo.json").done(function(data){
            $.ajax(data.home + ".1.json").done(searchWithKeyword);
        });
    }

    function searchWithKeyword(data){
        if(!data || !data.profile || !data.profile[PROFILE_SEARCH_KEYWORD]){
            return;
        }

        var $assetFinderFilter = $(ASSET_FINDER_FILTER),
            $assetFinderContainer = $(ASSET_FINDER_CONTAINER),
            $assetFinderKeyword = $assetFinderFilter.find(KEYWORD_SELECTOR);

        $assetFinderKeyword.val(data.profile[PROFILE_SEARCH_KEYWORD]);

        $assetFinderContainer.trigger({
            type: "loadAssets",
            append: false
        })
    }
})(jQuery, jQuery(document));