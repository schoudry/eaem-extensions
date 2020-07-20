(function($, $document){
    $document.ready(addImgHtmlButton);

    function addImgHtmlButton(){
        var $titleBar = $(".granite-pickerdialog-titlebar"),
            $imgHtmlBut = $titleBar.find("betty-titlebar-primary").append(getButtonHtml());

        $imgHtmlBut.on('click', showHTMLInModal);
    }

    function showHTMLInModal(event){
        event.preventDefault();

        var $selections = $(".foundation-selections-item");

        if(_.isEmpty($selections)){
            showAlert("Please select an image", "Select");
            return;
        }

        var html = "<textarea rows='3' cols= '70' " +
                        "style='background-color:#EEE; outline: 0; border-width: 0;padding: 20px'>&ltdiv&gt";

        _.each($selections, function(item){
            var $item = $(item),
                imgPath = $item.data("granite-collection-item-id");

            html = html + "\n\t" + getImageHtml(imgPath);
        });

        html = html + "\n" + "&lt/div&gt</textarea>";

        showCopyCode(html);
    }

    function getButtonHtml(){
        return '<button is="coral-button" icon="adobeCampaign" iconsize="S" variant="quiet">Img Html</button>';
    }

    function getImageHtml(imgPath){
        return "&lt;img src='" + imgPath + "'/&gt;";
    }

    function showCopyCode(code, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "COPY",
                text: "Copy",
                primary: true
            }];

        fui.prompt("Code", code, "default", options, copyHandler);

        function copyHandler(){
            var $dialog = $("coral-dialog.is-open"),
                $codeText = $dialog.find("textarea");

            $codeText[0].select();

            document.execCommand("copy");
        }
    }

    function showAlert(message, title, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "warning", options, callback);
    }
}(jQuery, jQuery(document)));
