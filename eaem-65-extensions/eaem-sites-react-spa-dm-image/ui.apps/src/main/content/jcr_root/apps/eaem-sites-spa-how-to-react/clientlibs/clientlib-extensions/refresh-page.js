(function($, $document){
    var EAEM_COMPONENTS = "eaem-sites-spa-how-to-react/",
        EAEM_SPA_COMP_REFRESH_EVENT = "eaem-spa-component-refresh-event";

    $document.on("cq-editables-loaded", overrideSPAImageCompRefresh);

    function overrideSPAImageCompRefresh(){
        var _origExec = Granite.author.edit.EditableActions.REFRESH.execute;

        Granite.author.edit.EditableActions.REFRESH.execute = function(editable, config){
            if(editable.type.startsWith(EAEM_COMPONENTS)){
                $.ajax(editable.slingPath).done(function(compData){
                    sendComponentRefreshEvent(editable, compData);
                });
            }

            return _origExec.call(this, editable, config);
        };
    }

    function sendComponentRefreshEvent(editable, compData){
        let event = new CustomEvent(EAEM_SPA_COMP_REFRESH_EVENT, {
            detail: {
                type: editable.type,
                path: editable.path,
                slingPath: editable.slingPath,
                data: compData
            }
        });

        window.dispatchEvent(event);
    }
}(jQuery, jQuery(document)));