(function ($, $document) {
    var THUMBNAILS_PATH = "/conf/global/settings/dam/eaem-thumbnails/thumbnails.2.json",
        LAYOUT_COL_VIEW  = "column",
        LAYOUT_LIST_VIEW = "list",
        LAYOUT_CARD_VIEW = "card",
        CONTAINER = ".cq-damadmin-admin-childpages",
        FOUNDATION_COLLECTION_ITEM_ID = "foundationCollectionItemId",
        DIRECTORY = "directory",
        CORAL_COLUMNVIEW_PREVIEW = "coral-columnview-preview",
        COLUMN_VIEW = "coral-columnview",
        colViewListenerAdded = false,
        DEFAULT_THUMBS = {};

    loadDefaultThumbnails();

    $document.on("foundation-contentloaded", showThumbnails);

    $document.on("foundation-selections-change", function(){
        getUIWidget(CORAL_COLUMNVIEW_PREVIEW).then(showThumbnailInColumnViewPreview);
    });

    function showThumbnails(){
        if(isColumnView()){
            addColumnViewThumbnails();
        }else{
            addCardListViewThumbnails()
        }
    }

    function addCardListViewThumbnails(){
        var cardThumbs = DEFAULT_THUMBS.card,
            listThumbs = DEFAULT_THUMBS.list;

        if(_.isEmpty(cardThumbs) || _.isEmpty(listThumbs)){
            return;
        }

        $(".foundation-collection-item").each(function(index, item){
            var $item = $(item),
                isFolder = ($item.data("item-type") == DIRECTORY);

            if(isFolder){
                return;
            }

            var extension = getExtension($item.data(FOUNDATION_COLLECTION_ITEM_ID));

            if(_.isEmpty(cardThumbs[extension])){
                return;
            }

            $item.find("td:first > img").attr("src", listThumbs[extension]);
            $item.find("coral-card-asset > img").attr("src", cardThumbs[extension]);
        });
    }

    function addColumnViewThumbnails(){
        if(colViewListenerAdded){
            return;
        }

        var $columnView = $(COLUMN_VIEW),
            columnThumbs = DEFAULT_THUMBS.column;

        if(_.isEmpty($columnView) || _.isEmpty(columnThumbs)){
            return;
        }

        colViewListenerAdded = true;

        $columnView[0].on("coral-columnview:navigate", showThumbnail);

        _.each($columnView.find("coral-columnview-column"), function(colItem){
            showThumbnail({ detail : { column: colItem } });
        });

        function showThumbnail(event){
            $(event.detail.column).find("coral-columnview-item").each(function(index, item){
                var $item = $(item),
                    extension = getExtension($item.data(FOUNDATION_COLLECTION_ITEM_ID));

                $item.find("coral-columnview-item-thumbnail > img").attr("src", columnThumbs[extension]);
            });
        }
    }

    function showThumbnailInColumnViewPreview($colPreview){
        var columnThumbs = DEFAULT_THUMBS.column;

        if(_.isEmpty($colPreview)){
            return;
        }

        var extension = getExtension($colPreview.data("foundationLayoutColumnviewColumnid"));

        $colPreview.find("coral-columnview-preview-asset > img").attr("src", columnThumbs[extension]);
    }

    function getExtension(path){
        var extension = "";

        if(_.isEmpty(path) || !path.includes(".")){
            return extension;
        }

        extension = path.substring(path.lastIndexOf(".") + 1);

        return extension.toUpperCase();
    }

    function loadDefaultThumbnails(){
        $.ajax( { url: THUMBNAILS_PATH, asyc: false }).done(handler);

        var extension = "";

        function handler(data){
            if(_.isEmpty(data)){
                return;
            }

            DEFAULT_THUMBS["card"] = {};
            DEFAULT_THUMBS["list"] = {};
            DEFAULT_THUMBS["column"] = {};

            _.each(data, function(thumb){
                if(_.isEmpty(thumb.extension)){
                    return;
                }

                extension = thumb.extension.toUpperCase();

                DEFAULT_THUMBS["card"][extension] = thumb.path + "/jcr:content/renditions/cq5dam.thumbnail.319.319.png";
                DEFAULT_THUMBS["column"][extension] = thumb.path + "/jcr:content/renditions/cq5dam.thumbnail.319.319.png";
                DEFAULT_THUMBS["list"][extension] = thumb.path + "/jcr:content/renditions/cq5dam.thumbnail.48.48.png";
            })
        }
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
        var $childPage = $(CONTAINER),
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
        }, 100);

        return deferred.promise();
    }
}(jQuery, jQuery(document)));