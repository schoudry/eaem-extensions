(function (document, $) {
    "use strict";

    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded";
    var CREATE_FOLDER_ACTIVATOR = ".cq-damadmin-admin-actions-createfolder-activator";
    var E_AEM_SHOW_FOLDERS = "experience-aem-show-folders";
    var AEM_ASSETS_CREATE = "#aem-assets-create";

    $(document).on(FOUNDATION_CONTENT_LOADED, function(e){
        if($("#" + E_AEM_SHOW_FOLDERS).length > 0){
            return;
        }

        //if dynamic media is enabled /etc/dam/dynamicmediaconfig, the create folder changes to dropdown
        var $cFolder = $(AEM_ASSETS_CREATE) ;

        if($cFolder.length == 0){
            $cFolder = $(CREATE_FOLDER_ACTIVATOR);
        }

        if($cFolder.length == 0){
            return;
        }

        var $showFolderCheckBox = $("<span class='endor-ActionBar-item' style='line-height: 2.25em'>" +
            "<label  class='coral-Checkbox coral-Form-field'>" +
            "<input  type='checkbox' id='" + E_AEM_SHOW_FOLDERS + "' value='true' class='coral-Checkbox-input' />" +
            "<span class='coral-Checkbox-checkmark'></span>" +
            "<span class='coral-Checkbox-description'><b>Show Folders Only</b></span>" +
            "</label></span>");

        var $articles, $assets, gridsHtml;

        $showFolderCheckBox.insertAfter($cFolder).find("#" + E_AEM_SHOW_FOLDERS).change(function(){
            if(!$articles){
                $articles = $("article");
                $assets = $("[data-type='asset']");
            }

            var hide = this.checked, $grids = $("div[class^='grid-']");

            if($grids.length > 0 && !gridsHtml){
                gridsHtml = $grids.parent().html();
            }

            if(hide){
                $assets.hide();
            }else{
                $assets.show();
            }

            var $cards = $.find(".foundation-layout-card");

            //adjust the cards to fit in layout
            if($cards.length == 0){
                return;
            }

            var clazz = $grids.prop("class"),
                gIndex = parseInt(clazz.substr(clazz.indexOf("-") + 1), 10),
                assetType, index = 0;

            if(!hide && gridsHtml){
                $grids.parent().html(gridsHtml);
                return;
            }

            $grids.html("");

            var inGrid = Math.ceil( ( hide ? ($articles.length - $assets.length) : $articles.length ) / gIndex);

            $articles.each(function(i, article){
                if(hide){
                    assetType = $(article).find("[itemprop='assettype']");

                    if(assetType.length > 0 && assetType[0].innerHTML !== "FOLDER"){
                        return;
                    }
                }

                $($grids[ Math.floor(index++ / inGrid)]).append($(article));
            });
        });

        $(document).on(FOUNDATION_CONTENT_LOADED, function(e){
            $(document).on(FOUNDATION_CONTENT_LOADED, ".foundation-layout-columns", function(e) {
                $articles = $assets = gridsHtml = undefined;
                $("#" + E_AEM_SHOW_FOLDERS).prop( "checked", false );
            });

            //event not thrown on .foundation-layout-list, .foundation-layout-card sometimes, bug???
            $(document).on(FOUNDATION_CONTENT_LOADED, ".foundation-layout-util-maximized", function(e) {
                $articles = $assets = gridsHtml = undefined;
                $("#" + E_AEM_SHOW_FOLDERS).prop( "checked", false );
            });
        });
    });
})(document, jQuery);
