(function(){
    var ASSET_SELECTOR_ID = "aem-asset-selector",
        ASSET_SELECTOR_URL_FIELD = "asset-selector-url",
        AUTH_TYPE_ASSET_SELECTOR = "authType=EAEM_ASSET_SELECTOR",
        ASSET_SELECTOR_URL = "/aem/assetpicker",
        IMAGE_PROFILES_URL = "/conf/global/settings/dam/adminui-extension/imageprofile.1.json",
        assetsSelected, imageProfiles = {};

    $(document).ready(initComponents);

    function addHostAndAuthType(url){
        if(!url || url.includes(AUTH_TYPE_ASSET_SELECTOR)){
            return url;
        }

        var host = $("#aem-host-url").val();

        if(!url.startsWith(host)){
            url = $("#aem-host-url").val() + url;
        }

        if(url.includes("?")){
            return (url + "&" + AUTH_TYPE_ASSET_SELECTOR);
        }

        return (url + "?" + AUTH_TYPE_ASSET_SELECTOR);
    }

    function loadImageProfiles(){
        $("#dyn-image-profiles-grp").html("");

        $("#dyn-renditions-grp").html("");

        $.ajax(addHostAndAuthType(IMAGE_PROFILES_URL)).done(handler).fail(function(){
            alert("Error getting image profile. Check AEM host value")
        });

        function handler(data){
            if(!data["jcr:primaryType"]){
                alert("Error getting image profiles");
                return;
            }

            _.each(data, function(imgProfile, key){
                if(key.startsWith("jcr:") || ( imgProfile["crop_type"] != "crop_smart" ) ){
                    return;
                }

                var crops = [];

                _.each(imgProfile["banner"].split("|"), function(crop){
                    crops.push(crop.substring(0,crop.indexOf(",")));
                });

                imageProfiles[key] = crops;
            });

            addImageProfilesRadioGroup(imageProfiles);
        }
    }

    function addImageProfilesRadioGroup(){
        var html = "";

        _.each(imageProfiles, function(crops, profileName){
            html = html + '<coral-radio name="dyn-image-profiles" value="' + profileName + '">' + profileName + '</coral-radio>';
        });

        $("#dyn-image-profiles-grp").html(html);

        $("[name='dyn-image-profiles']").change(addSmartCropsRadioGroup);
    }

    function addSmartCropsRadioGroup(){
        var selProfile = $("input[name='dyn-image-profiles']:checked").val();

        var html = '<coral-radio name="dyn-renditions" value="original" checked>Original</coral-radio>';

        _.each(imageProfiles, function(crops, profileName){
            if(profileName != selProfile){
                return;
            }

            _.each(crops, function(crop){
                html = html + '<coral-radio name="dyn-renditions" value="' + crop + '">' + crop + '</coral-radio>';
            });
        });

        $("#dyn-renditions-grp").html(html);

        $("[name='dyn-renditions']").change(setDynamicRenditionImage);

        setDynamicRenditionImage();
    }

    function createDialog(){
        var selUrl = $("#aem-host-url").val() + ASSET_SELECTOR_URL,
            html = "<iframe width='1500px' height='800px' frameBorder='0' src='" + selUrl + "'></iframe>";

        var dialog = new Coral.Dialog().set({
            id: ASSET_SELECTOR_ID,
            content: {
                innerHTML: html
            }
        });

        document.body.appendChild(dialog);
    }

    function hideDialog() {
        var dialog = document.querySelector('#' + ASSET_SELECTOR_ID);

        dialog.hide();
    }

    function showDialog(){
        var dialog = document.querySelector('#' + ASSET_SELECTOR_ID);

        dialog.show();

        var $dialog = $(dialog);

        adjustHeader($dialog);
    }

    function adjustHeader($dialog){
        $dialog.find(".coral3-Dialog-header").remove().find(".coral3-Dialog-footer").remove();
    }

    function removeReceiveDataListener(handler) {
        if (window.removeEventListener) {
            window.removeEventListener("message", handler);
        } else if (window.detachEvent) {
            window.detachEvent("onmessage", handler);
        }
    }

    function registerReceiveDataListener(handler) {
        if (window.addEventListener) {
            window.addEventListener("message", handler, false);
        } else if (window.attachEvent) {
            window.attachEvent("onmessage", handler);
        }
    }

    function receiveMessage(event) {
        var message = JSON.parse(event.data);

        if(message.config.action == "close"){
            hideDialog();
            return;
        }

        assetsSelected = message.data;

        setAssetInfo("original");

        $("#aem-image").attr("src", assetsSelected[0].url);

        $("input[name='dyn-renditions']")[0].checked = true;

        var dialog = document.querySelector('#' + ASSET_SELECTOR_ID);

        dialog.hide();
    }

    function setAssetInfo(dynRendition, dynRendUrl){
        var assetInfo = "Path - " + assetsSelected[0].path;

        if(dynRendition != "original"){
            assetInfo = assetInfo + "<BR><BR>" + "Dynamic Media URL - <a href='" + dynRendUrl+ "' target='_blank'>" + dynRendUrl + "</a>";
        }

        $("#asset-info").html(assetInfo);
    }

    function setDynamicRenditionImage(){
        var dynRendition = $("input[name='dyn-renditions']:checked").val(),
            $aemImage = $("#aem-image");

        if(!$aemImage.attr("src")){
            return;
        }

        if(dynRendition == "original"){
            $aemImage.attr("src", addHostAndAuthType(assetsSelected[0].url));

            setAssetInfo(dynRendition);

            return;
        }

        $.ajax(addHostAndAuthType(assetsSelected[0].url + ".2.json")).done(handler);

        function handler(data){
            if(!data["jcr:content"]){
                alert("Error getting asset metadata");
                return;
            }

            var metadata = data["jcr:content"]["metadata"],
                dynRendUrl = metadata["dam:scene7Domain"] + "is/image/" + metadata["dam:scene7File"] + ":" + dynRendition;

            $aemImage.attr("src", dynRendUrl);

            setAssetInfo(dynRendition, dynRendUrl);
        }
    }

    function initComponents(){
        loadImageProfiles();

        registerReceiveDataListener(receiveMessage);

        $("#open-asset-picker").click(function(){
            createDialog();

            showDialog();
        });

        $("#aem-host-url").change(loadImageProfiles);
    }
}());