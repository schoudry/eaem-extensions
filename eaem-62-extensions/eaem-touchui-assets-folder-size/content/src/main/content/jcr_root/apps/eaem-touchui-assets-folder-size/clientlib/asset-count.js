(function ($, $document) {
    "use strict";

    var firstLoad = true,
        COOKIE_AEM_ASSETS_LIST_VIEW_COLUMNS = "aem.assets.listview.columns",
        EAEM_ASSETS_COUNT = "eaemAssetsCount",
        LAYOUT_COL_VIEW = "column",
        LAYOUT_LIST_VIEW = "list",
        LAYOUT_CARD_VIEW = "card",
        DIRECTORY = "directory",
        FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        SEL_DAM_ADMIN_CHILD_PAGES = ".cq-damadmin-admin-childpages",
        DIR_CELL_HTML =    '<td is="coral-td" class="coral-Table-cell coral-Table-cell--left" alignment="column">' +
                                '<coral-td-label class="coral-Table-cellLabel">Total Count: ASSET_COUNT, Size: ASSETS_SIZE</coral-td-label>' +
                            '</td>',
        LIST_CELL_HTML =    '<td is="coral-td" class="coral-Table-cell coral-Table-cell--left" alignment="column">' +
                                '<coral-td-label class="coral-Table-cellLabel"></coral-td-label>' +
                            '</td>';

    $document.on(FOUNDATION_CONTENT_LOADED, SEL_DAM_ADMIN_CHILD_PAGES, addAssetCount);

    $document.on("cui-contentloaded", function (e) {
        if(!firstLoad){
            return;
        }

        var $childPages = $(e.currentTarget).find(SEL_DAM_ADMIN_CHILD_PAGES);

        if(_.isEmpty($childPages)){
            return;
        }

        firstLoad = false;

        $childPages.trigger(FOUNDATION_CONTENT_LOADED);
    });

    function isFolderCountEnabled(){
        var cookies = document.cookie.split(";"), tokens, isEnabled = false;

        _.each(cookies, function(cookie){
            tokens = cookie.split("=");

            if(tokens[0].trim() !== COOKIE_AEM_ASSETS_LIST_VIEW_COLUMNS){
                return;
            }

            isEnabled = tokens[1].trim().indexOf(EAEM_ASSETS_COUNT) > 0;
        });

        return isEnabled;
    }

    function addAssetCount(e) {
        if(!e.currentTarget || !isFolderCountEnabled()){
            return;
        }

        var $currentTarget = $(e.currentTarget),
            foundationLayout = $currentTarget.data("foundation-layout");

        if(_.isEmpty(foundationLayout)){
            return;
        }

        var layoutId = foundationLayout.layoutId;

        if(layoutId == LAYOUT_COL_VIEW){
            return;
        }

        var path = $currentTarget.data("foundation-collection-id");

        $.ajax(path + ".size.json").done(function(data){
            var $dragHandles = $(".cq-damadmin-admin-childpages .coral-Icon--dragHandle");

            if(_.isEmpty($dragHandles) || ($dragHandles.closest("td").css("display") == "none")){
                //adjust UI removing drag handle column header
                $(".cq-damadmin-admin-childpages thead th:last").prev().remove();
            }

            $(".foundation-collection-item").each(function(index, item){
                itemHandler(data, layoutId, $(item) );
            });
        });

        function itemHandler(data, layoutId, $item){
            var itemPath = $item.data("foundation-collection-item-id"), isFolder;

            var sizeObj = data[itemPath], size = "0 MB",
                notExact, totalAssets, html;

            if(!_.isEmpty(sizeObj)){
                notExact = (sizeObj["totalAssets"] !== sizeObj["countedAssets"]);

                if(sizeObj["size"] !== "0"){
                    size = (notExact ? "~" : "") + ((parseFloat(sizeObj["size"]) / (1024 * 1024))).toFixed(2) + " MB";
                }
            }

            if(layoutId == LAYOUT_LIST_VIEW){
                isFolder = $item.data("item-type") == DIRECTORY;

                if(!isFolder){
                    html = LIST_CELL_HTML;
                }else{
                    html = DIR_CELL_HTML.replace("ASSET_COUNT", sizeObj["totalAssets"]).replace("ASSETS_SIZE", size);
                }

                $item.append(html);
            }else if(layoutId == LAYOUT_CARD_VIEW){
                var $itemMeta = $item.find(".foundation-collection-assets-meta"), $cardTitle;

                isFolder = $itemMeta.data("foundation-collection-meta-type") == DIRECTORY;

                if(!isFolder){
                    return;
                }

                $cardTitle =$item.find("coral-card-content > coral-card-title");
                $cardTitle.html($cardTitle.html() + " - Assets: " + sizeObj["totalAssets"] + ", " + size);
            }
        }

        function getStringAfterLastSlash(str){
            if(!str || (str.indexOf("/") == -1)){
                return "";
            }

            return str.substr(str.lastIndexOf("/") + 1);
        }
    }
})(jQuery, jQuery(document));