package apps.experienceaem.autoadvancer.datetime;

import com.day.cq.workflow.exec.WorkItem;
import com.day.cq.workflow.exec.WorkflowProcess;
import com.day.cq.workflow.job.AbsoluteTimeoutHandler;
import com.day.cq.workflow.timeout.autoadvance.AbsoluteTimeAutoAdvancer;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.Properties;
import org.apache.felix.scr.annotations.Property;
import org.apache.felix.scr.annotations.Service;
import org.apache.sling.commons.json.JSONArray;
import org.apache.sling.commons.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.text.SimpleDateFormat;
import java.util.*;

@Component(metatype = false)
@Service(value={WorkflowProcess.class, AbsoluteTimeoutHandler.class})
@Properties({
        @Property(name="service.description", value="Experience AEM Date Time Auto Advancer Process"),
        @Property(name="process.label", value = "Experience AEM Date Time Auto Advancer")
})
public class DateTimeAutoAdvancer extends AbsoluteTimeAutoAdvancer {
    protected final Logger log = LoggerFactory.getLogger(DateTimeAutoAdvancer.class);

    private static SimpleDateFormat JS_JAVA_FORMATTER = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
    private static String DATE_TIMES_PROP = "eaemTimeoutDateTimes";

    static {
        JS_JAVA_FORMATTER.setTimeZone(TimeZone.getTimeZone("GMT"));
    }

    private void addTimes(Date currentDate, JSONArray times, List<Long> dtNumbers) throws Exception{
        if( (times == null) || (times.length() == 0)){
            return;
        }

        Calendar cal;

        String time[], hhmm[], ampm;
        int hour, min, nextDayHour = -1, nextDayMin = -1;

        for(int i = 0, len = times.length(); i < len; i++){
            time = ((String)times.get(i)).split(" ");

            hhmm = time[0].split(":");
            ampm = time[1];

            cal = Calendar.getInstance();

            hour = NumberUtils.createInteger(hhmm[0]);
            hour = (ampm.equalsIgnoreCase("AM")) ? hour : hour + 12;
            min = NumberUtils.createInteger(hhmm[1]);

            cal.set(Calendar.HOUR_OF_DAY, hour);
            cal.set(Calendar.MINUTE, min);

            //get the earliest time of next day, if a page/asset was approved after the timeout times set
            //in a day, are passed
            if(i == 0){
                nextDayHour = hour;
                nextDayMin = min;
            }else{
                if(hour < nextDayHour){
                    nextDayHour = hour;
                    nextDayMin = min;
                }else if(hour == nextDayHour){
                    if( min < nextDayMin ){
                        nextDayMin = min;
                    }
                }
            }

            //skip past dates
            if(currentDate.getTime() > cal.getTimeInMillis()){
                continue;
            }

            dtNumbers.add(cal.getTimeInMillis());
        }

        if(dtNumbers.isEmpty()){
            cal = Calendar.getInstance();

            cal.add(Calendar.DATE, 1);
            cal.set(Calendar.HOUR_OF_DAY, nextDayHour);
            cal.set(Calendar.MINUTE, nextDayMin);

            dtNumbers.add(cal.getTimeInMillis());
        }
    }

    private void addDateTimes(Date currentDate, JSONArray dateTimes, List<Long> dtNumbers)
                                    throws Exception{
        if( (dateTimes == null) || (dateTimes.length() == 0)){
            return;
        }

        String dateStr = null; Date date = null;

        for(int i = 0, len = dateTimes.length(); i < len; i++){
            dateStr = (String)dateTimes.get(i);

            date = JS_JAVA_FORMATTER.parse(dateStr);

            //skip past dates
            if(currentDate.getTime() > date.getTime()){
                continue;
            }

            dtNumbers.add(date.getTime());
        }
    }

    public long getTimeoutDate(WorkItem workItem) {
        List<Long> dtNumbers = new ArrayList<Long>();
        Date currentDate = new Date();

        try{
            String dateTimesVal = workItem.getNode().getMetaDataMap().get(DATE_TIMES_PROP, String.class);

            if(StringUtils.isEmpty(dateTimesVal)){
                return super.getTimeoutDate(workItem);
            }

            JSONObject dt = new JSONObject(dateTimesVal);

            JSONArray times = (JSONArray)dt.get("times");
            JSONArray dateTimes = (JSONArray)dt.get("datetimes");

            addTimes(currentDate, times, dtNumbers);
            addDateTimes(currentDate, dateTimes, dtNumbers);

            Collections.sort(dtNumbers);
        }catch(Exception e){
            log.error("Could not calculate timeout", e);
        }

        // get the most recent date&time in future, at which the auto advancer should timeout
        return dtNumbers.isEmpty() ? super.getTimeoutDate(workItem) : dtNumbers.get(0);
    }
}
