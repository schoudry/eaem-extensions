(function ($, $document) {
    $document.on("foundation-contentloaded", showFileName);

    function showFileName(){
        var fileName = window.Dam.Util.getUrlParam("item");

        if(isAssetDetailsPage()){
            fileName = window.location.pathname;
        }

        if(_.isEmpty(fileName)){
            return;
        }

        var $title = $(".granite-title");

        if(_.isEmpty($title)){
            return;
        }

        fileName = fileName.substring(fileName.lastIndexOf("/") + 1);

        $title.find("[role=heading]").html(fileName);
    }

    function isAssetDetailsPage(){
        return window.location.pathname.startsWith("/assetdetails.html");
    }
}(jQuery, jQuery(document)));