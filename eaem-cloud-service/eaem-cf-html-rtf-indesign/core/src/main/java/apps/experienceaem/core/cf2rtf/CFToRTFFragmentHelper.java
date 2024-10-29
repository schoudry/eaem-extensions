package apps.experienceaem.core.cf2rtf;

import com.adobe.cq.dam.cfm.ContentElement;
import com.adobe.cq.dam.cfm.ContentFragment;

import java.util.Iterator;

public class CFToRTFFragmentHelper
{

    private static final String HTML_MIME_TYPE = "text/html";

    /**
     * Extracts all the "text/html" elements found in the specified `cf` and returns the result.
     * @param cf The content fragment whose HTML contents are to be extracted.
     * @return The resulting HTML.
     */
    public static StringBuilder getFragmentHtmlContents(ContentFragment cf)
    {

        StringBuilder result = new StringBuilder();
        Iterator<ContentElement> elements = cf.getElements();

        while (elements.hasNext())
        {

            ContentElement element = elements.next();

            if (HTML_MIME_TYPE.equals(element.getContentType()))
            {
                result.append(element.getContent());
            }

        }

        return result;

    }

}