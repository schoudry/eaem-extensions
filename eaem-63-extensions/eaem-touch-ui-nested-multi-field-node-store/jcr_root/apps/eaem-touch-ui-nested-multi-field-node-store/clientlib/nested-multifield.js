(function ($, $document) {
    var EAEM_NESTED = "eaem-nested",
        DATA_EAEM_NESTED = "data-" + EAEM_NESTED,
        CFFW = ".coral-Form-fieldwrapper",
        NODE_STORE = "NODE_STORE";

    if(CUI.Multifield.eaemNMFExtended){
        return;
    }

    CUI.Multifield.eaemNMFExtended = true;

    function isNodeStoreMultifield(type) {
        return (type === NODE_STORE);
    }

    function isSelectOne($field) {
        return !_.isEmpty($field) && ($field.prop("type") === "select-one");
    }

    function setSelectOne($field, value) {
        var select = $field.closest(".coral-Select").data("select");

        if (select) {
            select.setValue(value);
        }
    }

    function isCheckbox($field) {
        return !_.isEmpty($field) && ($field.prop("type") === "checkbox");
    }

    function setCheckBox($field, value) {
        $field.prop("checked", $field.attr("value") === value);
    }

    function isDateField($field) {
        return !_.isEmpty($field) && $field.parent().hasClass("coral-DatePicker");
    }

    function setDateField($field, value) {
        var date = moment(new Date(value)),
            $parent = $field.parent();

        $parent.find("input.coral-Textfield").val(date.format($parent.data("displayed-format")));

        $field.val(date.format($parent.data("stored-format")));
    }

    function isTagsField($fieldWrapper) {
        return !_.isEmpty($fieldWrapper) && ($fieldWrapper.children(".js-cq-TagsPickerField").length > 0);
    }

    function getTagsFieldName($fieldWrapper) {
        return $fieldWrapper.children(".js-cq-TagsPickerField").data("property-path").substr(2);
    }

    function getTagObject(tag){
        var tagPath = "/etc/tags/" + tag.replace(":", "/");
        return $.get(tagPath + ".tag.json");
    }

    function setTagsField($fieldWrapper, tags) {
        if(_.isEmpty(tags)){
            return;
        }

        var cuiTagList = $fieldWrapper.find(".coral-TagList").data("tagList");

        _.each(tags, function(tag){
            getTagObject(tag).done(function(data){
                cuiTagList._appendItem( { value: data.tagID, display: data.titlePath} );
            });
        });
    }

    function isMultifield($formFieldWrapper){
        return ($formFieldWrapper.children("[data-init='multifield']").length > 0);
    }

    function setWidgetValue($field, value) {
        if (_.isEmpty($field)) {
            return;
        }

        if(isSelectOne($field)) {
            setSelectOne($field, value);
        }else if(isCheckbox($field)) {
            setCheckBox($field, value);
        }else if(isDateField($field)) {
            setDateField($field, value);
        }else {
            $field.val(value);
        }
    }

    function getMultifields($formField, isInner){
        var mNames = {}, mName, $multifield, $template,
            $multiTemplates = $formField.find(".js-coral-Multifield-input-template");

        $multiTemplates.each(function (i, template) {
            $template = $(template);
            $multifield = $($template.html());

            if(!isInner && !isNodeStoreMultifield($multifield.data(EAEM_NESTED))){
                return;
            }

            mName = $multifield.data("name").substring(2);

            mNames[mName] = $template.closest(".coral-Multifield");
        });

        return mNames;
    }

    function buildMultifield(data, $multifield, mName){
        var $formFieldWrapper, $field, $fieldSet, name,
            innerMultifields;

        _.each(data, function (value, key) {
            if(key.indexOf("jcr:") === 0){
                return;
            }

            $multifield.children(".js-coral-Multifield-add").click();

            $fieldSet = $multifield.find(".coral-Form-fieldset").last();

            _.each($fieldSet.find(CFFW), function (formFieldWrapper) {
                $formFieldWrapper = $(formFieldWrapper);

                if(isMultifield($formFieldWrapper)){
                    innerMultifields = getMultifields($formFieldWrapper, true);

                    _.each(innerMultifields, function($innerMultifield, nName){
                        buildMultifield(value[nName], $innerMultifield, nName);
                    });

                    return;
                }else if(isTagsField($formFieldWrapper)){
                    setTagsField($formFieldWrapper, value[getTagsFieldName($formFieldWrapper)]);
                    return;
                }

                $field = $formFieldWrapper.find("[name]");

                if(_.isEmpty($field)){
                    return;
                }

                name = $field.attr("name").substr(2);

                if(_.isEmpty(value[name])){
                    return;
                }

                setWidgetValue($field, value[name]);
            });
        })
    }

    function addDataInFields() {
        $document.on("dialog-ready", dlgReadyHandler);

        function dlgReadyHandler() {
            var outerMultifields = getMultifields($(this), false),
                $form = $("form.cq-dialog"),
                actionUrl = $form.attr("action") + ".infinity.json";

            $.ajax(actionUrl).done(postProcess);

            function postProcess(data){
                _.each(outerMultifields, function($outerMultifield, mName){
                    buildMultifield(data[mName], $outerMultifield, mName);
                });
            }
        }
    }

    function fillValue($form, fieldSetName, $field, counter){
        var name = $field.attr("name"), value;

        if (!name) {
            return;
        }

        if (name.indexOf("./") === 0) {
            name = name.substring(2);
        }

        value = $field.val();

        if (isCheckbox($field)) {
            value = $field.prop("checked") ? $field.val() : "";
        }

        //remove the field, so that individual values are not POSTed
        $field.remove();

        $('<input />').attr('type', 'hidden')
            .attr('name', fieldSetName + "/" + counter + "/" + name)
            .attr('value', value)
            .appendTo($form);
    }

    function addNestedMultifieldData($form, outerMultiName, $nestedMultiField){
        var $fieldSets = $nestedMultiField.find("[class='coral-Form-fieldset']"),
            nName = $fieldSets.data("name"), $fields;

        if(!nName){
            return;
        }

        nName = outerMultiName + "/" + nName.substring(2);

        $fieldSets.each(function (iCounter, fieldSet) {
            $fields = $(fieldSet).find("[name]");

            $fields.each(function (counter, field) {
                fillValue($form, nName, $(field), (iCounter + 1));
            });
        });
    }

    function collectDataFromFields(){
        $document.on("click", ".cq-dialog-submit", collectHandler);

        function collectHandler() {
            var $form = $(this).closest("form.foundation-form"),
                mName = $("[" + DATA_EAEM_NESTED + "]").data("name"),
                $fieldSets = $("[" + DATA_EAEM_NESTED + "][class='coral-Form-fieldset']");

            var $fields, $field, name, $nestedMultiField;

            $fieldSets.each(function (oCounter, fieldSet) {
                $fields = $(fieldSet).children().children(CFFW);

                $fields.each(function (counter, field) {
                    $field = $(field);

                    //may be a nested multifield
                    $nestedMultiField = $field.find("[data-init='multifield']");

                    if($nestedMultiField.length == 0){
                        fillValue($form, mName, $(field).find("[name]"), (oCounter + 1));
                    }else{
                        addNestedMultifieldData($form, mName + "/" + (oCounter + 1) , $nestedMultiField);
                    }
                });
            });
        }
    }

    $document.ready(function () {
        addDataInFields();
        collectDataFromFields();
    });

    //extend otb multifield for adjusting event propagation when there are nested multifields
    //for working around the nested multifield add and reorder
    CUI.Multifield = new Class({
        toString: "Multifield",
        extend: CUI.Multifield,

        construct: function () {
            this.script = this.$element.find(".js-coral-Multifield-input-template:last");
        },

        _addListeners: function () {
            this.superClass._addListeners.call(this);

            //otb coral event handler is added on selector .js-coral-Multifield-add
            //any nested multifield add click events are propagated to the parent multifield
            //to prevent adding a new composite field in both nested multifield and parent multifield
            //when user clicks on add of nested multifield, stop the event propagation to parent multifield
            this.$element.on("click", ".js-coral-Multifield-add", function (e) {
                e.stopPropagation();
            });

            this.$element.on("drop", function (e) {
                e.stopPropagation();
            });
        }
    });

    CUI.Widget.registry.register("multifield", CUI.Multifield);
})(jQuery, jQuery(document));