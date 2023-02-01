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
<%@ page import="org.apache.sling.commons.json.JSONException" %>

<%
    response.setContentType("application/json");

    SlingHttpServletRequest eaemSlingRequest = slingRequest;
    String assetPath = eaemSlingRequest.getRequestPathInfo().getSuffix();

    Resource currentResource = eaemSlingRequest.getResourceResolver().getResource(assetPath);
    Asset asset = (currentResource != null ? currentResource.adaptTo(Asset.class) : null);

    JSONObject dynRenditions = new JSONObject();

    if( (asset == null) || !(asset.getMimeType().startsWith("video/"))) {
        dynRenditions.write(response.getWriter());
        return;
    }

    String s7Domain = asset.getMetadataValue("dam:scene7Domain");

    DynamicMediaRenditionProvider dmRendProvider = sling.getService(DynamicMediaRenditionProvider.class);

    HashMap<String, Object> rules = new HashMap<>();
    rules.put("remote", true);
    rules.put("video", true);

    String image = null;
    String s7EncodeUrl = null;

    JSONObject dynRendition = getVideo(s7Domain, asset);
    dynRenditions.put(dynRendition.getString("name"), dynRendition);

    List<Rendition> dmRenditions = dmRendProvider.getRenditions(asset, rules);

    for (Rendition dmRendition : dmRenditions) {
        dynRendition = new JSONObject();

        image = dmRendition.getPath();

        image = image.substring(0, image.lastIndexOf("."));

        s7EncodeUrl = getDeliveryUrl(s7Domain, dmRendition.getPath());

        dynRendition.put("type", "VIDEO");
        dynRendition.put("name", dmRendition.getName());
        dynRendition.put("image", getRendThumbnail(s7Domain, image));
        dynRendition.put("s7Url", s7EncodeUrl);

        //dynRenditions.put(dmRendition.getName(), dynRendition);
    }

    dynRenditions.write(response.getWriter());
%>

<%!
    private JSONObject getVideo(String s7Domain, Asset asset) throws JSONException {
        JSONObject dynRendition = new JSONObject();

        dynRendition.put("type", "VIDEO");
        dynRendition.put("name", asset.getMetadataValue("dam:scene7Name"));
        dynRendition.put("s7Url", getDeliveryUrl(s7Domain, asset.getMetadataValue("dam:scene7File")));

        return dynRendition;
    }

    private static String getDeliveryUrl(String s7Domain, String rendPath){
        if(rendPath.contains(".")){
            rendPath = rendPath.substring(0, rendPath.lastIndexOf("."));
        }

        return s7Domain + "is/content/" + rendPath;
    }

    private static String getRendThumbnail(String s7Domain, String rendPath){
        return s7Domain + "is/image/" + rendPath + "?fit=constrain,1&wid=200&hei=200";
    }
%>