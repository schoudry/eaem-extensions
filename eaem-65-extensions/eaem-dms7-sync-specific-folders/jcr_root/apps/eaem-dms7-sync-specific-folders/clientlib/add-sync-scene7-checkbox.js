(function($, $document) {
    var FOLDER_SHARE_WIZARD = "/mnt/overlay/dam/gui/content/assets/v2/foldersharewizard.html",
        ASSETS_CONSOLE = "/assets.html",
        FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        SEL_DAM_ADMIN_CHILD_PAGES = ".cq-damadmin-admin-childpages",
        LAYOUT_CARD_VIEW = "card",
        EAEM_SYNC_TO_SCENE7 = "eaemSyncToScene7",
        EAEM_UPLOAD_SCENE7_PROPERTY = "eaem-upload-scene7-property",
        SYNC_TO_SCENE7_CB = "/apps/eaem-dms7-sync-specific-folders/ui/syncToScene7.html",url = document.location.pathname, $customTab;

    if( url.indexOf(FOLDER_SHARE_WIZARD) == 0 ){
        handleFolderProperties();
    }else if(url.indexOf(ASSETS_CONSOLE) == 0){
        $document.on("foundation-selections-change", SEL_DAM_ADMIN_CHILD_PAGES, showSyncUIIndicator);
    }

    function handleFolderProperties(){
        $document.on(FOUNDATION_CONTENT_LOADED, function(){
            $.ajax(SYNC_TO_SCENE7_CB).done(addSyncScene7CheckBox);
        });
    }

    function showSyncUIIndicator(e){
        if(!e.currentTarget){
            return;
        }

        var $currentTarget = $(e.currentTarget),
            foundationLayout = $currentTarget.data("foundation-layout");

        if(_.isEmpty(foundationLayout)){
            return;
        }

        var layoutId = foundationLayout.layoutId;

        if(layoutId !== LAYOUT_CARD_VIEW){
            return;
        }

        var path = $currentTarget.data("foundation-collection-id");

        $.ajax(path + ".2.json").done(function(data){
            $(".foundation-collection-item").each(function(index, item){
                itemHandler(data, layoutId, $(item) );
            });
        });

        function itemHandler(data, layoutId, $item){
            var itemPath = $item.data("foundation-collection-item-id"),
                itemName = getStringAfterLastSlash(itemPath);

            if( (layoutId !== LAYOUT_CARD_VIEW) || !_.isEmpty($item.find("." + EAEM_UPLOAD_SCENE7_PROPERTY))) {
                return;
            }

            if(!data[itemName] || !data[itemName]["jcr:content"] || !data[itemName]["jcr:content"][EAEM_SYNC_TO_SCENE7]){
                return;
            }

            var $cardProperties = $item.find("coral-card-content > coral-card-propertylist");
            $cardProperties.append(getScene7PropertyHtml());
        }

        function getScene7PropertyHtml(){
            return '<coral-card-property icon="upload" title="Uploads to Scene7" class="' + EAEM_UPLOAD_SCENE7_PROPERTY + '">' +
                        '<coral-card-property-content>Uploads to Scene7</coral-card-property-content>' +
                   '</coral-card-property>';
        }

        function getStringAfterLastSlash(str){
            if(!str || (str.indexOf("/") == -1)){
                return "";
            }

            return str.substr(str.lastIndexOf("/") + 1);
        }
    }

    function addSyncScene7CheckBox(html){
        var $tabView = $("coral-tabview");

        if(_.isEmpty($tabView)){
            return;
        }

        var detailsTab = $tabView[0]._elements.panelStack.querySelector("coral-panel:first-child");

        if(!detailsTab){
            return;
        }

        var $cbSyncToScene7 = $(html).appendTo($(detailsTab).find(".aem-assets-foldershare-details-container")),
            $form = $("form"),
            $submit = $("button[type=submit]");

        $.ajax($form.attr("action") + "/jcr:content.json").done(setSyncScene7ContentCB);

        $submit.click(handlerFolderPropertiesSubmit);

        function setSyncScene7ContentCB(fJcrContent){
            var $cb = $cbSyncToScene7.find("[type='checkbox']"),
                name = $cb.attr("name");

            if(_.isEmpty(fJcrContent[name])){
                return;
            }

            $cb[0].checked = true;

            $cbSyncToScene7.attr("disabled", "disabled");
        }

        function handlerFolderPropertiesSubmit(){
            var $cb = $cbSyncToScene7.find("[type='checkbox']"),
                data = {};

            if(!$cb[0].checked){
                return;
            }

            data[$cb.attr("name")] = $cb.val();

            $.post( $form.attr("action") + "/jcr:content", data );
        }
    }
})(jQuery, jQuery(document));