<%@include file="/libs/granite/ui/global.jsp"%>

<%@page session="false"
        import="java.util.Iterator,
                org.apache.sling.commons.json.JSONObject,
                com.adobe.granite.ui.components.Config,
                com.adobe.granite.ui.components.Tag"%>
<%@ page import="com.adobe.granite.ui.components.ds.ValueMapResource" %>
<%@ page import="org.apache.sling.api.SlingHttpServletRequest" %>
<%@ page import="com.day.cq.dam.api.Asset" %>
<%@ page import="com.day.cq.dam.api.renditions.DynamicMediaRenditionProvider" %>
<%@ page import="com.day.cq.dam.api.Rendition" %>
<%@ page import="java.util.HashMap" %>
<%@ page import="java.util.List" %>
<%@ page import="org.apache.sling.api.resource.Resource" %>

<%
    response.setContentType("application/json");

    SlingHttpServletRequest eaemSlingRequest = slingRequest;
    String assetPath = eaemSlingRequest.getRequestPathInfo().getSuffix();

    Resource currentResource = eaemSlingRequest.getResourceResolver().getResource(assetPath);
    Asset asset = (currentResource != null ? currentResource.adaptTo(Asset.class) : null);

    String s7Domain = "/";

    s7Domain = s7Domain.replace("http://", "https://");

    JSONObject dynRenditions = new JSONObject();

    if( (asset == null) || !(asset.getMimeType().startsWith("video/"))) {
        dynRenditions.write(response.getWriter());
        return;
    }

    DynamicMediaRenditionProvider dmRendProvider = sling.getService(DynamicMediaRenditionProvider.class);

    HashMap<String, Object> rules = new HashMap<>();
    rules.put("remote", true);
    rules.put("video", true);

    JSONObject dynRendition = new JSONObject();
    String image = null;
    String s7EncodeUrl = null;

    List<Rendition> dmRenditions = dmRendProvider.getRenditions(asset, rules);

    for (Rendition dmRendition : dmRenditions) {
        dynRendition = new JSONObject();

        image = dmRendition.getPath();

        image = image.substring(0, image.lastIndexOf("."));

        s7EncodeUrl = getPreviewUrl(s7Domain, dmRendition.getPath());

        dynRendition.put("type", "VIDEO");
        dynRendition.put("name", dmRendition.getName());
        dynRendition.put("image", getRendThumbnail(s7Domain, image));
        dynRendition.put("s7Url", s7EncodeUrl);

        dynRenditions.put(dmRendition.getName(), dynRendition);
    }

    dynRenditions.write(response.getWriter());
%>

<%!
    private static String getScene7Url(String s7Domain, String rendPath){
        return s7Domain + "/s7viewers/html5/VideoViewer.html?asset=" + rendPath;
    }

    private static String getPreviewUrl(String s7Domain, String rendPath){
        if(rendPath.contains(".")){
            rendPath = rendPath.substring(0, rendPath.lastIndexOf("."));
        }

        return s7Domain + "is/content/" + rendPath;
    }

    private static String getRendThumbnail(String s7Domain, String rendPath){
        return s7Domain + "is/image/" + rendPath + "?fit=constrain,1&wid=200&hei=200";
    }
%>