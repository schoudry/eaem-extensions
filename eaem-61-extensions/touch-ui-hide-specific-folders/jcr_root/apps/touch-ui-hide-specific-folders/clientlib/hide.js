(function (document, $) {
    "use strict";

    var PATHS_TO_HIDE = ["/content/dam/catalogs", "/content/dam/projects", "/content/dam/geometrixx/portraits" ];

    var DAM_ADMIN_CHILD_PAGES = "cq-damadmin-admin-childpages",
        LOAD_EVENT = "coral-columnview-load",
        FOUNDATION_LAYOUT_CARD = ".foundation-layout-card",
        NS_COLUMNS = ".foundation-layout-columns";

    $(document).on("foundation-mode-change", function(e, mode, group){
        //not assets console, return
        if(group != DAM_ADMIN_CHILD_PAGES){
            return;
        }

        hide();

        var $collection = $(".foundation-collection[data-foundation-mode-group=" + group + "]");

        //for column view
        $collection.on(LOAD_EVENT, function(){
            setTimeout( hide ,200);
        });

        //for column view select
        $collection.on("coral-columnview-item-select" + NS_COLUMNS, hide);

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

                hide();
            }, 250);
        }, 100));
    });

    function hide(){
        var $articles = $("article"), $article, path;

        $articles.each(function(index, article){
            $article = $(article);

            path = $article.data("path");

            if(PATHS_TO_HIDE.indexOf(path) < 0){
                return;
            }

            $article.hide();
        });
    }
})(document, jQuery);