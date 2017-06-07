(function ($, $document) {
    var DIALOG_SELECTOR = ".cq-dialog",
        FILE_UPLOAD_SELECTOR = ".cq-dialog .coral-FileUpload",
        TITLE_NAME = "[name='./title']", // dialog field for file name autofill
        CREATOR_NAME = "[name='./creator']"; // dialog field for creator auto fill - image-path/jcr:content/metadata/xmp:CreatorTool

    $document.on("dialog-ready", function () {
        var $element = $document.find(FILE_UPLOAD_SELECTOR),
            widget = $element ? $element.data("fileUpload") : undefined;

        if (_.isEmpty(widget)) {
            return;
        }

        registerImageDrop(widget);
    });

    function registerImageDrop(widget){
        //when the image is drag n dropped from asset finder
        widget.$element.on("assetselected", handleImageDrop);

        //when the image is uploaded from local file system
        widget.$element.on("fileuploadsuccess", handleFileUpload);

        var $dialog = $document.find(DIALOG_SELECTOR);

        function handleFileUpload(event){
            $dialog.find(TITLE_NAME).val(event.item.file.name);
            $dialog.find(CREATOR_NAME).val("");
        }

        function handleImageDrop(event){
            var assetPath = event.path;

            if(_.isEmpty(assetPath)){
                return;
            }

            $.ajax(assetPath + ".3.json").done(function(data){
                $dialog.find(TITLE_NAME).val(getStringAfterLastSlash(assetPath));
                $dialog.find(CREATOR_NAME).val(data["jcr:content"]["metadata"]["xmp:CreatorTool"]);
            })
        }
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }
})(jQuery, jQuery(document));