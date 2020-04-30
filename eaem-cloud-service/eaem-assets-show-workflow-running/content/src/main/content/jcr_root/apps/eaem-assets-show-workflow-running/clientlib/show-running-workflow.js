(function($, $document){
    var F_CONTENT_LOADED = "foundation-contentloaded",
        WF_STATUS_API = "/content/dam/experience-aem.eaemworkflow.json",
        IN_WORKFLOW_STR = "In Workflow";

    $document.on(F_CONTENT_LOADED, addWorkflowBanner);

    function addWorkflowBanner(){
        $.ajax(WF_STATUS_API).done(handler);

        function handler(wfData){
            var $container = $(".foundation-collection-content"),
                $items = $container.find("coral-masonry-item");

            _.each($items, function(item){
                var itemPath = $item.data("granite-collection-item-id"),
                    $alert = $item.find("coral-card-info coral-alert coral-alert-content");

                if(_.isEmpty($alert.html()) || !$alert.html().startsWith(IN_WORKFLOW_STR)){
                    return;
                }

                var wfName = wfData[itemPath];

                if(!wfName){
                    return;
                }

                $alert.html(trunc(wfName));
            });
        }
    }

    function trunc(text){
        return text.length > 25 ? text.substring(0, 25) + "..." : text;
    }
}(jQuery, jQuery(document)));