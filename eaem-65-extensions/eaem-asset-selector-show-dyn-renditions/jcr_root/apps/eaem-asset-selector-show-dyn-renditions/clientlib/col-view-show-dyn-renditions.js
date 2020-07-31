(function($, $document){
    var CORAL_COLUMNVIEW_PREVIEW = "coral-columnview-preview",
        THUMB_PATH = "/_jcr_content/renditions/cq5dam.thumbnail.48.48.png",
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

        var thumbPath = $colPreview.attr("data-foundation-layout-columnview-columnid") + THUMB_PATH,
            dynRendsCol = new Coral.ColumnView.Column().set({});

        dynRendsCol._loadItems = function(count, item){
        };

        var $dynRendsCol = $(dynRendsCol).insertBefore($colPreview);

        $dynRendsCol.find("coral-columnview-column-content").append(getDynamicRenditionsHtml(thumbPath));
    }

    function getDynamicRenditionsHtml(origThumb) {
        return  '<coral-columnview-item>' +
                    '<coral-columnview-item-thumbnail>' +
                        '<img src="' + origThumb + '" style="vertical-align: middle; width: auto; height: auto; max-width: 3rem; max-height: 3rem;">' +
                    '</coral-columnview-item-thumbnail>' +
                    '<coral-columnview-column-content>' +
                        '<div class="foundation-collection-item-title">Original</div>' +
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
