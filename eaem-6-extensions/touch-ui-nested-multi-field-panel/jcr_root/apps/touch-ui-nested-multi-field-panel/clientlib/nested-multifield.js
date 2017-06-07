(function () {
    var DATA_EAEM_NESTED = "data-eaem-nested";
    var CFFW = ".coral-Form-fieldwrapper";

    //reads multifield data from server, creates the nested composite multifields and fills them
    var addDataInFields = function () {
        $(document).on("dialog-ready", function() {
            var mName = $("[" + DATA_EAEM_NESTED + "]").data("name");

            if(!mName){
                return;
            }

            //strip ./
            mName = mName.substring(2);

            var $fieldSets = $("[" + DATA_EAEM_NESTED + "][class='coral-Form-fieldset']"),
                $form = $fieldSets.closest("form.foundation-form");

            var actionUrl = $form.attr("action") + ".json";

            var postProcess = function(data){
                if(!data || !data[mName]){
                    return;
                }

                var mValues = data[mName], $field, name;

                if(_.isString(mValues)){
                    mValues = [ JSON.parse(mValues) ];
                }

                _.each(mValues, function (record, i) {
                    if (!record) {
                        return;
                    }

                    if(_.isString(record)){
                        record = JSON.parse(record);
                    }

                    _.each(record, function(rValue, rKey){
                        $field = $($fieldSets[i]).find("[name='./" + rKey + "']");

                        if(_.isArray(rValue) && !_.isEmpty(rValue)){
                            fillNestedFields( $($fieldSets[i]).find("[data-init='multifield']"), rValue);
                        }else{
                            $field.val(rValue);
                        }
                    });
                });
            };

            //creates & fills the nested multifield with data
            var fillNestedFields = function($multifield, valueArr){
                _.each(valueArr, function(record, index){
                    $multifield.find(".js-coral-Multifield-add").click();

                    //a setTimeout may be needed
                    _.each(record, function(value, key){
                        var $field = $($multifield.find("[name='./" + key + "']")[index]);
                        $field.val(value);
                    })
                })
            };

            $.ajax(actionUrl).done(postProcess);
        });
    };

    var fillValue = function($field, record){
        var name = $field.attr("name");

        if (!name) {
            return;
        }

        //strip ./
        if (name.indexOf("./") == 0) {
            name = name.substring(2);
        }

        record[name] = $field.val();

        //remove the field, so that individual values are not POSTed
        $field.remove();
    };

    //for getting the nested multifield data as js objects
    var getRecordFromMultiField = function($multifield){
        var $fieldSets = $multifield.find("[class='coral-Form-fieldset']");

        var records = [], record, $fields, name;

        $fieldSets.each(function (i, fieldSet) {
            $fields = $(fieldSet).find("[name]");

            record = {};

            $fields.each(function (j, field) {
                fillValue($(field), record);
            });

            if(!$.isEmptyObject(record)){
                records.push(record)
            }
        });

        return records;
    };

    //collect data from widgets in multifield and POST them to CRX as JSON
    var collectDataFromFields = function(){
        $(document).on("click", ".cq-dialog-submit", function () {
            var $form = $(this).closest("form.foundation-form");

            var mName = $("[" + DATA_EAEM_NESTED + "]").data("name");
            var $fieldSets = $("[" + DATA_EAEM_NESTED + "][class='coral-Form-fieldset']");

            var record, $fields, $field, name, $nestedMultiField;

            $fieldSets.each(function (i, fieldSet) {
                $fields = $(fieldSet).children().children(CFFW);

                record = {};

                $fields.each(function (j, field) {
                    $field = $(field);

                    //may be a nested multifield
                    $nestedMultiField = $field.find("[data-init='multifield']");

                    if($nestedMultiField.length == 0){
                        fillValue($field.find("[name]"), record);
                    }else{
                        name = $nestedMultiField.find("[class='coral-Form-fieldset']").data("name");

                        if(!name){
                            return;
                        }

                        //strip ./
                        name = name.substring(2);

                        record[name] = getRecordFromMultiField($nestedMultiField);
                    }
                });

                if ($.isEmptyObject(record)) {
                    return;
                }

                //add the record JSON in a hidden field as string
                $('<input />').attr('type', 'hidden')
                    .attr('name', mName)
                    .attr('value', JSON.stringify(record))
                    .appendTo($form);
            });
        });
    };

    $(document).ready(function () {
        addDataInFields();
        collectDataFromFields();
    });

    //extend otb multifield for adjusting event propagation when there are nested multifields
    //for working around the nested multifield add and reorder
    CUI.Multifield = new Class({
        toString: "Multifield",
        extend: CUI.Multifield,

        construct: function (options) {
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
})();