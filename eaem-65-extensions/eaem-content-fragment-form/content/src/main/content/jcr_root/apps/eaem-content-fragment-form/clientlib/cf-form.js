(function($, $document) {
    var PLAYABLE_MEDIA_PAGE = "/apps/eaem-content-fragment-form/playable-media.html",
        formTabAdded = false, initialData;

    $document.on("foundation-contentloaded", addFragmentFormTab);

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

    function saveInitialState(){
        initialData = $("form").serialize();
    }
})(jQuery, jQuery(document));