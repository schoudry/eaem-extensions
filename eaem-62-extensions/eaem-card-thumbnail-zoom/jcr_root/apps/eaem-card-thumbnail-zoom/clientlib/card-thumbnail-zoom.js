(function ($, $document) {
    var FOUNDATION_MODE_CHANGE = "foundation-mode-change",
        DAM_ADMIN_CHILD_PAGES = ".cq-damadmin-admin-childpages",
        ACTION_BAR = ".foundation-collection-actionbar",
        $zoomSlider,
        LAYOUT_CARD_VIEW = "card";

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
            if(!_.isEmpty($zoomSlider)){
                $zoomSlider.hide();
            }

            return;
        }

        addZoomSlider();
    }

    function addZoomSlider(){
        if(!_.isEmpty($zoomSlider)){
            $zoomSlider.show();
            $zoomSlider.find("input").trigger("change.slider");
            return;
        }

        var $actionBar = $(ACTION_BAR),
            $graniteRight = $actionBar.find(".granite-actionbar-right");

        $zoomSlider = $(getSliderHtml()).prependTo($graniteRight).find(".coral-Slider");

        CUI.Slider.init($zoomSlider, $document);

        $zoomSlider.find("input").on("change.slider", function(){
            $(DAM_ADMIN_CHILD_PAGES).attr("columnwidth", $(this).val());
        });

        $zoomSlider = $zoomSlider.parent("div");
    }

    function getSliderHtml(){
        return '<div class="granite-actionbar-item">' +
                    '<div style="margin: 10px 10px 0 0;display: inline-block;font-weight: bold;">Zoom</div>' +
                    '<div class="coral-Slider" data-init="slider">' +
                        '<input type="range" value="242" min="242" max="1642" step="200">' +
                    '</div>' +
                '</div>'
    }
})(jQuery, jQuery(document));