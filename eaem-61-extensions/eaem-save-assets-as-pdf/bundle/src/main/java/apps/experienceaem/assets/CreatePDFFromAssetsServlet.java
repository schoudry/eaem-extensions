package apps.experienceaem.assets;

import com.adobe.internal.io.ByteWriter;
import com.adobe.internal.io.RandomAccessFileByteWriter;
import com.adobe.internal.pdftoolkit.core.types.ASMatrix;
import com.adobe.internal.pdftoolkit.pdf.document.PDFDocument;
import com.adobe.internal.pdftoolkit.pdf.document.PDFOpenOptions;
import com.adobe.internal.pdftoolkit.pdf.document.PDFSaveFullOptions;
import com.adobe.internal.pdftoolkit.pdf.graphics.PDFExtGState;
import com.adobe.internal.pdftoolkit.pdf.graphics.PDFRectangle;
import com.adobe.internal.pdftoolkit.pdf.graphics.xobject.PDFXObjectImage;
import com.adobe.internal.pdftoolkit.pdf.page.PDFPage;
import com.adobe.internal.pdftoolkit.pdf.page.PDFPageTree;
import com.adobe.internal.pdftoolkit.services.imageconversion.ImageManager;
import com.day.cq.dam.api.Asset;
import com.day.cq.dam.api.AssetManager;
import com.day.cq.dam.commons.util.DamUtil;
import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.resource.ResourceResolver;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.imageio.ImageIO;
import javax.jcr.Node;
import javax.servlet.ServletException;
import java.awt.image.BufferedImage;
import java.io.*;

@Component(metatype = true, label = "Experience AEM Create PDF From Assets", description = "")
@Service
@Properties({
        @Property(name = "sling.servlet.methods", value = {"GET" }, propertyPrivate = true),
        @Property(name = "sling.servlet.paths", value = "/bin/eaem/createpdf", propertyPrivate = true)})
public class CreatePDFFromAssetsServlet extends SlingAllMethodsServlet {
    private static final Logger log = LoggerFactory.getLogger(CreatePDFFromAssetsServlet.class);

    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
            throws ServletException, IOException {
        try{
            String assetPaths = request.getParameter("assetPaths");

            if(StringUtils.isEmpty(assetPaths)){
                response.getWriter().print("No asset paths provided");
            }else{
                Asset pdf = createPDF(assetPaths, request);

                if(pdf == null){
                    response.getWriter().print("Error creating pdf");
                }else{
                    writePDF(response, pdf);
                }
            }
        }catch(Exception e){
            log.error("Error creating pdf", e);
        }
    }

    private void writePDF(SlingHttpServletResponse response, Asset pdf) throws Exception{
        response.setContentType("application/pdf");
        response.addHeader("Content-Disposition", "attachment; filename=" + pdf.getName());
        response.setContentLength((int)pdf.getOriginal().getSize());

        InputStream is = null;

        try{
            is = pdf.getOriginal().getStream();
            OutputStream responseOutputStream = response.getOutputStream();
            int bytes;

            while ((bytes = is.read()) != -1) {
                responseOutputStream.write(bytes);
            }
        }finally{
            if(is != null){
                is.close();
            }
        }
    }

    private Asset createPDF(String assetPaths, SlingHttpServletRequest request) throws Exception{
        String pdfPath = null;
        File tmpFile = null;
        ByteWriter tmpFileWriter = null;

        FileInputStream tmpFileReader = null;
        Asset asset = null, pdf = null;
        ResourceResolver resolver = request.getResourceResolver();

        PDFDocument pdfDocument = null;
        InputStream assetStream = null;

        try{
            Node folder = null;

            pdfDocument = PDFDocument.newInstance(PDFOpenOptions.newInstance());
            PDFPageTree pageTree = pdfDocument.requireCatalog().getPages();

            for(String assetPath : assetPaths.split(",")){
                asset = DamUtil.resolveToAsset(resolver.getResource(assetPath));

                if(folder == null){
                    folder = asset.adaptTo(Node.class).getParent();
                }

                assetStream = asset.getOriginal().getStream();

                BufferedImage bImage = ImageIO.read(assetStream);

                PDFXObjectImage image = ImageManager.getPDFImage(bImage, pdfDocument);

                PDFPage newPage = PDFPage.newInstance(pdfDocument,
                                        PDFRectangle.newInstance(pdfDocument,0, 0, image.getWidth(), image.getHeight()));

                ImageManager.insertImageInPDF(image, newPage,
                        PDFExtGState.newInstance(pdfDocument),
                        new ASMatrix(image.getWidth(), 0, 0, image.getHeight(), 0, 0));

                if (pageTree == null){
                    pageTree = PDFPageTree.newInstance(pdfDocument, newPage);
                }else{
                    pageTree.getPage(0).prependPage(newPage);
                }

                assetStream.close();
            }

            tmpFile = File.createTempFile(folder.getName(), ".pdf");

            tmpFileWriter = getTempFileWriter(tmpFile);

            pdfDocument.save(tmpFileWriter, PDFSaveFullOptions.newInstance());

            tmpFileReader = new FileInputStream(tmpFile);

            AssetManager assetMgr = resolver.adaptTo(AssetManager.class);

            pdfPath = folder.getPath() + "/" + folder.getName() + ".pdf";

            Resource resource = resolver.getResource(pdfPath);

            if(resource != null){
                resource.adaptTo(Node.class).remove();
            }

            pdf = assetMgr.createAsset( pdfPath, tmpFileReader, "application/pdf", true);
        }catch(Exception e){
            log.warn("Error generating pdf", e);
        }finally{
            if(assetStream != null){
                assetStream.close();
            }

            if (pdfDocument != null) {
                pdfDocument.close();
            }

            if (tmpFileWriter != null) {
                tmpFileWriter.close();
            }

            if(tmpFileReader !=null ){
                tmpFileReader.close();
            }
        }

        return pdf;
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
}
