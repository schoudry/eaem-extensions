<%@include file="/libs/granite/ui/global.jsp"%>

<%@page session="false"
        import="java.util.Iterator,
                  org.apache.sling.commons.json.JSONObject,
                  com.adobe.granite.ui.components.Tag"%>
<%@ page import="com.adobe.granite.ui.components.ds.DataSource" %>
<%@ page import="org.apache.sling.commons.json.JSONArray" %>
<%@ page import="apps.experienceaem.assets.core.services.DMCService" %>

<%
    ValueMap dynVM = null;

    JSONObject dynRenditions = new JSONObject();
    Resource dynResource = null;

    DMCService dmcService = sling.getService(DMCService.class);
    response.setContentType("application/json");

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
        JSONObject dynRendition = new JSONObject();

        dynResource = items.next();

        dynVM = dynResource.getValueMap();

        String name = String.valueOf(dynVM.get("breakpoint-name"));

        dynRendition.put("name", name);
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
