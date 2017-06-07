CQ.Ext.ns("ExperienceAEM");

//extend CQ.tagging.TagInputField and register as eaem-tags
ExperienceAEM.TagInputField = CQ.Ext.extend(CQ.tagging.TagInputField, {
    //eaemTagsBasePaths: [ "/etc/tags/geometrixx-media", "/etc/tags/marketing/interest/business" ],
    eaemTagsBasePaths: null, // any namespace or subfolders of namespace passed as array

    //Iterates over the base paths and creates each path as namespace
    loadTagNamespaces: function() {
        this.tagNamespaces = {};

        if(!this.eaemTagsBasePaths || $.isEmptyObject(this.eaemTagsBasePaths)){
            ExperienceAEM.TagInputField.superclass.loadTagNamespaces.call(this);
            return;
        }

        CQ.Ext.each(this.eaemTagsBasePaths, function(tUrl) {
            var pUrl = tUrl.substring(0, tUrl.lastIndexOf("/"));

            //load each base path
            var tagJson = this.loadJson(pUrl + CQ.tagging.TAG_LIST_JSON_SUFFIX + "?count=false");

            if (tagJson && tagJson.tags) {
                CQ.Ext.each(tagJson.tags, function(t) {
                    if(t.path === tUrl){
                        this.tagNamespaces[t.name] = t;
                    }
                }, this);
            }
        }, this);

        this.setupPopupMenu();

        this.tagNamespacesLoaded = true;
    },

    setupPopupMenu: function() {
        ExperienceAEM.TagInputField.superclass.setupPopupMenu.call(this);

        if(!this.eaemTagsBasePaths || $.isEmptyObject(this.eaemTagsBasePaths)){
            return;
        }

        var panel, treePanel, path, nsName;

        //adjust the tree panel roots to load eaemTagsBasePaths data
        CQ.Ext.each(this.namespacesTabPanel, function(tabPanel) {
            for(var i = 0; i < tabPanel.items.length; i++){
                panel = tabPanel.items.get(i);
                treePanel = panel.items.get(0);

                nsName = treePanel.root.attributes.name;
                nsName = nsName.substring(nsName.lastIndexOf("/") + 1);

                path = this.tagNamespaces[nsName].path;

                treePanel.getLoader().path = path.substring(0, path.lastIndexOf("/"));
                treePanel.root.attributes.name = path.substring(1);
            }
        }, this);
    }
});

CQ.Ext.reg("eaem-tags", ExperienceAEM.TagInputField);