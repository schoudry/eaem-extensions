(function ($, $document) {
    var THUMBNAILS_PATH = "/conf/global/settings/dam/eaem-thumbnails/thumbnails.2.json",
        LAYOUT_COL_VIEW  = "column",
        LAYOUT_LIST_VIEW = "list",
        LAYOUT_CARD_VIEW = "card",
        CONTAINER = ".cq-damadmin-admin-childpages",
        FOUNDATION_COLLECTION_ITEM_ID = "foundationCollectionItemId",
        DIRECTORY = "directory",
        DEFAULT_THUMBS = {};

    loadDefaultThumbnails();

    $document.on("foundation-contentloaded", showThumbnails);

    function showThumbnails(){
        if(isColumnView()){
            addColumnViewThumbnails();
        }else if(isCardView()){
            addCardViewThumbnails();
        }else if(isListView()){
            addListViewThumbnails()
        }
    }

    function addListViewThumbnails(){

    }

    function addCardViewThumbnails(){
        var cardThumbs = DEFAULT_THUMBS.card;

        if(_.isEmpty(cardThumbs)){
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

            $item.find("coral-card-asset > img").attr("src", cardThumbs[extension]);
        });
    }

    function getExtension(path){
        var extension = "";

        if(_.isEmpty(path) || !path.includes(".")){
            return extension;
        }

        extension = path.substring(path.lastIndexOf(".") + 1);

        return extension.toUpperCase();
    }

    function addColumnViewThumbnails(){

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
                DEFAULT_THUMBS["column"][extension] = thumb.path + "/jcr:content/renditions/cq5dam.thumbnail.1280.1280.png";
                DEFAULT_THUMBS["card"][extension] = thumb.path + "/jcr:content/renditions/cq5dam.thumbnail.319.319.png";
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
}(jQuery, jQuery(document)));