package apps.experienceaem.assets.core.reports;

import com.day.cq.search.PredicateGroup;
import com.day.cq.search.Query;
import com.day.cq.search.QueryBuilder;
import com.day.cq.search.result.Hit;
import com.day.cq.search.result.SearchResult;
import org.apache.commons.io.FileUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.sling.api.resource.LoginException;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.resource.ResourceResolverFactory;
import org.apache.sling.event.jobs.Job;
import org.apache.sling.event.jobs.consumer.JobConsumer;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Reference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import java.io.*;
import java.util.*;

@Component(
        immediate = true,
        service = JobConsumer.class,
        property = {
                "job.topics=com/eaem/aem/dam/report",
        }
)
public class EAEMReportJobConsumer implements JobConsumer {
    protected final Logger logger = LoggerFactory.getLogger(EAEMReportJobConsumer.class);

    private static String CF_USAGE_REPORT_TYPE = "cf-usage-report";

    @Reference
    private ResourceResolverFactory resolverFactory;

    @Reference
    private QueryBuilder builder;

    public JobConsumer.JobResult process(Job job) {
        ResourceResolver resourceResolver = null;
        File tempFile = null;

        try {
            resourceResolver = getServiceResourceResolver(resolverFactory);
            Session session = resourceResolver.adaptTo(Session.class);

            String cfRootPath = job.getProperty("cfRootPath", String.class);

            if(StringUtils.isEmpty(cfRootPath)){
                cfRootPath = "/content/dam";
            }

            String pageRootPath = job.getProperty("pageRootPath", String.class);

            if(StringUtils.isEmpty(pageRootPath)){
                pageRootPath = "/content";
            }

            String csvCreationPath = job.getProperty("jobNodePath", String.class);
            Node jobNode = session.getNode(csvCreationPath);
            String csvName = jobNode.getProperty("jobTitle").getString();
            ArrayList columns = new ArrayList(Arrays.asList(job.getProperty("reportColumns", String[].class)));

            String reportType = jobNode.getProperty("reportType").getString();

            if(!reportType.equals(CF_USAGE_REPORT_TYPE)){
                return JobResult.OK;
            }

            tempFile = File.createTempFile("report", ".csv");
            FileOutputStream e = new FileOutputStream(tempFile);
            PrintWriter writer = new PrintWriter(new OutputStreamWriter(e, "UTF-8"));

            List csvHeaders = writeColumnsHeaderToCSV(writer, columns);
            writeContentToCSV(writer, resourceResolver, cfRootPath,pageRootPath);

            writer.close();

            Node fileNode = jobNode.addNode(csvName + ".csv", "nt:file");
            Node resNode = fileNode.addNode("jcr:content", "nt:resource");

            jobNode.setProperty("reportCsvColumns", (String[])csvHeaders.toArray(new String[0]));
            resNode.setProperty("jcr:mimeType", "text/csv");
            resNode.setProperty("jcr:data", session.getValueFactory().createBinary(
                                    new ByteArrayInputStream(FileUtils.readFileToByteArray(tempFile))));

            setLastModified(resNode);

            jobNode.setProperty("jobStatus", "completed");

            session.save();
        } catch (Exception var28) {
            logger.info("Failed to create report");
            return JobResult.FAILED;
        } finally {
            if(tempFile != null) {
                tempFile.delete();
            }
        }

        return JobResult.OK;
    }

    public ResourceResolver getServiceResourceResolver(ResourceResolverFactory resourceResolverFactory) {
        Map<String, Object> subServiceUser = new HashMap<>();
        subServiceUser.put(ResourceResolverFactory.SUBSERVICE, "eaem-user-report-admin");
        try {
            return resourceResolverFactory.getServiceResourceResolver(subServiceUser);
        } catch (LoginException ex) {
            logger.error("Could not login as SubService user {}", "eaem-user-report-admin", ex);
            return null;
        }
    }


    public List<String> writeColumnsHeaderToCSV(PrintWriter writer, List<String> columns) throws IOException {
        List<String> csvColumns = new ArrayList<String>();

        columns.stream().forEach((c) -> {
            writer.append("\"").append(c.toUpperCase()).append("\"").append(",");
            csvColumns.add(c.toLowerCase());
        });

        writer.append("\r\n");

        return csvColumns;
    }

    private static Map<String, String> getFindCFsQueryPredicateMap(String folderPath) {
        Map<String, String> map = new HashMap<>();

        map.put("path", folderPath);
        map.put("1_property","jcr:content/contentFragment");
        map.put("1_property.value","true");
        map.put("p.limit","-1");

        return map;
    }

    private static Map<String, String> getFindReferencesPredicateMap(String folderPath, String cfPath) {
        Map<String, String> map = new HashMap<>();

        map.put("path", folderPath);
        map.put("fulltext", cfPath);
        map.put("orderby", "@jcr:score");
        map.put("p.limit", "-1");

        return map;
    }

    private void setLastModified(Node resNode) throws RepositoryException {
        Calendar lastModified = Calendar.getInstance();
        lastModified.setTimeInMillis(lastModified.getTimeInMillis());
        resNode.setProperty("jcr:lastModified", lastModified);
    }

    public void writeContentToCSV(PrintWriter writer, ResourceResolver resolver, String folderPath, String pageRootPath) throws Exception {
        Query query = builder.createQuery(PredicateGroup.create(getFindCFsQueryPredicateMap(folderPath)), resolver.adaptTo(Session.class));

        SearchResult result = query.getResult();
        String cfPath = null, title;

        for (Hit hit : result.getHits()) {
            cfPath = hit.getPath();

            Query cfQuery = builder.createQuery(PredicateGroup.create(getFindReferencesPredicateMap(pageRootPath, cfPath)), resolver.adaptTo(Session.class));
            SearchResult cfResults = cfQuery.getResult();

            for (Hit cfHit : cfResults.getHits()) {
                writer.append("\"").append(hit.getTitle()).append("\"").append(",").append("\"")
                        .append(hit.getPath()).append("\"").append(",").append("\"").append(cfHit.getPath()).append("\",");
                writer.append("\r\n");
            }
        }
    }
}
