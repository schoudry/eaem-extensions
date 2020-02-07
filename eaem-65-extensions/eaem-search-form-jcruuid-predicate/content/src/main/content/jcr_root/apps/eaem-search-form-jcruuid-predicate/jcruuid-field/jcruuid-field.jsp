<%@include file="/libs/granite/ui/global.jsp" %>
<%@ page session="false" contentType="text/html" pageEncoding="utf-8"
         import="com.adobe.granite.ui.components.Config" %>

<%
    String key = resource.getName();
    String metaType = "eaemjcruuid";

    String fieldLabel = i18n.get("Asset ID");
%>

<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key) %>">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/jcr:primaryType") %>" value="nt:unstructured">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/sling:resourceType") %>" value="/apps/eaem-search-form-jcruuid-predicate/jcruuid-predicate">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/fieldLabel") %>" value="<%= fieldLabel %>">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/metaType") %>" value="<%= metaType %>">

<div><h3><%= i18n.get("Asset ID (jcr:uuid) predicate")%></h3></div>

<%	request.setAttribute ("com.adobe.cq.datasource.fieldtextplaceholder", i18n.get("Asset ID"));%>

<sling:include resource="<%= resource %>" resourceType="dam/gui/coral/components/admin/customsearch/formbuilder/predicatefieldproperties/fieldlabelpropertyfield"/>

<sling:include resource="<%= resource %>" resourceType="granite/ui/components/foundation/form/formbuilder/formfieldproperties/titlefields"/>

<sling:include resource="<%= resource %>" resourceType="granite/ui/components/foundation/form/formbuilder/formfieldproperties/deletefields"/>
