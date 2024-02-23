package apps;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.Scanner;

public class CheckMissingAssets {
    private static String LOG_PATH = "C:/dev/projects/experience-aem/deliverables/all-assets.csv";
    private static String FOLDER_LOCATION = "D:/cm";

    public static void main(String[] args) throws Exception{
        BufferedReader INPUT_READER = new BufferedReader(new FileReader(LOG_PATH));
        Scanner fileScanner = new Scanner(INPUT_READER);
        String line = null;
        String[] data = null;

        System.out.println("MISSING FILES IN " + FOLDER_LOCATION);
        int index = 0, foundFiles = 0;

        while (fileScanner.hasNextLine()) {
            index++;

            line = fileScanner.nextLine();

            data = line.split(",");

            String fileName = data[0].substring(data[0].lastIndexOf("/") + 1);
            String filePathOnDisk = FOLDER_LOCATION + "/" + fileName;

            if(!(new File(filePathOnDisk).exists())){
                System.out.println(line);
            }else{
                foundFiles++;
            }
        }

        System.out.println("TOTAL SCANNED : " + index);
        System.out.println("FOUND : " + foundFiles);

        INPUT_READER.close();
    }
}
