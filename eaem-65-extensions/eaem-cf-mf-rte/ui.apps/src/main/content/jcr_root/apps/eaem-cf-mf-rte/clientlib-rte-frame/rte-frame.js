(function ($, $document) {
    const RTE_CLASS = ".richtext-container";

    $document.one("foundation-contentloaded", initRTE);

    function initRTE(){
        $(RTE_CLASS).css("width", "95%").css("padding-left", "20px");
    }
}(jQuery, jQuery(document)));