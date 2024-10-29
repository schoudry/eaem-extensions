package apps.experienceaem.core.cf2rtf;

import com.google.gson.*;
import org.apache.commons.lang3.StringUtils;

import java.util.*;

public class CFToRTFConfig
{

    private static final String EMPTY_JSON_OBJECT_TEXT = "{}";
    private static final String RTF_OPEN_PARAGRAPH_TAG = "{\\pard";
    private static final String RTF_CLOSE_PARAGRAPH_TAG = "\\par}";
    private static final String RTF_FONT_SIZE_TAG_TPL = "\\fs%s";
    private static final String RTF_LINE_HEIGHT_TAG_TPL = "\\sl%s\\slmult1";
    private static final String RTF_FONT_SCALE_X_TAG_TPL = "\\charscalex%s";
    private static final int RTF_FONT_SIZE_PX = 24;
    private static final float RTF_FONT_SIZE_TO_H1_RATIO = 2.66f;
    private static final int RTF_DEFAULT_LINE_HEIGHT_TWIPS = 240;

    private static final String DEFAULT_OUTPUT_PATH = "./${cfNodeName}.rtf";
    private static final String DEFAULT_FONT_NAME = "Helvetica Condensed";
    private static final CFToRTFColor DEFAULT_HYPERLINK_COLOR = new CFToRTFColor(0, 0, 255);
    private static final Map<String, Long> DEFAULT_HEADING_SIZES = Collections.emptyMap();
    private static final Map<String, String> DEFAULT_COLOR_CLASSES = Collections.emptyMap();
    private static final Map<String, String> DEFAULT_PRE_TEXT_REPLACEMENTS = Collections.emptyMap();
    private static final Map<String, String> DEFAULT_POST_TEXT_REPLACEMENTS = Collections.emptyMap();
    private static final Map<String, String> DEFAULT_BORDERED_PARAGRAPH_CLASSES = Collections.emptyMap();
    private static final long DEFAULT_H1_SIZE = resolveH1FontSize(RTF_FONT_SIZE_PX);
    private static final long DEFAULT_FONT_SIZE = -1;
    private static final long DEFAULT_FONT_SCALE_X = 100;
    private static final long DEFAULT_LIST_LEFT_INDENT_SIZE = 300;
    private static final long DEFAULT_LIST_FIRST_LINE_INDENT_SIZE = 300;
    private static final float DEFAULT_LINE_HEIGHT = 1.0f;
    private static final boolean DEFAULT_INDENT_UNNESTED_LISTS = true;
    private static final boolean DEFAULT_SUPERSCRIPT_TRADEMARKS = true;

    private static final String JSON_KEY_HEADINGS = "headings";
    private static final String JSON_KEY_HEADINGS_1 = "1";
    private static final String JSON_KEY_FONT_NAME = "fontName";
    private static final String JSON_KEY_OUTPUT_PATH = "outputPath";
    private static final String JSON_KEY_FONT_SCALE_X = "fontScaleX";
    private static final String JSON_KEY_COLOR_CLASSES = "colorClasses";
    private static final String JSON_KEY_DOC_FONT_SIZE = "docFontSize";
    private static final String JSON_KEY_DOC_LINE_HEIGHT = "docLineHeight";
    private static final String JSON_KEY_HYPERLINK_COLOR = "hyperlinkColor";
    private static final String JSON_KEY_LIST_LEFT_INDENT_SIZE = "listLeftIndentSize";
    private static final String JSON_KEY_INDENT_UNNESTED_LISTS = "indentUnnestedLists";
    private static final String JSON_KEY_PRE_TEXT_REPLACEMENTS = "preTextReplacements";
    private static final String JSON_KEY_POST_TEXT_REPLACEMENTS = "postTextReplacements";
    private static final String JSON_KEY_SUPERSCRIPT_TRADEMARKS = "superscriptTrademarks";
    private static final String JSON_KEY_LIST_FIRST_LINE_INDENT_SIZE = "listFirstIndentSize";
    private static final String JSON_KEY_BORDERED_PARAGRAPH_CLASSES = "borderedParagraphClasses";

    /** The RTF Font Name. e.g., "Helvetica" */
    public final String fontName;

