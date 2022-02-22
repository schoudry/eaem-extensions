(function ($, $document) {
    const FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        GRANITE_OMNI_SEARCH_CONTENT = ".granite-omnisearch-content",
        SITES_EDIT_ACTIVATOR = "cq-siteadmin-admin-actions-edit-activator",
        START_WF_URL = "/mnt/override/libs/wcm/core/content/common/startbulkworkflows.html",
        CREATE_WF_BUT_URL = "/apps/eaem-omni-search-create-workflow/create-wf-but.html";

    let init = false;

    $document.on(FOUNDATION_CONTENT_LOADED, GRANITE_OMNI_SEARCH_CONTENT, function(event){
        $.ajax(CREATE_WF_BUT_URL).done(function(html){
            init = addCreateButton(html);
        });
    });

    function addCreateButton(html){
        html = html || "";

        if(!html.trim()){
            return;
        }

        const $eActivator = $("." + SITES_EDIT_ACTIVATOR);

        if ($eActivator.length == 0) {
            return false;
        }

        let $createWFBut = $("<coral-actionbar-item>" + html + "</coral-actionbar-item>")
                                .insertBefore($eActivator.closest("coral-actionbar-item"));

        $createWFBut = $createWFBut.find("button");

        $createWFBut.click(startWorkflow);

        return true;
    }

    function startWorkflow(){
        const $selectedItems = $(".foundation-selections-item");

        if($selectedItems.length == 0){
            return;
        }

        let startWfUrl = START_WF_URL + "?"

        $selectedItems.each(function(){
            startWfUrl = startWfUrl + "item=" + $(this).data("graniteCollectionItemId") + "&";
        })

        window.open(startWfUrl, '_blank');
    }
})(jQuery, jQuery(document));