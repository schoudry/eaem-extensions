(function ($) {
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

        window.Dam.CFM.Core.registerReadyHandler(() => {
            hideTabHeaders();

            addFieldGrouping();
        });
    }

    function hideTabHeaders(){
        $("coral-tablist").hide();
    }

    function addFieldGrouping(){
        $(FIELD_TYPE_SELECTOR).each(function(index, fieldTypeSelect){
            Coral.commons.ready(fieldTypeSelect, doVisibility);
        });
    }

    function doVisibility(fieldTypeSelect){
        const widgetItems = fieldTypeSelect.items.getAll();

        hideAllButThis(fieldTypeSelect.selectedItem.value);

        fieldTypeSelect.on("change", function() {
            hideAllButThis(this.value);
        });

        function hideAllButThis(doNotHide){
            _.each(widgetItems, (item) => {
                const $cffw = $("[name^='" + item.value + "_']").closest(CFFW);
                $cffw.css("display", ( doNotHide == item.value ) ? "block" : "none");
            })
        }
    }

    function isCFEditor(){
        return ((URL.indexOf("/editor.html") == 0)
            ||  (URL.indexOf("/mnt/overlay/dam/cfm/admin/content/v2/fragment-editor.html") == 0) )
    }
}(jQuery));