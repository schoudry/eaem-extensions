package apps.mysample.chainselect;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.felix.scr.annotations.sling.SlingServlet;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.io.JSONWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@SlingServlet(
        paths="/bin/mycomponents/chainselect/dropdowndata",
        methods = "GET",
        metatype = true,
        label = "Dropdown Data Servlet"
)
public class GetDropDownData extends SlingAllMethodsServlet {
    private static final Logger LOG = LoggerFactory.getLogger(GetDropDownData.class);

    private static Map<String, String> LEVEL_1 = new HashMap<String, String>();
    private static Map<String, Map<String, String>> LEVEL_2 = new HashMap<String, Map<String, String>>();
    private static Map<String, Map<String, String>> LEVEL_3 = new HashMap<String, Map<String, String>>();

    static{
        fillStaticData();
    }

    private static void fillStaticData(){
        LEVEL_1.put("ENTERTAINMENT", "Entertainment");
        LEVEL_1.put("HEALTH", "Health");
        LEVEL_1.put("PARTY", "Party");

        Map<String, String> map = new LinkedHashMap<String, String>();

        map.put("MOVIES", "Movies");
        map.put("CELEB_NEWS", "Celebrity News");
        map.put("TV", "TV");
        map.put("MUSIC", "Music");
        map.put("STYLE", "Style");

        LEVEL_2.put("ENTERTAINMENT", map);

        map = new LinkedHashMap<String, String>();

        map.put("MENS_HEALTH", "Men's Health");
        map.put("WOMENS_HEALTH", "Women's Health");
        map.put("CHILD_HEALTH", "Children's Health");
        map.put("ALT_MEDICINE", "Alternative Medicine");

        LEVEL_2.put("HEALTH", map);

        map = new LinkedHashMap<String, String>();

        map.put("HOLLYWOOD", "Hollywood");
        map.put("BOLLYWOOD", "Bollywood");

        LEVEL_3.put("MOVIES", map);

        map = new LinkedHashMap<String, String>();

        map.put("MJ", "Michael Jackson");
        map.put("RAHMAN", "A R Rahman");

        LEVEL_3.put("MUSIC", map);
    }

    private void outputInitData(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
                                throws ServletException{
        Integer level = NumberUtils.createInteger(request.getParameter("level"));
        String keyword = request.getParameter("keyword");

        if(level == null){
            level = 1;
        }

        try{
            JSONWriter jw = new JSONWriter(response.getWriter());
            Field field = null; Class clazz = this.getClass();
            Map<String, String> map = null;

            jw.object();

            do{
                try{
                    field = clazz.getDeclaredField("LEVEL_" + level);
                }catch (NoSuchFieldException nfe){
                    break;
                }

                if(level == 1){
                    map = (Map<String, String>)field.get(null);
                }else{
                    if(StringUtils.isEmpty(keyword)){
                        keyword = ((Map<String,Map<String, String>>)field.get(null)).keySet().iterator().next();
                    }

                    map = ((Map<String,Map<String, String>>)field.get(null)).get(keyword);
                }

                if(map == null){
                    break;
                }

                keyword = null;

                jw.key(level.toString()).array();

                for(Map.Entry<String, String> entry : map.entrySet()){
                    jw.array();
                    jw.value(entry.getKey()).value(entry.getValue());
                    jw.endArray();

                    if(StringUtils.isEmpty(keyword)){
                        keyword = entry.getKey();
                    }
                }

                jw.endArray();
                level++;
            }while(true);

            jw.endObject();
        }catch(Exception e){
            LOG.error("Error getting dropdown data",e);
            throw new ServletException(e);
        }
    }

    private void outputSavedText(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException{
        try {
            String[] lStrs = request.getParameter("levels").split(",");
            String[] keywords = request.getParameter("keywords").split(",");
            JSONWriter jw = new JSONWriter(response.getWriter());

            Field field = null; Class clazz = this.getClass();
            Map<String, String> map = null; Integer level = null;

            jw.object();

            for(int i = 0; i < lStrs.length; i++){
                level = NumberUtils.createInteger(lStrs[i]);

                try{
                    field = clazz.getDeclaredField("LEVEL_" + level);
                }catch (NoSuchFieldException nfe){
                    continue;
                }

                if(level == 1){
                    map = (Map<String, String>)field.get(null);
                }else{
                    map = ((Map<String,Map<String, String>>)field.get(null)).get(keywords[i - 1]);
                }

                if(map == null){
                    continue;
                }

                jw.key(level.toString()).array();

                for(Map.Entry<String, String> entry : map.entrySet()){
                    jw.array();
                    jw.value(entry.getKey()).value(entry.getValue());
                    jw.endArray();
                }

                jw.endArray();
            }

            jw.endObject();
        } catch (Exception e) {
            LOG.error("Error getting dropdown data", e);
            throw new ServletException(e);
        }
    }

        @Override
    protected void doGet(final SlingHttpServletRequest request, final SlingHttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("utf-8");

        String lStr = request.getParameter("levels");

        if(StringUtils.isNotEmpty(lStr)){
            outputSavedText(request, response);
        }else{
            outputInitData(request, response);
        }
    }
}