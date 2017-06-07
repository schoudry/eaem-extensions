package apps.experienceaem.taillogs;

import org.apache.commons.lang3.StringUtils;
import org.apache.felix.scr.annotations.*;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.apache.sling.commons.json.JSONObject;
import org.apache.sling.settings.SlingSettingsService;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletException;
import java.io.*;
import java.util.Dictionary;
import org.apache.commons.lang3.StringEscapeUtils;

@Component(
        metatype = true,
        label = "Experience AEM Tail Logs",
        description = "Experience AEM Tail Logs Servlet")
@Service
@Properties({
        @Property(name = "sling.servlet.methods", value = {"GET", "POST"}, propertyPrivate = true),
        @Property(name = "sling.servlet.paths", value = "/bin/experience-aem/tail/log", propertyPrivate = true)})
public class TailLogsServlet extends SlingAllMethodsServlet {
    private final Logger LOG = LoggerFactory.getLogger(getClass());

    @Reference
    protected SlingSettingsService slingSettings;

    @Property(name = "logs.path", label = "Logs folder location",
            value = "",
            description = "Absolute path of log files")
    private static final String LOG_PATH = "log.path";

    @Property(name = "bytes.to.read", label = "Initial Bytes to Read",
            value = "2048",
            description = "The initial bytes to read")
    private static final String DEFAULT_BYTES_TO_READ = "bytes.to.read";

    @Property(name = "refresh.interval.millis", label = "Refresh Interval",
            value = "5000",
            description = "Log textarea refresh interval in millis")
    private static final String REFRESH_INTERVAL = "refresh.interval.millis";

    private String logFolderPath = null;
    private String bytesToRead = null;
    private String refreshInterval = null;

    @Activate
    protected void activate(final ComponentContext context) {
        Dictionary<String, Object> props = context.getProperties();
        Object prop = props.get(LOG_PATH);

        if(prop == null){
            logFolderPath = slingSettings.getSlingHomePath() + File.separator + "logs" + File.separator;
        }else{
            logFolderPath = String.valueOf(prop);
        }

        bytesToRead = String.valueOf(props.get(DEFAULT_BYTES_TO_READ));
        refreshInterval = String.valueOf(props.get(REFRESH_INTERVAL));

        LOG.info("Logs path : " + logFolderPath + ", Initial bytes to read : " + bytesToRead + ", Refresh interval : " + refreshInterval);
    }

