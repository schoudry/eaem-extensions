<%@include file="/libs/granite/ui/global.jsp" %>

<%@page session="false"
        import="org.apache.commons.lang3.StringUtils,
                  com.adobe.granite.ui.components.AttrBuilder,
                  com.adobe.granite.ui.components.Config,
                  com.adobe.granite.ui.components.Field,
                  com.adobe.granite.ui.components.Tag" %>
<%@ page import="org.apache.sling.api.SlingHttpServletRequest" %>
<%@ page import="apps.experienceaem.assets.core.services.SimpleTokenAuthService" %>
<%
    Config cfg = cmp.getConfig();

    SimpleTokenAuthService tokenService = sling.getService(SimpleTokenAuthService.class);
    String ssoKey = tokenService.getTokenKey();

    String name = cfg.get("name", String.class);

    Tag tag = cmp.consumeTag();

    AttrBuilder attrs = tag.getAttrs();
    cmp.populateCommonAttrs(attrs);

    attrs.add("name", name);

    String fieldLabel = cfg.get("fieldLabel", String.class);
    String fieldDesc = cfg.get("fieldDescription", String.class);
%>

<div class="coral-Form-fieldwrapper">
    <label class="coral-Form-fieldlabel"><%=fieldLabel%></label>
    <input is="coral-textfield" name="<%=name%>" value="<%=ssoKey%>" style="width: 100%;">
    <coral-icon class="coral-Form-fieldinfo" icon="infoCircle" size="S"></coral-icon>
    <coral-tooltip target="_prev" placement="left" class="coral3-Tooltip" variant="info" role="tooltip" style="display: none;">
        <coral-tooltip-content><%=fieldDesc%></coral-tooltip-content>
    </coral-tooltip>
</div>
<div style="text-align: right; width: 100%; margin: 0 0 15px 0">
    <button is="coral-button" iconsize="S" id="<%=name%>Gen">Generate</button>
    <button is="coral-button" iconsize="S" id="<%=name%>Copy">copy</button>
</div>

<script>
    function addCopyListener(selector){
        var $widget = $("[name='" + selector + "']"),
            $widgetCopy = $("[id='" + selector + "Copy']"),
            $widgetGen = $("[id='" + selector + "Gen']");

        $widgetCopy.click(function(event){
            event.preventDefault();
            $widget[0].select();
            document.execCommand("copy");
        });

        $widgetGen.click(function(event){
            event.preventDefault();
            $widget.val([...Array(25)].map( i => (~~(Math.random()*36)).toString(36)).join(''));
        });
    }

    $(document).on("foundation-contentloaded", function(){
        addCopyListener("<%=name%>");
    });
</script>