(function($, $document) {
    var extended = false,
        FOUNDATION_SELECTIONS_CHANGE = "foundation-selections-change",
        FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        DAM_ADMIN_CHILD_PAGES_SEL = ".cq-damadmin-admin-childpages",
        REMOVE_EAEM_CB_SUFFIX = "-eaem-remove";

    $document.on(FOUNDATION_CONTENT_LOADED, addRemoveTags);

    $document.on(FOUNDATION_SELECTIONS_CHANGE, DAM_ADMIN_CHILD_PAGES_SEL , showHideRemoveCheckbox);

    function showHideRemoveCheckbox(event){
        var $collection = $(event.target),
            selectApi = $collection.adaptTo("foundation-selections"),
            count = selectApi.count(),
            $acFields = $("foundation-autocomplete"), $removeCB, $acField;

        _.each($acFields, function(acField){
            $acField = $(acField);

            $removeCB = getRemoveCheckBox($acField);

            if(count === 1){
                $removeCB.attr("disabled", "disabled");
            }else{
                $removeCB.removeAttr("disabled").removeAttr("checked");
            }
        });
    }

    function addRemoveTags(){
        if(extended){
            return;
        }

        var $acFields = $("foundation-autocomplete"), $acField,
            $removeCB, cbName;

        if(_.isEmpty($acFields)){
            return;
        }

        _.each($acFields, function(acField){
            $acField = $(acField);

            cbName = $acField.attr("name") + REMOVE_EAEM_CB_SUFFIX;

            if(!_.isEmpty(getRemoveCheckBox($acField)) || $acField.hasClass("granite-pickerdialog-searchfield")){
                return;
            }

            $removeCB = $(getRemoveHtml(cbName)).insertBefore($acField);
        });
    }

    function getRemoveCheckBox($acField){
        var cbName = $acField.attr("name") + REMOVE_EAEM_CB_SUFFIX;

        return $acField.prev("[name='" + cbName + "']");
    }

    function getRemoveHtml(cbName){
        return '<coral-checkbox class="coral-Form-field" name="' + cbName + '" value="true">Remove selected tags</coral-checkbox>';
    }
})(jQuery, jQuery(document));