(function($, $document){
    var CORAL_COLUMNVIEW_PREVIEW = "coral-columnview-preview",
        THUMB_PATH = "/_jcr_content/renditions/cq5dam.thumbnail.48.48.png",
        GET_SMART_CROPS_URL = "/apps/eaem-asset-selector-show-dyn-renditions/smart-crop-renditions/renditions.html",
        added = false;

    $document.on("foundation-selections-change", function(){
        getUIWidget(CORAL_COLUMNVIEW_PREVIEW).then(showDynamicRenditions);
    });

    function showDynamicRenditions($colPreview){
        if(_.isEmpty($colPreview)){
            return;
        }

        if(added){
            return;
        }

        added = true;

        var assetPath = $colPreview.attr("data-foundation-layout-columnview-columnid"),
            thumbPath = assetPath + THUMB_PATH,
            dynRendsCol = new Coral.ColumnView.Column().set({});

        dynRendsCol._loadItems = function(count, item){ };

        var $dynRendsCol = $(dynRendsCol).insertBefore($colPreview);

        $.ajax( { url: GET_SMART_CROPS_URL + assetPath, async: false } ).done(function(data){
            _.each(data, function(dynImgPath, dynName){
                $dynRendsCol.find("coral-columnview-column-content").append(getDynamicRenditionsHtml(dynImgPath, dynName));
            })
        });

    }

    function getDynamicRenditionsHtml(thumbPath, name) {
        return  '<coral-columnview-item>' +
                    '<coral-columnview-item-thumbnail>' +
                        '<img src="' + thumbPath + '" style="vertical-align: middle; width: auto; height: auto; max-width: 3rem; max-height: 3rem;">' +
                    '</coral-columnview-item-thumbnail>' +
                    '<coral-columnview-column-content>' +
                        '<div class="foundation-collection-item-title">' + name + '</div>' +
                    '</coral-columnview-column-content>' +
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
