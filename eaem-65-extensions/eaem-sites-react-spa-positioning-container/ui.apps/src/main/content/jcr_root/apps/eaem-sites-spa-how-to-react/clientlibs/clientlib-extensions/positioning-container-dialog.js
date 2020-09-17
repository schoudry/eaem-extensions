(function($, $document){
    var DIALOG_SLIDER = ".eaem-dialog-slider";

    $document.on("dialog-ready", initPositioningContainerDialog);

    function initPositioningContainerDialog(){
        addSliderListener();

        addContentAlignmentListner();
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

    function addContentAlignmentListner(){

    }
}(jQuery, jQuery(document)));