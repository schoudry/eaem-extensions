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
    String TOKEN_PATH = "/var/eaem/tokens";

    final ResourceResolver resolver = resourceResolver;

    Resource tokenPath = resolver.getResource(TOKEN_PATH);

    DataSource ds = new SimpleDataSource(new TransformIterator(tokenPath.getValueMap().entrySet().iterator(), new Transformer() {
        public Object transform(Object o) {
            Map.Entry entry = (Map.Entry) o;

            if(entry.getKey().equals("jcr:primaryType")){
                return null;
            }

            ValueMap vm = new ValueMapDecorator(new HashMap<String, Object>());

            vm.put("value", entry.getKey());
            vm.put("text", entry.getValue());

            return new ValueMapResource(resolver, new ResourceMetadata(), "nt:unstructured", vm);
        }
    }));

    request.setAttribute(DataSource.class.getName(), ds);
%>