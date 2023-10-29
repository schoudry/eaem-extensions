package apps.experienceaem.sites.core.services.impl;

import apps.experienceaem.sites.core.services.FireflyService;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.config.SocketConfig;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.AttributeType;
import org.osgi.service.metatype.annotations.Designate;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;


@Component(service = FireflyService.class)
@Designate(ocd = FireflyServiceImpl.FireflyConfiguration.class)
public class FireflyServiceImpl implements FireflyService {
    private final Logger logger = LoggerFactory.getLogger(FireflyServiceImpl.class);

    private String clientId = "";
    private String clientSecret = "";
    private String IMS_URL = "https://ims-na1.adobelogin.com/ims/token/v3";
    private String FF_URL = "https://firefly-beta.adobe.io/v1/images/generations";

    @Activate
    @Modified
    protected void activate(final FireflyConfiguration config) {
        clientId = config.clientId();
        clientSecret = config.clientSecret();
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

        Gson gson = new Gson();

        JsonObject responseObject = gson.fromJson(responseBody, JsonObject.class);

        return responseObject.get("access_token").getAsString();
    }

    private String getAccessTokenRequestBody(){
        return "grant_type=client_credentials&client_id=" + clientId + "&client_secret=" + clientSecret + "&scope=openid,AdobeID,firefly_api";
    }

    public String generateImage(String text){
        String base64Image = "";

        try{
            base64Image = getAccessToken();
        }catch(Exception e){
            logger.error("Error generating Image for text : " + text,e);
            throw new RuntimeException("Error generating image", e);
        }

        return base64Image;
    }

    @ObjectClassDefinition(name = "Firefly Configuration")
    public @interface FireflyConfiguration {
        @AttributeDefinition(
            name = "Client Id",
            description = "Firefly account clientId",
            type = AttributeType.STRING
        )
        String clientId() default "";

        @AttributeDefinition(
            name = "Client Secret",
            description = "Firefly account clientSecret",
            type = AttributeType.STRING
        )
        String clientSecret() default "";
    }
}
