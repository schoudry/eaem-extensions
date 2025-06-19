const { AEM_HOST, AEM_TOKEN } = {
    AEM_HOST: "author-pxxxx-exxxx.adobeaemcloud.com",
    AEM_TOKEN: "eyJhbG..."
}

try {
    const sourcePath = process.argv[2];
    const destPath = process.argv[3];

    if (!sourcePath || !destPath) {
        console.log("srcPath or destPath missing in 3rd, 4th parameters");
        process.exit(500);
    }

    renamePage(AEM_HOST, AEM_TOKEN, sourcePath, destPath);
} catch (e) {
    console.error(e);
}

async function renamePage(aemHost, aemToken, srcPath, destPath) {
    console.log("Command execution : renamePage : " + srcPath + ", to :" + destPath);

    const postData = {
        ":operation": "move",
        ":dest": destPath
    };

    await doFetchSyncPost(aemHost, aemToken, srcPath, postData);

    console.log("Command complete : renamePage : " + srcPath + ", to :" + destPath);
}

async function doFetchSyncPost(aemHost, token, path, payload) {
    let postOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams(payload),
    }

    if (aemHost == "localhost") {
        aemHost = "http://" + aemHost + ":4502";
        postOptions.headers["cookie"] = "login-token=" + token;
    } else {
        aemHost = "https://" + aemHost;
        postOptions.headers["Authorization"] = "Bearer " + token;
    }

    let data;

    try {
        const response = await fetch(aemHost + path, postOptions);

        data = await response.text();
    } catch (err) {
        console.log("ERROR: " + path + ": " + err.message, err);
    }

    return data;
}

