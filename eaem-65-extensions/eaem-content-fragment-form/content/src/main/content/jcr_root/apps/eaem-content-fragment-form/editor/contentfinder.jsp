<%@ page import="javax.jcr.Session" %>
<%@ page import="org.apache.sling.api.resource.ResourceResolver" %>
<%@ page import="org.slf4j.Logger" %>
<%@ page import="org.slf4j.LoggerFactory" %>
<%@ page import="com.day.cq.commons.jcr.JcrUtil" %>
<%@ page import="javax.jcr.Node" %>
<%@ page import="javax.jcr.Value" %>
<%@ page import="org.apache.sling.api.resource.SyntheticResource" %>
<%@ page import="java.util.HashMap" %>
<%@ page import="java.util.Map" %>
<%@ page import="javax.jcr.Property" %>
<%@ page import="org.apache.sling.api.resource.Resource" %>
<%@ page import="com.adobe.granite.ui.components.ds.ValueMapResource" %>
<%@ page import="org.apache.sling.api.wrappers.ValueMapDecorator" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="com.google.common.collect.Iterators" %>
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

        addCuePoints(playableMedia, formPlayableMedia);

        addAssetBundles(viaResolver, playableMedia, formPlayableMedia);

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

    private static void addAssetBundles(ResourceResolver viaResolver, Node playableMedia, Node formPlayableMedia) throws Exception{
        if(!playableMedia.hasNode("assetBundles")){
            return;
        }

        Resource abRes = viaResolver.getResource(playableMedia.getNode("assetBundles").getPath());

        if( (abRes == null) || !abRes.hasChildren()){
            return;
        }

        Resource assetBundle = abRes.listChildren().next();

        setValue(assetBundle.adaptTo(Node.class), formPlayableMedia, "durationSeconds", "durationSeconds");

        Resource assetRefs = assetBundle.getChild("assetRefs");

        if(assetRefs == null){
            return;
        }

        Iterator<Resource> assetRefsItr = assetRefs.listChildren();
        Resource assetRef = null;
        Resource resource = null;

        Node video = null, audio = null, transcripts = null;
        Session session = viaResolver.adaptTo(Session.class);

        while(assetRefsItr.hasNext()){
            assetRef = assetRefsItr.next();

            resource = assetRef.getChild("videoRendition");

            if(resource != null){
                if(video == null){
                    video = JcrUtil.createPath(formPlayableMedia.getPath() + "/video", "nt:unstructured", "nt:unstructured", session, false);
                }

                addVideoRendition(session, resource.adaptTo(Node.class), video);
            }

            resource = assetRef.getChild("audioRendition");

            if(resource != null){
                if(audio == null){
                    audio = JcrUtil.createPath(formPlayableMedia.getPath() + "/audio", "nt:unstructured", "nt:unstructured", session, false);
                }

                addAudioRendition(resource.adaptTo(Node.class), audio);
            }

            resource = assetRef.getChild("transcriptRendition");

            if(resource != null){
                if(transcripts == null){
                    transcripts = JcrUtil.createPath(formPlayableMedia.getPath() + "/transcripts", "nt:unstructured", "nt:unstructured", session, false);
                }

                addTranscriptRendition(resource.adaptTo(Node.class), transcripts);
            }
        }
    }

    private static void addVideoRendition(Session session, Node playableVideoRendition, Node video) throws Exception{
        Node playableVideoParent = playableVideoRendition.getParent();

        int nextIndex = Iterators.size(video.getNodes());

        Node videoItem = JcrUtil.createPath(video.getPath() + "/item" + nextIndex, "nt:unstructured", "nt:unstructured",
                                    session, false);

        setValue(playableVideoParent, videoItem, "mgidFileURI", "mgidFileURI");
        setValue(playableVideoParent, videoItem, "container", "container");
        setValue(playableVideoParent, videoItem, "language", "language");
        setValue(playableVideoParent, videoItem, "duration", "videoDuration");
        setValue(playableVideoRendition, videoItem, "inBandCaptionInfo", "inBandCaptionInfo");
        setValue(playableVideoRendition, videoItem, "width", "width");
        setValue(playableVideoRendition, videoItem, "height", "height");
        setValue(playableVideoRendition, videoItem, "peakBitRateKbps", "peakBitRateKbps");
        setValue(playableVideoRendition, videoItem, "avgBitRateKbps", "avgBitRateKbps");
        setValue(playableVideoRendition, videoItem, "hasBurnedInTitles", "hasBurnedInTitles");
        setValue(playableVideoRendition, videoItem, "frameRate", "frameRate");
        setValue(playableVideoRendition, videoItem, "videoCodec", "videoCodec");
        setValue(playableVideoRendition, videoItem, "numberAudioChannels", "numberAudioChannels");
        setValue(playableVideoRendition, videoItem, "isAudioOverDubbed", "isAudioOverDubbed");
        setValue(playableVideoRendition, videoItem, "audioVideoCodec", "audioVideoCodec");
        setValue(playableVideoRendition, videoItem, "audioCodec", "audioCodec");
    }

    private static void addAudioRendition(Node playableVideoRendition, Node formPlayableVideoRendition) throws Exception{

    }

    private static void addTranscriptRendition(Node playableVideoRendition, Node formPlayableVideoRendition) throws Exception{

    }

    private static void addCuePoints(Node playableMedia, Node formPlayableMedia) throws Exception{
        if(!playableMedia.hasNode("adCuePointList")){
            return;
        }

        JcrUtil.copy(playableMedia.getNode("adCuePointList"), formPlayableMedia, "adCuePointList");
    }

    private static void setValue(Node src, Node dest, String srcProperty, String destProperty) throws Exception{
        if(!src.hasProperty(srcProperty)){
            return;
        }

        dest.setProperty(destProperty, src.getProperty(srcProperty).getValue());
    }
%>