(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        FOUNDATION_DATA_MODEL_LOADED = "foundation-model-dataloaded",
        UPDATE_TASK_FORM = "#updatetaskform,#updateworkitemform",
        COMPLETE_TASK = "[type=submit]",
        completeAllAdded = false,
        doCompleteAll = false, taskData = {},
        fui = $(window).adaptTo("foundation-ui"),
        COMPLETE_ALL_BUT_URL = "/apps/eaem-inbox-complete-all/button/complete-all-selected.html";

    $document.on(FOUNDATION_CONTENT_LOADED, function(){
        var $form = $(UPDATE_TASK_FORM);

        if(_.isEmpty($form) || completeAllAdded){
            return;
        }

        completeAllAdded = true;

        $.ajax(COMPLETE_ALL_BUT_URL).done(addCompleteAllButton);

        $form.on(FOUNDATION_DATA_MODEL_LOADED, completeTasks);
    });

    function setWidgetValue($field, value){
        if(isSelectOne($field)){
            setSelectOne($field, value);
        }else{
            $field.val(value);
        }
    }

    function fillFormData(){
        if(_.isEmpty(taskData)){
            return;
        }

        var $form = $(UPDATE_TASK_FORM), $field;

        _.each(taskData, function(value, name){
            $field = $form.find("[name='" + name + "']");

            if(_.isEmpty($field)){
                return;
            }

            setWidgetValue($field, value);
        })
    }

    function completeTasks(){
        if(!doCompleteAll) {
            return;
        }

        fillFormData();

        $(UPDATE_TASK_FORM).submit();

        var store = Granite.UI.Extension.DataStore;

        if(!store.hasItems()){
            doCompleteAll = false;

            fui.clearWait();
        }
    }

    function addCompleteAllButton(html){
        doCompleteAll = false;

        var $completeTask = $(COMPLETE_TASK),
            $completeAll = $(html).insertAfter($completeTask);

        $completeTask.closest("div").removeAttr("style");

        $completeAll.click(function(){
            doCompleteAll = true;

            var $form = $(UPDATE_TASK_FORM),
                store = Granite.UI.Extension.DataStore;

            if(store.getSize() > 1){
                fui.wait();
                taskData = queryParameters($form.serialize());
            }

            $form.submit();
        })
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

    function queryParameters(searchStr) {
        var result = {}, param,
            params = (searchStr ? searchStr.split(/\?|\&/) : document.location.search.split(/\?|\&/));

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }
}($, $(document)));