package apps.experienceaem.pdf;

import com.adobe.internal.io.ByteReader;
import com.adobe.internal.io.ByteWriter;
import com.adobe.internal.io.InputStreamByteReader;
import com.adobe.internal.io.RandomAccessFileByteWriter;
import com.adobe.internal.pdftoolkit.core.exceptions.PDFException;
import com.adobe.internal.pdftoolkit.pdf.document.PDFDocument;
import com.adobe.internal.pdftoolkit.pdf.document.PDFOpenOptions;
import com.adobe.internal.pdftoolkit.pdf.document.PDFSaveFullOptions;
import com.adobe.internal.pdftoolkit.pdf.page.PDFPage;
import com.adobe.internal.pdftoolkit.pdf.page.PDFPageTree;
import com.adobe.internal.pdftoolkit.services.manipulations.PMMOptions;
import com.adobe.internal.pdftoolkit.services.manipulations.PMMService;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.api.AssetManager;
import com.day.cq.dam.commons.util.DamUtil;
import com.day.cq.workflow.WorkflowException;
import com.day.cq.workflow.WorkflowSession;
import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.exec.WorkflowProcess;
import com.day.cq.workflow.metadata.MetaDataMap;
import org.apache.felix.scr.annotations.*;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.jcr.resource.JcrResourceResolverFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Session;
import java.io.*;

@Component
@Service
@Properties({@Property(name = "process.label", value = "Experience AEM - Generate PDF Assets Process")})
public class CreatePDFRendition implements WorkflowProcess {
    private static final Logger log = LoggerFactory.getLogger(CreatePDFRendition.class);

    @Reference(policy = ReferencePolicy.STATIC)
    private JcrResourceResolverFactory jcrResolverFactory;

    public void execute(WorkItem workItem, WorkflowSession workflowSession,
                        MetaDataMap metaDataMap) throws WorkflowException {
        long startTime = System.currentTimeMillis();

        Asset asset = getAssetFromPayload(workItem, workflowSession.getSession());

        try{
            if(asset != null && asset.getName().endsWith(".ai")){
                addPDFRendition(asset);
            }
        }catch(Exception e){
            log.warn("Error generating pdf", e);
        }

        long endTime = System.currentTimeMillis();

        log.info("CreatePDFRendition took {} seconds" , (endTime - startTime) / 1000);
    }

    private void addPDFRendition(Asset asset) throws Exception{
        File tmpFile = null;
        ByteWriter tmpFileWriter = null;

        FileInputStream tmpFileReader = null;
        InputStream assetOrigIS = null;

        PDFDocument pdfDocument = null;
        PDFDocument vectorFile = null;
        PDFPage pdfPage = null;

        try {
            assetOrigIS = asset.getOriginal().getStream();

            vectorFile = parseDocument(assetOrigIS);

            PMMService pmmService = new PMMService(vectorFile);

            PDFPageTree pages = vectorFile.requirePages();

            int count = pages.getCount();

            for(int i = 0; i < count; i++){
                pdfPage = pages.getPage(i);

                pdfDocument = pmmService.extractPages(pdfPage, 1,
                        PMMOptions.newInstance(PMMOptions.AllOptions),
                        PDFOpenOptions.newInstance());

                tmpFile = File.createTempFile(asset.getName(), ".pdf");

                tmpFileWriter = getTempFileWriter(tmpFile);

                pdfDocument.save(tmpFileWriter, PDFSaveFullOptions.newInstance());

                tmpFileWriter.close();

                tmpFileReader = new FileInputStream(tmpFile);

                AssetManager assetMgr = asset.getOriginal().getResourceResolver()
                        .adaptTo(AssetManager.class);

                String folder = asset.adaptTo(Node.class).getParent().getPath();

                assetMgr.createAsset( folder + "/" + asset.getName() + "-"
                        + pdfPage.getPageNumber() + ".pdf",
                        tmpFileReader, "application/pdf", true);

                pdfDocument.close();
                tmpFileWriter.close();
                tmpFileReader.close();
            }
        }catch(Exception e){
            log.warn("Error generating pdf for - " + asset.getPath(), e);
        }finally{
            if (pdfDocument != null) {
                pdfDocument.close();
            }

            if (tmpFileWriter != null) {
                tmpFileWriter.close();
            }

            if(tmpFileReader !=null ){
                tmpFileReader.close();
            }

            if(assetOrigIS != null){
                assetOrigIS.close();
            }
        }
    }

    private static PDFDocument parseDocument(InputStream input) throws Exception {
        ByteReader byteReader = null;
        PDFDocument pdfDoc = null;

        byteReader = new InputStreamByteReader(input);

        try {
            pdfDoc = PDFDocument.newInstance(byteReader, PDFOpenOptions.newInstance());
        } catch (PDFException e) {
            log.warn("Error while reading vector file", e);
            throw e;
        }

        return pdfDoc;
    }

    private ByteWriter getTempFileWriter(File file) throws IOException {
        file.delete();

        File parent = file.getParentFile();

        if (parent != null) {
            parent.mkdirs();
        }

        file.createNewFile();

        return new RandomAccessFileByteWriter(new RandomAccessFile(file, "rw"));
    }

    private Asset getAssetFromPayload(WorkItem item, Session session) {
        Asset asset = null;

        if(item.getWorkflowData().getPayloadType().equals("JCR_PATH")) {
            String path = item.getWorkflowData().getPayload().toString();
            Resource resource = getResourceResolver(session).getResource(path);

            if(null != resource) {
                asset = DamUtil.resolveToAsset(resource);
            } else {
                log.error("getAssetFromPaylod: asset [{}] in payload of workflow [{}] does not exist.", path, item.getWorkflow().getId());
            }
        }

        return asset;
    }

    private ResourceResolver getResourceResolver(final Session session) {
        return jcrResolverFactory.getResourceResolver(session);
    }
}
