(function($, $document){
    var IMAGE_COMP_RES_TYPE = "eaem-sites-spa-how-to-react/components/image";

    $document.on("cq-editables-loaded", overrideSPAImageCompRefresh);

    function overrideSPAImageCompRefresh(){
        var _origExec = Granite.author.edit.EditableActions.REFRESH.execute;

        Granite.author.edit.EditableActions.REFRESH.execute = function(editable, config){
            if(editable.type == IMAGE_COMP_RES_TYPE){
                window.location.reload();
            }else{
                _origExec.call(this, editable, config);
            }
        };
    }
}(jQuery, jQuery(document)));