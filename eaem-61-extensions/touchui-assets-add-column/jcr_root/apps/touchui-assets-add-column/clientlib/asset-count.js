(function (document, $) {
    "use strict";

    var FOUNDATION_LAYOUT_LIST = ".foundation-layout-list",
        DAM_ADMIN_CHILD_PAGES = "cq-damadmin-admin-childpages",
        ATTR_DATA_FOUNDATION_COLLECTION_ID = "data-foundation-collection-id",
        ASSETS_COUNT_CLASS = "assetsCount",
        CREATED_BY_CLASS = "createdBy",
        OOTB_DEFAULT_CSS = "shared";

    $(document).on("foundation-mode-change", function(e, mode, group){
        //not on assets list, return
        if((group != DAM_ADMIN_CHILD_PAGES) || (mode == "selection") ){
            return;
        }

        //group is cq-damadmin-admin-childpages for assets
        var $collection = $(".foundation-collection[data-foundation-mode-group=" + group + "]");

        if (!$collection.is(FOUNDATION_LAYOUT_LIST)) {
            return;
        }

        var $articles = $("article");

        //css class shared added in /libs/dam/gui/components/admin/childasset/childasset.jsp,
        //rename it to the first extension column css class - assetsCount for "Assets Count"
        $articles.find("." + OOTB_DEFAULT_CSS)
                    .removeClass(OOTB_DEFAULT_CSS)
                    .addClass(ASSETS_COUNT_CLASS);

        //add new dom for second extension column "Created By"
        $("<p/>").attr("class", CREATED_BY_CLASS).insertAfter($articles.find("." + ASSETS_COUNT_CLASS));

        var path = $("." + DAM_ADMIN_CHILD_PAGES).attr(ATTR_DATA_FOUNDATION_COLLECTION_ID);

        $.ajax(path + ".2.json").done(handler);

        function handler(data){
            var articleName, assets;

            $articles.each(function(index, article){
                var $article = $(article);

                articleName = getStringAfterLastSlash($article.data("path"));

                //reject non assets nodes
                assets = _.reject(data[articleName], function(value, key){
                    return (key.indexOf("jcr:") == 0) || value["jcr:primaryType"] == "sling:OrderedFolder";
                });

                $article.find("." + CREATED_BY_CLASS).html(data[articleName]["jcr:createdBy"]);
                $article.find("." + ASSETS_COUNT_CLASS).html(Object.keys(assets).length);
            });
        }

        function getStringAfterLastSlash(str){
            if(!str || (str.indexOf("/") == -1)){
                return "";
            }

            return str.substr(str.lastIndexOf("/") + 1);
        }
    });
})(document, jQuery);