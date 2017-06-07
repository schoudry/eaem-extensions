<%@ page import="com.day.cq.wcm.api.WCMMode" %>
<%@ page import="org.osgi.framework.FrameworkUtil" %>
<%@ page import="apps.mycomponents.favorites.PageNodesServlet" %>
<%@ page import="org.osgi.framework.Bundle" %>
<%@ page import="org.osgi.framework.ServiceReference" %>
<%@ page import="org.apache.sling.commons.json.JSONObject" %>
<%@ page import="java.io.PrintWriter" %>
<%@include file="/libs/foundation/global.jsp" %>
<%@page session="false" %>

<cq:includeClientLib categories="mycomponents.favorites"/>

<div style="display: block; border-style: solid; border-width: 1px; margin: 10px; padding: 10px">
    <b>Favorites Component</b>

    <br><br>

    <%
        try {
            Property property = null;

            if(currentNode.hasProperty("favorites")){
                property = currentNode.getProperty("favorites");
            }

            if (property != null) {
                JSONObject obj = null;
                String resourcePath = null;
                Value[] favorites = null;

                if(property.isMultiple()){
                    favorites = property.getValues();
                }else{
                    favorites = new Value[1];
                    favorites[0] = property.getValue();
                }

                for (Value val : favorites) {
                    obj = new JSONObject(val.getString());
                    resourcePath = xssAPI.getValidHref(String.valueOf(obj.get("url")) + ".html");
    %>
                    <a href="<%=resourcePath%>"><%=obj.get("text")%></a>
                    <br><br>
    <%
                }
            } else {
    %>
                Configure the favorite pages in dialog
                <br><br>
    <%
            }
    %>

</div>

<%
        if (WCMMode.fromRequest(request) != WCMMode.DISABLED) {
            Bundle bundle = FrameworkUtil.getBundle(PageNodesServlet.class);
            ServiceReference[] services = bundle.getRegisteredServices();

            //assuming we have only one servlet as osgi service
            String sPath = String.valueOf(services[0].getProperty("sling.servlet.paths"));

%>
            <script type="text/javascript">
                CQ.Ext.onReady(function () {
                    MyClientLib.dataUrl = '<%=sPath%>';
                })
            </script>
<%
        }
    } catch (Exception e) {
        e.printStackTrace(new PrintWriter(out));
    }
%>