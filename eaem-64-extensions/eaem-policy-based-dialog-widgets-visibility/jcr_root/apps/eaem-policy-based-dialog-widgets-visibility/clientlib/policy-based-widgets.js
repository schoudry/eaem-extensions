(function ($, $document) {
    var EAEM_SHOW_FOR_CONTAINER_POLICY = "eaemshowforcontainerpolicy",
        HIDE_HTML = "<div style='font-weight: bold; text-align: center;  margin: 10px 0 10px 0'>"
                        + "Widget not supported in root layout container"
                    + "</div>";

    $document.on('dialog-ready', handleEditablePolicies);

    function handleEditablePolicies(){
        var containerPolicyRelPath = getParentResponsiveGridPolicyPath(getCurrentEditable());

        if(_.isEmpty(containerPolicyRelPath)){
            console.error("Experience AEM - Container Relative Policy Path in page not available");
            return;
        }

        var eTemplatePath = getEditableTemplatePath();

        if(_.isEmpty(eTemplatePath)){
            console.error("Experience AEM - Editable template path not available for current page");
            return;
        }

        var containerPolicyMappingPath = eTemplatePath + "/policies/jcr:content/" + containerPolicyRelPath;

        $.get(containerPolicyMappingPath + ".json").done(checkWidgetsAndPolicies);
    }

    function checkWidgetsAndPolicies(data){
        var policyRelPath = data["cq:policy"];

        if(_.isEmpty(policyRelPath)){
            console.error("Experience AEM - Policy Relative Path in template not available");
            return;
        }

        handleDialogWidgetsVisibility(policyRelPath);
    }

    function handleDialogWidgetsVisibility(policyRelPath){
        var $widgetsWithPolicySet = $("[data-" + EAEM_SHOW_FOR_CONTAINER_POLICY + "]"),
            $widget, value;

        _.each($widgetsWithPolicySet, function(widget){
            $widget = $(widget);

            value = $widget.data(EAEM_SHOW_FOR_CONTAINER_POLICY);

            if(value != policyRelPath){
                $widget.closest(".coral-Form-fieldwrapper").append(HIDE_HTML);
                $widget.remove();
            }
        });
    }

    function getEditableTemplatePath(){
        var gAuthor = Granite.author;

        if(!gAuthor  || !gAuthor.pageInfo){
            return "";
        }

        return gAuthor.pageInfo.editableTemplate;
    }

    function getCurrentEditable(){
        var gAuthor = Granite.author;

        if(!gAuthor  || !gAuthor.DialogFrame){
            return;
        }

        return gAuthor.DialogFrame.currentDialog.editable;
    }

    function getParentResponsiveGridPolicyPath(editable){
        if(!editable){
            return "";
        }

        var parent = editable, containerPolicyPath;

        do{
            if(!parent){
                break;
            }

            if(parent.config && parent.config.isResponsiveGrid){
                containerPolicyPath = parent.config.policyPath;
                break;
            }

            parent = parent.getParent();
        }while(true);

        return containerPolicyPath;
    }
}(jQuery, jQuery(document)));