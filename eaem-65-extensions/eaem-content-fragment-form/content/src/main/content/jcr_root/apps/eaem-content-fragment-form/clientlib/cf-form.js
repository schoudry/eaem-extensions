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
            alert("hi");
        });
    }

    function getFragmentFormTabContent(){
        return "<div class='sidepanel-tab sidepanel-tab-playable-media'>" +
            "</div>";
    }
})(jQuery, jQuery(document));