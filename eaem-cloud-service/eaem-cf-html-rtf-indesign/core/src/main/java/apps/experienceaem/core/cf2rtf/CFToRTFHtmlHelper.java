package apps.experienceaem.core.cf2rtf;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class CFToRTFHtmlHelper
{

    private static final Map<String, String> COMMON_ENTITIES;
    private static final Map<String, String> SUPER_TRADEMARKS;
    private static final Map<String, String> REGULAR_TRADEMARKS;

    static
    {

        HashMap<String, String> commonEntities = new HashMap<>();
        HashMap<String, String> superTrademarks = new HashMap<>();
        HashMap<String, String> regularTrademarks = new HashMap<>();

        commonEntities.put("&lt;", "<");
        commonEntities.put("&gt;", ">");
        commonEntities.put("&#0*39;", "'");
        commonEntities.put("&apos;|&#x0*27;", "'");
        commonEntities.put("&quot;", "\"");
        commonEntities.put("&amp;", "&");
        commonEntities.put("&nbsp;", " ");
        commonEntities.put("&NonBreakingSpace;", " ");
        commonEntities.put("’", "'");
        commonEntities.put("‘", "'");
        commonEntities.put("“", "\"");
        commonEntities.put("”", "\"");
        commonEntities.put("°", "\\\\'b0");
        commonEntities.put("•", "\\\\'95");
        commonEntities.put("—", "\\\\'97");
        commonEntities.put("¢", "\\\\'a3");
        commonEntities.put("¤", "\\\\'a4");
        commonEntities.put("¥", "\\\\'a5");
        commonEntities.put("¦", "\\\\'a6");
        commonEntities.put("§", "\\\\'a7");
        commonEntities.put("µ", "\\\\'b5");
        commonEntities.put("¶", "\\\\'b6");
        commonEntities.put("‹", "\\\\'8b");
        commonEntities.put("›", "\\\\'9b");
        commonEntities.put("«", "\\\\'ab");
        commonEntities.put("»", "\\\\'bb");
        commonEntities.put("¼", "\\\\'bc");
        commonEntities.put("½", "\\\\'bd");
        commonEntities.put("¾", "\\\\'be");
        commonEntities.put("…", "\\\\'85");
        commonEntities.put("±", "\\\\'b1");

        superTrademarks.put("™", "{\\\\super\\\\'99}");
        superTrademarks.put("℠", "{\\\\super\\\\u8480?}");
        superTrademarks.put("©", "{\\\\super\\\\'a9}");
        superTrademarks.put("®", "{\\\\super\\\\'ae}");

        regularTrademarks.put("™", "\\\\'99");
        regularTrademarks.put("℠", "\\\\u8480?");
        regularTrademarks.put("©", "\\\\'a9");
        regularTrademarks.put("®", "\\\\'ae");

        COMMON_ENTITIES = Collections.unmodifiableMap(commonEntities);
        SUPER_TRADEMARKS = Collections.unmodifiableMap(superTrademarks);
        REGULAR_TRADEMARKS = Collections.unmodifiableMap(regularTrademarks);

    }

    /**
     * Replaces all the occurrences of each key of `config.preTextReplacements` to the
     * `dictionary`'s value for that key from `html` and returns the updated `html`.
     * @param html The source HTML
     * @param config The user configurations.
     * @return The resulting HTML with.
     */
    public static String preProcess(String html, CFToRTFConfig config)
    {
        return replaceAll(html, config.preTextReplacements);
    }

    /**
     * Replaces HTML entities with their RTF equivalent, based on the given `config`.
     * @param html The source HTML
     * @param config The user configurations.
     * @return The resulting HTML with its entities converted to RTF compatible values
     * and `config.postTextReplacements` applied.
     */
    public static String escapeHTMLEntities(String html, CFToRTFConfig config)
    {

        html = replaceAll(html, COMMON_ENTITIES);

        if (config.superscriptTrademarks)
        {
            html = replaceAll(html, SUPER_TRADEMARKS);
        }
        else
        {
            html = replaceAll(html, REGULAR_TRADEMARKS);
        }

        html = replaceAll(html, config.postTextReplacements);

        return html;

    }

    /**
     * Replaces all the occurrences of each key of `dictionary` to the `dictionary`'s
     * value for that key from `text` and returns the updated `text`.
     */
    private static String replaceAll(String text, Map<String, String> dictionary)
    {

        for (Map.Entry<String, String> entry: dictionary.entrySet())
        {
            text = text.replaceAll(entry.getKey(), entry.getValue());
        }

        return text;

    }

}
