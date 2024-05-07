<%@page session="false"
        contentType="text/html"
        pageEncoding="utf-8"
        import="com.adobe.granite.auth.ims.ImsConfigProvider,
                com.adobe.granite.xss.XSSAPI"%>
<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.0"%>
<%@ taglib prefix="ui" uri="http://www.adobe.com/taglibs/granite/ui/1.0" %>

<sling:defineObjects />

<%
    final XSSAPI xssAPI = sling.getService(XSSAPI.class).getRequestSpecificAPI(slingRequest);
    ImsConfigProvider imsConfigProvider = sling.getService(ImsConfigProvider.class);
    String imsLoginUrl = "test";

    if (imsConfigProvider != null) {
        imsLoginUrl = imsConfigProvider.getImsLoginUrl(slingRequest);
        imsLoginUrl = xssAPI.getValidHref(imsLoginUrl);
    }
%>

<div class="eaem-centered coral--dark">
    <button id="eaem-ims-submit-button" is="coral-button" variant="primary" type="submit"
            data-ims-url='<%=imsLoginUrl%>'
            class="_coral-Button--block _coral-Button _coral-Button--cta" size="M">
        <coral-button-label class="_coral-Button-label"><%= resource.getValueMap().get("buttonText", "Sign-in with Adobe")%></coral-button-label>
    </button>
</div>