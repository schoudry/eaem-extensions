(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        FOUNDATION_MODE_CHANGE = "foundation-mode-change",
        FOUNDATION_COLLECTION_ID = "foundation-collection-id",
        LAYOUT_COL_VIEW  = "column",
        LAYOUT_LIST_VIEW = "list",
        LAYOUT_CARD_VIEW = "card",
        COLUMN_VIEW = "coral-columnview",
        EVENT_COLUMNVIEW_CHANGE = "coral-columnview:change",
        FOUNDATION_COLLECTION_ITEM_ID = "foundation-collection-item-id",
        CORAL_COLUMNVIEW_PREVIEW = "coral-columnview-preview",
        CORAL_COLUMNVIEW_PREVIEW_ASSET = "coral-columnview-preview-asset",
        EAEM_BANNER_CLASS = "eaem-banner",
        EAEM_BANNER = ".eaem-banner",
        FOUNDATION_COLLECTION_ITEM_TITLE = ".foundation-collection-item-title",
        MED_SIZE_LIMIT = "4194304", //4mb
        LARGE_SIZE_LIMIT = "52428800", //4mb
        colViewListenerAdded = false,
        DAM_ADMIN_CHILD_PAGES = ".cq-damadmin-admin-childpages";

    $document.on(FOUNDATION_CONTENT_LOADED, checkFileSizes);

    $document.on(FOUNDATION_MODE_CHANGE, function(){
        colViewListenerAdded = false;
        checkFileSizes();
    });

    function checkFileSizes(){
        var folderPath = $(DAM_ADMIN_CHILD_PAGES).data(FOUNDATION_COLLECTION_ID);

        if(_.isEmpty(folderPath)){
            return;
        }

        $.ajax(folderPath + ".3.json").done(showLargeFileSizeBanners);
    }

    function showLargeFileSizeBanners(pathsObj){
        if(isColumnView()){
            handleColumnView();
        }

        if(_.isEmpty(pathsObj)){
            return;
        }

        if(isCardView()){
            addCardViewBanner(pathsObj);
        }else if(isListView()){
            addListViewBanner(pathsObj)
        }
    }

    function handleColumnView(){
        var $columnView = $(COLUMN_VIEW);

        if(colViewListenerAdded){
            return;
        }

        colViewListenerAdded = true;

        $columnView.on(EVENT_COLUMNVIEW_CHANGE, handleColumnItemSelection);
    }

    function handleColumnItemSelection(event){
        var detail = event.originalEvent.detail,
            $asset = $(detail.selection[0]),
            assetPath = $asset.data(FOUNDATION_COLLECTION_ITEM_ID);

        if(_.isEmpty(assetPath)){
            return;
        }

        $.ajax(assetPath + ".2.json").done(addColumnViewBanner);
    }

    function addColumnViewBanner(assetObj){
        getUIWidget(CORAL_COLUMNVIEW_PREVIEW).then(handler);

        function handler($colPreview){
            var $assetPreview = $colPreview.find(CORAL_COLUMNVIEW_PREVIEW_ASSET);

            $assetPreview.find(EAEM_BANNER).remove();

            $assetPreview.prepend(getBannerMissingLinksHtmlColumnView(assetObj));
        }
    }

    function getBannerMissingLinksHtmlColumnView(assetObj){
        var size = nestedPluck(assetObj,"jcr:content/metadata/dam:size");

        if(!size || (nestedPluck(assetObj,"jcr:content/dam:assetState") == "processing")){
            return;
        }

        var ct = getColorText(size);

        if(!ct.color){
            return;
        }

        return "<coral-tag style='background-color: " + ct.color + ";z-index: 9999; width: 100%' class='" + EAEM_BANNER_CLASS + "'>" +
                    "<i class='coral-Icon coral-Icon--bell coral-Icon--sizeXS' style='margin-right: 10px'></i>" +
                        ct.text +
                "</coral-tag>";
    }

    function getBannerMissingLinksHtml(assetObj){
        var size = nestedPluck(assetObj,"jcr:content/metadata/dam:size"), color, text;

        if(!size || (nestedPluck(assetObj,"jcr:content/dam:assetState") == "processing")){
            return;
        }

        var ct = getColorText(size);

        if(!ct.color){
            return;
        }

        return "<coral-alert style='background-color:" + ct.color + "' class='" + EAEM_BANNER_CLASS + "'>" +
                    "<coral-alert-content>" + ct.text + "</coral-alert-content>" +
               "</coral-alert>";
    }

    function getColorText(size){
        size = parseFloat(size);

        var color, text;

        if(size > LARGE_SIZE_LIMIT){
            color = "#ff7f7f";
            text = "LARGE > 50 MB";
        }else if(size > MED_SIZE_LIMIT){
            color = "#FFBF00";
            text = "MEDIUM > 4 MB";
        }

        return{
            color: color,
            text: text
        }
    }

    function addListViewBanner(pathsObj){
        var $container = $(DAM_ADMIN_CHILD_PAGES), $item, clazz, assetPath, ct, size,
            folderPath = $container.data(FOUNDATION_COLLECTION_ID);

        _.each(pathsObj, function(assetObj, assetName){
            if(_.isString(assetObj) && isJCRProperty(assetName)){
                return;
            }

            assetPath = folderPath + "/" + assetName;

            $item = $container.find("[data-" + FOUNDATION_COLLECTION_ITEM_ID + "='" + assetPath + "']");

            if(!_.isEmpty($item.find(EAEM_BANNER))){
                return;
            }

            size = nestedPluck(assetObj,"jcr:content/metadata/dam:size");

            ct = getColorText(size);

            if(!ct.color){
                return
            }

            $item.find("td").css("background-color" , ct.color).addClass(EAEM_BANNER_CLASS);

            $item.find(FOUNDATION_COLLECTION_ITEM_TITLE).prepend(getListViewMissingLinksHtml());
        });
    }

    function getListViewMissingLinksHtml(){
        return "<i class='coral-Icon coral-Icon--bell coral-Icon--sizeXS' style='margin-right: 10px'></i>";
    }

    function addCardViewBanner(pathsObj){
        var $container = $(DAM_ADMIN_CHILD_PAGES), $item, assetPath,
            folderPath = $container.data(FOUNDATION_COLLECTION_ID);

        _.each(pathsObj, function(assetObj, assetName){
            if(_.isString(assetObj) && isJCRProperty(assetName)){
                return;
            }

            assetPath = folderPath + "/" + assetName;

            $item = $container.find("[data-" + FOUNDATION_COLLECTION_ITEM_ID + "='" + assetPath + "']");

            if(_.isEmpty($item)){
                return;
            }

            if(!_.isEmpty($item.find(EAEM_BANNER))){
                return;
            }

            $item.find("coral-card-info").append(getBannerMissingLinksHtml(assetObj));
        });
    }

    function isColumnView(){
        return ( getAssetsConsoleLayout() === LAYOUT_COL_VIEW );
    }

    function isListView(){
        return ( getAssetsConsoleLayout() === LAYOUT_LIST_VIEW );
    }

    function isCardView(){
        return (getAssetsConsoleLayout() === LAYOUT_CARD_VIEW);
    }

    function getAssetsConsoleLayout(){
        var $childPage = $(DAM_ADMIN_CHILD_PAGES),
            foundationLayout = $childPage.data("foundation-layout");

        if(_.isEmpty(foundationLayout)){
            return "";
        }

        return foundationLayout.layoutId;
    }

    function getUIWidget(selector){
        if(_.isEmpty(selector)){
            return;
        }

        var deferred = $.Deferred();

        var INTERVAL = setInterval(function(){
            var $widget = $(selector);

            if(_.isEmpty($widget)){
                return;
            }

            clearInterval(INTERVAL);

            deferred.resolve($widget);
        }, 250);

        return deferred.promise();
    }

    function startsWith(val, start){
        return val && start && (val.indexOf(start) === 0);
    }

    function isJCRProperty(property){
        return (startsWith(property, "jcr:") || startsWith(property, "sling:"));
    }

    function nestedPluck(object, key) {
        if (!_.isObject(object) || _.isEmpty(object) || _.isEmpty(key)) {
            return [];
        }

        if (key.indexOf("/") === -1) {
            return object[key];
        }

        var nestedKeys = _.reject(key.split("/"), function(token) {
            return token.trim() === "";
        }), nestedObjectOrValue = object;

        _.each(nestedKeys, function(nKey) {
            if(_.isUndefined(nestedObjectOrValue)){
                return;
            }

            if(_.isUndefined(nestedObjectOrValue[nKey])){
                nestedObjectOrValue = undefined;
                return;
            }

            nestedObjectOrValue = nestedObjectOrValue[nKey];
        });

        return nestedObjectOrValue;
    }
}($, $(document)));