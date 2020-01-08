<%@page session="false" contentType="text/html; charset=utf-8" %>
<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.0" %>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0" %>
<cq:defineObjects/>

<%
    String[] content = request.getParameterValues("item");

    if (content == null || content.length == 0) {
        content = new String[]{slingRequest.getRequestPathInfo().getSuffix() + "/jcr:content/metadata/eaemPlayableMedia"};
    }

    request.setAttribute("aem.assets.ui.properties.content", content);

    if (content.length == 1) {
        request.setAttribute("granite.ui.form.contentpath", content[0]);
    }
%>