CQ.Ext.ns("MyClientLib");

$.ajax({
    type: "GET",
    url: "http://www.google.com/jsapi",
    success: function(msg) {
        debugger;
    },
    error: function(r, s, e) {
        debugger;

    }
});

MyClientLib.ContentFinder = CQ.Ext.extend(CQ.wcm.ContentFinder, {
    setupAllTabs: function(items) {
        MyClientLib.ContentFinder.superclass.setupAllTabs.call(this, items);
        this.allTabs.push(this.addWorldImagesTab());
    },

    addWorldImagesTab: function(){
        var tabConfig = {
            "tabTip": "World Images",
            "id": "cfTab-World-Images",
            "xtype": "contentfindertab",
            "iconCls": "cq-cft-tab-icon images",
            "ranking": 1,
            "items": [
                CQ.wcm.ContentFinderTab.getQueryBoxConfig({
                    "id": "cfTab-World-Images-QueryBox",
                    "items": [
                        CQ.wcm.ContentFinderTab.getSuggestFieldConfig(
                            {   "url": "/bin/wcm/contentfinder/suggestions.json/content/dam"}
                        )
                    ]
                }),
                CQ.wcm.ContentFinderTab.getResultsBoxConfig({
                    "itemsDDGroups": [CQ.wcm.EditBase.DD_GROUP_ASSET],
                    "itemsDDNewParagraph": {
                        "path": "foundation/components/image",
                        "propertyName": "./fileReference"
                    },
                    "noRefreshButton": true,
                    "tbar": [
                        CQ.wcm.ContentFinderTab.REFRESH_BUTTON,
                        "->",
                        {
                            "toggleGroup": "cfTab-World-Images-TG",
                            "enableToggle": true,
                            "toggleHandler": function(button, pressed) {
                                var tab = CQ.Ext.getCmp("cfTab-Images");
                                if (pressed) {
                                    tab.dataView.tpl = new CQ.Ext.XTemplate(CQ.wcm.ContentFinderTab.THUMBS_TEMPLATE);
                                    tab.dataView.itemSelector = CQ.wcm.ContentFinderTab.THUMBS_ITEMSELECTOR;
                                }
                                if (tab.dataView.store != null) {
                                    tab.dataView.refresh();
                                }
                            },
                            "pressed": true,
                            "allowDepress": false,
                            "cls": "cq-btn-thumbs cq-cft-dataview-btn",
                            "iconCls":"cq-cft-dataview-mosaic",
                            "tooltip": {
                                "text": CQ.I18n.getMessage("Mosaic View"),
                                "autoHide":true
                            }
                        }
                    ]
                },{
                    "url": "/bin/wcm/contentfinder/asset/view.json/content/dam"
                }, {
                    "baseParams": {
                        "mimeType": "image"
                    },
                    "autoLoad":false,
                    "reader": new CQ.Ext.data.JsonReader({
                        "totalProperty": "results",
                        "root": "hits",
                        "fields": [
                            "name", "path", "title", "mimeType", "ddGroups", "size", "lastModified", "ck", "templateParams", "imageWidth", "imageHeight"
                        ],
                        "id": "path"
                    })
                })
            ]
        }

        return tabConfig;
    }
});

CQ.Ext.reg("contentfinder", MyClientLib.ContentFinder);
