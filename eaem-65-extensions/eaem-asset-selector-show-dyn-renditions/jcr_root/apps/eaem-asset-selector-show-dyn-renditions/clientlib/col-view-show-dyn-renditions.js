(function($, $document){
    var CORAL_COLUMNVIEW_PREVIEW = "coral-columnview-preview",
        THUMB_PATH = "/_jcr_content/renditions/cq5dam.thumbnail.48.48.png",
        EAEM_DATA_ASSET_PATH = "data-eaem-asset-path",
        EAEM_RENDITION_DATA = "data-eaem-rendition",
        EAEM_RENDITION_FIELD = "eaem-rendition-name",
        EAEM_DONE_ACTION = "EAEM_DONE",
        GET_SMART_CROPS_URL = "/apps/eaem-asset-selector-show-dyn-renditions/smart-crop-renditions/renditions.html",
        GET_VIDEO_RENDS_URL = "/apps/eaem-asset-selector-show-dyn-renditions/video-dyn-renditions/renditions.html",
        added = false, dynRendsCol;

    $document.on("foundation-contentloaded", registerSelectListener);

    $document.on("foundation-selections-change", function(){
        var isSelected = handleSelections();

        if(isSelected){
            return;
        }

        getUIWidget(CORAL_COLUMNVIEW_PREVIEW).then(showDynamicRenditions);
    });

    function registerSelectListener(){
        var saveHandler = getSaveHandler();

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

        var $selItem = $("coral-columnview-item.is-selected"),
            selected = JSON.parse($selItem.attr(EAEM_RENDITION_DATA));

        message.data.push(selected);

        console.log(message);

        getParent().postMessage(JSON.stringify(message), $(".assetselector-content-container").data("targetorigin"));
    }

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

        var $titleValue = $colPreview.find("coral-columnview-preview-label:contains('Title')").next(),
            $rendition = $("<coral-columnview-preview-label>Rendition</coral-columnview-preview-label>")
                .insertAfter( $titleValue );

        $("<coral-columnview-preview-value id='" + EAEM_RENDITION_FIELD + "'>Original</coral-columnview-preview-value>").insertAfter($rendition);
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

    function showDynamicRenditions($colPreview){
        if(_.isEmpty($colPreview)){
            return;
        }

        if(added){
            return;
        }

        added = true;

        resetDynamicRenditionsColumnView();

        var assetPath = $colPreview.attr("data-foundation-layout-columnview-columnid"),
            $type = $colPreview.find("coral-columnview-preview-label:contains('Type')"),
            typeValue = $type.next("coral-columnview-preview-value").html(),
            thumbPath = assetPath + THUMB_PATH;

        if(!isImage(typeValue) && !isVideo(typeValue)){
            return;
        }

        createDynamicRenditionsColumn($colPreview);

        var $dynRendsCol = $(dynRendsCol).insertBefore($colPreview),
            $dynRendsColContent = $dynRendsCol.find("coral-columnview-column-content");

        addOriginalImage();

        var rendsUrl = isImage(typeValue) ? GET_SMART_CROPS_URL : GET_VIDEO_RENDS_URL;

        rendsUrl = rendsUrl + assetPath;

        _.defer(function(){
            $.ajax( { url: rendsUrl, async: false } ).done(addDynRenditions);
        });

        function addDynRenditions(data){
            var $dynRendColItem;

            _.each(data, function(dynRendition, dynName){
                $dynRendColItem = $(getDynamicRenditionsHtml(thumbPath, dynRendition, assetPath))
                    .appendTo($dynRendsColContent);

                $dynRendColItem.click(showDynRendImage);
            });

            $dynRendsColContent.find("coral-columnview-item:first").click();
        }

        function addOriginalImage(){
            var origImgSrc = $colPreview.find("img").attr("src"),
                data = { image : origImgSrc, name : "Original" };

            var $orig = $(getDynamicRenditionsHtml(thumbPath, data, assetPath)).appendTo($dynRendsColContent);

            $orig.click(showDynRendImage);
        }

        function showDynRendImage(){
            $colPreview.find("img").attr("src", $(this).attr("data-foundation-collection-item-id"));
            $colPreview.find("#" + EAEM_RENDITION_FIELD).html($(this).find(".foundation-collection-item-title").html());
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

    function getDynamicRenditionsHtml(thumbPath, dynRendition, assetPath) {
        return  '<coral-columnview-item data-foundation-collection-item-id="' + dynRendition.image + '" ' + EAEM_DATA_ASSET_PATH + '="' + assetPath
            +'" ' + EAEM_RENDITION_DATA + '="' + JSON.stringify(dynRendition).replace(/\"/g, "&quot;") + '">' +
            '<coral-columnview-item-thumbnail>' +
            '<img src="' + thumbPath + '" style="vertical-align: middle; width: auto; height: auto; max-width: 3rem; max-height: 3rem;">' +
            '</coral-columnview-item-thumbnail>' +
            '<div class="foundation-collection-item-title">' + dynRendition.name + '</div>' +
            '</coral-columnview-item>';
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }
        return parent;
    }

    function getSaveHandler(){
        var handlers = $._data(document, "events")["click"];

        return _.reject(handlers, function(handler){
            return (handler.selector != ".asset-picker-done" );
        })[0].handler;
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
