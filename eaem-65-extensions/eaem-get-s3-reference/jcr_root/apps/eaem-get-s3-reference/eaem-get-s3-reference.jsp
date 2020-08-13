<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@ page import="com.day.cq.dam.commons.util.DamUtil" %>
<%@ page import="org.apache.sling.api.resource.Resource" %>
<%@ page import="com.day.cq.commons.jcr.JcrConstants" %>
<%@ page import="javax.jcr.Node" %>
<%@ page import="javax.jcr.Property" %>
<%@ page import="org.apache.jackrabbit.api.ReferenceBinary" %>
<%@ page import="org.apache.sling.api.resource.ResourceResolver" %>
<%@ page import="org.apache.sling.api.SlingHttpServletRequest" %>
<%@ page import="com.day.cq.dam.api.Asset" %>

<%@include file="/libs/granite/ui/global.jsp"%>

<%

    SlingHttpServletRequest eaemSlingRequest = slingRequest;
    String assetPath = eaemSlingRequest.getRequestPathInfo().getSuffix();

    if(StringUtils.isEmpty(assetPath)){
        response.getWriter().print("No suffix provided, sample usage - /apps/eaem-get-s3-reference/content.html/content/eaem/big-video.mov");
        return;
    }

    ResourceResolver eaemResolver = eaemSlingRequest.getResourceResolver();
    Resource s3Resource = eaemResolver.getResource(assetPath);

    String assetIdSha246 = getS3AssetIdFromReference(s3Resource);

    response.getWriter().print("Asset : " + assetPath + "<BR><BR>");
    response.getWriter().print("S3 Reference : " + assetIdSha246);
%>

<%!
    public static String getS3AssetIdFromReference(final Resource assetResource) throws Exception {
        String s3AssetId = StringUtils.EMPTY;

        if( (assetResource == null) || !DamUtil.isAsset(assetResource)){
            return s3AssetId;
        }

        Resource original = assetResource.getChild(JcrConstants.JCR_CONTENT + "/renditions/original/jcr:content");

        if(original == null) {
            return s3AssetId;
        }

        Node orgNode = original.adaptTo(Node.class);

        if(!orgNode.hasProperty("jcr:data")){
            return s3AssetId;
        }

        Property prop = orgNode.getProperty("jcr:data");

        ReferenceBinary value = (ReferenceBinary)prop.getBinary();

        s3AssetId = value.getReference();

        if(StringUtils.isEmpty(s3AssetId) || !s3AssetId.contains(":")){
            return s3AssetId;
        }

        s3AssetId = s3AssetId.substring(0, s3AssetId.lastIndexOf(":"));

        s3AssetId = s3AssetId.substring(0, 4) + "-" + s3AssetId.substring(4);

        return s3AssetId;
    }
%>
