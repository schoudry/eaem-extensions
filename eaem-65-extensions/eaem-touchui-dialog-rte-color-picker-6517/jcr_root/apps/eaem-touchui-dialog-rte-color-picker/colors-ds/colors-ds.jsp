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
    final ResourceResolver resolver = resourceResolver;

    Map<String, String> colorsFromGenericList = new LinkedHashMap<String, String>();

    colorsFromGenericList.put("yellow", "#FFFF00");
    colorsFromGenericList.put("blue", "#0000FF");
    colorsFromGenericList.put("red", "#FF0000");

    DataSource ds = new SimpleDataSource(new TransformIterator(colorsFromGenericList.keySet().iterator(), new Transformer() {
        public Object transform(Object o) {
            String key = (String) o;
            ValueMap vm = new ValueMapDecorator(new HashMap<String, Object>());

            vm.put("value", colorsFromGenericList.get(key));
            vm.put("text", key);

            return new ValueMapResource(resolver, new ResourceMetadata(), "nt:unstructured", vm);
        }
    }));

    request.setAttribute(DataSource.class.getName(), ds);
%>