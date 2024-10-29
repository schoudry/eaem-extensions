package apps.experienceaem.core.cf2rtf;

import com.day.cq.dam.api.Asset;
import com.day.cq.dam.api.AssetManager;
import org.apache.commons.lang.text.StrSubstitutor;
import org.apache.sling.api.resource.Resource;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

public class CFToRTFAssetHelper
{

    private static final String RTF_MIME_TYPE = "text/rtf";
    private static final String PATH_SEPARATOR = "/";
    private static final String PATH_CURRENT_DIR = ".";

    private static final String KEY_NOW = "now";
    private static final String KEY_CURRENT_MILLIS = "currentMillis";
    private static final String KEY_CF_PARENT_NODE_NAME = "cfParentNodeName";
    private static final String KEY_CF_NODE_NAME = "cfNodeName";
    private static final String KEY_CF_DIRECTORY = "cfDirectory";

    private static final DateTimeFormatter NOW_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

    private static final boolean COMMIT_SESSION = true;

    /**
     * Write the RTF content of `rft` to `.rtf` file and save it as an AEM Asset per the `config` rule.
     * @param rtf The RTF content
     * @param fragmentResource The Content Fragment resource which was used to generate the RTF.
     * @param assetManager The AEM Asset Manager.
     * @param config The user configurations.
     * @return The created asset's fully qualified path in AEM.
     */
    public static String createRTFAsset(
        String rtf,
        Resource fragmentResource,
        AssetManager assetManager,
        CFToRTFConfig config
    )
    {

        String rtfFileSpec = getRTFFileDestination(fragmentResource, config);
        InputStream rtfStream = new ByteArrayInputStream(rtf.getBytes(StandardCharsets.UTF_8));
        Asset rtfAsset = assetManager.createAsset(rtfFileSpec, rtfStream, RTF_MIME_TYPE, COMMIT_SESSION);

        if (rtfAsset == null)
        {
            throw new CFToRTFException(String.format("Could not create the RTF Asset `%s`!", rtfFileSpec));
        }

        return rtfFileSpec;

    }

    /**
     * Resolve the location of the RTF Asset.
     * @param fragmentResource The Content Fragment resource which was used to generate the RTF.
     * @param config The user configurations.
     * @return The asset's absolute path in AEM.
     */
    private static String getRTFFileDestination(
            Resource fragmentResource,
            CFToRTFConfig config
    )
    {

        Map<String, String> vars = getDestinationVars(fragmentResource);
        StrSubstitutor strSubstitutor = new StrSubstitutor(vars);
        String outputPath = strSubstitutor.replace(config.outputPath);

        return resolveAbsolutePath(vars.get(KEY_CF_DIRECTORY), outputPath);

    }

    /**
     * Creates and returns a map of variable to be substituted in the output file path template.
     */
    private static Map<String, String> getDestinationVars(Resource fragmentResource)
    {

        Resource parentResource = fragmentResource.getParent();
        String parentNodeName;
        String parentDirectory;

        if (parentResource == null)
        {
            parentNodeName = PATH_CURRENT_DIR;
            parentDirectory = PATH_SEPARATOR;
        }
        else
        {
            parentNodeName = parentResource.getName();
            parentDirectory = parentResource.getPath() + PATH_SEPARATOR;
        }

        HashMap<String, String> result = new HashMap<>();

        result.put(KEY_NOW, LocalDateTime.now().format(NOW_FORMATTER));
        result.put(KEY_CURRENT_MILLIS, String.valueOf(System.currentTimeMillis()));
        result.put(KEY_CF_NODE_NAME, fragmentResource.getName());
        result.put(KEY_CF_PARENT_NODE_NAME, parentNodeName);
        result.put(KEY_CF_DIRECTORY, parentDirectory);

        return result;

    }

    /**
     * Makes `relPath` absolute using `absPath` as reference.
     * @param absPath The reference absolute path
     * @param relPath The path to make absolute
     */
    private static String resolveAbsolutePath(String absPath, String relPath)
    {
        try
        {
            return (new URI(absPath).resolve(new URI(relPath))).toString();
        }
        catch (URISyntaxException ex)
        {
            throw new CFToRTFException(
                    String.format(
                            "Could not generate the RTF output file path `%s` (parent dir `%s`): %s",
                            relPath,
                            absPath,
                            ex.getMessage()
                    ),
                    ex
            );
        }
    }

}