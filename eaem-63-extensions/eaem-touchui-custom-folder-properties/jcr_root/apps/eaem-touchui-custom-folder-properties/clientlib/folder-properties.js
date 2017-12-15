(function($, $document) {
    var FOLDER_SHARE_WIZARD = "/mnt/overlay/dam/gui/content/assets/foldersharewizard.html",
        CUSTOM_DIALOG = "/apps/eaem-touchui-custom-folder-properties/dialog",
        EAEM_GET_ADDN_PROPERTIES = "EAEM_GET_ADDN_PROPERTIES",
        url = document.location.pathname, $customTab;

    if( url.indexOf(FOLDER_SHARE_WIZARD) == 0 ){
        handleAssetsConsole();
    }else if(url.indexOf(CUSTOM_DIALOG) == 0){
        handlePropertiesDialog();
    }

    function handleAssetsConsole(){
        $document.on("foundation-contentloaded", addProperties);
    }

    function addProperties(){
        var cuiTabView = $("coral-tabview");

        if(_.isEmpty(cuiTabView)){
            return;
        }

        cuiTabView = cuiTabView[0];

        $customTab = $(getCustomTab()).appendTo(cuiTabView.$.children("coral-tablist"));

        var $panel = $(getCustomPanel()).appendTo(cuiTabView.$.children("coral-panelstack")),
            $iFrame = $panel.find("iframe");

        $customTab.on("click",function(){
            if(!_.isEmpty($iFrame.attr("src"))){
                return;
            }

            $iFrame.attr("src", CUSTOM_DIALOG + ".html?folder=" + ($("form")).attr("action"));
        });

        addDummySubmit($iFrame);
    }

    function addDummySubmit($iFrame){
        var $submit = $("button[type=submit]"), $dummySubmit;

        $dummySubmit = $("<button variant='primary' is='coral-button'>Save</button>").insertAfter($submit);

        $submit.hide();

        $dummySubmit.click(handler);

        function handler(event){
            event.preventDefault();

            var message = {
                action: EAEM_GET_ADDN_PROPERTIES
            };

            $iFrame[0].contentWindow.postMessage(JSON.stringify(message), "*");
        }

        registerReceiveDataListener(addAddnPropertiesToForm);
    }

    function addAddnPropertiesToForm(event){
        var message = JSON.parse(event.data);

        if( message.action !== EAEM_GET_ADDN_PROPERTIES ){
            return;
        }

        $customTab.find("coral-tab-label").css("color", message.isDataInValid ? "#e14132" : "#707070");

        if(message.isDataInValid){
            return;
        }

        var $form = $("form"), $submit = $("button[type=submit]");

        $submit.click();

        $.post( $form.attr("action") + "/jcr:content", message.data );
    }

    function handlePropertiesDialog(){
        $(function(){
            _.defer(styleCustomDialogIFrame);
        });

        registerReceiveDataListener(postAddnProperties);
    }

    function styleCustomDialogIFrame() {
        var $dialog = $("coral-dialog");

        if (_.isEmpty($dialog)) {
            return;
        }

        $dialog.css("overflow", "hidden");

        $dialog[0].open = true;

        $dialog.find(".coral-Dialog-header").remove();

        Coral.commons.ready(coralReady);

        function coralReady() {
            var top = ($(window).width() - 1140) + "px",
                left = ($(window).height() - 1155) + "px";

            $dialog.find(".coral-Dialog-wrapper").css("margin", top + " 0 0 " + left)
                .css("background-color", "#f5f5f5");

            $.ajax(queryParameters()["folder"] + "/jcr:content.json").done(function(data){
                var $fields = $dialog.find("[name^='./']"), $field, name;

                $fields.each(function (index, field) {
                    $field = $(field);
                    $field.val(data[$field.attr("name").substr(2)] || '');
                })
            });
        }
    }

    function postAddnProperties(event){
        var message = JSON.parse(event.data);

        if( message.action !== EAEM_GET_ADDN_PROPERTIES ){
            return;
        }

        var $dialog = $("coral-dialog"),
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

            data[name.substr(2)] = value;
        });

        message = {
            action: EAEM_GET_ADDN_PROPERTIES,
            data: data,
            isDataInValid: isDataInValid
        };

        parent.postMessage(JSON.stringify(message), "*");
    }

    function getCustomTab(){
        var title = "Custom";

        $.ajax( { url: CUSTOM_DIALOG + ".json", async: false}).done(function(data){
            title = data["jcr:title"];
        });

        return  '<coral-tab>' +
                    '<coral-tab-label>' + title + '</coral-tab-label>' +
                '</coral-tab>';
    }

    function getCustomPanel(){
        var iFrame = '<iframe width="750px" height="750px" seamless="seamless" frameborder="0" />';

        return  '<coral-panel>' +
                    '<div style="margin-top: 5px">' +  iFrame + '</div>' +
                '</coral-panel>';
    }

    function queryParameters(searchStr) {
        var result = {}, param,
            params = (searchStr ? searchStr.split(/\?|\&/) : document.location.search.split(/\?|\&/));

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }

    function registerReceiveDataListener(handler) {
        if (window.addEventListener) {
            window.addEventListener("message", handler, false);
        } else if (window.attachEvent) {
            window.attachEvent("onmessage", handler);
        }
    }
})(jQuery, jQuery(document));