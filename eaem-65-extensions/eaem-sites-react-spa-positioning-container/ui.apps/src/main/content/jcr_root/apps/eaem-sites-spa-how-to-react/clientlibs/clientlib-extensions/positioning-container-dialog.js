(function($, $document){
    var DIALOG_SLIDER = ".eaem-dialog-slider",
        DIALOG_CONTENT_ALIGN = ".eaem-dialog-content-align",
        DIALOG_FIELD_SELECTED = "eaem-dialog-content-selected";

    $document.on("dialog-ready", initPositioningContainerDialog);

    function initPositioningContainerDialog(){
        addSliderListener();

        addContentAlignmentListener();
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

    function addContentAlignmentListener(){
        var $contentAlignContainer = $(DIALOG_CONTENT_ALIGN),
            $contentAlignDisplay = $contentAlignContainer.find("div"),
            $contentAlign = $("[name='./contentAlignment']");

        addInitialPositions();

        $contentAlignContainer.find("coral-icon").click(function(){
            $(this).toggleClass(DIALOG_FIELD_SELECTED);

            calculatePositioning();
        });

        function addInitialPositions(){
            var alignments = $contentAlign.val();

            $contentAlignDisplay.html(alignments);

            _.each(alignments.split(","), function(alignment){
                var $icon = $contentAlignContainer.find("[data-content-align='" + alignment.trim() + "']");

                $icon.addClass(DIALOG_FIELD_SELECTED);
            })
        }

        function calculatePositioning(){
            var $alignIcons = $contentAlignContainer.find("coral-icon." + DIALOG_FIELD_SELECTED),
                position = "";

            $alignIcons.each(function(){
                position = position + $(this).data("content-align") + ", ";
            });

            if(position.includes(",")){
                position = position.substring(0, position.lastIndexOf(","));
            }

            position = position.trim();

            if(!position){
                position = "Center";
            }

            $contentAlignDisplay.html(position);
            $contentAlign.val(position);
        }
    }
}(jQuery, jQuery(document)));