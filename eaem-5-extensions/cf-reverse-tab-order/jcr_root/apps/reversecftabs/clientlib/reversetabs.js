CQ.Ext.ns("MyClientLib");

MyClientLib.ContentFinder = CQ.Ext.extend(CQ.wcm.ContentFinder, {
    getVisibleTabs: function(path) {
        var tabs = MyClientLib.ContentFinder.superclass.getVisibleTabs.call(this, path);

        $.each(tabs, function(index, tab){
            tab.ranking = tabs.length - index;
        });

        return tabs;
    }
});

CQ.Ext.reg("contentfinder", MyClientLib.ContentFinder);