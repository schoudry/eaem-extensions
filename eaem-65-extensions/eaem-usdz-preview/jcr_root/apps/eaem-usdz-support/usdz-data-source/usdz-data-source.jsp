<%@include file="/libs/granite/ui/global.jsp"%>

<%@ page import="com.adobe.granite.ui.components.ds.DataSource" %>
<%@ page import="com.adobe.granite.ui.components.ds.ValueMapResource" %>
<%@ page import="org.apache.sling.api.wrappers.ValueMapDecorator" %>
<%@ page import="com.adobe.granite.ui.components.ds.SimpleDataSource" %>
<%@ page import="org.apache.commons.collections.iterators.TransformIterator" %>
<%@ page import="org.apache.commons.collections.Transformer" %>
<%@ page import="org.apache.sling.api.resource.*" %>
<%@ page import="java.util.*" %>

<%
    String ROOT_PATH = "/content/dam";

    final ResourceResolver resolver = resourceResolver;

    Resource rootPath = resolver.getResource(ROOT_PATH);

    List<Resource> qualifiedParents = new ArrayList<Resource>();

    rootPath.listChildren().forEachRemaining(r -> {
        if(r.getName().equals("jcr:content")){
            return;
        }

        qualifiedParents.add(r);
    });


    ResourceMetadata rm = new ResourceMetadata();

    //workaround for sling SlingRequestDispatcher.getAbsolutePath() NPE
    rm.setResolutionPath("/apps/eaem-usdz-support/usdz-data-source");

    Map<String, String> viewers = new HashMap<String, String>();

    viewers.put("Quick Look", "Native viewer (iOS Safari)");

    TransformIterator tm = new TransformIterator(viewers.entrySet().iterator(), new Transformer() {
        public Object transform(Object o) {
            Map.Entry entry = (Map.Entry) o;
            ValueMap vm = new ValueMapDecorator(new HashMap<String, Object>());

            vm.put("value", entry.getKey());
            vm.put("text", entry.getValue());

            return new ValueMapResource(resolver, rm, "nt:unstructured", vm);
        }
    });

    DataSource ds = new SimpleDataSource(tm);

    request.setAttribute(DataSource.class.getName(), ds);
%>