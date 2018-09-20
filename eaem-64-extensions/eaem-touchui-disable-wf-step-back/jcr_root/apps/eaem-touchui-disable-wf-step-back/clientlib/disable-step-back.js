(function ($, $document, gAuthor) {
    "use strict";

    var _ = window._,
        EDITOR_URL = "/editor.html",
        REQ_FOR_ACT_MODEL = "/var/workflow/models/request_for_activation",
        DISABLE_MESSAGE = "Step back not allowed for 'Request for Activation' workflow",
        WF_ACTION_STEP_BACK = "workflow-stepback",
        WF_STATUS_TYPE = "workflow";

    if(isAuthoring()){
        $document.one("cq-editor-statusbar-loaded", disableStepBackOnPage);
    }else{
        $document.one('foundation-contentloaded', disableStepBackOnInBox);
    }

    function disableStepBackOnInBox(){
        overrideStepBack();
    }

    function disableStepBackOnPage(){
        if(!gAuthor){
            return;
        }

        var wfStatus = getWFStatus();

        if(!wfStatus){
            return;
        }

        var stepBackId = wfStatus.actionIds.findIndex(function(ele){
            return (ele == WF_ACTION_STEP_BACK);
        });

        if(stepBackId < 0){
            return;
        }

        var $status = $(gAuthor.ui.statusBarManager.getStatusBar().status),
            $stepBack = $status.find("[data-status-action-id='" + WF_ACTION_STEP_BACK + "']");

        $stepBack.css("color", "#777777");

        overrideStepBack();
    }

    function overrideStepBack(){
        var origFn = window.CQ.Inbox.UI.commons.stepBackWorkitem;

        window.CQ.Inbox.UI.commons.stepBackWorkitem = eaemStepBackWorkitem;

        function eaemStepBackWorkitem(workitemId, successURL){
            $.ajax(getWorkflowId(workitemId) + ".json").done(function(data){
                if(data.model != REQ_FOR_ACT_MODEL){
                    return origFn(workitemId, successURL);
                }

                showAlert(DISABLE_MESSAGE, "Disabled");
            });
        }
    }

    function showAlert(message, title, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "warning", options, callback);
    }

    function getWFStatus(){
        var statusBar = gAuthor.ui.statusBarManager.getStatusBar(),
            wfStatus;

        _.each(statusBar.statuses, function(status){
            if(status.statusType == WF_STATUS_TYPE){
                wfStatus = status;
            }
        });

        return wfStatus;
    }

    function getWorkflowId(workitemId){
        return workitemId.substring(0, workitemId.indexOf("/workItems"));
    }

    function isAuthoring() {
        return (window.location.pathname.indexOf(EDITOR_URL) === 0);
    }
}(jQuery, jQuery(document), Granite.author));
