package apps;

import java.io.*;
import java.net.URL;
import java.util.Properties;

public class S7UserUploadAudit {
    private static String S7_NA_IPS_URL = "https://s7sps1apissl.scene7.com/scene7/api/IpsApiService";
    private static String SRC_S7_COMPANY_HANDLE = "";
    private static String SRC_S7_USER = "";
    private static String SRC_S7_PASS = "";
    private static String STAND_ALONE_APP_NAME = "Experience AEM";
    private static String logName = "user-uploads.csv";
    private static BufferedWriter LOG_WRITER = null;
    private static int assetCount = 0;

    public static void main(String[] args) throws Exception {
        setProperties();

        System.out.println("INFO : Reading all uploads for company : " + SRC_S7_COMPANY_HANDLE);

        LOG_WRITER.flush();
        LOG_WRITER.close();
    }

    private static void setProperties(){
        try{
            URL propFile = GetScene7AssetPathsAndSize.class.getResource("config.properties");

            System.out.println("INFO : Reading configuration from : " + propFile.getPath());

            InputStream input = new FileInputStream(propFile.getPath());

            Properties prop = new Properties();
            prop.load(input);

            String srcAccount = prop.getProperty("src");

            if((srcAccount == null) || srcAccount.trim().equals("")){
                System.out.println("ERROR: 'src' property not found in config.properties");
                System.exit(-1);
            }

            String[] words = srcAccount.split("/");

            if(words.length != 3){
                System.out.println("ERROR: 'src' property format is 's7CompanyHandle/user/pass' eg.'c|999999/user@adobe.com/password'");
                System.exit(-1);
            }

            SRC_S7_COMPANY_HANDLE = words[0];
            SRC_S7_USER = words[1];
            SRC_S7_PASS = words[2];

            String assetLogFilePath = (new File(propFile.getPath())).getParentFile().getPath() + "/" + logName;

            System.out.println("INFO: Writing asset paths to csv file : " + assetLogFilePath);

            LOG_WRITER = new BufferedWriter(new FileWriter(assetLogFilePath));
        }catch(Exception e){
            System.out.println("ERROR: Reading config.properties, is it in the current folder? - " + e.getMessage());
            e.printStackTrace();
            System.exit(-1);
        }
    }
}
