(function($, $document) {
    var MF_SELECTOR = "coral-multifield",
        SELECTED_TAGS_DIV = "eaem-column-view-selections",
        FOUNDATION_SELECTIONS_CHANGE = "foundation-selections-change",
        FOUNDATION_SELECTIONS_ITEM = "foundation-selections-item",
        FOUNDATION_COLLECTION = ".foundation-collection",
        FOUNDATION_COLLECTION_ITEM_ID = "foundation-collection-item-id",
        $assetsContainer,
        extended = false;

    $document.on("foundation-contentloaded", handleAssetPicker);

    function handleAssetPicker(){
        if(extended){
            return;
        }

        var $autoCompletes = $("foundation-autocomplete");

        if(_.isEmpty($autoCompletes)){
            return;
        }

        extended = true;

        _.each($autoCompletes, function(autoCompete){
            var $autoComplete = $(autoCompete),
                acName = $autoComplete.attr("name"),
                nearestMF = $autoComplete.closest("coral-multifield[data-granite-coral-multifield-name='" + acName + "']");

            if(_.isEmpty(nearestMF)){
                return;
            }

            var pathField = $autoComplete[0];

            extendPicker(pathField);
        });
    }

    function extendPicker(pathField){
        var origShowPicker = pathField._showPicker,
            origSetSelections = pathField._setSelections;

        pathField._showPicker = function(){
            origShowPicker.call(this);

            var $dialog = $(this._picker.el),
                $columnView = $dialog.find("coral-columnview");

            addSelectedSection($columnView);

            $dialog.on(FOUNDATION_SELECTIONS_CHANGE, FOUNDATION_COLLECTION, collectAssets);
        };

        pathField._setSelections = function(selections, deferChangeEvent){
            var $assets = $assetsContainer.find("coral-tag"), selectedAssets = [];

            _.each($assets, function(tag){
                selectedAssets.push({
                    text: $(tag).find("coral-tag-label").html(),
                    value: tag.value
                });
            });

            origSetSelections.call(this, selectedAssets, deferChangeEvent);
        }
    }

    function collectAssets(){
        var selectedAssets = {};

        $("." + FOUNDATION_SELECTIONS_ITEM).each(function(index, asset){
            var $asset = $(asset),
                assetPath = $asset.data(FOUNDATION_COLLECTION_ITEM_ID);

            if(_.isEmpty(assetPath)){
                return;
            }

            selectedAssets[assetPath] = $asset.find(".foundation-collection-item-title").html();
        });

        var $submit = $(this).closest("coral-dialog").find(".granite-pickerdialog-submit");

        if(_.isEmpty(selectedAssets)){
            $submit.prop("disabled", _.isEmpty(getSelectedAssetsInContainer()));
            return;
        }

        buildSelectedContainer(selectedAssets, $assetsContainer);

        $(this).adaptTo("foundation-selections").clear();

        $submit.prop("disabled", false);
    }

    function buildSelectedContainer(selectedAssets, $container) {
        var $tagList = $container.find("coral-taglist");

        _.each(selectedAssets, function (text, value) {
            $tagList.append(getAssetHtml(text, value));
        });
    }

    function getAssetHtml(title, value){
        return '<coral-tag class="coral3-Tag" value="' + value + '">' +
                    '<coral-tag-label>' + title + '</coral-tag-label>' +
               '</coral-tag>';
    }

    function addSelectedSection($columnView){
        $columnView.css("height", "70%");

        $assetsContainer = $("<div/>").appendTo($columnView.parent());

        var html =  "<div style='text-align:center; padding:1px; background-color: rgba(0,0,0,0.05)'>" +
                        "<h3>Selected Assets</h3>" +
                    "</div>" +
                    "<div style='margin: 15px' id='" + SELECTED_TAGS_DIV + "'>" +
                        "<coral-taglist class='coral3-TagList'></coral-taglist>" +
                    "</div>";

        $(html).appendTo($assetsContainer);

        $assetsContainer.find("coral-taglist").on("change", function(){
            $assetsContainer.closest("coral-dialog").find(".granite-pickerdialog-submit").prop("disabled", _.isEmpty(this.values));
        })
    }

    function getSelectedAssetsInContainer(){
        var $assetList = $assetsContainer.find("coral-taglist");

        if(_.isEmpty($assetList)){
            return [];
        }

        return $assetList[0].values;
    }
})(jQuery, jQuery(document));
