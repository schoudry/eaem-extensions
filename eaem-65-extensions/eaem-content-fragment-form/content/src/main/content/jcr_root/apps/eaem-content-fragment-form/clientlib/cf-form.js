(function($, $document) {
    var formTabAdded = false;

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

        tabList.items.add({
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
    }

    function getFragmentFormTabContent(){
        return "<div class='sidepanel-tab'>" +
            "<span class='sidepanel-tab-title'>Page Tree</span>" +
            "<iframe src='http://www.adobe.com' style='border:none' height='800px'></iframe>" +
            "</div>";
    }
})(jQuery, jQuery(document));