<%@ page import="org.apache.sling.api.resource.ResourceResolver" %>
<%@ page import="java.util.Collections" %>
<%@ page import="com.day.cq.dam.scene7.api.S7Config" %>
<%@ page import="org.apache.sling.api.resource.ResourceResolverFactory" %>
<%@ page import="com.day.cq.dam.scene7.api.S7ConfigResolver" %>
<%@ page import="com.day.cq.dam.commons.util.DamUtil" %>
<%@ page import="org.apache.sling.api.resource.Resource" %>
<%@ page import="com.day.cq.dam.api.Asset" %>
<%@ page import="javax.jcr.Session" %>
<%@ page import="org.apache.sling.jcr.api.SlingRepository" %>
<%@ page import="com.day.cq.dam.scene7.api.constants.Scene7Constants" %>
<%@ page import="org.w3c.dom.Document" %>
<%@ page import="com.scene7.ipsapi.GetFolderTreeReturn" %>
<%@ page import="com.day.cq.dam.scene7.api.Scene7APIClient" %>
<%@ page import="javax.xml.bind.JAXBContext" %>
<%@ page import="javax.xml.transform.dom.DOMSource" %>
<%@ page import="java.io.ByteArrayOutputStream" %>
<%@ page import="javax.xml.transform.stream.StreamResult" %>
<%@ page import="javax.xml.transform.TransformerFactory" %>
<%@ page import="java.io.ByteArrayInputStream" %>
<%@ page import="javax.xml.bind.Unmarshaller" %>

<%@include file="/libs/granite/ui/global.jsp"%>

<%
    String assetPath = "/content/dam/sreek/gartner1.png";

    ResourceResolver resolver = slingRequest.getResourceResolver();

    Resource assetResource = resolver.getResource(assetPath);
    Asset asset = DamUtil.resolveToAsset(assetResource);

    S7ConfigResolver s7ConfigResolver = sling.getService(S7ConfigResolver.class);
    ResourceResolverFactory resolverFactory = sling.getService(ResourceResolverFactory.class);
    SlingRepository slingRepository = sling.getService(SlingRepository.class);

    Session s7ConfigSession = slingRepository.loginService( Scene7Constants.S7_CONFIG_SERVICE, null);

    ResourceResolver s7ConfigResourceResolver = resolverFactory.getServiceResourceResolver(
                        Collections.singletonMap(ResourceResolverFactory.SUBSERVICE,(Object) Scene7Constants.S7_CONFIG_SERVICE));

    S7Config s7Config = s7ConfigResolver.getS7ConfigForAssetPath(s7ConfigResourceResolver, asset.getPath());

    if(s7Config == null) {
        s7Config = s7ConfigResolver.getDefaultS7Config(s7ConfigResourceResolver);
    }

    Scene7APIClient scene7APIClient = sling.getService(Scene7APIClient.class);

    out.println("S7 Folder tree handle - " + getS7FolderHandle(scene7APIClient, s7Config));

    /*SocketConfig sc = SocketConfig.custom().setSoTimeout(180000).build();
    CloseableHttpClient client = HttpClients.custom().setDefaultSocketConfig(sc).build();*/
%>

<%!
    private Object getS7FolderHandle(Scene7APIClient scene7APIClient, S7Config s7Config) throws Exception{
        String cqFolderPath = "";
        String ipsUploadFilePath = s7Config.getRootPath() + cqFolderPath.replaceAll("^/content/dam/", "");

        Document e = scene7APIClient.getFolderTree(ipsUploadFilePath, 0, (String[])null, (String[])null, s7Config);
        GetFolderTreeReturn result = (GetFolderTreeReturn)this.extractType(e, GetFolderTreeReturn.class);

        return result.getFolders().getFolderHandle();
    }

    private Object extractType(Document document, Class clazz) throws Exception{
        DOMSource s = new DOMSource(document);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        StreamResult r = new StreamResult(baos);

        TransformerFactory.newInstance().newTransformer().transform(s, r);
        ByteArrayInputStream e = new ByteArrayInputStream(baos.toByteArray());
        Unmarshaller unmarshaller = getUnmarshaller(clazz);

        if(unmarshaller != null) {
            return unmarshaller.unmarshal(e);
        }

        return null;
    }

    private Unmarshaller getUnmarshaller(Class clazz) throws Exception{
        return JAXBContext.newInstance(new Class[]{clazz}).createUnmarshaller();
    }
%>