(function ($, $document) {
    "use strict";

    var SEL_BG_COLOR = "#9999ff",
        extended = false;

    if(extended){
        return;
    }

    extended = true;

    extendSetSelected();

    function extendSetSelected(){
        var elementImpl = CUI.rte.ui.cui.ElementImpl;

        if(!elementImpl){
            return;
        }

        var origFn = elementImpl.prototype.setSelected;

        elementImpl.prototype.setSelected = function (isSelected, suppressEvent) {
            origFn.call(this, isSelected, suppressEvent);
            this.$ui.css("background-color", isSelected ? SEL_BG_COLOR : "");
        }
    }
}(jQuery, jQuery(document)));
