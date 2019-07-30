<%@include file="/libs/granite/ui/global.jsp" %>
<%@ page session="false" contentType="text/html" pageEncoding="utf-8"
         import="com.adobe.granite.ui.components.Config" %>

<%
    String key = resource.getName();
    Config cfg = new Config(resource);
    String metaType = "metadataexists";

    String listOrder = cfg.get("listOrder", String.class);
    listOrder = (listOrder == null) ? "" : listOrder;

    String fieldLabel = i18n.get("Metadata Exists Predicate");
%>

<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key) %>">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/jcr:primaryType") %>" value="nt:unstructured">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/sling:resourceType") %>" value="/apps/eaem-search-form-metadata-exists-predicate/metadata-exists-field">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/fieldLabel") %>" value="<%= fieldLabel %>">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/metaType") %>" value="<%= metaType %>">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/listOrder@Delete") %>">
<input type="hidden" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/listOrder@TypeHint") %>" value="String">
<input type="hidden" class="listOrder" name="<%= xssAPI.encodeForHTMLAttr("./items/" + key + "/listOrder") %>" value="<%= xssAPI.encodeForHTMLAttr(listOrder) %>">

<div><h3><%= i18n.get("Metadata Exists Predicate")%></h3></div>

<%	request.setAttribute ("com.adobe.cq.datasource.fieldtextplaceholder", i18n.get("Metadata Property"));%>

<sling:include resource="<%= resource %>" resourceType="dam/gui/coral/components/admin/customsearch/formbuilder/predicatefieldproperties/fieldlabelpropertyfield"/>

<sling:include resource="<%= resource %>" resourceType="dam/gui/coral/components/admin/customsearch/formbuilder/predicatefieldproperties/maptopropertyfield"/>

<sling:include resource="<%= resource %>" resourceType="granite/ui/components/foundation/form/formbuilder/formfieldproperties/titlefields"/>

<sling:include resource="<%= resource %>" resourceType="granite/ui/components/foundation/form/formbuilder/formfieldproperties/deletefields"/>
