(function(document, $) {
    $(document).ready(function(){
        var $path = $("[data-type='path']");

        if($path.length == 0){
            return;
        }

        //defined in /libs/dam/gui/content/assets/jcr:content/body/content/aside/items/search
        var ASSET_RAIL_SEARCH = "#aem-assets-rail-search";
        var $button = $path.find("[role='button']");
        var $checkbox = $path.find("input[type='checkbox']");

        var doSearch = function(){
            $button.click();
            $checkbox.click();
        };

        if($.cookie("endor.innerrail.current") == ASSET_RAIL_SEARCH){
            doSearch();
        }

        $(document).on('click', '.js-endor-innerrail-toggle', function(e) {
            doSearch();
        });
    });
})(document, Granite.$);