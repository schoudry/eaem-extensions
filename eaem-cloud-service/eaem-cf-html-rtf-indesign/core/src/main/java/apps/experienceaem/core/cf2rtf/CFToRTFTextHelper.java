package apps.experienceaem.core.cf2rtf;

import org.apache.commons.lang3.StringUtils;

public class CFToRTFTextHelper
{

    private static final String OPEN_BRACKET = "{";
    private static final String CLOSE_BRACKET = "}";
    private static final String RIGHT_SPACES_REGEXP = "[\\s\\uFEFF\\xA0]+$";

    /**
     * Ensures that `text` has an equal amount of opening and closing curly braces `{}`.
     * @param text The text to inspect.
     * @return The text, either unmodified, or prepended with `{` or appended with `}`
     */
    public static String syncBrackets(String text)
    {

        int openBraceCount = countOccurrences(text, OPEN_BRACKET);
        int closeBraceCount = countOccurrences(text, CLOSE_BRACKET);

        if (openBraceCount > closeBraceCount)
        {
            text += strRepeat(CLOSE_BRACKET, openBraceCount - closeBraceCount);
        }
        else if (closeBraceCount > openBraceCount)
        {
            text = strRepeat(OPEN_BRACKET, closeBraceCount - openBraceCount) + text;
        }

        return text;

    }

    /**
     * Counts the number of times `haystack` is found in `needle`.
     * @param haystack The text to look in.
     * @param needle The text to look for.
     * @return The count.
     */
    private static int countOccurrences(String haystack, String needle)
    {

        int count = 0;
        int step = needle.length();

        if (step > 0)
        {

            int size = haystack.length();
            int position = haystack.indexOf(needle);

            while (position != -1 && position < size)
            {
                count += 1;
                position = haystack.indexOf(needle, position + step);
            }

        }

        return count;

    }

    /**
     * Repeats `chunk` `count` times in a `String` and returns the resulting string.
     * @param chunk The text to repeat.
     * @param count The number of times to repeat it.
     * @return The repeated String.
     */
    private static String strRepeat(String chunk, int count)
    {

        StringBuilder result = new StringBuilder();

        for (int i = 0; i < count; ++i)
        {
            result.append(chunk);
        }

        return result.toString();

    }

    /**
     * Replaces the characters from `startIndex` to `endIndex` by `replacement` in `text` .
     * @param text The text to update
     * @param replacement The text to replace add to `text`
     * @param startIndex Where to add `replacement` and to start dropping previous characters of `text`
     * @param endIndex Where to stop dropping previous characters of `text`. `-1` means drop the all rest.
     */
    public static String strSubReplace(String text, String replacement, int startIndex, int endIndex)
    {

        if (startIndex < 0)
        {
            startIndex = 0;
        }

        if (endIndex < 0 || endIndex > text.length())
        {
            endIndex = text.length();
        }

        if (startIndex > endIndex)
        {
            throw new CFToRTFException("Start index cannot be greater than end index!");
        }

        return text.substring(0, startIndex) + replacement + text.substring(endIndex);

    }

    /**
     * Removes white-spaces from the right side of the specified `str`.
     */
    public static String stripEnd(String str)
    {
        if (StringUtils.isNotBlank(str))
        {
            return str.replaceAll(RIGHT_SPACES_REGEXP, StringUtils.EMPTY);
        }
        return str;
    }

}
