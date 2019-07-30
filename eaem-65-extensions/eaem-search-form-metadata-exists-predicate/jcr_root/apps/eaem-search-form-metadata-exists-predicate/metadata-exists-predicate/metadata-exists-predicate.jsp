<%@include file="/libs/granite/ui/global.jsp" %>
<%@ page session="false" contentType="text/html" pageEncoding="utf-8"
           import="com.adobe.granite.ui.components.Config"%>

<%
    Config cfg = new Config(resource);
    String metaPropName = cfg.get("name", "");

    long predicateIndex = cfg.get("listOrder", 5000L);

    String indexGroup = predicateIndex + "_group";
    String predicateName = indexGroup + ".property";
    String propertyOperation = predicateName + ".operation";

    boolean foldableOpen = cfg.get("open", true);
    String selected = foldableOpen ? "selected":"";
%>

<ui:includeClientLib categories="eaem.dam.admin.metadataexists" />

<coral-accordion variant="large">
    <coral-accordion-item "<%=selected%>" data-metaType="checkboxgroup" data-type="metadataexists">
        <coral-accordion-item-label><%= xssAPI.encodeForHTML(cfg.get("text", i18n.get("Property"))) %></coral-accordion-item-label>
        <coral-accordion-item-content class="coral-Form coral-Form--vertical" id="<%= xssAPI.encodeForHTMLAttr(resource.getPath()) %>">
            <input type="hidden" name="<%=predicateName%>" value="<%= xssAPI.encodeForHTMLAttr(metaPropName) %>">
            <coral-checkbox class="coral-Form-field eaem-metadata-exists-predicate" name="<%=propertyOperation%>" value="not">
                Not Exists
            </coral-checkbox>
            <coral-checkbox class="coral-Form-field eaem-metadata-exists-predicate" name="<%=propertyOperation%>" value="exists">
                Exists
            </coral-checkbox>
        </coral-accordion-item-content>
    </coral-accordion-item>
</coral-accordion>

