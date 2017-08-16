(function ($, $document) {
    var CONFIGURE_COLUMNS_FORM = "#aem-configure-columns",
        FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        ASSETS_CONFIGURE_COLUMNS_DIALOG = "aem-configure-columns-dialog",
        COOKIE_ASSET_LIST_VIEW_COLUMNS = "eaem.asset.listview.columns",
        AEM_COLUMN_CHOOSER = ".aem-ColumnChooser",
        COLUMNS_MODAL = "/apps/eaem-assets-list-view-columns/dialog/modal.html";

    $document.on(FOUNDATION_CONTENT_LOADED, function(event){
        _.defer(function(){
            handleContentLoad(event);
        });
    });

    function handleContentLoad(event){
        var target = event.target;

        if(isConfigureColumnsDialog(target)){
            addDynamicColumnsInModal();
        }
    }

    function isConfigureColumnsDialog(target){
        if(!target || (target.tagName !== "CORAL-DIALOG")){
            return false;
        }

        var $target = (!target.$ ? $(target) : target.$);

        return $target.hasClass(ASSETS_CONFIGURE_COLUMNS_DIALOG);
    }

    function addDynamicColumnsInModal(){
        $.ajax(COLUMNS_MODAL).done(handler);

        function handler(html){
            if(_.isEmpty(html)){
                return;
            }

            var columnsHtml = $("<div>" + html + "</div>").find(".aem-ColumnChooser").html();

            if(_.isEmpty(columnsHtml)){
                return;
            }

            $(AEM_COLUMN_CHOOSER).append(columnsHtml);

            checkEnabledColumns();
        }
    }

    function checkEnabledColumns(){
        var $colForm = $(CONFIGURE_COLUMNS_FORM),
            enabledColumns = getEnabledColumns();

        if(_.isEmpty(enabledColumns)){
            checkAll($colForm);
            return;
        }

        $colForm.find("[type=checkbox]").each(function(index, cb){
            var $cb = $(cb);

            if(!contains(enabledColumns, $cb.val())){
                return;
            }

            $cb.attr("checked", "checked");
        })
    }

    function getEnabledColumns(){
        var cookieValue = getCookie(COOKIE_ASSET_LIST_VIEW_COLUMNS);

        if(!cookieValue){
            cookieValue = [];
        }else{
            var arr = [];

            _.each(decodeURIComponent(cookieValue).split(","), function(val){
                if(_.isEmpty(val)){
                    return;
                }

                arr.push(val);
            });

            cookieValue = arr;
        }

        return cookieValue;
    }

    function getCookie(cookieName){
        var cookieValue = "";

        if(_.isEmpty(cookieName)){
            return;
        }

        var cookies = document.cookie.split(";"), tokens;

        _.each(cookies, function(cookie){
            tokens = cookie.split("=");

            if(tokens[0].trim() !== cookieName){
                return;
            }

            cookieValue = tokens[1].trim();
        });

        return cookieValue;
    }

    function contains(arrOrObj, key){
        var doesIt = false;

        if(_.isEmpty(arrOrObj) || _.isEmpty(key)){
            return doesIt;
        }

        if(_.isArray(arrOrObj)){
            doesIt = (arrOrObj.indexOf(key) !== -1);
        }

        return doesIt;
    }

    function checkAll($colForm){
        $colForm.find("[type=checkbox]").attr("checked", "checked");
    }
})(jQuery, jQuery(document));