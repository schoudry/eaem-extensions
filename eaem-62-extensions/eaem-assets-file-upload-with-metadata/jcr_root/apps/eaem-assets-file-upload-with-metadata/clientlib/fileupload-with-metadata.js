(function($, $document) {
    var METADATA_DIALOG = "/apps/eaem-assets-file-upload-with-metadata/dialog.html",
        METADATA_PREFIX = "eaem",
        ACTION_CHECK_DATA_VALIDITY = "ACTION_CHECK_DATA_VALIDITY",
        ACTION_POST_METADATA = "ACTION_POST_METADATA",
        url = document.location.pathname,
        metadataDialogAdded = false;

    if( url.indexOf("/assets.html") == 0 ){
        handleAssetsConsole();
    }else if(url.indexOf(METADATA_DIALOG) == 0){
        handleMetadataDialog();
    }

    function handleAssetsConsole(){
        $document.on("foundation-contentloaded", handleFileAdditions);
    }

    function handleMetadataDialog(){
        $document.on("foundation-contentloaded", styleMetadataIframe);
    }

    function registerReceiveDataListener(handler) {
        if (window.addEventListener) {
            window.addEventListener("message", handler, false);
        } else if (window.attachEvent) {
            window.attachEvent("onmessage", handler);
        }
    }

    function styleMetadataIframe(){
        $(".cq-dialog-actions").remove();

        registerReceiveDataListener(postMetadata);

        function postMetadata(event){
            var message = JSON.parse(event.data);

            if( (message.action !== ACTION_CHECK_DATA_VALIDITY) && (message.action !== ACTION_POST_METADATA)){
                return;
            }

            var $dialog = $(".cq-dialog"),
                $fields = $dialog.find("[name^='./']"),
                data = {}, $field, $fValidation, name, value, values,
                isDataInValid = false;

            $fields.each(function(index, field){
                $field = $(field);
                name = $field.attr("name");
                value = $field.val();

                $fValidation = $field.adaptTo("foundation-validation");

                if($fValidation && !$fValidation.checkValidity()){
                    isDataInValid = true;
                }

                $field.updateErrorUI();

                if(_.isEmpty(value)){
                    return;
                }

                name = name.substr(2);

                if(name.indexOf(METADATA_PREFIX) !== 0){
                    return;
                }

                if(!_.isEmpty(data[name])){
                    if(_.isArray(data[name])){
                        data[name].push(value);
                    }else{
                        values =  [];
                        values.push(data[name]);
                        values.push(value);

                        data[name] = values;
                        data[name + "@TypeHint"] = "String[]";
                    }
                }else{
                    data[name] = value;
                }
            });

            if(message.action === ACTION_CHECK_DATA_VALIDITY){
                sendValidityMessage(isDataInValid);
            }else{
                $.ajax({
                    type : 'POST',
                    url : message.path,
                    data  : data
                })
            }
        }

        function sendValidityMessage(isDataInValid){
            var message = {
                action: ACTION_CHECK_DATA_VALIDITY,
                isDataInValid: isDataInValid
            };

            parent.postMessage(JSON.stringify(message), "*");
        }
    }

    function handleFileAdditions(){
        var $fileUpload = $("coral-chunkfileupload"),
            $metadataIFrame, $uploadButton, validateUploadButton;

        $fileUpload.on('coral-fileupload:fileadded', addMetadataDialog);

        $fileUpload.on('coral-fileupload:loadend', postMetadata);

        function sendDataMessage(message){
            $metadataIFrame[0].contentWindow.postMessage(JSON.stringify(message), "*");
        }

        function addMetadataDialog(){
            if(metadataDialogAdded){
                return;
            }

            metadataDialogAdded = true;

            _.debounce(addDialog, 500)();
        }

        function addDialog(){
            var $dialog = $("coral-dialog-header:contains('Upload')").closest("coral-dialog"),
                iFrame = '<iframe width="550px" height="450px" src="' + METADATA_DIALOG + '"/>',
                $dialogContent = $dialog.find("coral-dialog-content");

            $metadataIFrame = $(iFrame).appendTo($dialogContent.css("max-height", "600px"));
            $dialogContent.find("input").css("width", "30rem");
            $dialogContent.closest(".coral-Dialog-wrapper").css("top", "27%").css("left", "40%");

            addValidateUploadButton($dialog);
        }

        function addValidateUploadButton($dialog){
            var $footer = $dialog.find("coral-dialog-footer");

            $uploadButton = $footer.find("coral-button-label:contains('Upload')").closest("button");

            validateUploadButton = new Coral.Button().set({
                variant: 'primary'
            });

            validateUploadButton.label.textContent = Granite.I18n.get('Upload');

            $footer.append(validateUploadButton);

            $uploadButton.hide();

            validateUploadButton.hide();

            validateUploadButton.on('click', function() {
                checkDataValidity();
            });

            $metadataIFrame.on('load', function(){
                validateUploadButton.show();
            });

            registerReceiveDataListener(isMetadataValid);
        }

        function isMetadataValid(event){
            var message = JSON.parse(event.data);

            if( (message.action !== ACTION_CHECK_DATA_VALIDITY)){
                return;
            }

            if(message.isDataInValid){
                return;
            }

            validateUploadButton.hide();

            $uploadButton.click();
        }

        function checkDataValidity(){
            var message = {
                action: ACTION_CHECK_DATA_VALIDITY
            };

            sendDataMessage(message);
        }

        function postMetadata(event){
            var detail = event.originalEvent.detail,
                folderPath = detail.action.replace(".createasset.html", ""),
                assetMetadataPath = folderPath + "/" + detail.item._file.name + "/jcr:content/metadata";

            var message = {
                action: ACTION_POST_METADATA,
                path: assetMetadataPath
            };

            sendDataMessage(message);
        }
    }

})(jQuery, jQuery(document));