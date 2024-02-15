package apps.experienceaem.assets.core.servlets;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.config.SocketConfig;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.sling.api.SlingHttpServletRequest;
import org.apache.sling.api.SlingHttpServletResponse;
import org.apache.sling.api.servlets.SlingAllMethodsServlet;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.Servlet;
import javax.servlet.ServletException;
import java.io.IOException;

@Component(
    immediate = true,
    service = Servlet.class,
    property = {
        "sling.servlet.methods=GET",
        "sling.servlet.paths=/bin/eaem/umapi/users"
    }
)
@Designate(ocd = GetAdminConsoleUsers.UMAPIConfiguration.class)
public class GetAdminConsoleUsers extends SlingAllMethodsServlet {
    private static final Logger LOGGER = LoggerFactory.getLogger(GetAdminConsoleUsers.class);

    private static final String UMAPI_END_POINT = "https://usermanagement.adobe.io/v2/usermanagement/users";

    private String clientId = "";
    private String clientSecret = "";
    private String adobeOrg = "";
    private String IMS_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
    private String UMAPI_URL = "https://usermanagement.adobe.io/v2/usermanagement/users";

    @Activate
    @Modified
    protected void activate(final UMAPIConfiguration config) {
        clientId = config.clientId();
        clientSecret = config.clientSecret();
        adobeOrg = config.adobeOrg();
    }

    @Override
    protected void doGet(SlingHttpServletRequest request, SlingHttpServletResponse response)
        throws ServletException, IOException {

        try{
            response.setContentType("application/json");
            if(StringUtils.isEmpty(clientId) || StringUtils.isEmpty(clientSecret) || StringUtils.isEmpty(adobeOrg)){
                response.getWriter().println("{ error : 'User API not initialized' }");
            }else{
                response.getWriter().println(getUsersInOrg());
            }
        }catch(Exception e){
            throw new ServletException("Error getting users in org : " + adobeOrg, e);
        }
    }

    public JsonObject getUsersInOrg(){
        JsonObject usersObject = new JsonObject();

        try{
            String accessToken = getAccessToken();

            SocketConfig sc = SocketConfig.custom().setSoTimeout(180000).build();
            CloseableHttpClient client = HttpClients.custom().setDefaultSocketConfig(sc).build();

            HttpGet userGet = new HttpGet(UMAPI_URL + "/" + adobeOrg + "/0");

            userGet.addHeader("X-Api-Key", clientId);
            userGet.addHeader("Authorization", "Bearer " + accessToken);
            userGet.addHeader("Content-Type", "application/json");

            HttpResponse response = client.execute(userGet);

            HttpEntity responseEntity = response.getEntity();

            String responseBody = IOUtils.toString(responseEntity.getContent(), "UTF-8");

            client.close();

            Gson gson = new Gson();

            JsonObject responseObject = gson.fromJson(responseBody, JsonObject.class);
            JsonObject user = null;

            JsonArray users = (JsonArray)responseObject.get("users");

            for(JsonElement element : users){
                user = element.getAsJsonObject();
                usersObject.addProperty(user.get("email").getAsString(), user.get("id").getAsString());
            }
        }catch(Exception e){
            LOGGER.error("Error getting users in org : " + adobeOrg,e);
            throw new RuntimeException("Error getting users in org : " + adobeOrg, e);
        }

        return usersObject;
    }

    private String getAccessTokenRequestBody(){
        return "grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret + "&scope=openid,AdobeID,user_management_sdk";
    }

    private String getAccessToken() throws IOException {
        CloseableHttpClient client = null;
        String responseBody = "";

        SocketConfig sc = SocketConfig.custom().setSoTimeout(180000).build();
        client = HttpClients.custom().setDefaultSocketConfig(sc).build();

        HttpPost post = new HttpPost(IMS_URL);
        StringEntity entity = new StringEntity(getAccessTokenRequestBody(), "UTF-8");

        post.addHeader("Content-Type", "application/x-www-form-urlencoded");
        post.setEntity(entity);

        HttpResponse response = client.execute(post);

        HttpEntity responseEntity = response.getEntity();

        responseBody = IOUtils.toString(responseEntity.getContent(), "UTF-8");

        client.close();

        Gson gson = new Gson();

        JsonObject responseObject = gson.fromJson(responseBody, JsonObject.class);

        return responseObject.get("access_token").getAsString();
    }

    @ObjectClassDefinition(name = "Experience AEM User Management API Configuration")
    public @interface UMAPIConfiguration {
        @AttributeDefinition(
            name = "Client Id",
            description = "UMAPI account clientId",
            type = AttributeType.STRING
        )
        String clientId() default "";

        @AttributeDefinition(
            name = "Client Secret",
            description = "UMAPI account clientSecret",
            type = AttributeType.STRING
        )
        String clientSecret() default "";

        @AttributeDefinition(
            name = "Adobe Org",
            description = "Adobe Org",
            type = AttributeType.STRING
        )
        String adobeOrg() default "";
    }
}
