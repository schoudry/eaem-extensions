(function ($, $document) {
    var WORKFLOW_DIALOG_CLASS = "cq-common-admin-timeline-toolbar-actions-workflow",
        SHOW_MODELS_WITH_PREFIX = "EAEM";

    $document.on('foundation-contentloaded', handleWorkflowList);

    function handleWorkflowList(event){
        var $target = $(event.target);

        if(!$target.hasClass(WORKFLOW_DIALOG_CLASS)){
            return;
        }

        var $wfSelect = $target.find("coral-select");

        if(_.isEmpty($wfSelect)){
            return;
        }

        _.each($wfSelect[0].items.getAll(), function(item){
            if(canShow(item.innerText)){
                return;
            }

            item.remove();
        })
    }

    function canShow(text){
        if(_.isEmpty(text)){
            return true;
        }

        return (text.trim().indexOf(SHOW_MODELS_WITH_PREFIX) == 0);
    }
}(jQuery, jQuery(document), Granite.author));