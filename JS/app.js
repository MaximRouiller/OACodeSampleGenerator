const SwaggerParser = require('@apidevtools/swagger-parser');
const fs = require('fs');
const converter = require('swagger2openapi');
// const validator = require('oas-validator');

let options = {};
// options.resolve = true;
options.outfile = '../example/convertedSpecExample.json';
// options.patch = true;
// options.source = inputFile;

(async () => {
  try {
    let api = await SwaggerParser.validate(
      'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json',
      { dereference: { circular: 'ignore' } }
    );

    try {
      fs.writeFileSync('../example/parsedSpecExample.json', JSON.stringify(api, null, 2));
    } catch (err) {
      console.error(err);
    }

    converter.convertObj(api, options, function () {
      // validator
      //   .validate(options.openapi, options)
      //   .then(function () {
      //     console.log(options.outfile + " is Valid!");
      //   })
      //   .catch(function (err) {
      //     console.log(options.outfile + " is Invalid!");
      //     console.warn(err.message);
      //     if (options.context) console.warn("Location", options.context.pop());
      //   });

      try {
        const converted = JSON.stringify(options.openapi, null, 2);
        fs.writeFileSync(options.outfile, converted, options.encoding || 'utf8');
      } catch (ex) {
        console.warn('The result cannot be represented safely in the chosen output format');
      }
    });

    // await SwaggerParser.validate("../example/convertedSpecExample.json");

    console.log('API name: %s, Version: %s', api.info.title, api.info.version);
  } catch (err) {
    console.error(err);
  }
})();
