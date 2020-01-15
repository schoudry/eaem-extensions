<%@ page import="javax.jcr.Session" %>
<%@ page import="org.apache.sling.api.resource.ResourceResolver" %>
<%@ page import="org.slf4j.Logger" %>
<%@ page import="org.slf4j.LoggerFactory" %>
<%@ page import="com.day.cq.commons.jcr.JcrUtil" %>
<%@ page import="javax.jcr.Node" %>
<%@ page import="javax.jcr.Value" %>
<%@page session="false" contentType="text/html; charset=utf-8" %>
<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.0" %>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0" %>
<cq:defineObjects/>

<%
    final Logger LOG = LoggerFactory.getLogger(this.getClass());
    final String FORM_PLAYABLE_MEDIA = "/jcr:content/metadata/formPlayableMedia";
    final String PLAYABLE_MEDIA = "/jcr:content/metadata/playableMedia";

    ResourceResolver viaResolver = slingRequest.getResourceResolver();
    Session session = viaResolver.adaptTo(Session.class);

    String[] content = new String[]{slingRequest.getRequestPathInfo().getSuffix() + FORM_PLAYABLE_MEDIA};

    try{
        request.setAttribute("aem.assets.ui.properties.content", content);

        if (content.length == 1) {
            request.setAttribute("granite.ui.form.contentpath", content[0]);
        }

        String formPlayableMediaPath = content[0];
        String playableMediaPath = slingRequest.getRequestPathInfo().getSuffix() + PLAYABLE_MEDIA;

        if(session.nodeExists(formPlayableMediaPath) || !session.nodeExists(playableMediaPath)){
            return;
        }

        Node playableMedia = session.getNode(playableMediaPath);

        Node formPlayableMedia = JcrUtil.createPath(formPlayableMediaPath, "nt:unstructured", "nt:unstructured", session, false);

        addIdentifiers(playableMedia, formPlayableMedia);

        session.save();
    }catch(Exception e){
        LOG.error("Error creating form playable media content", e);
    }
%>

<%!
    private static void addIdentifiers(Node playableMedia, Node formPlayableMedia) throws Exception{
        setValue(playableMedia, formPlayableMedia, "isChannelSimulcast", "isChannelSimulcast");
        setValue(playableMedia, formPlayableMedia, "isLive", "isLive");
        setValue(playableMedia, formPlayableMedia, "title", "assetId");
        setValue(playableMedia, formPlayableMedia, "description", "dsid");
    }

    private static void setValue(Node src, Node dest, String srcProperty, String destProperty) throws Exception{
        if(!src.hasProperty(srcProperty)){
            return;
        }

        dest.setProperty(destProperty, src.getProperty(srcProperty).getValue());
    }
%>