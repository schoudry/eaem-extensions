(function ($document, gAuthor) {
    $(extendComponentInsert);

    function extendComponentInsert(){
        gAuthor.edit.ToolbarActions.INSERT.handler = function eaemOpenInsertDialog(executeDlgFn){
            return function (editable) {
                gAuthor.components.allowedComponents.sort(sortFn);

                executeDlgFn.call(this, editable);
            }
        }(gAuthor.edit.ToolbarActions.INSERT.handler);
    }

    function sortFn(comp1, comp2){
        try{
            return comp1.componentConfig.title.localeCompare(comp2.componentConfig.title)
        }catch(err){
            console.log("Error doing compare", err);
        }
    }
})($(document), Granite.author);