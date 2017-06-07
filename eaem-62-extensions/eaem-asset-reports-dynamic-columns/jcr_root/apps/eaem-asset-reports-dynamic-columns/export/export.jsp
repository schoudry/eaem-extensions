<%@ page import="java.io.PrintWriter" %>
<%@ page import="java.io.IOException" %>
<%@ page import="java.io.StringWriter" %>
<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@ page import="org.apache.sling.api.SlingHttpServletRequest" %>
<%@ page import="org.apache.sling.commons.json.JSONObject" %>
<%@ page import="org.slf4j.Logger" %>
<%@ page import="org.slf4j.LoggerFactory" %>
<%@ page import="java.net.URLDecoder" %>
<%@ page import="org.apache.sling.commons.json.JSONArray" %>
<%@ page import="org.apache.sling.api.resource.ResourceResolver" %>
<%@ page import="org.apache.sling.api.resource.Resource" %>
<%@ page import="java.util.*" %>
<%@ page import="org.apache.sling.api.resource.ValueMap" %>
<%@ page import="javax.jcr.Session" %>
<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.2"%>
<%@taglib prefix="cq" uri="http://www.day.com/taglibs/cq/1.0"%>

<cq:defineObjects />

<%!
    final Logger log = LoggerFactory.getLogger(this.getClass());
    final String EXPORT_JSP = "/libs/dam/gui/content/reports/export";
    final String COLUMNS_CONFIG = "/etc/experience-aem/report-columns/jcr:content/list";

    static String COOKIE_REPORT_LIST_VIEW_COLUMNS = "eaem.report.listview.columns";
    static String PATH_HEADER = "\"PATH\"";
%>

<%
    HttpServletResponseWrapper responseWrapper = getWrapper(response);

    request.getRequestDispatcher(EXPORT_JSP).include(request, responseWrapper);

    String csvContent = responseWrapper.toString();

    csvContent = addCustomColumns(slingRequest, csvContent);

    PrintWriter o = response.getWriter();

    o.write(csvContent);

    o.flush();
%>

<%!
    private String addCustomColumns(SlingHttpServletRequest sRequest, String csvContent){
        Cookie cookie = sRequest.getCookie(COOKIE_REPORT_LIST_VIEW_COLUMNS);

        if(cookie == null){
            return csvContent;
        }

        String enabledColumns = cookie.getValue();

        if(StringUtils.isEmpty(enabledColumns)){
            return csvContent;
        }

        String reportSelected = sRequest.getRequestPathInfo().getSuffix();

        try{
            JSONObject enabled = new JSONObject(URLDecoder.decode(enabledColumns, "UTF-8"));

            if(!enabled.has(reportSelected)){
                return csvContent;
            }

            JSONArray reportCustomColumns = enabled.getJSONArray(reportSelected);
            String[] lines = csvContent.split("\r\n");

            StringWriter customCsvContent = new StringWriter();

            if(lines.length == 0){
                return csvContent;
            }

            Map<String, String> colConfig = getCustomColumnsConfig(sRequest.getResourceResolver());

            addHeaderLine(colConfig, reportCustomColumns, customCsvContent, lines[0]);

            addAssetLines(sRequest, reportCustomColumns, customCsvContent, lines);

            csvContent = customCsvContent.toString();

            System.out.println(reportCustomColumns);
        }catch(Exception e){
            log.warn("Error adding global internal external columns", e);
        }

        return csvContent;
    }

    private void addAssetLines(SlingHttpServletRequest sRequest, JSONArray reportCustomColumns,
                               StringWriter gieCsvContent, String[] csvLines) throws Exception {
        if(csvLines.length == 1){
            return;
        }

        int pathIndex = -1;

        String[] headers = csvLines[0].split(",");

        for(int i = 0; i < headers.length; i++){
            if(headers[i].equalsIgnoreCase(PATH_HEADER)){
                pathIndex = i;
            }
        }

        if(pathIndex == -1){
            return;
        }

        String line = null, assetPath = null, colMapPath = null, colMetaName;
        ValueMap assetMetadata = null;

        ResourceResolver resolver = sRequest.getResourceResolver();
        Session session = resolver.adaptTo(Session.class);

        for(int l = 1; l < csvLines.length; l++){
            line = csvLines[l];

            try{
                assetPath = line.split(",")[pathIndex];

                assetPath = assetPath.replaceAll("\"", "");

                assetPath = assetPath + "/jcr:content/metadata";

                if(!session.nodeExists(assetPath)){
                    continue;
                }

                assetMetadata = resolver.getResource(assetPath).getValueMap();

                for(int index = 0, len = reportCustomColumns.length(); index < len; index++){
                    colMapPath = reportCustomColumns.getString(index);
                    colMetaName = colMapPath.substring(colMapPath.lastIndexOf("/") + 1);
                    line = line + "," + assetMetadata.get(colMetaName, "");
                }
            }catch(Exception e){
            }

            gieCsvContent.append(line);

            gieCsvContent.append("\r\n");
        }
    }

    private Map<String, String> getCustomColumnsConfig(ResourceResolver resolver){
        Resource mlResource = resolver.getResource(COLUMNS_CONFIG);
        Map<String, String> colConfig = new HashMap<String, String>();

        if(mlResource == null){
            return colConfig;
        }

        try{
            Iterator<Resource> managedList = mlResource.listChildren();
            Resource resource;
            ValueMap vm;

            while (managedList.hasNext()) {
                resource = managedList.next();
                vm = resource.getValueMap();

                colConfig.put(vm.get("value", ""), vm.get("jcr:title", ""));
            }
        }catch(Exception e){
            log.warn("Error reading managed list");
        }

        return colConfig;
    }


    private void addHeaderLine(Map<String, String> colConfig, JSONArray customColumns,
                                       StringWriter customCsvContent, String headerLine) throws Exception{
        String colMapPath  = null;

        if(headerLine.indexOf("\"\"") != -1){
            headerLine = headerLine.substring(0, headerLine.indexOf("\"\"") - 1);
        }

        for(int index = 0, len = customColumns.length(); index < len; index++){
            colMapPath = customColumns.getString(index);
            headerLine = headerLine + ",\"" + colConfig.get(colMapPath) + "\"";
        }

        customCsvContent.append(headerLine).append("\r\n");;
    }

    private static HttpServletResponseWrapper getWrapper(HttpServletResponse response){
        return new HttpServletResponseWrapper(response) {
            public final StringWriter sw = new StringWriter();

            @Override
            public PrintWriter getWriter() throws IOException {
                return new PrintWriter(sw);

            }

            @Override
            public String toString() {
                return sw.toString();
            }
        };
    }
%>