    /**
     * The path where the resulting RTF asset should be created,
     * relative to the source content fragment's directory.
     * <p>Note that the specified parent directory must already exist,
     * and that existing nodes at that path will get overwritten.</p>
     * <p>This string is a template in which the following variables will be substituted:</p>
     * <ul>
     * <li><code>${currentMillis}</code>: The result of <code>System.currentTimeMillis()</code>.</li>
     * <li><code>${now}</code>: <code>LocalDateTime.now()</code> formatted with the pattern <code>yyyyMMdd'T'HHmmss</code>.</li>
     * <li><code>${cfNodeName}</code>: The node name of the source content fragment.</li>
     * <li><code>${cfParentNodeName}</code>: The node name of the source content fragment's parent node.
     *    <p><i>This will be a dot (<code>.</code>) if the source content fragment was in the root directory (<code>/</code>)</i></p></li>.
     * </ul>
     */
    public final String outputPath;

    /**
     * The proportion between the width of the type, relative to
     * the original width of the characters, in percentage.
     * The default is `100`, and values `<= 0` will result in
     * the default being used.
     */
    public final long fontScaleX;

    /**
     * The default font size of the document, in pixels.
     * Values `<= 0` mean that the document does not specify its
     * default font size, and thus, once will be assigned
     * by the RTF Viewer at runtime.
     */
    public final long docFontSize;

    /**
     * The left indent to apply to list items.
     * Nested list items will double, triple, quadruple etc., this value.
     */
    public final long listLeftIndentSize;

    /**
     * The first-line indent to apply to list items.
     * Nested list items will double, triple, quadruple etc., this value.
     */
    public final long listFirstIndentSize;

    /**
     * The default line height (i.e., leading space) multiplier of the document.
     * For instance, to double-space the paragraphs, use `2.0`.
     * Values `<= 0` mean that the document does not specify its
     * default line height, and thus, once will be assigned
     * by the RTF Viewer at runtime.
     */
    public final float docLineHeight;

    /**
     * Whether list items that are not nested in any parent lists
     * should be indented.
     */
    public final boolean indentUnnestedLists;

    /**
     * Whether the characters '™,℠,©,®' should automatically be
     * wrapped in superscript tags.
     */
    public final boolean superscriptTrademarks;

    /**
     * A default CSS Color set to the hyperlinks of the document.
     */
    public final CFToRTFColor hyperlinkColor;

    /**
     * A map of CSS class name to their color counterparts.
     * e.g., `{ "cardFootnote-legal-text": "#58158A" }`
     * The supported color formats are:
     * <ul>
     *   <li>HTML color constant e.g., <code>purple</code> or <code>white</code></li>
     *   <li>Hex Color Code (short or long) e.g., <code>#fff</code> or <code>#FF00CC</code></li>
     *   <li>rgb color e.g., <code>rgb(255, 255, 255)</code></li>
     *   <li>rgba color e.g., <code>rgb(255, 255, 255, 1.0)</code>, though, the alpha value will be discarded</li>
     * </ul>
     */
    public final Map<String, String> colorClasses;

    /**
     * A Map of the document font sizes, in pixels. Where each key from `1` to `6`
     * represents the matching HTML Heading Element (i.e., `1` == `H1`).
     * e.g., `{ "1": 64, "2": 40 }`
     * <p>Each value represents its key's font size, in pixels, of the corresponding HTML
     * Heading tag. E.g., `1` corresponds to `H1`. The default value of which is `64`.
     * If a heading size is not specified, its size will derive from the `H1` size divided
     * by their heading number. For example if the `H1` size is `64` then an HTML `H2`
     * element size will be `32` (i.e., 65 / 2), and so on unless explicitly specified.
     * Values `<= 0` mean that the default will be used.</p>
     */
    public final Map<String, Long> headings;

    /**
     * A map of characters or sequences of characters which all instance of should be replaced
     * by the specified value of their properties in the resulting document before being transpiled
     * to RTF format.
     * <p>Note that the keys are considered to be RegExp patterns and
     * their captured groups may be substituted in the values.</p>
     * <p>This may be used for example to drop unwanted content from the resulting document.</p>
     */
    public final Map<String, String> preTextReplacements;

    /**
     * A map of characters or sequences of characters which all instance of should be replaced
     * by the specified value of their properties in the resulting document after being transpiled
     * to RTF format.
     * <p>Note that the keys are considered to be RegExp patterns and
     * their captured groups may be substituted in the values.</p>
     * <p>This may be used for example to swap unsupported special characters with their
     * RTF escaped counterparts.</p>
     */
    public final Map<String, String> postTextReplacements;

