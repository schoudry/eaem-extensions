(function($, $document){
    var DIALOG_SLIDER = ".eaem-dialog-slider";

    $document.on("dialog-ready", initPositioningContainerDialog);

    function initPositioningContainerDialog(){
        addSliderListener();
    }

    function addSliderListener(){
        var $sliders = $(DIALOG_SLIDER);

        $sliders.each(function(){
            var $sliderValue = $(this),
                $slider = $sliderValue.prev(".coral-Form-fieldwrapper").find("coral-slider");

            if(_.isEmpty($slider)){
                return;
            }

            $slider.on("change", function(){
                $sliderValue.html($(this).val() + "%");
            });
        });
    }
}(jQuery, jQuery(document)));