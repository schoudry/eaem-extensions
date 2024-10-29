package apps.experienceaem.core.cf2rtf;

import org.apache.commons.lang3.StringUtils;

import java.awt.Color;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CFToRTFColorHelper
{

    public static final Pattern INLINE_CSS_COLOR_PATTERN = Pattern.compile(
            "\\bcolor\\s*:\\s*(?:" +
                    "(#[0-9a-f]{6}\\b)|" + // 1) 3 digit hex
                    "(#[0-9a-f]{3}\\b)|" + // 2) 6 digit hex
                    "rgba?\\s*\\(\\s*([0-9]{1,3}\\s*,\\s*[0-9]{1,3}\\s*,\\s*[0-9]{1,3})\\s*(?:,\\s*[0-9.]+)?\\s*\\)|" + // 3) rgb(...) / rgba(...)
                    "([a-z]+)" + // 4) color names and other (unsupported) formats
                    ")",
            Pattern.CASE_INSENSITIVE
    );

    private static final Integer[] EMPTY_ARRAY = new Integer[]{};
    private static final Map<String, CFToRTFColor> HTML_COLOR_NAMES;
    private static final String COLOR_RULE_TPL = "color: %s";
    private static final int SUPPORTED_COLOR_FORMATS = 4;

    static
    {

        HashMap<String, CFToRTFColor> names = new HashMap<>();

        names.put("aliceblue", fromHex("f0f8ff"));
        names.put("antiquewhite", fromHex("faebd7"));
        names.put("aqua", fromHex("00ffff"));
        names.put("aquamarine", fromHex("7fffd4"));
        names.put("azure", fromHex("f0ffff"));
        names.put("beige", fromHex("f5f5dc"));
        names.put("bisque", fromHex("ffe4c4"));
        names.put("black", fromHex("000000"));
        names.put("blanchedalmond", fromHex("ffebcd"));
        names.put("blue", fromHex("0000ff"));
        names.put("blueviolet", fromHex("8a2be2"));
        names.put("brown", fromHex("a52a2a"));
        names.put("burlywood", fromHex("deb887"));
        names.put("cadetblue", fromHex("5f9ea0"));
        names.put("chartreuse", fromHex("7fff00"));
        names.put("chocolate", fromHex("d2691e"));
        names.put("coral", fromHex("ff7f50"));
        names.put("cornflowerblue", fromHex("6495ed"));
        names.put("cornsilk", fromHex("fff8dc"));
        names.put("crimson", fromHex("dc143c"));
        names.put("cyan", fromHex("00ffff"));
        names.put("darkblue", fromHex("00008b"));
        names.put("darkcyan", fromHex("008b8b"));
        names.put("darkgoldenrod", fromHex("b8860b"));
        names.put("darkgray", fromHex("a9a9a9"));
        names.put("darkgreen", fromHex("006400"));
        names.put("darkkhaki", fromHex("bdb76b"));
        names.put("darkmagenta", fromHex("8b008b"));
        names.put("darkolivegreen", fromHex("556b2f"));
        names.put("darkorange", fromHex("ff8c00"));
        names.put("darkorchid", fromHex("9932cc"));
        names.put("darkred", fromHex("8b0000"));
        names.put("darksalmon", fromHex("e9967a"));
        names.put("darkseagreen", fromHex("8fbc8f"));
        names.put("darkslateblue", fromHex("483d8b"));
        names.put("darkslategray", fromHex("2f4f4f"));
        names.put("darkturquoise", fromHex("00ced1"));
        names.put("darkviolet", fromHex("9400d3"));
        names.put("deeppink", fromHex("ff1493"));
        names.put("deepskyblue", fromHex("00bfff"));
        names.put("dimgray", fromHex("696969"));
        names.put("dodgerblue", fromHex("1e90ff"));
        names.put("firebrick", fromHex("b22222"));
        names.put("floralwhite", fromHex("fffaf0"));
        names.put("forestgreen", fromHex("228b22"));
        names.put("fuchsia", fromHex("ff00ff"));
        names.put("gainsboro", fromHex("dcdcdc"));
        names.put("ghostwhite", fromHex("f8f8ff"));
        names.put("gold", fromHex("ffd700"));
        names.put("goldenrod", fromHex("daa520"));
        names.put("gray", fromHex("808080"));
        names.put("green", fromHex("008000"));
        names.put("greenyellow", fromHex("adff2f"));
        names.put("honeydew", fromHex("f0fff0"));
        names.put("hotpink", fromHex("ff69b4"));
        names.put("indianred", fromHex("cd5c5c"));
        names.put("indigo", fromHex("4b0082"));
        names.put("ivory", fromHex("fffff0"));
        names.put("khaki", fromHex("f0e68c"));
        names.put("lavender", fromHex("e6e6fa"));
        names.put("lavenderblush", fromHex("fff0f5"));
        names.put("lawngreen", fromHex("7cfc00"));
        names.put("lemonchiffon", fromHex("fffacd"));
        names.put("lightblue", fromHex("add8e6"));
        names.put("lightcoral", fromHex("f08080"));
        names.put("lightcyan", fromHex("e0ffff"));
        names.put("lightgoldenrodyellow", fromHex("fafad2"));
        names.put("lightgrey", fromHex("d3d3d3"));
        names.put("lightgreen", fromHex("90ee90"));
        names.put("lightpink", fromHex("ffb6c1"));
        names.put("lightsalmon", fromHex("ffa07a"));
        names.put("lightseagreen", fromHex("20b2aa"));
        names.put("lightskyblue", fromHex("87cefa"));
        names.put("lightslategray", fromHex("778899"));
        names.put("lightsteelblue", fromHex("b0c4de"));
        names.put("lightyellow", fromHex("ffffe0"));
        names.put("lime", fromHex("00ff00"));
        names.put("limegreen", fromHex("32cd32"));
        names.put("linen", fromHex("faf0e6"));
        names.put("magenta", fromHex("ff00ff"));
        names.put("maroon", fromHex("800000"));
        names.put("mediumaquamarine", fromHex("66cdaa"));
        names.put("mediumblue", fromHex("0000cd"));
        names.put("mediumorchid", fromHex("ba55d3"));
        names.put("mediumpurple", fromHex("9370d8"));
        names.put("mediumseagreen", fromHex("3cb371"));
        names.put("mediumslateblue", fromHex("7b68ee"));
        names.put("mediumspringgreen", fromHex("00fa9a"));
        names.put("mediumturquoise", fromHex("48d1cc"));
        names.put("mediumvioletred", fromHex("c71585"));
        names.put("midnightblue", fromHex("191970"));
        names.put("mintcream", fromHex("f5fffa"));
        names.put("mistyrose", fromHex("ffe4e1"));
        names.put("moccasin", fromHex("ffe4b5"));
        names.put("navajowhite", fromHex("ffdead"));
        names.put("navy", fromHex("000080"));
        names.put("oldlace", fromHex("fdf5e6"));
        names.put("olive", fromHex("808000"));
        names.put("olivedrab", fromHex("6b8e23"));
        names.put("orange", fromHex("ffa500"));
        names.put("orangered", fromHex("ff4500"));
        names.put("orchid", fromHex("da70d6"));
        names.put("palegoldenrod", fromHex("eee8aa"));
        names.put("palegreen", fromHex("98fb98"));
        names.put("paleturquoise", fromHex("afeeee"));
        names.put("palevioletred", fromHex("d87093"));
        names.put("papayawhip", fromHex("ffefd5"));
        names.put("peachpuff", fromHex("ffdab9"));
        names.put("peru", fromHex("cd853f"));
        names.put("pink", fromHex("ffc0cb"));
        names.put("plum", fromHex("dda0dd"));
        names.put("powderblue", fromHex("b0e0e6"));
        names.put("purple", fromHex("800080"));
        names.put("rebeccapurple", fromHex("663399"));
        names.put("red", fromHex("ff0000"));
        names.put("rosybrown", fromHex("bc8f8f"));
        names.put("royalblue", fromHex("4169e1"));
        names.put("saddlebrown", fromHex("8b4513"));
        names.put("salmon", fromHex("fa8072"));
        names.put("sandybrown", fromHex("f4a460"));
        names.put("seagreen", fromHex("2e8b57"));
        names.put("seashell", fromHex("fff5ee"));
        names.put("sienna", fromHex("a0522d"));
        names.put("silver", fromHex("c0c0c0"));
        names.put("skyblue", fromHex("87ceeb"));
        names.put("slateblue", fromHex("6a5acd"));
        names.put("slategray", fromHex("708090"));
        names.put("snow", fromHex("fffafa"));
        names.put("springgreen", fromHex("00ff7f"));
        names.put("steelblue", fromHex("4682b4"));
        names.put("tan", fromHex("d2b48c"));
        names.put("teal", fromHex("008080"));
        names.put("thistle", fromHex("d8bfd8"));
        names.put("tomato", fromHex("ff6347"));
        names.put("turquoise", fromHex("40e0d0"));
        names.put("violet", fromHex("ee82ee"));
        names.put("wheat", fromHex("f5deb3"));
        names.put("white", fromHex("ffffff"));
        names.put("whitesmoke", fromHex("f5f5f5"));
        names.put("yellow", fromHex("ffff00"));
        names.put("yellowgreen", fromHex("9acd32"));

        HTML_COLOR_NAMES = Collections.unmodifiableMap(names);

    }

    /**
     * @param color e.g., "black" or "red"
     * @return Whether the color name is a known/supported HTML color name.
     */
    public static boolean isKnownColorName(String color)
    {
        return StringUtils.isNotBlank(color) &&
               HTML_COLOR_NAMES.containsKey(color.trim().toLowerCase());
    }

    /**
     * Parses a known/supported HTML color name.
     * Use `.isKnownColorName(...)` to determine whether the color
     * name is known before calling this method.
     * @throws CFToRTFException If the specified name is unknown.
     * @param htmlColorName e.g., "black" or "red"
     */
    public static CFToRTFColor fromName(String htmlColorName)
    {

        String cleansed = StringUtils.isNotBlank(htmlColorName) ?
                          htmlColorName.trim().toLowerCase() : null;

        if (!HTML_COLOR_NAMES.containsKey(cleansed))
        {
            throw new CFToRTFException("Unsupported color htmlColorName '" + htmlColorName + "'");
        }

        return HTML_COLOR_NAMES.get(cleansed);

    }

    /**
     * Parse an RGB number
     * @param value e.g., 123825
     */
    public static CFToRTFColor fromRgb(int value)
    {
        return new CFToRTFColor(new Color(value));
    }

    /**
     * Parse a comma separated RGB string
     * @param value e.g., "134, 255, 0" or "255,255,255"
     */
    public static CFToRTFColor fromRgb(String value)
    {

        Integer[] rgb = splitByCommaAndTrim(value);

        if (rgb.length < 3)
        {
            throw new CFToRTFException(
                    "'" + value + "' is not a comma separated RGB String!"
            );
        }

        return new CFToRTFColor(rgb[0], rgb[1], rgb[2]);

    }

    /**
     * Splits the given value by the commas and
     * returns the resulting list, with empty
     * elements removed and tokens parsed as Integers.
     * @param value e.g., "134, 255, 0" or "255,255,255"
     */
    private static Integer[] splitByCommaAndTrim(String value)
    {

        if (StringUtils.isNotBlank(value))
        {
            return Arrays.stream(value.split(","))
                         .map(String::trim)
                         .filter(StringUtils::isNotEmpty)
                         .map(Integer::parseInt)
                         .toArray(Integer[]::new);
        }

        return EMPTY_ARRAY;

    }

    /**
     * Parse and Hexadecimal color string, either in short
     * (3 digits) or long (6 digits) format.
     * @param hexString e.g., "#fff" or "FF00CC" or "#000000"
     */
    public static CFToRTFColor fromHex(String hexString)
    {

        String str = hexShorthandToFullForm(trimHexStringLeadingHash(String.valueOf(hexString)));

        if (str.length() != 6)
        {
            throw new CFToRTFException("Invalid hex color " + hexString + "!");
        }

        try
        {
            return fromRgb(Integer.parseInt(str, 16));
        }
        catch (NumberFormatException ex)
        {
            throw new CFToRTFException("Invalid hex color " + hexString + "!", ex);
        }

    }

    /**
     * Converts the hex color shorthand to its full form,
     * preserving the leading hash, if any.
     *
     * @param hexString (e.g. '#fff' or 'aaa')
     * @return (e.g. 'ffffff' or 'aaaaaa')
     */
    private static String hexShorthandToFullForm(String hexString)
    {

        if (hexString.length() == 3 || hexString.length() == 4)
        {

            int base = hexString.charAt(0) == '#' ? 1 : 0;

            return String.valueOf(hexString.charAt(base)) +
                    hexString.charAt(base) +
                    hexString.charAt(base + 1) +
                    hexString.charAt(base + 1) +
                    hexString.charAt(base + 2) +
                    hexString.charAt(base + 2);

        }

        return hexString;

    }

    /**
     * Removes the leading hash if from of the hex color string if present.
     *
     * @param hexString (e.g. '#fff')
     * @return (e.g. 'fff')
     */
    private static String trimHexStringLeadingHash(String hexString)
    {

        if (hexString.charAt(0) == '#')
        {
            return hexString.substring(1);
        }

        return hexString;

    }

    /**
     * Parse a supported color value.
     * @param colorValue e.g., 'blue' or '#0000FF' or 'rgb(0, 0, 255)'
     * @return The `CFToRTFColor` representation of the given color value or `null`.
     */
    public static CFToRTFColor parseColorValue(String colorValue)
    {

        if (StringUtils.isNotBlank(colorValue))
        {
            return parseCssRule(String.format(COLOR_RULE_TPL, colorValue));
        }

        return null;

    }

    /**
     * Parse a CSS color rule.
     * @param colorRule e.g., 'color: blue' or 'color: #0000FF' or 'color: rgb(0, 0, 255)'
     * @return The `CFToRTFColor` representation of the given rule or `null`.
     */
    private static CFToRTFColor parseCssRule(String colorRule)
    {

        if (StringUtils.isNotBlank(colorRule))
        {

            Matcher inlineCssColorMatcher = INLINE_CSS_COLOR_PATTERN.matcher(colorRule);

            if (inlineCssColorMatcher.find())
            {
                return parseMatchedColor(inlineCssColorMatcher);
            }

        }

        return null;

    }

    /**
     * Parse a CSS color rule that was matcher using the `INLINE_CSS_COLOR_PATTERN` pattern.
     * @param colorMatcher The matcher that matched the CSS color
     * @return The `CFToRTFColor` representation of the matched CSS color rule or `null`.
     */
    public static CFToRTFColor parseMatchedColor(Matcher colorMatcher)
    {

        CFToRTFColor result = null;

        loop:
        for (int i = 1; i <= SUPPORTED_COLOR_FORMATS; ++i)
        {

            String source = colorMatcher.group(i);

            if (StringUtils.isNotBlank(source))
            {
                switch (i)
                {
                    case 1:
                    case 2: // hex
                        result = fromHex(source);
                        break loop;
                    case 3: // rgb/a
                        result = fromRgb(source);
                        break loop;
                    case 4: // color name
                        if (isKnownColorName(source))
                        {
                            result = fromName(source);
                            break loop;
                        }
                        break;
                }
            }

        }

        return result;

    }

}
