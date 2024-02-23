package apps;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

public class PutAssetsInFolders {
    private static String inputAssetsFolderName = "input";
    private static String outputAssetsFolderName = "output";
    private static String assetsFile = "all-assets.csv";

    private static BufferedReader ASSES_FILE_READER = null;

    public static void main(String[] args) throws Exception{
        URL propFile = PutAssetsInFolders.class.getResource("config.properties");
        String downloadPath = (new File(propFile.getPath())).getParentFile().getPath();

        ASSES_FILE_READER = new BufferedReader(new FileReader(downloadPath + "/" + assetsFile));
        int skipLines = 0;

        Scanner fileScanner = new Scanner(ASSES_FILE_READER);
        String line = null;
        String[] data = null;
        int index = 0;

        while (fileScanner.hasNextLine()) {
            line = fileScanner.nextLine();

            if(index++ < skipLines){
                continue;
            }

            data = line.split(",");

            String assetPath = data[0];
            String folderPath = assetPath.substring(0, assetPath.lastIndexOf("/"));
            String assetName = assetPath.substring(assetPath.lastIndexOf("/") + 1);

            String outputFolderPath = downloadPath + "/" + outputAssetsFolderName + "/" + folderPath;
            String inputFolderPath = downloadPath + "/" + inputAssetsFolderName;

            new File(outputFolderPath).mkdirs();

            try{
                Path temp = Files.move
                        (Paths.get(inputFolderPath + "/" + assetName),
                                Paths.get(outputFolderPath + "/" + assetName));

                if(temp != null)            {
                    System.out.println("Moved : " + (outputFolderPath + "/" + assetName));
                }else{
                    System.out.println("Failed : " + (outputFolderPath + "/" + assetName));
                }
            }catch (Exception e){
                System.out.println("Not found? : " + (outputFolderPath + "/" + assetName));
            }
        }

        ASSES_FILE_READER.close();
    }
}
