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
<%@ page import="org.apache.commons.lang3.StringUtils" %>

<%
    response.setContentType("application/json");

    SlingHttpServletRequest eaemSlingRequest = slingRequest;
    String contentPath = eaemSlingRequest.getRequestPathInfo().getSuffix();

    Resource currentResource = eaemSlingRequest.getResourceResolver().getResource(contentPath);
    Asset asset = (currentResource != null ? currentResource.adaptTo(Asset.class) : null);

    JSONObject dynRenditions = new JSONObject();

    if( (asset == null) || !(asset.getMimeType().startsWith("video/")) || (asset.getMetadata("dam:scene7ID") == null)) {
        dynRenditions.write(response.getWriter());
        return;
    }

    DynamicMediaRenditionProvider dmRendProvider = sling.getService(DynamicMediaRenditionProvider.class);
    String s7Domain = String.valueOf(asset.getMetadata("dam:scene7Domain"));
    String scene7FileAvs = String.valueOf(asset.getMetadata("dam:scene7FileAvs"));

    HashMap<String, Object> rules = new HashMap<>();
    rules.put("remote", true);
    rules.put("video", true);

    List<Rendition> dmRenditions = dmRendProvider.getRenditions(asset, rules);
    JSONObject dynRendition = new JSONObject();
    String image = null, avsName = scene7FileAvs.substring(scene7FileAvs.lastIndexOf("/") + 1);

    dynRendition.put("type", "VIDEO");
    dynRendition.put("url", getScene7Url(s7Domain, scene7FileAvs));
    dynRendition.put("image", getRendThumbnail(s7Domain, scene7FileAvs));
    dynRendition.put("name", avsName);

    dynRenditions.put(avsName, dynRendition);

    String previewUrl = null;

    for (Rendition dmRendition : dmRenditions) {
        dynRendition = new JSONObject();

        image = dmRendition.getPath();

        if(image.endsWith(".mp4")){
            image = image.substring(0, image.lastIndexOf(".mp4"));

            if(StringUtils.isEmpty(previewUrl)){
                previewUrl = getPreviewUrl(s7Domain, dmRendition.getPath());
                previewUrl = previewUrl.substring(0, previewUrl.lastIndexOf(".mp4"));
            }
        }

        dynRendition.put("type", "VIDEO");
        dynRendition.put("name", dmRendition.getName());
        dynRendition.put("image", getRendThumbnail(s7Domain, image));
        dynRendition.put("url", getScene7Url(s7Domain, dmRendition.getPath()));
        dynRendition.put("preview", previewUrl);

        dynRenditions.put(dmRendition.getName(), dynRendition);
    }

    ((JSONObject)dynRenditions.get(avsName)).put("preview", previewUrl);

    dynRenditions.write(response.getWriter());
%>

<%!
    private static String getScene7Url(String s7Domain, String rendPath){
        return s7Domain + "/s7viewers/html5/VideoViewer.html?asset=" + rendPath;
    }

    private static String getPreviewUrl(String s7Domain, String rendPath){
        return s7Domain + "/is/content/" + rendPath;
    }

    private static String getRendThumbnail(String s7Domain, String rendPath){
        return s7Domain + "/is/image/" + rendPath + "?fit=constrain,1&wid=200&hei=200";
    }
%>
