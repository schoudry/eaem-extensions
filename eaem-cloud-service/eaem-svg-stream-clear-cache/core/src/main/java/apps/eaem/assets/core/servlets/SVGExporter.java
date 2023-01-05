package apps.eaem.assets.core.servlets;

import com.day.cq.dam.api.Asset;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.resource.Resource;
import org.apache.sling.api.servlets.SlingSafeMethodsServlet;
import org.osgi.service.component.annotations.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Parser;

@Component(
        name = "Experience AEM SVG Exporter",
        immediate = true,
        service = Servlet.class,
        property = {
                "sling.servlet.methods=GET",
                "sling.servlet.paths=/bin/eaem/sprite"
        }
)
public class SVGExporter extends SlingSafeMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(SVGExporter.class);

    private static final String ICONS_FOLDER = "/content/dam/eaem-svg-stream-clear-cache";
    private static final String ID_ATTRIBUTE = "id";
    private static final String XLINK_ATTRIBUTE = "xlink:href";

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
                        throws ServletException, IOException {
        List<Resource> icons = new ArrayList<Resource>();

        Resource iconsFolder = request.getResourceResolver().getResource(ICONS_FOLDER);

        List<String> iconStrings = getAllResourceChildren(iconsFolder, r -> r.getName().endsWith(".svg"), icons)
                .stream()
                .map(this::getIconAsString)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        response.setContentType("image/svg+xml; charset=UTF-8");

        PrintWriter writer = response.getWriter();
        writer.write("<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">");
        iconStrings.forEach(writer::write);
        writer.write("</svg>");
    }

    private static Collection<Resource> getAllResourceChildren(Resource resource, Predicate<Resource> predicate,
                                                               List<Resource> collection) {
        Iterable<Resource> children = resource.getChildren();

        for (Resource child : children) {
            if(predicate.test(child)){
                collection.add(child);
            }else{
                getAllResourceChildren(child, predicate, collection);
            }
        }

        return collection;
    }

    private String getIconAsString(Resource resource) {
        String result = null;
        String name = FilenameUtils.getBaseName(resource.getName());
        Asset asset = resource.adaptTo(Asset.class);

        if (asset == null) {
            return result;
        }

        try{
            String content = IOUtils.toString(asset.getOriginal().getStream());
            result = transformSvg(name, content);
        } catch (IOException e) {
            LOGGER.error("Error reading svg stream: {}", e);
        }

        return result;
    }

    public static String transformSvg(String id, String svgContent) {
        Document doc = Jsoup.parse(svgContent, "", Parser.xmlParser());
        Element svg = doc.select("svg").first();

        Element symbol = doc.createElement("symbol");
        symbol.attr(ID_ATTRIBUTE, id);
        symbol.attr("viewBox", svg.attr("viewBox"));

        Optional.ofNullable(svg.select("style").first()).ifPresent(style -> {
            String cssSelector = String.format("#%s .$1{", id);
            String styleContent = style.html().replaceAll("\\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*\\s*)\\{", cssSelector);
            style.html(styleContent);
        });

        svg.children().forEach(child -> {
            child.getElementsByAttribute(ID_ATTRIBUTE).forEach(element -> {
                String value = String.format("%s-%s", id, element.attr(ID_ATTRIBUTE));
                element.attr(ID_ATTRIBUTE, value);
            });
            child.getElementsByAttribute(XLINK_ATTRIBUTE).forEach(element -> {
                String value = String.format("#%s-%s", id, element.attr(XLINK_ATTRIBUTE).substring(1));
                element.attr(XLINK_ATTRIBUTE, value);
            });

            symbol.appendChild(child);
        });

        return symbol.outerHtml();
    }
}