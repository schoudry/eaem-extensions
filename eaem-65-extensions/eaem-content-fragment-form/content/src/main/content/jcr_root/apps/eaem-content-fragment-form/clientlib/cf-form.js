(function($, $document) {
    var PLAYABLE_MEDIA_PAGE = "/apps/eaem-content-fragment-form/playable-media.html",
        formTabAdded = false;

    $document.on("foundation-contentloaded", addFragmentFormTab);

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
})(jQuery, jQuery(document));