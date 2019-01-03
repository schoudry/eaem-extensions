(function($, $document){
    var COMP_SELECTOR = '.s7dm-dynamic-media',
        EAEM_TEXT_OVERLAY = "eaem-video-text-overlay";

    $document.ready(findViewer);

    function findViewer(){
        $(COMP_SELECTOR).each(function(){
            getViewer($(this).attr('id')).then(handleViewer);
        });
    }

    function handleViewer(viewer){
        if(!viewer instanceof s7viewers.VideoViewer){
            return;
        }

        var s7sdk = window.s7classic.s7sdk;

        viewer.s7params.addEventListener(s7sdk.Event.SDK_READY, function(){
            s7sdkReady(viewer, s7sdk);
        }, false);
    }

    function s7sdkReady(viewer, s7sdk){
        viewer.videoplayer.addEventListener(s7sdk.event.CapabilityStateEvent.NOTF_VIDEO_CAPABILITY_STATE, function(event){
            addTextOverlay(viewer, event.s7event);
        }, false);

        //viewer.playPauseButton.addEventListener("click", function(){});
    }

    function addTextOverlay(viewer, s7event){
        var $vpComponent = $("#" + viewer.videoplayer.compId),
            $textOverlay = $("." + EAEM_TEXT_OVERLAY);

        if(!_.isEmpty($textOverlay)){
            if(s7event && s7event.state && (s7event.state.state == 13)){
                $textOverlay.hide();
            }else{
                $textOverlay.show();
            }
            return;
        }

        $vpComponent.append("<div class='" + EAEM_TEXT_OVERLAY + "'>click anywhere to watch video</div>")
    }

    function getViewer(compId){
        if(!compId){
            return;
        }

        return new Promise(function(resolve, reject){
            var INTERVAL = setInterval(function(){
                var viewer = S7dmUtils[compId];

                if(!viewer || !viewer.initializationComplete){
                    return;
                }

                clearInterval(INTERVAL);

                resolve(viewer);
            }, 100);
        });
    }
}(jQuery, jQuery((document))));