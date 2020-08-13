(function($, $document){
    var CORAL_COLUMNVIEW_PREVIEW = "coral-columnview-preview",
        THUMB_PATH = "/_jcr_content/renditions/cq5dam.thumbnail.48.48.png",
        EAEM_DATA_ASSET_PATH = "data-eaem-asset-path",
        GET_SMART_CROPS_URL = "/apps/eaem-asset-selector-show-dyn-renditions/smart-crop-renditions/renditions.html",
        added = false, dynRendsCol;

    $document.on("foundation-selections-change", function(){
        var isSelected = handleSelections();

        if(isSelected){
            return;
        }

        getUIWidget(CORAL_COLUMNVIEW_PREVIEW).then(showDynamicRenditions);
    });

    function handleSelections(){
        var $selItem = $("coral-columnview-item.is-selected");

        if(_.isEmpty($selItem) || !$selItem[0].hasAttribute(EAEM_DATA_ASSET_PATH)){
            return false;
        }

        var metaHtml = getMetaHtml($selItem.attr(EAEM_DATA_ASSET_PATH));

        $selItem.prepend(metaHtml);

        $(".asset-picker-done")[0].disabled = false;

        return true;
    }

    function resetDynamicRenditionsColumnView(){
        $("coral-columnview-column").on("coral-columnview-column:_activeitemchanged", function(){
            added = false;

            if(dynRendsCol){
                $(dynRendsCol).remove();
            }
        });
    }

    function createDynamicRenditionsColumn($colPreview){
        dynRendsCol = new Coral.ColumnView.Column().set({});

        dynRendsCol._loadItems = function(count, item){};
    }

    function showDynamicRenditions($colPreview){
        if(_.isEmpty($colPreview)){
            return;
        }

        if(added){
            return;
        }

        added = true;

        var assetPath = $colPreview.attr("data-foundation-layout-columnview-columnid"),
            thumbPath = assetPath + THUMB_PATH;

        resetDynamicRenditionsColumnView();

        createDynamicRenditionsColumn($colPreview);

        var $dynRendsCol = $(dynRendsCol).insertBefore($colPreview),
            $dynRendsColContent = $dynRendsCol.find("coral-columnview-column-content");

        addOriginalImage();

        _.defer(function(){
            $.ajax( { url: GET_SMART_CROPS_URL + assetPath, async: false } ).done(addDynRenditions);
        });

        function addDynRenditions(data){
            var $dynRendColItem;

            _.each(data, function(dynImgPath, dynName){
                $dynRendColItem = $(getDynamicRenditionsHtml(thumbPath, dynImgPath, dynName, assetPath)).appendTo($dynRendsColContent);

                $dynRendColItem.click(showDynRendImage);
            });

            $dynRendsColContent.find("coral-columnview-item:first").click();
        }

        function addOriginalImage(){
            var origImgSrc = $colPreview.find("img").attr("src");

            var $orig = $(getDynamicRenditionsHtml(thumbPath, origImgSrc, "Original", assetPath)).appendTo($dynRendsColContent);

            $orig.click(showDynRendImage);
        }

        function showDynRendImage(){
            $colPreview.find("img").attr("src", $(this).attr("data-foundation-collection-item-id"));
        }
    }

    function getMetaHtml(assetPath){
        var $meta = $('[data-foundation-collection-item-id="' + assetPath + '"]'),
            metaHtml = "";

        if(_.isEmpty($meta)){
            return metaHtml;
        }

        $meta = $meta.find(".foundation-collection-assets-meta");

        if(_.isEmpty($meta)){
            return metaHtml;
        }

        return $meta[0].outerHTML;
    }

    function getDynamicRenditionsHtml(thumbPath, dynImgPath, name, assetPath) {
        return  '<coral-columnview-item data-foundation-collection-item-id="' + dynImgPath + '" ' + EAEM_DATA_ASSET_PATH + '="' + assetPath +'">' +
                    '<coral-columnview-item-thumbnail>' +
                        '<img src="' + thumbPath + '" style="vertical-align: middle; width: auto; height: auto; max-width: 3rem; max-height: 3rem;">' +
                    '</coral-columnview-item-thumbnail>' +
                    '<div class="foundation-collection-item-title">' + name + '</div>' +
                '</coral-columnview-item>';
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
