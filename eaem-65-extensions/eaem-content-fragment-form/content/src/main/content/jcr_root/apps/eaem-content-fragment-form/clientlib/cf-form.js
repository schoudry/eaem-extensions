(function($, $document) {
    var EAEM_FORM_PAGE = "/apps/eaem-content-fragment-form/cf-form.html",
        formTabAdded = false, initialData;

    $document.on("foundation-contentloaded", addFragmentFormTab);

    function addFormActions(){
        $(".button-apply").on("click", function(e) {
            $("form").submit();
            document.location.href = $("#Editor").data("return");
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
            title: "Experience AEM Form",
            label: {
                innerHTML: '<coral-icon icon="film" size="S"/>'
            }
        });

        var panelStack = $panelTabs[0].panelStack;

        panelStack.items.add({
            content: {
                innerHTML: getFragmentFormTabContent()
            }
        });

        mediaTab.on('click', function(){
            openEditorPage(EAEM_FORM_PAGE);
        });

        addFormActions();

        saveInitialState();

        addTabNavigationAlert();

        workarounds();
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
        return "<div class='sidepanel-tab sidepanel-tab-cf-form'></div>";
    }

    function openEditorPage(url){
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

    function getFormData(){
        var $fields = $("form").find("input[name]"),
            data = [];

        _.each($fields, function(field){
            var $field = $(field), name = $field.attr("name");

            if(name.includes("@")){
                return;
            }

            data.push([name.substring(name.lastIndexOf("/") + 1)] + "=" + $field.val());
        });

        return data.join(",");
    }

    function saveInitialState(){
        initialData = getFormData();
    }

    function workarounds(){
        $.fn.rearrangeFormLayout = function () {};
    }

    workarounds();
})(jQuery, jQuery(document));