(function($, $document) {
    var PLAYABLE_MEDIA_PAGE = "/apps/eaem-content-fragment-form/playable-media.html",
        VIDEO_MF_SELECTOR = "coral-multifield[data-granite-coral-multifield-name$='./video']",
        AUDIO_MF_SELECTOR = "coral-multifield[data-granite-coral-multifield-name$='./audio']",
        TRANSCRIPTS_MF_SELECTOR = "coral-multifield[data-granite-coral-multifield-name$='./transcripts']",
        VIDEO_GSP_BROWSER_BUTTON = "video-gsp-browser-button",
        AUDIO_GSP_BROWSER_BUTTON = "audio-gsp-browser-button",
        TRANSCRIPT_GSP_BROWSER_BUTTON = "transcripts-gsp-browser-button",
        MGID_FILE_URI = "mgidFileURI",
        PLAYABLE_PATH_PREFIX = undefined,
        ASSET_REFS_MAP = undefined,
        formTabAdded = false, initialData;

    var PROFILE_MAPPING = {
        baseline: '42E0',
        main: '4D40',
        high: '6400',
        extended: '58A0'
    };

    var FORMAT_MAPPING = {
        'h264': 'avc1'
    };

    function getTestData(){
        return '[{"mgid":"mgid:file:gsp:alias:/mediabus/87880490_LBRWIF63_1280x720_3128.mp4","lastModified":"2019-06-25T13:18:37.000-04:00","name":"87880490_LBRWIF63_1280x720_3128.mp4","container":"mp4","duration":"2612787","width":"1280","height":"720","frameRate":"29.96953061998548","bitRate":"2767","aspectRatio":"16:9","mediaType":"mp4","format":"h264","profile":"high","fileSizeInBytes":"903457651","fileSize":"862","videoCodec":"avc1.6400"},{"mgid":"mgid:file:gsp:alias:/mediabus/87880490_LBRWIF63_1920x1080_5128.mp4","lastModified":"2019-06-25T13:15:57.000-04:00","name":"87880490_LBRWIF63_1920x1080_5128.mp4","container":"mp4","duration":"2612787","width":"1920","height":"1080","frameRate":"29.96953061998548","bitRate":"4892","aspectRatio":"16:9","mediaType":"mp4","format":"h264","profile":"high","fileSizeInBytes":"1597374995","fileSize":"1523","videoCodec":"avc1.6400"},{"mgid":"mgid:file:gsp:alias:/mediabus/87880490_LBRWIF63_384x216_278.mp4","lastModified":"2019-06-25T13:23:04.000-04:00","name":"87880490_LBRWIF63_384x216_278.mp4","container":"mp4","duration":"2612787","width":"384","height":"216","frameRate":"29.96953061998548","bitRate":"284","aspectRatio":"16:9","mediaType":"mp4","format":"h264","profile":"main","fileSizeInBytes":"92747457","fileSize":"88","videoCodec":"avc1.4D40"},{"mgid":"mgid:file:gsp:alias:/mediabus/87880490_LBRWIF63_512x288_498.mp4","lastModified":"2019-06-25T13:22:47.000-04:00","name":"87880490_LBRWIF63_512x288_498.mp4","container":"mp4","duration":"2612787","width":"512","height":"288","frameRate":"29.96953061998548","bitRate":"495","aspectRatio":"16:9","mediaType":"mp4","format":"h264","profile":"main","fileSizeInBytes":"161770022","fileSize":"154","videoCodec":"avc1.4D40"},{"mgid":"mgid:file:gsp:alias:/mediabus/87880490_LBRWIF63_640x360_1028.mp4","lastModified":"2019-06-25T13:22:17.000-04:00","name":"87880490_LBRWIF63_640x360_1028.mp4","container":"mp4","duration":"2612787","width":"640","height":"360","frameRate":"29.96953061998548","bitRate":"865","aspectRatio":"16:9","mediaType":"mp4","format":"h264","profile":"main","fileSizeInBytes":"282552755","fileSize":"269","videoCodec":"avc1.4D40"}]';
    }

    function showMessage(title, message, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        fui.prompt(title, message, "default", options, callback);
    }

    function addInputField($form, name, value){
        $form.append($("<input type='hidden'/>").attr("name", name).attr("value", value));
    }

    function addPlayableMediaProps($form, prefix){
        var $field = $form.find("input[name='./assetId']");
        addInputField($form, prefix + "/title", $field.val());

        $field = $form.find("input[name='./dsid']");
        addInputField($form, prefix + "/description", $field.val());

        $field = $form.find("input[name='./isLive']");
        addInputField($form, prefix + "/isLive", $field.val());

        $field = $form.find("input[name='./isLive@Delete']");
        addInputField($form, prefix + "/isLive@Delete", $field.val());

        $field = $form.find("input[name='./isChannelSimulcast']");
        addInputField($form, prefix + "/isChannelSimulcast", $field.val());

        $field = $form.find("input[name='./isChannelSimulcast@Delete']");
        addInputField($form, prefix + "/isChannelSimulcast@Delete", $field.val());

        var fields = $form.find("input[name^='./adCuePointList']");

        _.each(fields, function(field){
            $field = $(field);
            addInputField($form, prefix + "/" + $field.attr("name") , $field.val());
        })
    }

    function addPlayableMediaRendition($form, typeSrc, typeTarget, fields){
        _.each(fields, function(key){
            var $fields = $form.find("input[name^='./" + typeSrc + "']input[name$='./" + key + "']");

            $fields.each(function(index, field){
                var item = "item" + index, name, $field = $(field);

                item = !_.isEmpty(ASSET_REFS_MAP) ? (ASSET_REFS_MAP[item] || item) : item;
                name = PLAYABLE_PATH_PREFIX + "/assetRefs/" + item + "/" + typeTarget + "/" + key;

                addInputField($form, name, $field.val());
            });
        });
    }

    function addAssetBundles(){
        if(_.isEmpty(PLAYABLE_PATH_PREFIX)){
            PLAYABLE_PATH_PREFIX = "../playableMedia/assetBundles/item0";
        }

        var $form = $("form");

        addInputField($form, "../playableMedia@Delete", "true");

        addPlayableMediaProps($form, "../playableMedia");

        addInputField($form, PLAYABLE_PATH_PREFIX + "/durationSeconds", $form.find("input[name='./durationSeconds']").val());

        _.each([ "mgidFileURI", "container", "language", "duration"], function(key){
            var $fields = $form.find("input[name^='./video']input[name$='./" + key + "']");

            $fields.each(function(index, field){
                var item = "item" + index, name, $field = $(field);

                item = !_.isEmpty(ASSET_REFS_MAP) ? (ASSET_REFS_MAP[item] || item) : item;
                name = PLAYABLE_PATH_PREFIX + "/assetRefs/" + item + "/" + key;

                addInputField($form, name, $field.val());
            });
        });

        var videoFields = [ "inBandCaptionInfo", "width", "height", "peakBitRateKbps",
                            "avgBitRateKbps", "hasBurnedInTitles", "hasBurnedInTitles@Delete", "frameRate", "videoCodec",
                            "numberAudioChannels", "audioVideoCodec", "audioCodec", "isAudioOverDubbed", "isAudioOverDubbed@Delete" ];

        addPlayableMediaRendition($form, "video", "videoRendition", videoFields);

        var audioFields = ["bitRateKbps", "numberAudioChannels", "isAudioOverDubbed", "isAudioOverDubbed@Delete", "audioCodec"  ];

        addPlayableMediaRendition($form, "audio", "audioRendition", audioFields);

        var transcriptsFields = [ "role" ];

        addPlayableMediaRendition($form, "transcripts", "transcriptRendition", transcriptsFields);
    }

    function loadPlayableMediaPaths(){
        var action = $("form").attr("action");

        action = action.substring(0, action.lastIndexOf("/")) + "/playableMedia.4.json";

        $.ajax(action).done(function(data){
            if(_.isEmpty(data) || _.isEmpty(data["assetBundles"])){
                return;
            }

            var assetBundleUnique;

            _.each(data["assetBundles"], function(value, key){
                if(!_.isObject(value)){
                    return;
                }

                assetBundleUnique = key;
            });

            if(_.isEmpty(assetBundleUnique)){
                return;
            }

            PLAYABLE_PATH_PREFIX = "../playableMedia/assetBundles/" + assetBundleUnique;

            var assetRefs = data["assetBundles"][assetBundleUnique]["assetRefs"];

            if(_.isEmpty(assetRefs)){
                return;
            }

            ASSET_REFS_MAP = {};

            var index = 0;

            _.each(assetRefs, function(value, refKey){
                if(!_.isObject(value)){
                    return;
                }

                ASSET_REFS_MAP["item" + index++] = refKey;
            });
        })
    }

    function addFormActions(){
        $(".button-apply").on("click", function(e) {
            addAssetBundles();

            $("form").submit();

            Dam.CFM.editor.Core.cancel();
        });

        $(".button-cancel").on("click", function(e) {
            Dam.CFM.editor.Core.cancel();
        });
    }

    function addFragmentFormTab() {
        if (formTabAdded) {
            return;
        }

        formTabAdded = true;

        var $sidePanel = $("#SidePanel"),
            $panelTabs = $sidePanel.find("coral-tabview");

        if (_.isEmpty($panelTabs)) {
            return;
        }

        var tabList = $panelTabs[0].tabList;

        var mediaTab = tabList.items.add({
            title: "Playable Media",
            label: {
                innerHTML: '<coral-icon icon="pages" size="S"/>'
            }
        });

        var panelStack = $panelTabs[0].panelStack;

        panelStack.items.add({
            content: {
                innerHTML: getFragmentFormTabContent()
            }
        });

        mediaTab.on('click', function(){
            openPlayableMediaEditor(PLAYABLE_MEDIA_PAGE);
        });

        loadPlayableMediaPaths();

        addFormActions();

        saveInitialState();

        addTabNavigationAlert();

        addBrowseButtons();
    }

    function addTabNavigationAlert(){
        var tabClickHandler = getTabClickHandler();

        $document.off('click', '#SidePanel coral-tab');

        $document.on('click', '#SidePanel coral-tab', function( eve ) {
            var that = this;

            if (initialData === getFormData()) {
                tabClickHandler.call(that);
                return;
            }

            var fui = $(window).adaptTo("foundation-ui");

            fui.prompt("Confirm", "NEW Warning! You must save your work before navigating to a new screen. Click ok to go to the page without saving", "warning", [{
                text: "Ok",
                handler: function(){
                    tabClickHandler.call(that)
                }
            }, {
                text: "Stay",
                primary: true,
                handler: function(){}
            }]);
        });
    }

    function getTabClickHandler(){
        var handlers = $._data(document, "events")["click"];

        return _.reject(handlers, function(handler){
            return (handler.selector != "#SidePanel coral-tab" );
        })[0].handler;
    }

    function getFragmentFormTabContent(){
        return "<div class='sidepanel-tab sidepanel-tab-playable-media'>" +
            "</div>";
    }

    function openPlayableMediaEditor(url){
        var CFM = Dam.CFM,
            href = Granite.HTTP.externalize(url);

        $document.trigger(CFM.constants.EVENT_CONTENT_FRAGMENT_BLOCK, {
            unloadHandling: true
        });

        href = href + encodeURI(CFM.state.fragment.path);

        CFM.editor.Page.notifyNavigation(function(isSuccess) {
            if (isSuccess) {
                document.location.href = href;
            }
        });
    }

    function addPreviewLinks($mfItem){
        $mfItem.find("[name$='" + MGID_FILE_URI + "']").each(function(i, mgIdItem){
            addPreviewLink($(mgIdItem).closest(".coral-Form-fieldwrapper"));
        });
    }

    function addBrowseButtons(){
        addGSPBrowseButton(VIDEO_MF_SELECTOR, VIDEO_GSP_BROWSER_BUTTON);

        addGSPBrowseButton(AUDIO_MF_SELECTOR, AUDIO_GSP_BROWSER_BUTTON);

        addGSPBrowseButton(TRANSCRIPTS_MF_SELECTOR, TRANSCRIPT_GSP_BROWSER_BUTTON);
    }

    function addGSPBrowseButton(componentSel, buttonCss){
        var $accrItem = $(componentSel);

        if(!_.isEmpty($accrItem.find("." + buttonCss))){
            return;
        }

        var $mfAdd = $accrItem.find("[coral-multifield-add]");

        var browse = new Coral.Button().set({
            variant: 'secondary',
            innerText: "Browse"
        });

        $(browse).addClass(buttonCss).css("margin-left", "10px").click(function(){
            showGSPDialog($accrItem);
        });

        $mfAdd.after(browse);

        addPreviewLinks($accrItem);
    }

    function getPreviewLinkHtml(link){
        return  '<a class="coral3-Button coral3-Button--secondary" target="_blank" href=' + link + '>' +
                    '<coral-button-label>Preview</coral-button-label>' +
                '</a>';
    }

    function getPreviewLink(mgid) {
        var url = "https://mediabus.mtvnservices.com/mediabus-webservices/mediaInspection/getMediaMetadata",
            xml = "<getMediaAttributes><url>" + mgid + "</url></getMediaAttributes>",
            httpUrl = "";

        $.ajax({
            async: false,
            type: "POST",
            url: url,
            data: xml,
            contentType: 'application/xml',
            dataType: 'xml',
            statusCode: {
                200: function(xmlDoc){
                    if (xmlDoc.getElementsByTagName("httpurl").length > 0) {
                        httpUrl = xmlDoc.getElementsByTagName("httpurl").item(0).innerHTML;
                    }
                }
            }
        });

        return httpUrl;
    }

    function addPreviewLink($mgIdField){
        var $previewLink = $('<div/>').appendTo($mgIdField),
            value = $mgIdField.find("input").val();

        if(_.isEmpty(value)){
            return;
        }

        var link = getPreviewLink(value);

        if(_.isEmpty(link)){
            return;
        }

        $previewLink.append(getPreviewLinkHtml(link));
    }

    function fillMultifieldItems(mfItem, mfMap){
        if( (mfItem === null) || _.isEmpty(mfMap)){
            return;
        }

        var fieldNameSuffix = null;

        _.each(mfMap, function(fValue, fKey){
            fieldNameSuffix = fKey;

            if(fKey === "mgid"){
                fieldNameSuffix = MGID_FILE_URI;
            }else if(fKey === "bitRate"){
                fieldNameSuffix = "avgBitRateKbps";
            }else if(fKey === "format"){
                fieldNameSuffix = "videoCodec";
            } else if (fKey === "container") {
                if (fValue === "xml") {
                    fValue = "ttml";
                }
            }

            var field = mfItem.querySelector("[name$='" + fieldNameSuffix + "']");

            if(field === null){
                return;
            }

            field.value = fValue;
        });

        var $mgIdField = $(mfItem.querySelector("[name$='" + MGID_FILE_URI + "']"));

        addPreviewLink($mgIdField.closest(".coral-Form-fieldwrapper"));
    }

    function setVideoCodecFormat(selectedFiles) {
        if(_.isEmpty(selectedFiles)){
            return;
        }

        selectedFiles.forEach(function(fileData) {
            if (fileData && fileData.format && fileData.profile) {
                fileData.videoCodec = FORMAT_MAPPING[fileData.format] + '.' + PROFILE_MAPPING[fileData.profile];
            }
        });
    }

    function showGSPDialog($mField) {
        var ACCEPT_BUTTON = "assetRefsGSPAcceptButton";

        var dialog = new Coral.Dialog().set({
            header: {
                innerHTML: 'GSP Browser'
            },
            content: {
                innerHTML: '<div ng-app="gspAppForAssetRefs" class="browser-container" ng-controller="GspCtrl">'+
                '<arc-gsp-browser options="gspOptions"></arc-gsp-browser>'+
                '</div>'
            },
            footer: {
                innerHTML: '<button is="coral-button" variant="default" coral-close>Cancel</button>' +
                //'<button id="' + ACCEPT_BUTTON + '" is="coral-button" variant="default" disabled>Select</button>'
                '<button id="' + ACCEPT_BUTTON + '" is="coral-button" variant="default">Select</button>'
            }
        });

        document.body.appendChild(dialog);

        dialog.show();

        var app = angular.module("gspAppForAssetRefs", ['gspBrowser']),
            selectButton = dialog.footer.querySelector('#' + ACCEPT_BUTTON),
            selectedFileJSON = null;

        app.constant('GSPConfig', {
            siteKey: 'comedy',
            addContentAttributes: true,
            allowSitekeySwitch: true,
            fileTypes: {
                transcript: ['xml', 'scc'],
                video: ['flv','mp4', 'fmp4']
            }
        });

        dialog.on('coral-overlay:close', function(){
            try{
                var selectedFiles, item, content, assetMField;

                selectedFileJSON = selectedFileJSON || getTestData();

                if(_.isEmpty(selectedFileJSON)){
                    return;
                }

                selectedFiles = JSON.parse(selectedFileJSON);

                assetMField = $mField[0];

                dumpItemsInMultifield($mField);

                _.each(selectedFiles, function(dataItem, index){
                    $('#viacom-import-count').html(index + 1);

                    item = new Coral.Multifield.Item();

                    content = document.importNode(assetMField.template.content, true).firstElementChild;

                    item.content.appendChild(content);

                    assetMField.items.add(item);

                    fillMultifieldItems(item, dataItem);
                });
            }catch(err){
                showAlert("Error", "Unable to add references for selected : " + selectedFileJSON);
            }
        });

        dialog.on('click', '#' + ACCEPT_BUTTON, function() {
            selectedFileJSON = selectedFileJSON || getTestData();

            var selectedFiles = JSON.parse(selectedFileJSON),
                message = "Adding <span id='viacom-import-count'>1</span> of total " + selectedFiles.length;

            showMessage("Importing...", message);

            dialog.hide();
        });

        app.controller("GspCtrl", ['$scope', function($scope) {
            $scope.gspOptions = {
                shownFileTypes: ['video', 'transcript'],
                multiSelect: true,
                onFileSelect: function(selectedFiles) {
                    if (!_.isEmpty(selectedFiles)) {
                        setVideoCodecFormat(selectedFiles);
                        selectedFileJSON = JSON.stringify(selectedFiles);
                        selectButton.removeAttribute("disabled");
                    } else {
                        selectedFileJSON = undefined;
                        selectButton.setAttribute("disabled", true);
                    }
                }
            };
        }]);

        angular.bootstrap(dialog, ['gspAppForAssetRefs']);
    }

    function dumpItemsInMultifield($mField){
        if(_.isEmpty($mField)){
            return;
        }

        _.each($mField[0].items.getAll(), function(mfItem){
            mfItem.remove();
        });
    }

    function getFormData(){
        var $fields = $("form").find("[name]"),
            data = [];

        _.each($fields, function(field){
            var $field = $(field);

            if($field.attr("name").includes("@")){
                return;
            }

            data.push([$field.attr("name")] + "=" + $field.val());
        });

        return data.join(",");
    }

    function saveInitialState(){
        initialData = getFormData();
    }

    function getResourcePath() {
        var path;

        path = CQ.shared.HTTP.getPath();

        return path.substring(path.lastIndexOf((".html/")) + 5);
    }

    function loadExtensionForVideoType(){
        $.ajax({
            url: getResourcePath() + "/jcr:content/data.2.json",
            async: false,
            dataType: "json",
            success: function (data) {
                if (data["cq:model"].includes("videosegment-content-model") ||
                    data["cq:model"].includes("excerpt-content-model") ||
                    data["cq:model"].includes("clip-content-model") ||
                    data["cq:model"].includes("channel-simulcast-content-model")) {
                        $document.on("foundation-contentloaded", addFragmentFormTab);
                }
            }
        });
    }

    loadExtensionForVideoType();
})(jQuery, jQuery(document));