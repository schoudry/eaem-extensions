<%@include file="/libs/foundation/global.jsp"%>
<%@page import="com.day.cq.wcm.api.WCMMode,
                com.day.cq.widget.HtmlLibraryManager,org.apache.commons.lang.StringEscapeUtils"
%>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0"%>

<cq:defineObjects></cq:defineObjects>

<head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">

    <%
        if ( WCMMode.fromRequest(request) != WCMMode.DISABLED ) {
            HtmlLibraryManager htmlMgr = sling.getService(HtmlLibraryManager.class);

            if (htmlMgr != null) {
                htmlMgr.writeCssInclude(slingRequest, out, "cq.wcm.edit", "cq.tagging", "cq.security");
                htmlMgr.writeJsInclude(slingRequest, out, "cq.wcm.edit", "cq.tagging", "cq.security" );
            }

            String dlgPath = null;

            if ( ( editContext != null ) && ( editContext.getComponent() != null ) ) {
                dlgPath = editContext.getComponent().getDialogPath();
            }
    %>

    <script type="text/javascript" >
        var dActions = CQ.wcm.Sidekick.DEFAULT_ACTIONS;

        <%
            String customPropsPath = "/apps/" + editContext.getComponent().getResourceType() + "/customprops";

            if( null != slingRequest.getResourceResolver().getResource( customPropsPath ) ){
        %>
                dActions.push({
                    "handler":function() {
                        var pDialog = CQ.WCM.getDialog("<%= customPropsPath %>");
                        pDialog.loadContent("<%= resource.getPath()%>");
                        pDialog.success = function(){
                                            CQ.shared.Util.reload();
                                        };
                        pDialog.show();
                    },
                    "text": CQ.I18n.getMessage("Custom Page Properties")
                });
        <%
            }
        %>

        CQ.WCM.launchSidekick("<%= currentPage.getPath() %>", {
            propsDialog: "<%= ( dlgPath == null ) ? "" : dlgPath %>",
            locked: <%= currentPage.isLocked() %>,
            actions: dActions
        });

    </script>

    <%
        }
    %>

    <title><%= StringEscapeUtils.escapeXml(currentPage.getTitle()) %></title>
</head>