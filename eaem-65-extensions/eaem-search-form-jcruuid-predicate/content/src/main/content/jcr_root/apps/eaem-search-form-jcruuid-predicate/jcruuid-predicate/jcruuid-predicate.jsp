<%@include file="/libs/granite/ui/global.jsp" %>
<%@ page session="false" contentType="text/html" pageEncoding="utf-8"
           import="com.adobe.granite.ui.components.Config"%>
<%@ page import="com.adobe.granite.ui.components.AttrBuilder" %>

<%
    Config cfg = new Config(resource);
    String name = cfg.get("text", i18n.get("Property"));
    String metaType = cfg.get("metaType", "eaemjcruuid");

    boolean foldableOpen = cfg.get("open", true);
    String selected = foldableOpen ? "selected":"";

    AttrBuilder inputAttrs = new AttrBuilder(request, xssAPI);
    inputAttrs.add("type", "text");
    inputAttrs.add("name", metaType);
    inputAttrs.addClass("coral-Form-field coral-Textfield coral-DecoratedTextfield-input");
    inputAttrs.add("placeholder", "Asset ID (jcr:uuid)");
%>
<coral-accordion variant="large">
    <coral-accordion-item "<%=selected%>" data-metaType="checkboxgroup" data-type="eaemjcruuid">
        <coral-accordion-item-label><%= xssAPI.encodeForHTML(name) %></coral-accordion-item-label>
        <coral-accordion-item-content class="coral-Form coral-Form--vertical">
            <input <%=inputAttrs.build()%>>
        </coral-accordion-item-content>
    </coral-accordion-item>
</coral-accordion>