    private void addLastNBytes(SlingHttpServletRequest request, SlingHttpServletResponse response, String logName)
                                    throws Exception{
        String filePointer = request.getParameter("pointer");
        String startLineAt = request.getParameter("startLineAt");
        String lineMinLength = request.getParameter("lineMinLength");
        String lineMaxLength = request.getParameter("lineMaxLength");
        String lineContains = request.getParameter("lineContains");
        String notLineContains = request.getParameter("notLineContains");
        String colorLineBegin = request.getParameter("colorLineBegin");
        String trimToSize = request.getParameter("trimToSize");

        File file = new File(logFolderPath + logName);

        long _filePointer = -1, len;
        int btr = Integer.parseInt(this.bytesToRead);

        if(StringUtils.isEmpty(filePointer)){
            _filePointer = file.length() - btr;
        }else{
            _filePointer = Long.parseLong(filePointer);

            len = file.length();

            //roll over or log clean
            if( len < _filePointer){
                _filePointer = len - btr;
            }
        }

        if(_filePointer < 0){
            _filePointer = 0;
        }

        StringBuilder sb = new StringBuilder();

        //based on //http://www.jibble.org/jlogtailer.php
        RandomAccessFile raf = new RandomAccessFile(file, "r");

        try{
            raf.seek(_filePointer);

            String line = null; int startAt = 0;

            if(StringUtils.isNotEmpty(startLineAt)){
                startAt = Integer.parseInt(startLineAt);
            }

            while ((line = raf.readLine()) != null) {
                if(startAt > 0 ){
                    if(line.length() > startAt){
                        line = line.substring(startAt);
                    }else{
                        continue; //skip lines shorter than desired
                    }
                }

                if(StringUtils.isNotEmpty(lineMinLength) && line.length() < Integer.parseInt(lineMinLength)){
                    continue;
                }

                if(StringUtils.isNotEmpty(lineMaxLength) && line.length() > Integer.parseInt(lineMaxLength)){
                    continue;
                }

                if(StringUtils.isNotEmpty(lineContains) && !line.contains(lineContains)){
                    continue;
                }

                if(StringUtils.isNotEmpty(notLineContains) && line.contains(notLineContains)){
                    continue;
                }

                if(StringUtils.isNotEmpty(trimToSize)){
                    line = line.substring(0, Integer.parseInt(trimToSize));
                }

                if(StringUtils.isNotEmpty(colorLineBegin) && colorLineBegin.equals("true")){
                    int length = (line.length() < 10) ? 1 : 10;
                    line = "<span style='color:red;font-weight:bold'>" + StringEscapeUtils.escapeHtml4(line.substring(0,length))
                            + "</span>" + StringEscapeUtils.escapeHtml4(line.substring(length));
                }

                sb.append(line).append("<br>");
            }

            _filePointer = raf.getFilePointer();

            raf.close();
        }catch(Exception e){
            raf.close();
            throw new ServletException("Error reading file - " + logName);
        }

        PrintWriter pw = response.getWriter();

        if(StringUtils.isEmpty(filePointer)){
            response.setContentType("text/html");

            String interval = Integer.parseInt(this.refreshInterval)/1000 + " secs";

            pw.write("<html><head><title>CQ Tail Log</title><script src='https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.js'></script><style>input[type='text']{width:50px}</style></head><body><div style='border: 1px solid; padding: 5px; height: 780px; overflow: scroll;'><code contenteditable='true' id='logData'>" + sb.toString() + "</code></div>");
            pw.write("<br><div>Log file : " + (logFolderPath + logName) + "</div><br>");
            pw.write("<div>Refreshing : <span id=status style='color:red'>" + interval + "</span> ");
            pw.write("| <input type=button value='pause' onclick=\"eaemTL.paused = !eaemTL.paused; this.value=eaemTL.paused ? 'resume' : 'pause'; $('#status').html(eaemTL.paused ? 'paused' : eaemTL.interval)\"/> ");
            pw.write("| <input type=button value='clear' onclick=\"$('#logData').html('');\"/> ");
            pw.write("| Color Line Begin : <input type=checkbox onchange='eaemTL.colorLineBegin=this.checked; updateTextArea()'/> ");
            pw.write("| Font Size : <input type=text onchange=\"$('#logData').css('font-size', this.value)\"> Px ");
            pw.write("| Start Line At : <input type=text onchange='eaemTL.startLineAt=this.value; updateTextArea()'> ");
            pw.write("| Line Min Length : <input type=text onchange='eaemTL.lineMinLength=this.value; updateTextArea()'> ");
            pw.write("| Line Max Length : <input type=text onchange='eaemTL.lineMaxLength=this.value; updateTextArea()'> ");
            pw.write("| Trim to Size : <input type=text onchange='eaemTL.trimToSize=this.value; updateTextArea()'> </div><br>");
            pw.write("<div>If Line Contains : <input type=text onchange='eaemTL.lineContains=this.value; updateTextArea()' style='width:600px'>  &nbsp; &nbsp; ");
            pw.write(" | &nbsp; &nbsp; Not If Line Contains : <input type=text onchange='eaemTL.notLineContains=this.value; updateTextArea()' style='width:600px'></div> ");
            pw.write("<script type='text/javascript'>var eaemTL = { log: '" + logName + "', pointer : " + _filePointer + ", paused : false, interval : '" + interval + "' }; var $logData = $('#logData');");
            pw.write("function updateTextArea() { if(eaemTL.paused){return;} $.ajax( { url: '/bin/experience-aem/tail/log', data: eaemTL } ).done(function(data){ if(data.log){$logData.html($logData.html() + data.log)}; eaemTL.pointer = data.pointer});} setInterval(updateTextArea, 5000);</script></body></html>");
        }else{
            response.setContentType("application/json");

            JSONObject json = new JSONObject();
            json.put("log", sb.toString());
            json.put("pointer", _filePointer);

            json.write(pw);
        }
    }

    /**
     * @param request
     * @param response
     * @throws javax.servlet.ServletException
     * @throws java.io.IOException
     */
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
                        throws ServletException, IOException {
        try{
            String logName = request.getParameter("log");

            if(StringUtils.isEmpty(logName)){
                logName = "error";
            }

            if(!logName.endsWith(".log")){
                logName = logName + ".log";
            }

            addLastNBytes(request, response, logName);
        }catch(Exception e){
            LOG.warn("Error tailing logs servlet", e);
        }
    }
}
