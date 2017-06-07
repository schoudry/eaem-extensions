(function ($, $document) {
    $document.on('cq-layer-activated', refreshPage);

    function refreshPage(ev){
        if ( (ev.prevLayer === "Preview") || (ev.layer !== 'Preview') ) {
            return;
        }

        window.location.reload();
    }
}(jQuery, jQuery(document)));