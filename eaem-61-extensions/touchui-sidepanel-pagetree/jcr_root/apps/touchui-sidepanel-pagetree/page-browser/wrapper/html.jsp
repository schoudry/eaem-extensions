<%@page session="false" %>
<%@include file="/libs/foundation/global.jsp" %>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">

<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">

    <title>Page Tree</title>

    <style type="text/css">
        #CQ .x-tab-panel-body, #CQ .x-panel-body {
            background-color: transparent !important;
        }
    </style>

    <cq:includeClientLib categories="cq.compat.authoring.widgets"/>

    <script type="text/javascript">
        CQ.I18n.init({ "locale": "<%= request.getLocale() %>" });

        CQ.Ext.onReady(function () {
            var pageTree = CQ.wcm.ContentFinderTab.getBrowseTree({
                "treeRoot":{
                    "text": CQ.I18n.getMessage("Content")
                }
            });

            pageTree.on('beforedblclick', function(node){
                window.open("/editor.html" + node.getPath() + ".html", '_blank');
            });

            var config = {
                items: [ pageTree ],
                xtype: "dialogwrapper"
            };

            var dialog = CQ.Util.build(config, null, null, false, null);

            dialog.setWidth(300);
            dialog.setHeight(700);
        });

    </script>
</head>
<body style="margin:10px 0 0 15px; overflow: hidden">
<div id="CQ"></div>
</body>
</html>