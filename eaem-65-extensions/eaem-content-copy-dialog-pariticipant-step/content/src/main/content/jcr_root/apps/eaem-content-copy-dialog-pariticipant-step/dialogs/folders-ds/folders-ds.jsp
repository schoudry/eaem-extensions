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

    DataSource ds = new SimpleDataSource(new TransformIterator(qualifiedParents.iterator(), new Transformer() {
        public Object transform(Object o) {
            Resource resource = (Resource) o;
            ValueMap vm = new ValueMapDecorator(new HashMap<String, Object>()),
                     tvm = resource.getValueMap();

            vm.put("value", resource.getPath());
            vm.put("text", tvm.get("jcr:content/jcr:title", tvm.get("jcr:title", resource.getName())));

            return new ValueMapResource(resolver, new ResourceMetadata(), "nt:unstructured", vm);
        }
    }));

    request.setAttribute(DataSource.class.getName(), ds);
%>