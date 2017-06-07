(function ($, $document, gAuthor) {
    var EAEM_IMAGE_REQ_FIELD_ID_PREFIX = "eaem-img-required-",
        FILE_UPLOAD = ".coral-FileUpload",
        FILE_UPLOAD_CLEAR = ".cq-FileUpload-clear",
        DATA_ATTR_FILE_UPLOAD = "fileUpload",
        FILE_UPLOAD_SEL = ".coral-FileUpload-input",
        FILE_NAME = "./fileName",
        COMPONENT = "foundation/components/image",
        FIELD_ERROR_EL = $("<span class='coral-Form-fielderror coral-Icon coral-Icon--alert " +
                            "coral-Icon--sizeS' data-init='quicktip' data-quicktip-type='error'>" +
                        "</span>");
    if(!gAuthor){
        return;
    }

    $document.on('dialog-ready', checkFileRequired);

    function checkFileRequired(){
        var $fileUpload = $(FILE_UPLOAD),
            $fileName = $("[name='" + FILE_NAME + "']"),
            fileReqId = EAEM_IMAGE_REQ_FIELD_ID_PREFIX + getStringAfterLastSlash(FILE_NAME),
            editable = gAuthor.DialogFrame.currentDialog.editable;

        //if not an image component dialog, return
        if((editable.type !== COMPONENT) || _.isEmpty($fileName)){
            return;
        }

        //fileName field is hidden input, for the validator to work, add a invisible text field
        //holding the file name
        $fileUpload.append("<input type=text style='display:none' id='" + fileReqId + "'/>");

        var cuiFileUpload = $fileUpload.data(DATA_ATTR_FILE_UPLOAD),
            $fileReqInvisibleField = $("#" + fileReqId);

        addValidatorIfRequiredSet(editable, cuiFileUpload, $fileReqInvisibleField);
    }

    function addValidatorIfRequiredSet(editable, cuiFileUpload, $fileReqInvisibleField){
        var $fileUploadInput = cuiFileUpload.$element.find(FILE_UPLOAD_SEL);

        if ($fileUploadInput.attr("aria-required") !== "true") {
            return;
        }

        //user can either drop or upload an image; with required set to true
        //validator with selector: ".coral-FileUpload-input"
        //in /libs/granite/ui/components/foundation/clientlibs/foundation.js
        //always checks if there is a file queued for upload, so workaround it by removing
        //the required attribute on file upload input
        $fileUploadInput.removeAttr( "aria-required" );

        cuiFileUpload.$element.find(FILE_UPLOAD_CLEAR).on("click tap", function (e) {
            performRequiredCheck($fileReqInvisibleField, '');
        });

        cuiFileUpload.$element.on("fileuploadsuccess", function (event) {
            performRequiredCheck($fileReqInvisibleField, event.item.file.name);
        });

        cuiFileUpload.$element.on("assetselected", function (event) {
            performRequiredCheck($fileReqInvisibleField, event.path);
        });

        addValidator($fileReqInvisibleField);

        initRequiredField($fileReqInvisibleField, editable.path);
    }

    function initRequiredField($fileReqInvisibleField, path){
        var fileName = getStringAfterLastSlash(FILE_NAME);

        $.ajax(path + ".json").done(function(data){
            var value = data[fileName];

            if(_.isEmpty(value)){
                value = data["fileReference"];

                if(_.isEmpty(value)){
                    return;
                }

                value = getStringAfterLastSlash(value);
            }

            $fileReqInvisibleField.val(value);
        })
    }

    function performRequiredCheck($fileReqInvisibleField, value){
        $fileReqInvisibleField.val(value);
        $fileReqInvisibleField.checkValidity();
        $fileReqInvisibleField.updateErrorUI();
    }

    function addValidator($fileReqInvisibleField){
        $.validator.register({
            selector: "#" + $fileReqInvisibleField.attr("id"),

            validate: validate ,

            show: show ,

            clear: clear
        });

        function validate($fileReqInvisibleField) {
            if (_.isEmpty($fileReqInvisibleField.val())) {
                return "Drop or upload an image";
            }

            return null;
        }

        function show($fileReqInvisibleField, message) {
            var $fileUploadField = $fileReqInvisibleField.closest(FILE_UPLOAD),
                arrow = $fileUploadField.closest("form").hasClass("coral-Form--vertical") ? "right" : "top",
                $error = $fileUploadField.nextAll(".coral-Form-fielderror");

            if (!_.isEmpty($error)) {
                return;
            }

            FIELD_ERROR_EL.clone()
                .attr("data-quicktip-arrow", arrow)
                .attr("data-quicktip-content", message)
                .insertAfter($fileUploadField);
        }

        function clear($fileReqInvisibleField) {
            var $fileUploadField = $fileReqInvisibleField.closest(FILE_UPLOAD);
            $fileUploadField.nextAll(".coral-Form-fielderror").remove();
        }
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }
}(jQuery, jQuery(document), Granite.author));