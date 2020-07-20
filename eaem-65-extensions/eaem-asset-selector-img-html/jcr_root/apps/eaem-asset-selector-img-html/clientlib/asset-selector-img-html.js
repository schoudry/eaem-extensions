(function($, $document){
    var PUBLISH_URL = "/apps/eaem-asset-selector-img-html/publish-url/content.html";

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

        var $selection = $($selections[0]),
            imgPath = $selection.data("granite-collection-item-id");

        $.ajax( { url: imgPath + ".2.json", async: false}).done(function(data){
            if(!data || !data["jcr:content"] || !data["jcr:content"]["cq:lastReplicated"]){
                showAlert("Please publish the image in AEM for using it in Campaign...", "Publish");
                imgPath = undefined;
            }
        });

        if(!imgPath){
            return;
        }

        var html = "<textarea rows='3' cols= '80' " +
            "style='background-color:#EEE; outline: 0; border-width: 0;padding: 20px; font-family: Courier'>&ltdiv&gt";

        $.ajax( { url: PUBLISH_URL + imgPath, async: false}).done(function(url){
            imgPath = url.trim();
        });

        html = html + "\n\t" + getImageHtml(imgPath) + "\n" + "&lt/div&gt</textarea>";

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
                id: "cancel",
                text: "Cancel",
                primary: true
            },{
                id: "COPY",
                text: "Copy",
                primary: true
            }];

        fui.prompt("Code", code, "default", options, copyHandler);

        function copyHandler(button){
            if(button === 'cancel'){
                return;
            }

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
