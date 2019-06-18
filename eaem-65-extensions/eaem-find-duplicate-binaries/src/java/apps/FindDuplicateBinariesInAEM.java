package apps;

import org.apache.jackrabbit.commons.JcrUtils;

import javax.jcr.*;
import javax.jcr.query.Query;
import javax.jcr.query.QueryManager;
import java.util.*;

/**
 * Created by nalabotu on 6/18/2019.
 */
public class FindDuplicateBinariesInAEM {
    public static void main(String[] args) throws Exception{
        String REPO = "http://localhost:4502/crx/server";
        String WORKSPACE = "crx.default";

        Repository repository = JcrUtils.getRepository(REPO);

        Session session = repository.login(new SimpleCredentials("admin", "admin".toCharArray()), WORKSPACE);
        QueryManager qm = session.getWorkspace().getQueryManager();

        String stmt = "SELECT  * FROM [dam:Asset] WHERE ISDESCENDANTNODE(\"/content/dam\") ORDER BY 'jcr:content/metadata/dam:sha1'";
        Query q = qm.createQuery(stmt, Query.JCR_SQL2);

        NodeIterator results = q.execute().getNodes();
        Node node = null, metadata;
        String previousSha1 = null, currentSha1 = null, paths = null, previousPath = null;
        Map<String, String> duplicates = new LinkedHashMap<String, String>();

        while(results.hasNext()){
            node = (Node)results.next();

            metadata = node.getNode("jcr:content/metadata");

            if(metadata.hasProperty("dam:sha1")){
                currentSha1 = metadata.getProperty("dam:sha1").getString();
            }else{
                continue;
            }

            if(currentSha1.equals(previousSha1)){
                paths = duplicates.get(currentSha1);

                if( paths == null){
                    paths = previousPath;
                }else{
                    if(!paths.contains(previousPath)){
                        paths = paths + "," + previousPath;
                    }
                }

                paths = paths + "," + node.getPath();

                duplicates.put(currentSha1, paths);
            }

            previousSha1 = currentSha1;
            previousPath = node.getPath();
        }

        String[] dupPaths = null;

        for(Map.Entry entry : duplicates.entrySet()){
            System.out.println(entry.getKey());

            dupPaths = String.valueOf(entry.getValue()).split(",");

            for(String path : dupPaths){
                System.out.println("\t" + path);
            }
        }

        session.logout();
    }
}

