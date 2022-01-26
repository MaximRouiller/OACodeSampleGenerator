const SwaggerParser = require('@apidevtools/swagger-parser');
const fs = require('fs');
const { safeStringify } = require('./utilities');

JSON.safeStringify = safeStringify;

(async function test() {
  try {
    let api = await SwaggerParser.validate(
      'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json'
    );

    try {
      fs.writeFileSync('parsedSpecExample.json', JSON.safeStringify(api));
    } catch (err) {
      console.error(err);
    }

    console.log('API name: %s, Version: %s', api.info.title, api.info.version);
  } catch (err) {
    console.error(err);
  }
})();
