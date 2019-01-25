(function ($, $document) {
    var PATH_FIELD_PICKER = "#granite-ui-pathfield-picker-collection",
        CUSTOM_SEARCH_FIELD = ".eaem-touchui-pathfield-picker-search-field",
        CUSTOM_FIELDS_URL = "/apps/eaem-touchui-pathfield-picker-search-fields/custom-search/form.html";

    $document.on("coral-cyclebutton:change", ".granite-toggleable-control", handlePathFieldPicker);

    function handlePathFieldPicker(event){
        if(_.isEmpty($(PATH_FIELD_PICKER))){
            return;
        }

        var selectedEl = event.originalEvent.detail.selection,
            target = selectedEl.dataset.graniteToggleableControlTarget;

        if(!_.isEmpty($(target).find(CUSTOM_SEARCH_FIELD))){
            return;
        }

        addSearchFields(target);
    }

    function addSearchFields(target){
        var ui = $(window).adaptTo("foundation-ui");

        ui.wait();

        $.ajax(CUSTOM_FIELDS_URL).done(function(html){
            $(target).find(".coral-Form-fieldwrapper:last").after(html);
            ui.clearWait();
        });
    }
}(jQuery, jQuery(document)));