    /**
     * A Bordered Paragraph Rule.
     * The supported formats are:
     * <ol>
     * <li><code>liquid {thickness#}</code></li>
     * <li><code>fixed {thickness#} {padding#} {width#}</code>.</li>
     * </ol>
     * <ul>
     * <li><strong>liquid</strong>: Is implemented with RTF paragraph border.
     * Its width expands and shrink to fit the paragraph automatically,
     * but padding is not supported in InDesign. <em><strong>Example</strong>:</em>
     *   <code>"liquid 10"</code></li>
     * <li><strong>fixed</strong>: Its width is fixed, but padding is supported in
     * InDesign. <em><strong>Example</strong>:</em>
     *   <code>"fixed 10 100 10800"</code></li>
     * </ul>
     * <p><strong>Note:</strong> Bordered paragraph classes are <strong>ONLY</strong> processed
     * when applied to a supported semantic block element (i.e., <code>p|div|section|article</code>).</p>
     */
    public final Map<String, String> borderedParagraphClasses;

    /**
     * The opening tag of an RTF paragraph, with the specified line height.
     */
    public final String startParagraph;

    /**
     * An empty RTF paragraph, with the specified line height.
     */
    public final String lineBreak;
    /**
     * A Map of the Parsed values of `borderedParagraphsClasses`.
     */
    public final Map<String, CFToRTFBorderedParagraph> borderedParagraphs;

    /**
     * The size, in pixel, of an H1 element when transferred to RTF.
     * All the other HTML Heading element sizes will derive from this
     * value divided by their heading number.
     * For example if this value is `64` then an HTML `h2` element size
     * will be `32` (i.e., 65 / 2), and so on.
     * Values `<= 0` mean that the default will be used.
     */
    private final long _h1FontSize;

    /**
     * Determines the size of the H1 HTML element, given on the specified `fontSize`.
     */
    private static long resolveH1FontSize(long fontSize)
    {
        return Math.round(fontSize * RTF_FONT_SIZE_TO_H1_RATIO);
    }

