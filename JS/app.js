const SwaggerParser = require('@apidevtools/swagger-parser');
const fs = require('fs');
const converter = require('swagger2openapi');

(async () => {
  try {
    let api = await SwaggerParser.validate(
      'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json',
      { dereference: { circular: 'ignore' } }
    );

    try {
      fs.writeFileSync('../example/parsedSpecExample.json', JSON.stringify(api, null, 2), 'utf8');
    } catch (err) {
      console.error(err);
    }

    await converter.convertObj(api, (options = {}), function () {
      try {
        const converted = JSON.stringify(options.openapi, null, 2);
        fs.writeFileSync('../example/convertedSpecExample.json', converted, 'utf8');
      } catch (err) {
        console.error(err);
      }
    });

    console.log('API name: %s, Version: %s', api.info.title, api.info.version);
  } catch (err) {
    console.error(err);
  }
})();
