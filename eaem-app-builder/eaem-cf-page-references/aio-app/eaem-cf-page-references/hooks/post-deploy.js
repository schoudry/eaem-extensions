const chalk = require('chalk');
const fs = require('fs');
const yaml = require('js-yaml');

module.exports = (config) => {
  try {
    // read the app.config.yaml file to get the extension points
    const yamlFile = fs.readFileSync(`${config.root}/app.config.yaml`, 'utf8');
    const yamlData = yaml.load(yamlFile);
    const { extensions } = yamlData;

    // For now we are ok just to read the first extension point to build the preview link
    const extension = Object.keys(extensions)[0];
    const previewData = {
      extensionPoint: extension,
      url: config.project.workspace.app_url,
    };

    // buid the preview URL
    const base64EncodedData = Buffer.from(JSON.stringify(previewData)).toString('base64');
    console.log(chalk.magenta(chalk.bold('For a developer preview of your UI extension in the AEM environment, follow the URL:')));

    // check if the environment is stage, if so, we need to add the -stage suffix to the URL
    const env = process.env.AIO_CLI_ENV === 'stage' ? '-stage' : '';
    console.log(chalk.magenta(chalk.bold(`  -> https://experience${env}.adobe.com/aem/extension-manager/preview/${base64EncodedData}`)));
  } catch (error) {
    // if something went wrong, we do nothing, and just don't display the URL
  }
};
