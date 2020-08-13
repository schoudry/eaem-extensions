(function ($, $document) {
    $document.on("foundation-contentloaded", init);

    function init(){
        console.log("loaded");
    }
}(jQuery, jQuery(document)));