    /**
     * Parsed the given JSON Text to a `CFToRTFConfig` instance
     */
    public static CFToRTFConfig parse(String jsonText)
    {
        try
        {

            if (StringUtils.isBlank(jsonText))
            {
                jsonText = EMPTY_JSON_OBJECT_TEXT;
            }

            JsonObject jsonObject = (new JsonParser()).parse(jsonText).getAsJsonObject();

            Map<String, Long> headings = DEFAULT_HEADING_SIZES;
            Map<String, String> colorClasses = DEFAULT_COLOR_CLASSES;
            Map<String, String> preTextReplacements = DEFAULT_PRE_TEXT_REPLACEMENTS;
            Map<String, String> postTextReplacements = DEFAULT_POST_TEXT_REPLACEMENTS;
            Map<String, String> borderedParagraphClasses = DEFAULT_BORDERED_PARAGRAPH_CLASSES;

            String fontName = getString(jsonObject, JSON_KEY_FONT_NAME, DEFAULT_FONT_NAME);
            String outputPath = getString(jsonObject, JSON_KEY_OUTPUT_PATH, DEFAULT_OUTPUT_PATH);
            String hyperlinkColor = getString(jsonObject, JSON_KEY_HYPERLINK_COLOR, null);

            boolean indentUnnestedLists = getBoolean(
                    jsonObject,
                    JSON_KEY_INDENT_UNNESTED_LISTS,
                    DEFAULT_INDENT_UNNESTED_LISTS
            );
            boolean superscriptTrademarks = getBoolean(
                    jsonObject,
                    JSON_KEY_SUPERSCRIPT_TRADEMARKS,
                    DEFAULT_SUPERSCRIPT_TRADEMARKS
            );

            long docFontSize = getLong(jsonObject, JSON_KEY_DOC_FONT_SIZE, DEFAULT_FONT_SIZE);
            long h1FontSize = docFontSize > 0 ? resolveH1FontSize(docFontSize) : DEFAULT_H1_SIZE;
            long fontScaleX = getLong(jsonObject, JSON_KEY_FONT_SCALE_X, DEFAULT_FONT_SCALE_X);
            float docLineHeight = getFloat(jsonObject, JSON_KEY_DOC_LINE_HEIGHT, DEFAULT_LINE_HEIGHT);
            long listLeftIndentSize = getLong(
                    jsonObject,
                    JSON_KEY_LIST_LEFT_INDENT_SIZE,
                    DEFAULT_LIST_LEFT_INDENT_SIZE
            );
            long listFirstIndentSize = getLong(
                    jsonObject,
                    JSON_KEY_LIST_FIRST_LINE_INDENT_SIZE,
                    DEFAULT_LIST_FIRST_LINE_INDENT_SIZE
            );

            if (jsonObject.has(JSON_KEY_COLOR_CLASSES))
            {
                colorClasses = toStringMap(jsonObject.get(JSON_KEY_COLOR_CLASSES)
                                            .getAsJsonObject());
            }
            if (jsonObject.has(JSON_KEY_PRE_TEXT_REPLACEMENTS))
            {
                preTextReplacements = toStringMap(jsonObject.get(JSON_KEY_PRE_TEXT_REPLACEMENTS)
                                            .getAsJsonObject());
            }
            if (jsonObject.has(JSON_KEY_POST_TEXT_REPLACEMENTS))
            {
                postTextReplacements = toStringMap(jsonObject.get(JSON_KEY_POST_TEXT_REPLACEMENTS)
                                            .getAsJsonObject());
            }
            if (jsonObject.has(JSON_KEY_BORDERED_PARAGRAPH_CLASSES))
            {
                borderedParagraphClasses = toStringMap(jsonObject.get(JSON_KEY_BORDERED_PARAGRAPH_CLASSES)
                                            .getAsJsonObject());
            }
            if (jsonObject.has(JSON_KEY_HEADINGS))
            {

                headings = toStringLongMap(jsonObject.get(JSON_KEY_HEADINGS).getAsJsonObject());

                if (headings.containsKey(JSON_KEY_HEADINGS_1))
                {
                    h1FontSize = headings.get(JSON_KEY_HEADINGS_1);
                }

            }

            return new CFToRTFConfig(

                    borderedParagraphClasses,
                    postTextReplacements,
                    preTextReplacements,
                    colorClasses,
                    headings,

                    fontName,
                    outputPath,
                    hyperlinkColor,
                    fontScaleX,
                    h1FontSize,
                    listLeftIndentSize,
                    listFirstIndentSize,
                    docFontSize,
                    docLineHeight,

                    indentUnnestedLists,
                    superscriptTrademarks

            );

        }
        catch (Exception ex)
        {
            throw new CFToRTFException(
                String.format(
                    "Error parsing the RTF to CF Configurations `%s`: %s",
                    jsonText,
                    ex.getMessage()
                ),
                ex
            );
        }
    }

    /**
     * @param jsonObject The object to cast.
     * @return A `Map<String, String>` from the given `jsonObject`
     */
    private static Map<String, String> toStringMap(JsonObject jsonObject)
    {

        Map<String, String> result = new HashMap<>();
        Set<Map.Entry<String, JsonElement>> entrySet = jsonObject.entrySet();

        for (Map.Entry<String,JsonElement> entry : entrySet)
        {

            String key = entry.getKey();
            String value = getString(jsonObject, key, null);

            if (value != null)
            {
                result.put(key, value);
            }

        }

        return result;

    }

    /**
     * @param jsonObject The object to cast.
     * @return A `Map<String, Long>` from the given `jsonObject`
     */
    private static Map<String, Long> toStringLongMap(JsonObject jsonObject)
    {

        Map<String, Long> result = new HashMap<>();
        Set<Map.Entry<String, JsonElement>> entrySet = jsonObject.entrySet();

        for (Map.Entry<String,JsonElement> entry : entrySet)
        {

            String key = entry.getKey();
            long value = getLong(jsonObject, key, -1);

            if (value > 0)
            {
                result.put(key, value);
            }

        }

        return result;

    }

    /**
     * @return The value of the specified `key` from the given `jsonObject` as a `String` or `defaultTo`
     * if the `key` did not exist in the jsonObject`.
     */
    private static String getString(JsonObject jsonObject, String key, String defaultTo)
    {
        try
        {
            if (jsonObject.has(key))
            {
                return jsonObject.get(key).getAsString();
            }
            return defaultTo;
        }
        catch (Exception ex)
        {
            throw new CFToRTFException(String.format(
                    "Could not get the property value of `%s` as a `String`!",
                    key
            ), ex);
        }
    }

