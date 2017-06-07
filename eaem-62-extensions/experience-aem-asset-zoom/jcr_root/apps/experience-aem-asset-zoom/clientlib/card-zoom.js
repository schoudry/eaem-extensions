(function ($, $document) {
    var FOUNDATION_MODE_CHANGE = "foundation-mode-change",
        DAM_ADMIN_CHILD_PAGES = ".cq-damadmin-admin-childpages",
        META_TYPE = "data-foundation-collection-meta-type",
        LAYOUT_CARD_VIEW = "card",
        ASSET_DETAIL = "/libs/dam/gui/content/assetdetails/jcr:content/content/items/assetdetail.html";

    $document.on(FOUNDATION_MODE_CHANGE, function(event){
        _.defer(function(){
            contentLoaded(event);
        });
    });

    function contentLoaded(){
        var $childPage = $(DAM_ADMIN_CHILD_PAGES),
            foundationLayout = $childPage.data("foundation-layout");

        if(_.isEmpty(foundationLayout)){
            return;
        }

        var layoutId = foundationLayout.layoutId;

        if(layoutId !== LAYOUT_CARD_VIEW){
            return;
        }

        var $items = $("coral-masonry-item"), $item,
            dialog = getZoomDialog();

        $items.each(function(){
            $item = $(this);

            if($item.find("[" + META_TYPE + "]").attr(META_TYPE) !== "asset"){
                return;
            }

            var $action = getZoomAction(dialog).appendTo($item);

            $item.mouseenter(function(){
                $action.show();
            });

            $item.mouseleave(function(){
                $action.hide();
            })
        });
    }

    function getZoomDialog(){
        var dialog = new Coral.Dialog().set({
            closable: "on",
            header: {
                innerHTML: 'Zoom'
            },
            content: {
                innerHTML: getZoomDialogContent()
            }
        });

        var uiAdjust = { "left" : "0%", "margin-left" : "0px", "max-width" : "100%" };

        dialog.$.find(".coral-Dialog-wrapper").css(uiAdjust);

        return dialog;
    }

    function getZoomDialogContent(){
        var vpWidth = $(window).width() - 30,
            vpHeight = $(window).height() - 110;

        return "<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen width='"
            + vpWidth + "px' height='" + vpHeight + "px' scrolling='no' frameBorder='0'></iframe>";
    }

    function getZoomAction(dialog){
        return $(getHtml()).hide().click(clickHandler);

        function clickHandler(event){
            event.stopPropagation();

            var assetPath = $(this).closest(".foundation-collection-item").data("foundationCollectionItemId");

            dialog.$.find("iframe").attr("src", ASSET_DETAIL + assetPath);

            dialog.show();
        }
    }

    function getHtml(){
        return '<button style="position: absolute;top: 35%;left: 35%;z-index: 10000;cursor: zoom-in;"' +
                    ' class="coral-Button coral-Button--square coral-QuickActions-button">' +
                    '<coral-icon icon="zoomIn"></coral-icon>' +
                '</button>';
    }
})(jQuery, jQuery(document));