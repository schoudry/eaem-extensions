(function ($, $document) {
    const   URL = document.location.pathname,
            CFFW = ".coral-Form-fieldwrapper",
            FIELD_TYPE_SELECTOR = "coral-select[name$='FieldType']";
    let initialized = false;

    if( !isCFEditor() ){
        return;
    }

    init();

    function init(){
        if(initialized){
            return;
        }

        initialized = true;

        window.Dam.CFM.Core.registerReadyHandler(addFieldGrouping);
    }

    function addFieldGrouping(){
        $(FIELD_TYPE_SELECTOR).each(function(index, fieldTypeSelect){
            Coral.commons.ready(fieldTypeSelect, doGrouping);
        });

        function doGrouping(fieldTypeSelect){
            _.each(fieldTypeSelect.items.getAll(), (item) => {
                console.log(item.value);
            });
        }
    }

    function isCFEditor(){
        return ((URL.indexOf("/editor.html") == 0)
            ||  (URL.indexOf("/mnt/overlay/dam/cfm/admin/content/v2/fragment-editor.html") == 0) )
    }
}(jQuery, jQuery(document)));