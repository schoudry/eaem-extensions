(function ($, author) {
    "use strict";

    if (typeof window.ASK == "undefined") {
        window.ASK = {};
    }

    ASK.highlight = highlight;
    ASK.delete = deleteEditable;

    function highlight(current, param, target){
        fadeOut(author.store, current);
    }

    function isPar(editable){
        return editable.path == "/content/geometrixx/en/jcr:content/par";
    }

    function fadeOut(editables, current){
        $.each(editables, function(i, editable){
            if(isPar(editable) || (editable.path == current.path)){
                return;
            }

            editable.dom.fadeTo(3000, editable.dom.css('opacity') == 1 ? 0.04 : 1);
        })
    }

    function deleteEditable(){
        var editables =  author.selection.getAllSelected();

        author.selection.deselectAll();

        author.edit.actions.doDelete(editables);

        author.edit.actions.cleanUp();
    }
})($, Granite.author);
