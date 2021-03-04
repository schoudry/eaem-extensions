<%@ page import="com.adobe.granite.ui.components.Config" %>
<%@ page import="org.apache.sling.api.SlingHttpServletRequest" %>
<%@ page import="org.apache.sling.api.resource.ResourceResolver" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="java.util.Date" %>
<%@include file="/libs/granite/ui/global.jsp" %>
<%@page session="false"%>

<%
    final String META_ASSET_USAGE_PATH = "jcr:content/metadata/asset-usage";
    final String EAEM_PUBLISH_PAGE = "eaem:external-page";

    Config cfg = new Config(resource);
    String fieldLabel = cfg.get("fieldLabel", String.class);
    String contentPath = (String)request.getAttribute("granite.ui.form.contentpath");

    ResourceResolver resolver = slingRequest.getResourceResolver();
    Resource eaemResource = resolver.getResource(contentPath);

    if(eaemResource == null){
        return;
    }

    Resource metadataRes = eaemResource.getChild(META_ASSET_USAGE_PATH);
    Iterator<Resource> usagesItr = ((metadataRes != null) ? metadataRes.getChildren().iterator() : null);

%>
    <div>
    <label class="coral-Form-fieldlabel"><%= outVar(xssAPI, i18n, fieldLabel) %></label>
<%
    if( (usagesItr == null) || !usagesItr.hasNext()){
%>
        <div>
            <div>None</div>
        </div>
<%
}else{
    while(usagesItr.hasNext()){
        Resource usageRes = usagesItr.next();
        ValueMap usageResVM = usageRes.getValueMap();
%>
        <div style="margin-top: 15px">
            <div><%= usageResVM.get(EAEM_PUBLISH_PAGE) %></div>
        </div>
<%
        }
    }
%>
    </div>