(function($, $document){

    $document.on("dialog-ready", initPositioningContainerDialog);

    function initPositioningContainerDialog(){
        addSliderListener();
    }

    function addSliderListener(){
        var $sliders = $(".eaem-dialog-slider");

        $sliders.each(function(){
            var $slider = $(this);

            $slider.find("span").html()
        })
    }
}(jQuery, jQuery(document)));