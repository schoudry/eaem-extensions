package apps.experienceaem.core.cf2rtf;

import org.apache.commons.lang3.StringUtils;

public class CFToRTFBorderedParagraph
{

    /**
     * The type of Bordered Paragraphs
     */
    public enum CFToRTFBorderedParagraphType
    {

        /**
         * A fixed Bordered Paragraph: Its width is fixed, but padding is supported in
         * InDesign. <em><strong>Example</strong>:</em>
         * <code>"fixed 10 100 10800"</code>
         */
        FIXED,
        /**
         * A liquid Bordered Paragraph: Implemented with RTF paragraph border.
         * Its width expands and shrink to fit the paragraph automatically,
         * but padding is not supported in InDesign. <em><strong>Example</strong>:</em>
         * <code>"liquid 10"</code>
         */
        LIQUID;

        /**
         * @return The instance that matches the specified `str`.
         */
        public static CFToRTFBorderedParagraphType require(String str)
        {

            for (CFToRTFBorderedParagraphType value: CFToRTFBorderedParagraphType.values())
            {
                if (value.name().equalsIgnoreCase(str))
                {
                    return value;
                }
            }

            throw new CFToRTFException(String.format(
                "Unsupported bordered paragraph type `%s`!",
                str
            ));

        }
    }

    private static final String SOURCE_PARSER = "\\s+";
    private static final CFToRTFBorderedParagraphType DEFAULT_TYPE = CFToRTFBorderedParagraphType.LIQUID;

    private static final int DEFAULT_THICKNESS = 10;
    private static final int DEFAULT_PADDING = 100;
    private static final int DEFAULT_WIDTH = 10800;

    private static final String DEFAULT_RULE = String.format(
            "%s %s %s %s",
            DEFAULT_TYPE,
            DEFAULT_THICKNESS,
            DEFAULT_PADDING,
            DEFAULT_WIDTH
    );

    private static final String LIQUID_TPL = "\n\\box\\brdrw%s\\brsp%s\\brdrs\n%%s";

    private static final String FIXED_TPL = "{\\trowd \n"                                           +
                                            "\\trpaddt%s\\trpaddr%s\\trpaddb%s\\trpaddl%s "         +
                                            "\\trpaddft3\\trpaddfl3\\trpaddfb3\\trpaddfr3\n"        +
                                            "\\clbrdrl\\brdrw%s\\brdrs \\clbrdrt\\brdrw%s\\brdrs "  +
                                            "\\clbrdrr\\brdrw%s\\brdrs \\clbrdrb\\brdrw%s\\brdrs\n" +
                                            "\\cellx%s\n"                                           +
                                            "\\intbl %%s\n"                                         +
                                            "\\cell\\row}";

    public final CFToRTFBorderedParagraphType type;
    public final int thickness;
    public final int padding;
    public final int width;
    public final String tpl;

    /**
     * Constructs A CFToRTFBorderedParagraph instance
     * @param source The rule source. e.g., `liquid 10` or `fixed 10 100 10800`.
     *               The default values will be used if `source` is `null` or empty.
     */
    public CFToRTFBorderedParagraph(String source)
    {

        String src = StringUtils.isBlank(source) ? DEFAULT_RULE : source;
        String[] p = parse(src.trim());
        String NA = StringUtils.EMPTY;

        type = CFToRTFBorderedParagraphType.require(p[0]);
        thickness = num(p.length > 1 ? p[1] : NA, DEFAULT_THICKNESS);
        padding = num(p.length > 2 ? p[2] : NA, DEFAULT_PADDING);
        width = num(p.length > 3 ? p[3] : NA, DEFAULT_WIDTH);
        tpl = buildTemplate();

    }

    /**
     * Split the give rule source into chunks
     */
    private String[] parse(String source)
    {
        return source.split(SOURCE_PARSER);
    }

    /**
     * Parses and returns `source` as an `Integer` or `defaultsTo` if fails.
     */
    private int num(String source, int defaultsTo)
    {
        try
        {
            return Integer.parseInt(source, 10);
        }
        catch (Exception ex)
        {
            return defaultsTo;
        }
    }

    /**
     * @return The correct bordered paragraph template for the rule.
     */
    private String buildTemplate()
    {

        switch (type)
        {
            case LIQUID: return buildLiquidTemplate();
            case FIXED : return buildFixedTemplate();
        }

        throw new CFToRTFException(String.format("Unknown bordered paragraph type `%s`!", type));

    }

    /**
     * @return The liquid bordered paragraph template.
     */
    private String buildLiquidTemplate()
    {
        return String.format(LIQUID_TPL, thickness, padding);
    }

    /**
     * @return The fixed bordered paragraph template.
     */
    private String buildFixedTemplate()
    {
        return String.format(
                FIXED_TPL,
                padding, padding, padding, padding,
                thickness, thickness, thickness, thickness,
                width
        );
    }

    /**
     * Wraps the given `content` in RTF tags representing this
     * instance's formatting and returns the result.
     */
    public String wrap(String content)
    {
        return String.format(tpl, content);
    }

    @Override
    public String toString()
    {
        return this.tpl;
    }

}
