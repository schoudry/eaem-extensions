CQ.Ext.ns("MyClientLib");

MyClientLib.ContentFinder = {
    TAB_IMAGES: "cfTab-Images",

    //interested in showing the following metadata only
    displayNames: { "dam:FileFormat": "File Format", "dam:MIMEtype": "Mime Type",
        "jcr:lastModifiedBy": "Last Modified By","jcr:lastModified": "Last Modified",
        "tiff:ImageLength": "Length","tiff:ImageWidth": "Width"},

    addImagesMetadata: function(){
        var tab = CQ.Ext.getCmp(this.TAB_IMAGES);
        var resultsView = tab.findByType("dataview");
        var store = tab.dataView.store;

        if(!resultsView || resultsView.length == 0){
            return;
        }

        var tBar = resultsView[0].ownerCt.getTopToolbar();
        var dNames = this.displayNames;

        //mouseenter fired when the mouse enters a node in results view
        resultsView[0].on('mouseenter', function(dView, index, node){
            if(node.metaAdded == true){
                return;
            }

            //get the selected view type from toolbar: tile or list
            var viewType = tBar.find("pressed", true);

            if(!viewType || (viewType.length == 0)){
                return;
            }

            viewType = viewType[0];

            var rec = store.getAt(index);
            var path = rec.id + "/jcr:content/metadata.json"; //get the metadata of asset as json

            $.ajax({
                url: path,
                dataType: "json",
                success: function(data){
                    if(!data || data.length == 0){
                        return;
                    }

                    var nodeValue = "<div>";

                    for(var x in dNames){
                        if(dNames.hasOwnProperty(x) && data[x]){
                            nodeValue = nodeValue + "<b>" + dNames[x] + "</b>:" + data[x] + "<br>";
                        }
                    }

                    node.metaAdded = true;
                    nodeValue = nodeValue + "</div>";

                    if(viewType.iconCls == "cq-cft-dataview-mosaic"){
                        var attrs = node.children[0].attributes;

                        CQ.Ext.each(attrs, function(attr){
                            if(attr.nodeName == "ext:qtip"){
                                attr.nodeValue = nodeValue;
                            }
                        });
                    }else{
                        var qTip = document.createAttribute("ext:qtip");
                        qTip.nodeValue = nodeValue;
                        node.attributes.setNamedItem(qTip);
                    }
                }
            });
        });
    }
};

(function(){
    var c = MyClientLib.ContentFinder;

    if( window.location.pathname == "/cf" ){
        var INTERVAL = setInterval(function(){
            var tabPanel = CQ.Ext.getCmp(CQ.wcm.ContentFinder.TABPANEL_ID);

            if(tabPanel){
                clearInterval(INTERVAL);
                c.addImagesMetadata();
            }
        }, 250);
    }
})();

