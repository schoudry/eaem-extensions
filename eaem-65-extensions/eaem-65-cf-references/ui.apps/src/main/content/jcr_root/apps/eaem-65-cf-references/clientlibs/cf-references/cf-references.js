(function ($, $document) {
    "use strict";

    var _ = window._,
        initialized = false,
        FRAGMENT_INFO_PAGE = "/mnt/overlay/dam/cfm/admin/content/v2/metadata-editor.html",
        GET_REFERENCES_URL = "/libs/dam/content/schemaeditors/forms/references/items/tabs/items/tab1/items/col1/items/local-references/items/references.html";

    if (!isFragmentInfoPage()) {
        return;
    }

    init();

    function init(){
        if(initialized){
            return;
        }

        initialized = true;

        window.Dam.CFM.Core.registerReadyHandler(extendFragmentInfoPage);
    }

    function extendFragmentInfoPage(){
        var cfPath = getCFPath();

        $.ajax(GET_REFERENCES_URL + cfPath).done(function(html){
            var $secondColumn = $("[data-metatype=tags]").closest(".aem-assets-metadata-form-column");

            if($secondColumn.length === 0){

                $secondColumn = $("[name='./jcr:content/metadata/cq:tags']").closest(".aem-assets-metadata-form-column");

                if($secondColumn.length === 0){
                    return;
                }
            }

            addReferencesHtml($secondColumn, html);
        })
    }

    function addReferencesHtml($secondColumn, html){
        html = '<div class="coral-Form-fieldwrapper">' +
                    '<div class="coral-Form-fieldlabel" style="margin: 10px 0 5px 0">Page References</div>' + html +
                '</div>';

        $secondColumn.append(html);

        $secondColumn.find("thead").remove();
    }

    function getCFPath(){
        var path = window.location.pathname;

        return path.substring(path.indexOf(FRAGMENT_INFO_PAGE) + FRAGMENT_INFO_PAGE.length);
    }

    function isFragmentInfoPage() {
        return (window.location.pathname.indexOf(FRAGMENT_INFO_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));
