(function($, $document) {
    var TAGS_FIELD = "./jcr:content/metadata/cq:tags",
        TABLES_DIV = "eaem-column-view-selections",
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
        var origShowPicker = pathField._showPicker;

        pathField._showPicker = function(){
            origShowPicker.call(this);

            var $columnView = $(this._picker.el).find("coral-columnview");

            addSelectedSection($columnView);
        }
    }

    function addSelectedSection($columnView){
        $columnView.css("height", "70%");

        var $tagsContainer = $("<div/>").appendTo($columnView.parent());

        addHeader($tagsContainer);

        addNoSelFilesDiv($tagsContainer);
    }

    function addHeader($container) {
        var html =  "<div style='text-align:center; padding:1px; margin-bottom: 15px; background-color: rgba(0,0,0,0.05)'>" +
                        "<h3>Selected Tags</h3>" +
                    "</div>";

        return $(html).appendTo($container);
    }

    function addNoSelFilesDiv($container) {
        var html =  "<div style='text-align:center' id='" + TABLES_DIV + "'>" +
                        "No tags have been selected. Select a tag by clicking on tag thumnbnail" +
                    "</div>";

        return $(html).appendTo($container);
    }
})(jQuery, jQuery(document));