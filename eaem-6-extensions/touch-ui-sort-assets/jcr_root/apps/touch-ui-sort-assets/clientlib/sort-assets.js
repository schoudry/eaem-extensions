(function (document, $) {
    "use strict";

    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded";

    var sort = function($articles, isColumn){
        $articles.sort(function(a, b) {
            a = $(a).find(isColumn ? ".foundation-collection-item-title" : "h4").text();
            b = $(b).find(isColumn ? ".foundation-collection-item-title" : "h4").text();

            //this piece was copied from underscore.js sortBy
            if (a > b || a === void 0){
                return 1;
            }else if (a < b || b === void 0){
                return -1;
            }

            return 1;
        });

        return $articles;
    };

    var sortCards = function(){
        var execFn = function(){
            var $cards = $.find(".foundation-layout-card");

            if($cards.length == 0){
                return;
            }

            var $grids = $("div[class^='grid-']"),
                clazz = $grids.prop("class"),
                gIndex = parseInt(clazz.substr(clazz.indexOf("-") + 1), 10),
                $articles = sort($("article"));

            $grids.html("");

            $articles.each(function(index, article){
                $($grids[index % gIndex]).append($(article));
            });
        };

        setTimeout(function(){
            try { execFn() } catch(err){ console.log("Error executing sort..." + err);}
        },250);
    };

    var sortList = function(){
        setTimeout(function(){
            var $items = $.find(".foundation-layout-list");

            if($items.length == 0){
                return;
            }

            $(".grid-0").html(sort($("article")));
        }, 250);
    };

    var sortColumns = function(){
        var columns = $.find(".foundation-layout-columns .coral-ColumnView-column-content");

        if(columns.length == 0){
            return;
        }

        //sort just the first column, more logic needed for sorting miller columns
        $(columns[0]).html(sort( $(columns[0]).find(".coral-ColumnView-item"), true));
    };

    $(document).on(FOUNDATION_CONTENT_LOADED, function(e){
        $(document).on(FOUNDATION_CONTENT_LOADED, ".foundation-layout-columns", function(e) {
            sortColumns();
        });

        //event not thrown on .foundation-layout-list, .foundation-layout-card sometimes, bug???
        $(document).on(FOUNDATION_CONTENT_LOADED, ".foundation-layout-util-maximized", function(e) {
            sortCards();
            sortList();
        });
    });
})(document, jQuery);
