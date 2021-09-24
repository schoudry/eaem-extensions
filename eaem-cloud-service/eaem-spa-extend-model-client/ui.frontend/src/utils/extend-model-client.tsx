import { ModelClient } from "@adobe/aem-spa-page-model-manager";

export const extendModelClient = () => {
    const client = new ModelClient();
    
    const extend = (modelClient:any) => {
        const fetch = modelClient.fetch as Function;
    
        modelClient.fetch = async function (modelPath:string):Promise<object> {
            try {
                const jsonData = await fetch.call(this, modelPath + "?ck=" + Math.floor(Math.random() * 999999));
                return Promise.resolve(jsonData);
            } catch (err) {
                return Promise.reject(err);
            }
        };
    
        return modelClient;
    };

    const modelClient:ModelClient = extend(client);

    return modelClient;
}

export default extendModelClient;