    /**
     * @return The value of the specified `key` from the given `jsonObject` as a `boolean` or `defaultTo`
     * if the `key` did not exist in the jsonObject`.
     */
    private static boolean getBoolean(JsonObject jsonObject, String key, boolean defaultTo)
    {
        try
        {
            if (jsonObject.has(key))
            {
                return jsonObject.get(key).getAsBoolean();
            }
            return defaultTo;
        }
        catch (Exception ex)
        {
            throw new CFToRTFException(String.format(
                    "Could not get the property value of `%s` as a `boolean`!",
                    key
            ), ex);
        }
    }

    /**
     * @return The value of the specified `key` from the given `jsonObject` as a `long` or `defaultTo`
     * if the `key` did not exist in the jsonObject`.
     */
    private static long getLong(JsonObject jsonObject, String key, long defaultTo)
    {
        try
        {
            if (jsonObject.has(key))
            {
                return jsonObject.get(key).getAsLong();
            }
            return defaultTo;
        }
        catch (Exception ex)
        {
            throw new CFToRTFException(String.format(
                    "Could not get the property value of `%s` as a `long`!",
                    key
            ), ex);
        }
    }

    /**
     * @return The value of the specified `key` from the given `jsonObject` as a `float` or `defaultTo`
     * if the `key` did not exist in the jsonObject`.
     */
    private static float getFloat(JsonObject jsonObject, String key, float defaultTo)
    {
        try
        {
            if (jsonObject.has(key))
            {
                return jsonObject.get(key).getAsFloat();
            }
            return defaultTo;
        }
        catch (Exception ex)
        {
            throw new CFToRTFException(String.format(
                    "Could not get the property value of `%s` as a `float`!",
                    key
            ), ex);
        }
    }

    /**
     * An Object that contains the specification by which to transpile HTML markup to RTF content.
     * @param borderedParagraphClasses CSS Class names and their matching bordered text rule.
     * @param postTextReplacements Texts to find and replace in the resulting document after processing.
     * @param preTextReplacements Texts to find and replace in the resulting document before processing.
     * @param colorClasses CSS Class names with their color equivalent.
     * @param headings HTML Heading sizes.
     * @param fontName The RTF Font name.
     * @param outputPath The RTF destination file spec.
     * @param hyperlinkColor A default CSS Color set to the hyperlinks of the document.
     * @param fontScaleX The Font Horizontal Scale.
     * @param h1FontSize The size, in pixel of the HTML `H1` element.
     * @param listLeftIndentSize The left indent to apply to list items.
     * @param listFirstIndentSize The first-line to apply to list items.
     * @param docFontSize The default font size, in pixel of RTF.
     * @param docLineHeight The space between paragraphs.
     * @param indentUnnestedLists Whether list items that are not nested in any parent lists should be indented.
     * @param superscriptTrademarks Whether the characters '™,℠,©,®' should automatically be wrapped in superscript tags.
     */
    private CFToRTFConfig(
            Map<String, String> borderedParagraphClasses,
            Map<String, String> postTextReplacements,
            Map<String, String> preTextReplacements,
            Map<String, String> colorClasses,
            Map<String, Long> headings,
            String fontName,
            String outputPath,
            String hyperlinkColor,
            long fontScaleX,
            long h1FontSize,
            long listLeftIndentSize,
            long listFirstIndentSize,
            long docFontSize,
            float docLineHeight,
            boolean indentUnnestedLists,
            boolean superscriptTrademarks
    )
    {

        this.indentUnnestedLists = indentUnnestedLists;
        this.superscriptTrademarks = superscriptTrademarks;

        this._h1FontSize = h1FontSize <= 0 ?
                        DEFAULT_H1_SIZE : h1FontSize;

        this.fontScaleX = fontScaleX <= 0 ?
                        DEFAULT_FONT_SCALE_X : fontScaleX;

        this.docFontSize = docFontSize <= 0 ?
                        DEFAULT_FONT_SIZE : docFontSize;

        this.docLineHeight = docLineHeight <= 0 ?
                        DEFAULT_LINE_HEIGHT : docLineHeight;

        this.listLeftIndentSize = listLeftIndentSize <= 0 ?
                        DEFAULT_LIST_LEFT_INDENT_SIZE : listLeftIndentSize;

        this.listFirstIndentSize = listFirstIndentSize <= 0 ?
                        DEFAULT_LIST_FIRST_LINE_INDENT_SIZE : listFirstIndentSize;

        this.fontName = StringUtils.isBlank(fontName) ?
                        DEFAULT_FONT_NAME : fontName;

        this.outputPath = StringUtils.isBlank(outputPath) ?
                        DEFAULT_OUTPUT_PATH : outputPath;

        this.colorClasses = colorClasses == null ?
                        DEFAULT_COLOR_CLASSES : colorClasses;

        this.headings = headings == null ?
                        DEFAULT_HEADING_SIZES : headings;

        this.preTextReplacements = preTextReplacements == null ?
                        DEFAULT_PRE_TEXT_REPLACEMENTS : preTextReplacements;

        this.postTextReplacements = postTextReplacements == null ?
                        DEFAULT_POST_TEXT_REPLACEMENTS : postTextReplacements;

        this.borderedParagraphClasses = borderedParagraphClasses == null ?
                        DEFAULT_BORDERED_PARAGRAPH_CLASSES : borderedParagraphClasses;

        this.startParagraph = resolveParagraphStart();
        this.hyperlinkColor = resolveHyperlinkColor(hyperlinkColor);
        this.lineBreak = startParagraph + RTF_CLOSE_PARAGRAPH_TAG + "\n";
        this.borderedParagraphs = parseBorderedParagraphs();

    }

