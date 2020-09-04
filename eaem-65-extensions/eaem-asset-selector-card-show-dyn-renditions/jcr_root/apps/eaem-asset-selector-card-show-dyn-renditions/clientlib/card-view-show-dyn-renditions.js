(function($, $document){
    var CORAL_COLUMNVIEW_PREVIEW = "coral-columnview-preview",
        THUMB_PATH = "/_jcr_content/renditions/cq5dam.thumbnail.48.48.png",
        EAEM_DATA_ASSET_PATH = "data-eaem-asset-path",
        EAEM_RENDITION_DATA = "data-eaem-rendition",
        EAEM_RENDITION_FIELD = "eaem-rendition-name",
        EAEM_CARD_DYN_RENDS_BLOCK = ".eaem-card-dyn-rends-block",
        EAEM_CARD_ASSETS_BLOCK = ".eaem-card-assets-block",
        SEARCH_RESULTS_CONTAINER = "#granite-pickerdialog-search-result-content",
        EAEM_DONE_ACTION = "EAEM_DONE",
        FUI = $(window).adaptTo("foundation-ui"),
        BROWSE_CARDS_CONTAINER = ".foundation-layout-panel-content",
        GET_SMART_CROPS_URL = "/apps/eaem-asset-selector-card-show-dyn-renditions/smart-crop-renditions/renditions.html",
        GET_VIDEO_RENDS_URL = "/apps/eaem-asset-selector-card-show-dyn-renditions/video-dyn-renditions/renditions.html";

    $document.on("foundation-contentloaded", registerSelectListener);

    $document.on("foundation-selections-change", function(){
        if(!(isBrowseCardsView() || isSearchCardsView())){
            return;
        }

        FUI.wait();

        _.defer(handleCardViewSelections);
    });

    function registerSelectListener(){
        $document.off('click', '.asset-picker-done');

        $(document).on("click", ".asset-picker-done", function(e) {
            e.stopImmediatePropagation();
            exportAssetInfo(e);
        });
    }

    function exportAssetInfo(e){
        var message = {
            config: {
                action: EAEM_DONE_ACTION
            },
            data: []
        };

        var $selItem, selected;

        if(isSearchCardsView() || isBrowseCardsView()){
            $selItem = $(".eaem-card-dyn-rends-block coral-masonry-item.is-selected");

            if(_.isEmpty($selItem)){
                $selItem = $(".eaem-card-assets-block coral-masonry-item.is-selected");
            }
        }else{
            $selItem = $("coral-columnview-item.is-selected");
        }

        var renditionData = $selItem.attr(EAEM_RENDITION_DATA);

        if(!renditionData){
            let path = $selItem.attr("data-foundation-collection-item-id"),
                name = path.substring(path.lastIndexOf("/") + 1),
                type = $selItem.find("coral-card-context").html();

            selected = {
                type: type ? type.trim() : "",
                image: path,
                name: name,
                aemPath: path,
                url : ""
            }
        }else{
            selected = JSON.parse(renditionData);
            selected["aemPath"] = $selItem.data("eaemAssetPath");
        }

        message.data.push(selected);

        console.log(message);

        getParent().postMessage(JSON.stringify(message), $(".assetselector-content-container").data("targetorigin"));

        if(isBrowseCardsView()){
            $("coral-masonry-item.is-selected").removeClass("is-selected");
        }
    }

    function handleCardViewSelections(){
        var $selItem = $("coral-masonry-item.is-selected");

        if(_.isEmpty($selItem)){
            hideDynRenditionsContainer();
            return;
        }

        $(".asset-picker-done")[0].disabled = false;

        var $dynRendsContainer;

        if(isSearchCardsView()){
            $dynRendsContainer = $(SEARCH_RESULTS_CONTAINER).find(EAEM_CARD_DYN_RENDS_BLOCK);
        }else if(isBrowseCardsView()){
            $dynRendsContainer = $(BROWSE_CARDS_CONTAINER).find(EAEM_CARD_DYN_RENDS_BLOCK);
        }

        if(_.isEmpty($dynRendsContainer)){
            $dynRendsContainer = createCardRenditionsContainer();
        }else{
            if(isBrowseCardsView()){
                showDynRenditionsContainer();
            }
        }

        var assetType = $selItem.find("coral-card-context").html(),
            rendsUrl = isImage(assetType) ? GET_SMART_CROPS_URL : GET_VIDEO_RENDS_URL,
            assetPath = $selItem.attr("data-granite-collection-item-id");

        if(!assetPath){
            FUI.clearWait();
            hideDynRenditionsContainer();
            return;
        }

        rendsUrl = rendsUrl + assetPath;

        $.ajax( { url: rendsUrl, async: false } ).done(function(data){
            var html = '<coral-masonry>';

            _.each(data, function(dynRendition, dynName){
                html = html + getCardDynamicRenditionHtml(dynRendition, assetPath);
            });

            html = html + '</coral-masonry>';

            $dynRendsContainer.html(html);

            _.defer(handCardDynRendSelection);

            FUI.clearWait();
        });
    }

    function getCardDynamicRenditionHtml(dynRendition, assetPath) {
        return  '<coral-masonry-item data-foundation-collection-item-id="' + dynRendition.image + '" ' + EAEM_DATA_ASSET_PATH + '="' + assetPath
                        + '" ' + EAEM_RENDITION_DATA + '="' + JSON.stringify(dynRendition).replace(/\"/g, "&quot;") + '">' +
                    '<coral-card>' +
                        '<coral-card-asset>' +
                            '<img src="' + dynRendition.image + '">' +
                        '</coral-card-asset>' +
                        '<coral-card-content>' +
                            '<coral-card-context>Dynamic Rendition</coral-card-context>' +
                            '<coral-card-title>' + dynRendition.name + '</coral-card-title>' +
                        '</coral-card-content>' +
                    '</coral-card>' +
                '</coral-masonry-item>' ;
    }

    function showDynRenditionsContainer(){
        $(EAEM_CARD_DYN_RENDS_BLOCK).show();

        $(EAEM_CARD_ASSETS_BLOCK).css("width", "85%");
    }

    function hideDynRenditionsContainer(){
        FUI.clearWait();

        $(EAEM_CARD_DYN_RENDS_BLOCK).hide();

        $(EAEM_CARD_ASSETS_BLOCK).css("width", "100%");
    }

    function handCardDynRendSelection(){
        var $dynRends = $(".eaem-card-dyn-rends-block").find("coral-masonry-item");

        $dynRends.click(function(){
            var $dynRend = $(this);

            $dynRends.removeClass("is-selected");

            $dynRend.addClass("is-selected");
        })
    }

    function createCardRenditionsContainer(){
        var $container = isSearchCardsView() ? $(SEARCH_RESULTS_CONTAINER) : $(BROWSE_CARDS_CONTAINER);

        $container.wrapInner("<div style='display:block'><div class='eaem-card-assets-block'></div></div>");

        return $("<div class='eaem-card-dyn-rends-block'></div>").appendTo($container.children("div"));
    }

    function isBrowseCardsView(){
        return ( ($(".foundation-layout-panel-content coral-masonry").length > 0)
        && !($(".foundation-layout-panel-content")[0].hasAttribute("hidden")));
    }

    function isSearchCardsView() {
        return ($(SEARCH_RESULTS_CONTAINER).length > 0);
    }

    function isImage(typeValue){
        if(!typeValue){
            return false;
        }

        return (typeValue.trim() == "IMAGE");
    }

    function isVideo(typeValue){
        if(!typeValue){
            return false;
        }
        return (typeValue.trim() == "MULTIMEDIA");
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }
        return parent;
    }
}(jQuery, jQuery(document)));
