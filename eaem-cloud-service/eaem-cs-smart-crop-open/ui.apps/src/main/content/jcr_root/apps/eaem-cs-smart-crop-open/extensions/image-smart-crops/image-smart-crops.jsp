<%@include file="/libs/granite/ui/global.jsp"%>

<%@page session="false"
        import="java.util.Iterator,
                  org.apache.sling.commons.json.JSONObject,
                  com.adobe.granite.ui.components.Config,
                  com.adobe.granite.ui.components.Tag"%>
<%@ page import="com.adobe.granite.ui.components.ds.ValueMapResource" %>
<%@ page import="com.adobe.granite.ui.components.ds.DataSource" %>
<%@ page import="org.apache.sling.commons.json.JSONArray" %>
<%@ page import="apps.experienceaem.assets.core.services.EAEMDMService" %>

<%
    Config cfg = cmp.getConfig();
    ValueMap dynVM = null;

    JSONObject dynRenditions = new JSONObject();
    Resource dynResource = null;

    EAEMDMService dmcService = sling.getService(EAEMDMService.class);
    response.setContentType("application/json");

    String name = "Original";

    JSONObject dynRendition = new JSONObject();

    dynRendition.put("type", "IMAGE");
    dynRendition.put("name", name);

    dynRenditions.put(name, dynRendition);

    DataSource rendsDS = null;

    try{
        rendsDS = cmp.getItemDataSource();
    }catch(Exception e){
        //could be pixel crop, ignore...
    }

    if(rendsDS == null){
        dynRenditions.write(response.getWriter());
        return;
    }

    for (Iterator<Resource> items = rendsDS.iterator(); items.hasNext();) {
        dynRendition = new JSONObject();

        dynResource = items.next();

        dynVM = dynResource.getValueMap();

        name = String.valueOf(dynVM.get("breakpoint-name"));
        String testContextUrl = dmcService.getS7TestContextUrl(dynResource.getPath(), (String)dynVM.get("copyurl"));

        dynRendition.put("type", "IMAGE");
        dynRendition.put("name", name);
        dynRendition.put("s7Url", testContextUrl);
        dynRendition.put("cropdata", getCropData(dynVM));

        dynRenditions.put(name, dynRendition);
    }

    dynRenditions.write(response.getWriter());
%>

<%!
    private static JSONArray getCropData(ValueMap dynVM) throws Exception{
        JSONArray cropArray = new JSONArray();
        JSONObject cropData = new JSONObject();

        cropData.put("name", String.valueOf(dynVM.get("breakpoint-name")));
        cropData.put("id", dynVM.get("id"));
        cropData.put("topN", dynVM.get("topN"));
        cropData.put("bottomN", dynVM.get("bottomN"));
        cropData.put("leftN", dynVM.get("leftN"));
        cropData.put("rightN", dynVM.get("rightN"));

        cropArray.put(cropData);

        return cropArray;
    }
%>
