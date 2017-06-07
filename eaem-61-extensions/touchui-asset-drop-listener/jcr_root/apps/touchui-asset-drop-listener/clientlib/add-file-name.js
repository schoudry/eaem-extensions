(function ($, $document) {
    "use strict";

    $(document).on("fileuploadsuccess", "span.coral-FileUpload", addTitle);

    function addTitle(event){
        try{
            var options = event.fileUpload.options,
                folderPath = options.uploadUrl.replace(".createasset.html", ""),
                assetMetadataPath = folderPath + "/" + event.item.fileName + "/jcr:content/metadata";

            var data = {
                "dc:title" : event.item.fileName + " - " + getCurrentUser()
            };

            $.ajax({
                type : 'POST',
                url : assetMetadataPath,
                data  : data
            }).done(function(){
                showAlert(true, data["dc:title"]);
            })
        }catch(err){
            showAlert(false, err.message);
        }
    }

    function showAlert(isSuccessful, data){
        var fui = $(window).adaptTo("foundation-ui"), message, options;

        if(isSuccessful){
            message = "Title added - '" + data + "'";

            options = [{
                text: "Refresh",
                primary: true,
                handler: function() {
                    location.reload();
                }
            }]
        }else{
            message = "Error - " + data;

            options = [{
                text: "OK",
                warning: true
            }]
        }

        fui.prompt("Asset Title", message, "notice", options);
    }

    function getCurrentUser(){
        //is there a better way like classic UI? - CQ.User.getCurrentUser()
        return $(".endor-Account-caption").html();
    }
})(jQuery, $(document));