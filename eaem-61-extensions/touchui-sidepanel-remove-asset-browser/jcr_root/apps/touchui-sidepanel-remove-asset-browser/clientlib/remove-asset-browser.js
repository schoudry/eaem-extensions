(function ($, $document) {
    var assetBrowserRemoved = false;

    $document.on('cq-layer-activated', removeAssetsBrowser);

    function removeAssetsBrowser(event){
        if(assetBrowserRemoved){
            return;
        }

        assetBrowserRemoved = true;

        var $sidePanelEdit = $("#SidePanel").find(".js-sidePanel-edit"),
            $tabs = $sidePanelEdit.data("tabs");

        //first tab is asset browser, remove it
        $tabs.removeItem(0);
    }
})(jQuery, jQuery(document));