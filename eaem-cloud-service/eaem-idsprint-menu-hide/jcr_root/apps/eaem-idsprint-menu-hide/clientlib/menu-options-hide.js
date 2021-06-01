(function($document){
    $document.on("foundation-contentloaded", function(e) {
        $(".aem-assets-idsprint-create-brochure").hide();
        $(".aem-assets-idsprint-create-printad").hide();
        $(".aem-assets-idsprint-create-businesscard").hide();
        $(".aem-assets-idsprint-create-postcard").hide();
        $(".dam-idsprint-assemble").hide();
    });
}($(document)));
