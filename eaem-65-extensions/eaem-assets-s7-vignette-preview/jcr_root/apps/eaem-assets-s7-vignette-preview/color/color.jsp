<%@ page import="com.adobe.granite.ui.components.Value" %>
<%@ page import="com.adobe.granite.ui.components.Config" %>
<%@include file="/libs/granite/ui/global.jsp" %>

<sling:include resourceType="/libs/granite/ui/components/coral/foundation/form/colorfield" />

<%
    Config cfg = cmp.getConfig();

    String fieldName = cfg.get("name", String.class);
%>

<div style="text-align: right; width: 100%; margin: 0 0 15px 0">
    <input is="coral-textfield" name="<%=fieldName%>Input" value="" style="width: 50px; margin-right: 10px">
    <button is="coral-button" id="<%=fieldName%>Copy" iconsize="S" variant="primary">copy</button>
</div>
