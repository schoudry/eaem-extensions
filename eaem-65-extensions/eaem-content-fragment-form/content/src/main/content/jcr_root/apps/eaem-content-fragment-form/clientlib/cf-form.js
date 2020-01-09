(function($, $document) {
    var PLAYABLE_MEDIA_PAGE = "/apps/eaem-content-fragment-form/playable-media.html",
        VIDEO_MF_SELECTOR = "coral-multifield[data-granite-coral-multifield-name$='./video']",
        AUDIO_MF_SELECTOR = "coral-multifield[data-granite-coral-multifield-name$='./audio']",
        TRANSCRIPTS_MF_SELECTOR = "coral-multifield[data-granite-coral-multifield-name$='./transcripts']",
        VIDEO_GSP_BROWSER_BUTTON = "video-gsp-browser-button",
        AUDIO_GSP_BROWSER_BUTTON = "audio-gsp-browser-button",
        TRANSCRIPT_GSP_BROWSER_BUTTON = "transcripts-gsp-browser-button",
        MGID_FILE_URI = "mgidFileURI",
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

    function showMessage(title, message, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        fui.prompt(title, message, "default", options, callback);
    }

    function addFormActions(){
        $(".button-apply").on("click", function(e) {
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

            if (initialData === $("form").serialize()) {
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
                '<button id="' + ACCEPT_BUTTON + '" is="coral-button" variant="default" disabled>Select</button>'
            }
        });

        document.body.appendChild(dialog);

        dialog.show();

        var app = angular.module("gspAppForAssetRefs", ['gspBrowser']),
            selectButton = dialog.footer.querySelector('#' + ACCEPT_BUTTON),
            selectedFileJSON = null;

        // optional
        app.constant('GSPConfig', {
            siteKey: 'comedy', // initial used sitekey
            addContentAttributes: true,
            allowSitekeySwitch: true, // optional
            fileTypes: {
                transcript: ['xml', 'scc'],
                video: ['flv','mp4', 'fmp4']
            }
        });

        dialog.on('coral-overlay:close', function(){
            try{
                var selectedFiles, item, content, assetMField;

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

    function saveInitialState(){
        initialData = $("form").serialize();
    }

    $document.on("foundation-contentloaded", addFragmentFormTab);
})(jQuery, jQuery(document));