    /**
     * @return The opening tag of an RTF paragraph, with the specified line height.
     */
    private String resolveParagraphStart()
    {

        StringBuilder result = new StringBuilder().append(RTF_OPEN_PARAGRAPH_TAG);

        addFontSize(result);
        addLineHeight(result);
        addFontScaleX(result);

        return result.toString();

    }

    /**
     * Adds font size data to the given paragraph
     */
    private void addFontSize(StringBuilder paragraph)
    {
        if (docFontSize > 0)
        {
            paragraph.append(String.format(RTF_FONT_SIZE_TAG_TPL, docFontSize));
        }
    }

    /**
     * Adds line height data to the given paragraph
     */
    private void addLineHeight(StringBuilder paragraph)
    {
        if (docLineHeight != 1 && docLineHeight > 0)
        {
            paragraph.append(String.format(
                    RTF_LINE_HEIGHT_TAG_TPL,
                    Math.round(RTF_DEFAULT_LINE_HEIGHT_TWIPS * docLineHeight)
            ));
        }
    }

    /**
     * Adds horizontal font scaling data to the given paragraph
     */
    private void addFontScaleX(StringBuilder paragraph)
    {
        if (fontScaleX != DEFAULT_FONT_SCALE_X)
        {
            paragraph.append(String.format(RTF_FONT_SCALE_X_TAG_TPL, fontScaleX));
        }
    }

    /**
     * @return The default CSS Color set to the hyperlinks of the document
     */
    private CFToRTFColor resolveHyperlinkColor(String colorValue)
    {

        if (StringUtils.isBlank(colorValue))
        {
            return DEFAULT_HYPERLINK_COLOR;
        }

        CFToRTFColor result = CFToRTFColorHelper.parseColorValue(colorValue);

        if (result == null)
        {
            throw new CFToRTFException(String.format(
                    "Could not parse the color `%s` from the configuration property `%s`!",
                    colorValue,
                    JSON_KEY_HYPERLINK_COLOR
            ));
        }

        return result;

    }

    /**
     * @return A Map of the Parsed values of `borderedParagraphsClasses`.
     */
    private Map<String, CFToRTFBorderedParagraph> parseBorderedParagraphs()
    {

        Map<String, CFToRTFBorderedParagraph> result = new HashMap<>();

        for (Map.Entry<String, String> rule: borderedParagraphClasses.entrySet())
        {
            result.put(rule.getKey(), new CFToRTFBorderedParagraph(rule.getValue()));
        }

        return result;

    }

    /**
     * @param headingSize e.g., "2"
     * @return e.g., 32. The size in pixels of the matching heading size.
     */
    public long h(String headingSize)
    {

        int intSize = Integer.parseInt(headingSize);

        if (!(intSize > 0 && intSize < 7))
        {
            throw new CFToRTFException(
                    String.format("Unsupported heading size `%s`!", headingSize)
            );
        }

        if (headings.containsKey(headingSize))
        {
            return headings.get(headingSize);
        }

        return Math.round((double) _h1FontSize / intSize);

    }

}
