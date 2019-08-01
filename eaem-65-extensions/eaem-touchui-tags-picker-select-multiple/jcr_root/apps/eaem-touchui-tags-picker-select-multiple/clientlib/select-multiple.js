(function($, $document) {
    var TAGS_FIELD = "./jcr:content/metadata/cq:tags",
        SELECTED_TAGS_DIV = "eaem-column-view-selections",
        FOUNDATION_SELECTIONS_CHANGE = "foundation-selections-change",
        FOUNDATION_SELECTIONS_ITEM = "foundation-selections-item",
        FOUNDATION_COLLECTION = ".foundation-collection",
        FOUNDATION_COLLECTION_ITEM_VALUE = "foundation-picker-collection-item-value",
        $tagsContainer,
        extended = false;

    $document.on("foundation-contentloaded", handleTagsPicker);

    function handleTagsPicker(){
        if(extended){
            return;
        }

        var $tagsField = $("foundation-autocomplete[name='" + TAGS_FIELD + "']");

        if(_.isEmpty($tagsField)){
            return;
        }

        var pathField = $tagsField[0];

        extended = true;

        extendPicker(pathField);
    }

    function extendPicker(pathField){
        var origShowPicker = pathField._showPicker,
            origSetSelections = pathField._setSelections;

        pathField._showPicker = function(){
            origShowPicker.call(this);

            var $dialog = $(this._picker.el),
                $columnView = $dialog.find("coral-columnview");

            addSelectedSection($columnView);

            $dialog.on(FOUNDATION_SELECTIONS_CHANGE, FOUNDATION_COLLECTION, collectTags);
        };

        pathField._setSelections = function(selections, deferChangeEvent){
            var $tags = $tagsContainer.find("coral-tag"), selectedTags = [];

            _.each($tags, function(tag){
                selectedTags.push({
                    text: $(tag).find("coral-tag-label").html(),
                    value: tag.value
                });
            });

            origSetSelections.call(this, selectedTags, deferChangeEvent);
        }
    }

    function collectTags(){
        var $tag, tagValue, selectedTags = {};

        $("." + FOUNDATION_SELECTIONS_ITEM).each(function(index, tag){
            $tag = $(tag);

            tagValue = $tag.data(FOUNDATION_COLLECTION_ITEM_VALUE);

            if(_.isEmpty(tagValue)){
                return;
            }

            selectedTags[tagValue] = $tag.data("foundation-picker-collection-item-text");
        });

        buildSelectedContainer(selectedTags, $tagsContainer);
    }

    function buildSelectedContainer(selectedTags, $container) {
        if(_.isEmpty(selectedTags)){
            return;
        }

        var $tagList = $container.find("coral-taglist");

        _.each(selectedTags, function (text, value) {
            $tagList.append(getTagHtml(text, value));
        });
    }

    function getTagHtml(title, value){
        return '<coral-tag class="coral3-Tag" value="' + value + '">' +
                    '<coral-tag-label>' + title + '</coral-tag-label>' +
                '</coral-tag>';
    }

    function addSelectedSection($columnView){
        $columnView.css("height", "70%");

        $tagsContainer = $("<div/>").appendTo($columnView.parent());

        var html =  "<div style='text-align:center; padding:1px; background-color: rgba(0,0,0,0.05)'>" +
                        "<h3>Selected Tags</h3>" +
                    "</div>" +
                    "<div style='margin: 15px' id='" + SELECTED_TAGS_DIV + "'>" +
                        "<coral-taglist class='coral3-TagList'></coral-taglist>" +
                    "</div>";

        $(html).appendTo($tagsContainer);
    }
})(jQuery, jQuery(document));