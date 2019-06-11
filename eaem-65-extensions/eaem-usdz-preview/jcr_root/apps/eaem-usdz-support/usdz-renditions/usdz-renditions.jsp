<%@ page import="com.adobe.granite.ui.components.AttrBuilder" %>
<%@ page import="com.adobe.granite.ui.components.Config" %>
<%@include file="/libs/granite/ui/global.jsp" %>

<%
    Config cfg = new Config(resource);
    AttrBuilder attrs = new AttrBuilder(request, xssAPI);
    attrs.add("id", cfg.get("class", String.class));

    String contentPath = slingRequest.getRequestPathInfo().getSuffix();
    String originalRend = contentPath + "/jcr:content/renditions/original";
%>

<nav <%= attrs.build() %>>
    <span class="colorpalette-headings aem-asset-rendition-item aem-asset-rendition-item--header">USDZ (3D)</span>

    <span href="<%=originalRend%>" data-type="model/usd" class="each-rendition">
    <a>
        <table class="renddetailstrip aem-asset-rendition-item">
            <tbody>
            <tr>
                <td>
                    <span class="name col1presetname">Quick Look</span>
                </td>
            </tr>
            <tr>
                <td>
                    <span class="type">Native viewer (iOS Safari)</span>
                </td>
            </tr>
            </tbody>
        </table>
    </a>
</span>