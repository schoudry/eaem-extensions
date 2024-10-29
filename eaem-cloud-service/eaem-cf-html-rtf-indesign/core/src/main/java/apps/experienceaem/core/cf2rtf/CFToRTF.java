package apps.experienceaem.core.cf2rtf;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;

import java.util.Map;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CFToRTF
{

    private static final Logger LOG = CFToRTFLogger.LOG;
    private static final String LOG_PREFIX = CFToRTFLogger.LOG_PREFIX;

    private static final int MAX_ITERATION = 10000;

    private static final String HTML_TAG_REGEXP = "<[^>]+>";
    private static final String SELF_CLOSING_TAG_REGEXP = "<[^>]+/>";
    private static final String SPACES_MINUS_NEW_LINE_REGEXP = "[^\\S\\r\\n]*";
    private static final String HTML_START_TAG_REGEXP_TPL = "<%s(?:\\s+[^>]*)?>";
    /**
     * Matches from the first instance of the start tag to the first
     * instance of the end tag, not the last (as denoted by .*`?`)
     */
    private static final String NON_VOID_ELEMENT_REGEXP_TPL = "(%s<)(%s)(\\s+[^>]*)?>(.*?)(<\\/\\2>)(" + SPACES_MINUS_NEW_LINE_REGEXP + ")";
    private static final String BORDERED_PARAGRAPH_CLASS_REGEXP_TPL = "<(p|div|section|article)(.*?class\\s*=\\s*)(['\"])(.*?)(\\b%s\\b)(.*?\\3.*?>)([\\s\\S]+?)(<\\/\\1)>";
    private static final String COLOR_CLASS_REGEXP_TPL = "(?i)(<.*?class\\s*=\\s*)(['\"])(.*?)(\\b%s\\b)(.*?\\2.*?>)";
    private static final String COLOR_CLASS_REPLACEMENT_TPL = "$1$2$3 color: %s $5";
    private static final String RTF_WRAPPER_TPL = "{\\rtf1\\ansi\\deff0\\nouicompat{\\fonttbl{\\f0\\fnil\\fcharset0 %s;}}%s\n}";
    /**
     * Choosing non-breaking space `\\u0160?` as separator. `\\tab ` could be used as well.
     * <p>Note that `\~` is also non-breaking space in RTF but it's not well supported.</p>
     */
    private static final String  RTF_LIST_ITEM_SYMBOL_SEPARATOR = "\\u0160?";

    private static final int FLAGS = Pattern.CASE_INSENSITIVE;
    private static final int FLAGS_DOT_ALL = FLAGS | Pattern.DOTALL;

    private static final Pattern BR_B4_BLOCK_TAG_ENDS_PATTERN = Pattern.compile("<br(?:\\s+[^>]*)?\\s*/?>\\s*(</(?:p|div|section|article)>)", FLAGS);
    private static final Pattern HR_TAG_PATTERN = Pattern.compile("<hr(?:\\s+[^>]*)?\\s*/?>", FLAGS);
    private static final Pattern BR_TAG_PATTERN = Pattern.compile("<br(?:\\s+[^>]*)?\\s*/?>", FLAGS);

    private static final Pattern EMPTY_BLOCK_TAGS_PATTERN = Pattern.compile("<(?:p|div|section|article)(?:\\s+[^>]*)?\\s*/>", FLAGS);

    private static final Pattern HEADING_TAGS_PATTERN = Pattern.compile("<h([1-6])[^>]*>(.*)</\\s*h\\1>", FLAGS);

    private static final Pattern DYNAMIC_START_A_TAGS_PATTERN = Pattern.compile("<a(?:\\s+[^>]*)?\\s+href=([\"'])(?:javascript:\\s*;|javascript:void\\(0?\\);?|#|return false;?|void\\(0?\\);?|)\\1(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern GENERIC_START_A_TAGS_PATTERN = Pattern.compile("<a(?:\\s+[^>]*)?\\s+href=\\s*([\"'])(.*?)\\1(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern ANY_START_A_TAGS_PATTERN = Pattern.compile("<a(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern ANY_END_A_TAGS_PATTERN = Pattern.compile("</a(?:\\s+[^>]*)?>", FLAGS);

    private static final Pattern START_BOLD_TAGS_PATTERN = Pattern.compile("<(?:b|strong)(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern START_ITALICS_TAGS_PATTERN = Pattern.compile("<(?:i|em)(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern START_UNDERLINE_TAGS_PATTERN = Pattern.compile("<(?:u|ins)(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern START_STRIKETHROUGH_TAGS_PATTERN = Pattern.compile("<(?:strike|del)(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern START_SUPERSCRIPT_TAGS_PATTERN = Pattern.compile("<sup(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern START_SUBSCRIPT_TAGS_PATTERN = Pattern.compile("<sub(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern START_BLOCK_TAGS_PATTERN = Pattern.compile("<(?:p|div|section|article)(?:\\s+[^>]*)?>", FLAGS);

    private static final Pattern END_BLOCK_TAGS_PATTERN = Pattern.compile("</(?:p|div|section|article)(?:\\s+[^>]*)?>", FLAGS);
    private static final Pattern END_INLINE_TAGS_PATTERN = Pattern.compile("</(?:b|strong|i|em|u|ins|strike|del|sup|sub)(?:\\s+[^>]*)?>", FLAGS);

    private static final Pattern OL_TAGNAME_PATTERN = Pattern.compile("^ol$", FLAGS);
    private static final Pattern START_RTF_LIST_ITEM_PATTERN = Pattern.compile("(\\s*)\\{\\\\pard.+?\\\\fi-[0-9]+\\\\li[0-9]+", FLAGS);

    private static final Pattern WHITE_SPACE_PATTERN = Pattern.compile("\\s");
    private static final Pattern INLINE_CSS_COLOR_PATTERN = CFToRTFColorHelper.INLINE_CSS_COLOR_PATTERN;

    private static final String[] HTML_LIST_TAGS = new String[]{ "ul", "ol" };
    private static final String HTML_LIST_ITEM_TAG = "li";

    public static String transpile(String html, CFToRTFConfig config)
    {

        if (StringUtils.isBlank(html))
        {
            return StringUtils.EMPTY;
        }

        String richText = preProcess(html, config);
        ArrayList<String> colorTable = createColorTable(config);

        richText = replaceRedundantLineBreaks(richText);
        richText = replaceSingletonTags(richText, config);
        richText = replaceBorderedParagraphs(richText, config);
        richText = replaceColorClasses(richText, config);
        richText = replaceInlineColors(richText, colorTable);
        richText = replaceHeadings(richText, config);
        richText = replaceAnchors(richText);
        richText = replaceSupportedStartTags(richText, config);
        richText = replaceSupportedEndTags(richText);
        richText = replaceListTags(richText, config);
        richText = stripTagsKeepingTheirContent(richText);
        richText = wrapRTFContent(richText, config, colorTable);

        return richText;

    }

    private static String preProcess(String text, CFToRTFConfig config)
    {
        return CFToRTFHtmlHelper.preProcess(text, config);
    }

    private static ArrayList<String> createColorTable(CFToRTFConfig config)
    {
        ArrayList<String> result = new ArrayList<>();
        result.add(config.hyperlinkColor.rtf);
        return result;
    }

    private static String replaceRedundantLineBreaks(String text)
    {
        return BR_B4_BLOCK_TAG_ENDS_PATTERN.matcher(text).replaceAll("$1");
    }

    private static String replaceSingletonTags(String text, CFToRTFConfig config)
    {
        return removeSelfClosingTags(replaceSupportedSingletonTags(text, config));
    }

    private static String replaceSupportedSingletonTags(String text, CFToRTFConfig config)
    {
        text = replaceHRTags(text, config);
        text = replaceBRTags(text, config);
        return replaceEmptyBlockTags(text, config);
    }

    private static String replaceHRTags(String text, CFToRTFConfig config)
    {
        return HR_TAG_PATTERN.matcher(text).replaceAll(quote(
                config.startParagraph +
                        " \\brdrb \\brdrs \\brdrw10 \\brsp20 \\par}\n" +
                config.lineBreak
        ));
    }

    private static String quote(String text)
    {
        return Matcher.quoteReplacement(text);
    }

    private static String replaceBRTags(String text, CFToRTFConfig config)
    {
        return BR_TAG_PATTERN.matcher(text).replaceAll(quote(config.lineBreak));
    }

    private static String replaceEmptyBlockTags(String text, CFToRTFConfig config)
    {
        return EMPTY_BLOCK_TAGS_PATTERN.matcher(text).replaceAll(quote(config.lineBreak));
    }

    private static String removeSelfClosingTags(String text)
    {
        return text.replaceAll(SELF_CLOSING_TAG_REGEXP, StringUtils.EMPTY);
    }

    private static String replaceBorderedParagraphs(String text, CFToRTFConfig config)
    {

        for (Map.Entry<String, CFToRTFBorderedParagraph> entry : config.borderedParagraphs.entrySet())
        {

            CFToRTFBorderedParagraph rule = entry.getValue();

            String regex = String.format(
                    BORDERED_PARAGRAPH_CLASS_REGEXP_TPL,
                    Pattern.quote(entry.getKey())
            );

            Pattern pattern = Pattern.compile(regex, FLAGS);

            int matcherNextIndex = 0;
            int iterationCount = 0;
            Matcher matcher;

            while (iterationCount < MAX_ITERATION)
            {

                ++iterationCount;
                matcher = pattern.matcher(text);

                if  ((matcherNextIndex >= text.length()) || (!matcher.find(matcherNextIndex)))
                {
                    break;
                }

                int matcherIndex = matcher.start();
                matcherNextIndex = matcher.end();

                if (matcherNextIndex == 0)
                {
                    break;
                }

                String[] replacement = new String[]{
                        "<",
                        matcher.group(1),
                        matcher.group(2),
                        matcher.group(3),
                        matcher.group(4),
                        // .append(matcher.group(5)) <- drop the matched class name
                        matcher.group(6),
                        rule.wrap(matcher.group(7)),
                        matcher.group(8),
                        ">"
                };

                text = CFToRTFTextHelper.strSubReplace(
                    text,
                    StringUtils.join(replacement, StringUtils.EMPTY),
                    matcherIndex,
                    matcherIndex + matcher.group(0).length()
                );

            }

        }

        return text;

    }

    private static String replaceColorClasses(String text, CFToRTFConfig config)
    {

        for (Map.Entry<String, String> entry : config.colorClasses.entrySet())
        {
            String regexp = String.format(COLOR_CLASS_REGEXP_TPL, Pattern.quote(entry.getKey()));
            String replacement = String.format(COLOR_CLASS_REPLACEMENT_TPL, entry.getValue());
            text = text.replaceAll(regexp, replacement);
        }

        return text;

    }

    private static String replaceInlineColors(String text, ArrayList<String> colorTable)
    {

        Matcher inlineCssColorMatcher;
        int inlineCssColorMatcherNextIndex = 0;
        int iterationCount = 0;

        while (iterationCount < MAX_ITERATION)
        {

            ++iterationCount;
            inlineCssColorMatcher = INLINE_CSS_COLOR_PATTERN.matcher(text);

            if
            (
                    (inlineCssColorMatcherNextIndex >= text.length()) ||
                    (!inlineCssColorMatcher.find(inlineCssColorMatcherNextIndex))
            )
            {
                break;
            }

            int inlineCssColorMatcherIndex = inlineCssColorMatcher.start();
            inlineCssColorMatcherNextIndex = inlineCssColorMatcher.end();

            if (inlineCssColorMatcherNextIndex == 0)
            {
                break;
            }

            try
            {

                CFToRTFColor color = CFToRTFColorHelper.parseMatchedColor(inlineCssColorMatcher);

                if (color == null)
                {
                    throw new CFToRTFException("Unsupported color format!");
                }

                if (!colorTable.contains(color.rtf))
                {
                    colorTable.add(color.rtf);
                }

                int colorIndex = colorTable.indexOf(color.rtf) + 1;

                // replace
                int openTagEndIndex = text.indexOf('>', inlineCssColorMatcherIndex);
                if (openTagEndIndex == -1) continue;

                int openTagStartIndex = text.lastIndexOf('<', inlineCssColorMatcherIndex);
                if (openTagStartIndex == -1) continue;

                int spaceIndex = CFToRTFPatternHelper.indexOf(
                        WHITE_SPACE_PATTERN, text, openTagStartIndex
                );
                if (spaceIndex == -1) continue;

                String tagName = text.substring(openTagStartIndex + 1, spaceIndex);
                String endTag = "</" + tagName + ">";
                int endTagIndex = text.indexOf(endTag, openTagEndIndex);
                if (endTagIndex == -1) continue;

                text = text.substring(0, openTagEndIndex + 1) +
                        "\\cf" + colorIndex + " " +
                        text.substring(openTagEndIndex + 1, endTagIndex) +
                        "\\cf0" +
                        text.substring(endTagIndex);

            } catch (Exception ex)
            {
                LOG.warn(
                    "{} Could not cast CSS color `{}` to RTF color: {}",
                    LOG_PREFIX,
                    inlineCssColorMatcher.group(),
                    ex.getMessage(),
                    ex
                );
            }

        }

        return text;

    }

    private static String replaceHeadings(String text, CFToRTFConfig config)
    {

        Matcher headingElementsMatcher;
        int headingElementsMatcherNextIndex = 0;
        int iterationCount = 0;

        while (iterationCount < MAX_ITERATION)
        {

            ++iterationCount;
            headingElementsMatcher = HEADING_TAGS_PATTERN.matcher(text);

            if
            (
                (headingElementsMatcherNextIndex >= text.length()) ||
                (!headingElementsMatcher.find(headingElementsMatcherNextIndex))
            )
            {
                break;
            }

            headingElementsMatcherNextIndex = headingElementsMatcher.end();

            if (headingElementsMatcherNextIndex == 0)
            {
                break;
            }

            String headingSize = headingElementsMatcher.group(1);

            text = text.replace(
                    headingElementsMatcher.group(2),
                    "{\\b{\\fs" + config.h(headingSize) + " " +
                            headingElementsMatcher.group(2) +
                            "}}" + config.lineBreak
            );

        }

        return text;

    }

    private static String replaceAnchors(String text)
    {

        text = DYNAMIC_START_A_TAGS_PATTERN.matcher(text).replaceAll(quote("{{{"));

        text = GENERIC_START_A_TAGS_PATTERN.matcher(text).replaceAll(
                quote("{\\field{\\*\\fldinst HYPERLINK ") +
                        "\"$2\"" +
                quote("}{\\fldrslt{\\ul\\cf1 ")
        );

        text = ANY_START_A_TAGS_PATTERN.matcher(text).replaceAll(quote("{{{"));
        text = ANY_END_A_TAGS_PATTERN.matcher(text).replaceAll(quote("}}}"));

        return text;

    }

    private static String replaceSupportedStartTags(String text, CFToRTFConfig config)
    {

        text = START_BOLD_TAGS_PATTERN.matcher(text).replaceAll(quote("{\\b\n"));
        text = START_ITALICS_TAGS_PATTERN.matcher(text).replaceAll(quote("{\\i\n"));
        text = START_UNDERLINE_TAGS_PATTERN.matcher(text).replaceAll(quote("{\\ul\n"));
        text = START_STRIKETHROUGH_TAGS_PATTERN.matcher(text).replaceAll(quote("{\\strike\n"));
        text = START_SUPERSCRIPT_TAGS_PATTERN.matcher(text).replaceAll(quote("{\\super\n"));
        text = START_SUBSCRIPT_TAGS_PATTERN.matcher(text).replaceAll(quote("{\\sub\n"));
        text = START_BLOCK_TAGS_PATTERN.matcher(text).replaceAll(quote(config.startParagraph + "\n"));

        return text;

    }

    private static String replaceSupportedEndTags(String text)
    {

        text = END_BLOCK_TAGS_PATTERN.matcher(text).replaceAll(quote("\n\\par}\n"));
        text = END_INLINE_TAGS_PATTERN.matcher(text).replaceAll(quote("\n}"));

        return text;

    }

    private static String replaceListTags(String text, CFToRTFConfig config)
    {
        int nestingLevel = 0;
        return replaceListTags(text, config, nestingLevel);
    }

    private static String replaceListTags(String text, CFToRTFConfig config, int level)
    {

        int iteration = 0;

        while (iteration < MAX_ITERATION)
        {

            ++iteration;
            MatchedElement match = getNonVoidElement(HTML_LIST_TAGS, text);

            if (match == null)
            {
                break;
            }

            String innerHTML = match.innerHTML.value;
            String updatedHTML = replaceListTags(innerHTML, config, level + 1);
            String updatedRTF = replaceListItems(
                    updatedHTML, config, level, isOrderedListTag(match.tag)
            );

            text = CFToRTFTextHelper.strSubReplace(
                    text,
                    updatedRTF,
                    match.outerHTML.startIndex,
                    match.outerHTML.endIndex
            );

        }

        return text;

    }

    private static class MatchedElement
    {
        public String tag = null;
        public String startTag = null;
        public String attributes = null;
        public MatchedHTML innerHTML = null;
        public String endTag = null;
        public MatchedHTML outerHTML = null;
        public boolean unevenTagsCount = false;
        public int nestedTagsCount = 0;
    }

    private static class MatchedHTML
    {
        public String value = null;
        public int startIndex = -1;
        public int endIndex = -1;
    }

    private static MatchedElement getNonVoidElement(String[] tagName, String text)
    {
        boolean matchLeadingSpaces = false;
        return getNonVoidElement(tagName, text, matchLeadingSpaces);
    }

    private static MatchedElement getNonVoidElement(String tagName, String text, boolean matchLeadingSpaces)
    {
        return getNonVoidElement(new String[]{ tagName }, text, matchLeadingSpaces);
    }

    private static MatchedElement getNonVoidElement(
            String[] tagNames,
            String text,
            boolean matchLeadingSpaces
    )
    {

        char tagsDelimiter = '|';
        String tags = StringUtils.join(
                Arrays.stream(tagNames).map(Pattern::quote).toArray(String[]::new),
                tagsDelimiter
        );

        String lead = matchLeadingSpaces ?
                SPACES_MINUS_NEW_LINE_REGEXP :
                StringUtils.EMPTY;

        String regex = String.format(NON_VOID_ELEMENT_REGEXP_TPL, lead, tags);
        Pattern pattern = Pattern.compile(regex, FLAGS_DOT_ALL);
        Matcher matcher = pattern.matcher(text);

        if (matcher.find())
        {

            MatchedElement result = new MatchedElement();
            String open = matcher.group(1);
            String tag = matcher.group(2);
            String attributes = str(matcher.group(3));
            String contents = str(matcher.group(4));
            String endTag = matcher.group(5);
            String trailingSpaces = str(matcher.group(6));
            String endTagAndSpaces = endTag + trailingSpaces;
            String startTag = open + tag + attributes + '>';

            MatchedHTML outerHTML = new MatchedHTML();
            outerHTML.value = matcher.group(0);
            outerHTML.startIndex = matcher.start();
            outerHTML.endIndex = matcher.start() + matcher.group(0).length();

            MatchedHTML innerHTML = new MatchedHTML();
            innerHTML.value = contents;
            innerHTML.startIndex = matcher.start() + startTag.length();
            innerHTML.endIndex = outerHTML.endIndex - endTagAndSpaces.length();

            result.tag = tag;
            result.endTag = endTagAndSpaces;
            result.startTag = startTag;
            result.innerHTML = innerHTML;
            result.outerHTML = outerHTML;
            result.attributes = attributes.trim();

            String startRegex = String.format(HTML_START_TAG_REGEXP_TPL, Pattern.quote(tag));
            Pattern startPattern = Pattern.compile(startRegex, FLAGS);

            int startMatchesCount = 0;
            Matcher startMatcher = startPattern.matcher(contents);

            while (startMatcher.find())
            {
                ++startMatchesCount;
            }

            if (startMatchesCount > 0)
            {
                for (int i = 0; i < startMatchesCount; ++i)
                {

                    int fromIndex = outerHTML.endIndex;
                    int nextEndTagIndex = text.indexOf(endTag, fromIndex);

                    if (nextEndTagIndex == -1)
                    {
                        result.unevenTagsCount = true;
                        LOG.warn("{} Malformed nested list item found in source!", LOG_PREFIX);
                        LOG.debug("{} Malformed nested list items spotted near `{}`!", LOG_PREFIX, outerHTML.value);
                        break;
                    }

                    ++result.nestedTagsCount;

                    String additionalInnerContents = text.substring(
                            fromIndex - endTag.length(),
                            nextEndTagIndex
                    );

                    contents += additionalInnerContents;

                    innerHTML.value = contents;
                    innerHTML.endIndex = innerHTML.startIndex + contents.length();

                    String additionalOuterContents = text.substring(
                            fromIndex,
                            nextEndTagIndex
                    );

                    StringBuilder outerHTMLValue = new StringBuilder(outerHTML.value);
                    outerHTMLValue.append(additionalOuterContents).append(endTag);

                    outerHTML.value = outerHTMLValue.toString();
                    outerHTML.endIndex = outerHTML.startIndex + outerHTMLValue.length();

                }
            }

            return result;

        }

        return null;

    }

    private static String str(String value)
    {
        return value == null ? StringUtils.EMPTY : value;
    }

    private static boolean isOrderedListTag(String tagName)
    {
        return OL_TAGNAME_PATTERN.matcher(tagName).find();
    }

    private static String replaceListItems(
            String text,
            CFToRTFConfig config,
            int level,
            boolean ordered
    )
    {


        int itemCount = 0;
        long firstLineIndent = config.listFirstIndentSize;
        int leftIndentFactor = level + (config.indentUnnestedLists ? 2 : 1);
        long leftIndent = config.listLeftIndentSize * leftIndentFactor;
        boolean matchLeadingSpaces = true;

        while (true)
        {

            MatchedElement match = getNonVoidElement(HTML_LIST_ITEM_TAG, text, matchLeadingSpaces);

            if (match == null)
            {
                break;
            }

            ++itemCount;

            StringBuilder rtfLi = new StringBuilder(config.startParagraph);

            rtfLi.append("\\fi-").append(firstLineIndent);
            rtfLi.append("\\li").append(leftIndent);

            if (ordered)
            {
                rtfLi.append(' ').append(itemCount).append('.');
            }
            else
            {
                rtfLi.append("\\bullet");
            }

            rtfLi.append(RTF_LIST_ITEM_SYMBOL_SEPARATOR);

            Matcher subListsMatcher = START_RTF_LIST_ITEM_PATTERN.matcher(match.innerHTML.value);

            if (subListsMatcher.find())
            {

                String spaces = str(subListsMatcher.group(1));
                int ownTextEndIndex = subListsMatcher.start();
                int nestedItemStartIndex = subListsMatcher.start() + spaces.length();

                String nestedContent = CFToRTFTextHelper.strSubReplace(
                        match.innerHTML.value,
                        "\\par",
                        ownTextEndIndex,
                        nestedItemStartIndex
                );

                rtfLi.append(CFToRTFTextHelper.stripEnd(nestedContent)).append('}');

            }
            else
            {
                rtfLi.append(match.innerHTML.value).append("\\par}");
            }

            text = CFToRTFTextHelper.strSubReplace(
                    text,
                    rtfLi.toString(),
                    match.outerHTML.startIndex,
                    match.outerHTML.endIndex
            );

        }

        return text;

    }

    private static String stripTagsKeepingTheirContent(String text)
    {
        return text.replaceAll(HTML_TAG_REGEXP, StringUtils.EMPTY);
    }

    private static String wrapRTFContent(String text, CFToRTFConfig config, ArrayList<String> colorTable)
    {
        return String.format(
                RTF_WRAPPER_TPL,
                config.fontName,
                stringifyColorTable(colorTable) + postProcess(text, config)
        );
    }

    private static String stringifyColorTable(ArrayList<String> colorTable)
    {
        return "\n{\\colortbl ;" + StringUtils.join(colorTable, ";") + ";}\n";
    }

    private static String postProcess(String text, CFToRTFConfig config)
    {
        return CFToRTFTextHelper.syncBrackets(CFToRTFHtmlHelper.escapeHTMLEntities(text, config));
    }

}
