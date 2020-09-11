(function ($, $document) {
    var PREVIEW_IMG = "#eaem-assets-preview-colorization-img";

    $document.on("foundation-contentloaded", init);

    function init(){
        var $url =  $("[name='./url']");

        $url.on('change', function(){
            loadContents();
            changePreview();
        });

        addApplyListener();

        addImageSaveListener();

        registerWidgetListener();

        loadContents();
    }

    function addImageSaveListener(){
        $("#rh-assets-preview-tool-save").click(download);

        function download(event){
            event.preventDefault();

            var $url = $("[name='./url']"),
                url = $url.val();

            if(_.isEmpty(url)){
                showAlert("Empty URL field...");
                return;
            }

            var link = document.createElement('a');
            link.href = url;
            link.download = getImageName() + ".jpg";
            link.setAttribute('target','_blank');

            if (document.createEvent) {
                var e = document.createEvent('MouseEvents');
                e.initEvent('click', true, true);
                link.dispatchEvent(e);
                return;
            }

            window.open(url, '_blank');
        }
    }

    function getImageName(){
        var $url = $("[name='./url']"),
            url = $url.val();

        if(_.isEmpty(url)){
            return;
        }

        var productId;

        try{
            productId = url.substring(url.indexOf("src=ir(rhir/"));
            productId = productId.substring(productId.indexOf("/") + 1, productId.indexOf("?"));
        }catch(err){
            productId = "rhis";
        }

        return productId;
    }

    function addApplyListener(){
        $("#rh-assets-preview-tool-apply").click(function(event){
            event.preventDefault();
            rewriteUrl();
        });
    }

    function changePreview(){
        var url = $("[name='./url']").val();

        if(_.isEmpty(url)){
            return;
        }

        $(PREVIEW_IMG).attr("src", url);
    }

    function loadContents(){
        var $url =  $("[name='./url']"),
            imageUrl = $url.val(),
            $contentsField = $("coral-select[name='./contents']");

        $contentsField.find("coral-select-item").not("[value='NONE']").remove();

        if(_.isEmpty(imageUrl)){
            return;
        }

        var contentsUrl = imageUrl.substring(0, imageUrl.indexOf("?")),
            imageName = imageUrl.substring(imageUrl.indexOf("src=ir(rhir/") + "src=ir(rhir/".length),
            objectsInVignette = [];

        imageName = imageName.substring(0, imageName.indexOf("?"));
        contentsUrl =  contentsUrl.replace("/is/image/rhis", "/ir/render/rhir") + "/" + imageName + "?req=contents";

        $.ajax({type: "GET", url: contentsUrl, dataType: "xml", async: false}).done(function (xml) {
            objectsInVignette = checkVignetteObjects(xml);
        });

        _.each(objectsInVignette, function(obj){
            var $item = $(getCoralSelectItem(obj, obj)).appendTo($contentsField),
                item = $item[0];

            item._elements = {};
            item.content = item;
        });
    }

    function checkVignetteObjects(xml) {
        var path = "/vignette/contents/group",
            nodes = xml.evaluate(path, xml, null, XPathResult.ANY_TYPE, null),
            group = nodes.iterateNext(), objects = [];

        while (group) {
            var object = group.getAttribute("id");

            objects.push(object);

            var children = group.getElementsByTagName("object");

            for (var x = 0; x < children.length; x++) {
                objects.push(object + " / " + children[x].id);
            }

            group = nodes.iterateNext();
        }

        return objects;
    }

    function getCoralSelectItem(text, value){
        return '<coral-select-item value="' + value + '" trackingelement>' + text+ '</coral-select-item>';
    }

    function registerWidgetListener(){
        addCopyListener("resolution");

        addCopyListener("objectColor");
    }

    function addCopyListener(selector){
        var $widget = $("[name='./" + selector + "']"),
            $widgetInput = $("[name='./" + selector + "Input']"),
            $widgetCopy = $("[id='./" + selector + "Copy']");

        $widget.on("change", function(){
            $widgetInput.val($(this).val());
            rewriteUrl();
        });

        $widgetCopy.click(function(event){
            event.preventDefault();
            $widgetInput[0].select();
            document.execCommand("copy");
        });
    }

    function rewriteUrl(){
        var $resSliderInput = $("[name='./resolutionInput']"),
            $objColor = $("[name='./objectColor']"),
            $obj = $("[name='./contents']"), selObj,
            $url = $("[name='./url']");

        var url = $url.val();

        if(_.isEmpty(url)){
            showAlert("Empty URL field...");
            return;
        }

        if(!_.isEmpty($obj.val()) && !_.isEmpty($objColor.val())){
            selObj = "obj=" + $obj.val().toLowerCase();
        }

        var params = rhirUrlParameters(url);

        params["src"]["res"] = $resSliderInput.val();

        url = params["url"] + "?src=" + params["src"]["url"] + "?";

        var selObjActive = false;

        _.each(params["src"]["q"], function(param){
            if(param.startsWith("res=")){
                url = url + "res=" + $resSliderInput.val() + "&";
            }else if(param.startsWith("color=") && selObjActive){
                //do nothing
            }else{
                url = url + param + "&";
            }

            if(param.startsWith("obj=")){
                selObjActive = (param.toLowerCase() == selObj);

                if(selObjActive){
                    url = url + "color=" + rgbToHex($objColor.val()) + "&";
                }
            }
        });

        url = url + ")" + "&" + params["q"].join("&");

        $url.val(url);

        changePreview();
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

        fui.prompt(title, message, "default", options, callback);
    }

    //eg. https://media.restorationhardware.com/is/image/rhis?src=ir(rhir/prod14020084_E410382572_F_Frank_OD18?obj=fabric&src=rhir/BWMSPerfTextLin_Mist_E311851653_repeat&res=190&illum=0&obj=Finish&color=b48e66&illum=0)&wid=461&wid=650
    function rhirUrlParameters(url) {
        var urlNoQS = url.substring(0, url.indexOf("?")),
            src;

        if(url.includes("ir(")){
            src = url.substring(url.indexOf("src=") + 4);

            src = src.substring(0, src.lastIndexOf(")"));

            src = urlAndParameters(src);

            url = url.substring(url.lastIndexOf(")") + 1);
        }

        var result = {};

        result["url"] = urlNoQS;

        if(src){
            result["src"] = src;
        }

        result["q"] = urlAndParameters(url);

        return result;
    }

    function urlAndParameters(url) {
        var urlNoQS;

        if(url.includes("?")){
            urlNoQS = url.substring(0, url.indexOf("?"));
            url = url.substring(url.indexOf("?") + 1);
        }

        var result = {}, q = [],
            params = url.split(/\?|\&/);

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            q.push(it);
        });

        result["q"] = q;

        if(urlNoQS){
            result["url"] =  urlNoQS;
        }else{
            result = q;
        }

        return result;
    }

    function rgbToHex(color){
        if(_.isEmpty(color)){
            return color;
        }

        if(color.indexOf("rgb") == 0){
            var rgba = color.substring(color.indexOf('(') + 1, color.lastIndexOf(')')).split(/,\s*/);
            color = '#' + hex(rgba[0]) + hex(rgba[1]) + hex(rgba[2]);
        }

        return color.substr(1);

        function hex(x) {
            return ("0" + parseInt(x, 10).toString(16)).slice(-2);
        }
    }
}(jQuery, jQuery(document)));