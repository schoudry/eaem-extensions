(function ($, $document) {
    "use strict";

    var DAM_ADMIN_CHILD_PAGES = "cq-damadmin-admin-childpages",
        LOAD_EVENT = "coral-columnview-load",
        FOUNDATION_LAYOUT_CARD = ".foundation-layout-card",
        NS_COLUMNS = ".foundation-layout-columns";

    $document.on("foundation-mode-change", function(e, mode, group){
        //not assets console, return
        if(group != DAM_ADMIN_CHILD_PAGES){
            return;
        }

        showFileName();

        var $collection = $(".foundation-collection[data-foundation-mode-group=" + group + "]");

        //for column view
        $collection.on(LOAD_EVENT, function(){
            setTimeout( showFileName ,200);
        });

        //for column view select
        $collection.on("coral-columnview-item-select" + NS_COLUMNS, showFileName);

        if (!$collection.is(FOUNDATION_LAYOUT_CARD)) {
            return;
        }

        var $scrollContainer = $collection.parent();

        //for card view scroll
        $scrollContainer.on("scroll" + FOUNDATION_LAYOUT_CARD, _.throttle(function(){
            var paging = $collection.data("foundation-layout-card.internal.paging");

            if(!paging.isLoading){
                return;
            }

            var INTERVAL = setInterval(function(){
                if(paging.isLoading){
                    return;
                }

                clearInterval(INTERVAL);

                showFileName();
            }, 250);
        }, 100));
    });

    function showFileName(){
        var $articles = $("article"), $article, name;

        $articles.each(function(index, article){
            $article = $(article);

            name = getStringAfterLastSlash($article.data("path"));

            $article.find("h4").html(name);
            $article.find(".coral-ColumnView-label").html(name);
        });
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }
})(jQuery, jQuery(document));