<%@ page import="org.slf4j.Logger" %>
<%@ page import="org.slf4j.LoggerFactory" %>
<%@page session="false" contentType="text/html; charset=utf-8" %>
<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.0" %>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0" %>
<cq:defineObjects/>

<%
    final Logger LOG = LoggerFactory.getLogger(this.getClass());

    final String FORM_DATA = "/jcr:content/metadata/eaemFormData";

    String[] content = new String[]{slingRequest.getRequestPathInfo().getSuffix() + FORM_DATA};

    try{
        request.setAttribute("aem.assets.ui.properties.content", content);

        if (content.length == 1) {
            request.setAttribute("granite.ui.form.contentpath", content[0]);
        }
    }catch(Exception e){
        LOG.error("Error creating form playable media content", e);
    }
%>
