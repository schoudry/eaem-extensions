package apps.experienceaem.core.cf2rtf;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CFToRTFPatternHelper
{

    /**
     * Finds the index of the substring of `text` matched by `pattern` starting at index `fromIndex`
     * @param pattern The search pattern
     * @param text The text to search for
     * @param fromIndex The start index of the search. Negative values will start searching from index `0`
     * @return The index of matched substring if found and `-1` otherwise.
     */
    public static int indexOf(Pattern pattern, String text, int fromIndex)
    {

        Matcher matcher = pattern.matcher(text);
        boolean found;

        if (fromIndex >= 0)
        {
            found = matcher.find(fromIndex);
        }
        else
        {
            found = matcher.find();
        }

        return found ? matcher.start() : -1;

    }

}
