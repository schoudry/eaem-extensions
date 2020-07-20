<%@page import="com.day.cq.commons.Externalizer" %>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0" %>
<cq:defineObjects />
<%
    Externalizer externalizer = resourceResolver.adaptTo(Externalizer.class);

    String url = externalizer.externalLink(resourceResolver, Externalizer.PUBLISH, request.getScheme(),
            slingRequest.getRequestPathInfo().getSuffix());

    response.getWriter().print(url);
%>
