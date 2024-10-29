package apps.experienceaem.core.cf2rtf;

import java.awt.Color;

public class CFToRTFColor
{

    /** Red Value in sRGB space **/
    public final int r;
    /** Green Value in sRGB space **/
    public final int g;
    /** Blue Value in sRGB space **/
    public final int b;
    /** The representation of this color in an RTF Color table. */
    public final String rtf;

    private static final String STR_FORMAT = "\\red%s\\green%s\\blue%s";

    /**
     * Creates an instance from the specified color value
     * @param r from 0 to 255
     * @param g from 0 to 255
     * @param b from 0 to 255
     */
    public CFToRTFColor(int r, int g, int b)
    {
        this.r = validate(r);
        this.g = validate(g);
        this.b = validate(b);
        rtf = String.format(STR_FORMAT, r, g, b);
    }

    /**
     * Creates an instance from the specified native Color object.
     */
    public CFToRTFColor(Color color)
    {
        this(color.getRed(), color.getGreen(), color.getBlue());
    }

    /**
     * Ensures that `color` is a valid sRGB color number.
     * @param color The color number to valid
     * @return `color` unchanged, if valid or throws an Exception.
     */
    private int validate(int color)
    {

        if (!(color >= 0 && color <= 255))
        {
            throw new RuntimeException("Invalid sRGB color value '" + color + "'!");
        }

        return color;

    }

    /**
     * @return The representation of this color in an RTF Color table.
     */
    @Override
    public String toString()
    {
        return this.rtf;
    }

    @Override
    public boolean equals(Object obj)
    {
        if (obj instanceof CFToRTFColor)
        {
            CFToRTFColor color = (CFToRTFColor)obj;
            return color.r == r && color.g == g && color.b == b;
        }
        return super.equals(obj);
    }

}
