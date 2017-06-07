(function ($, $document) {
    var CREATE_PAGE_WIZARD_URL = "/mnt/overlay/wcm/core/content/sites/createpagewizard.html",
        PATH_BROWSER = "/apps/eaem-touch-ui-create-page-select-loc/content/path.html",
        PATH_BROWSE_NAME = "[name='eaemPath']",
        FORM_CREATE_PAGE = "form.cq-siteadmin-admin-createpage",
        FOUNDATION_CONTENTLOADED = "foundation-contentloaded",
        PARENT_PATH = "parentPath",
        TAGS_FIELD = "[data-fieldname='./cq:tags']";

    if(window.location.pathname.indexOf(CREATE_PAGE_WIZARD_URL) !== 0){
        return;
    }

    $document.on(FOUNDATION_CONTENTLOADED, addPathBrowser);

    function addPathBrowser(){
        if(!_.isEmpty($(PATH_BROWSE_NAME))){
            return;
        }

        $.ajax(PATH_BROWSER).done(handler);

        function handler(html){
            var $tagsField = $(TAGS_FIELD).closest(".foundation-field-editable");

            if(_.isEmpty($tagsField)){
                return;
            }

            var $pathBrowser = $(html).insertAfter($tagsField),
                currentPath = $("[name='" + PARENT_PATH + "']").val();

            $pathBrowser.find('input').val(currentPath);

            $document.trigger(FOUNDATION_CONTENTLOADED);

            $(FORM_CREATE_PAGE).submit(function() {
                $("[name='" + PARENT_PATH + "']").val($pathBrowser.find('input').val());
            });
        }
    }
}(jQuery, jQuery(document)));