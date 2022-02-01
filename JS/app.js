const SwaggerParser = require('@apidevtools/swagger-parser');
const fs = require('fs');
const { safeStringify } = require('./utilities');
const converter = require('swagger2openapi');
const validator = require('oas-validator');

JSON.safeStringify = safeStringify;
let inputFile = "parsedSpecExample.json";
let options = {};
options.resolve = true;
options.outfile = "convertedSpecExample.json";
options.patch = true;
options.source = inputFile;

(async () => {
  try {
    let api = await SwaggerParser.validate(
      'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/agrifood/resource-manager/Microsoft.AgFoodPlatform/preview/2020-05-12-preview/agfood.json'
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

  converter.convertFile(options.source, options, function(err, options){
    if (err) {
      delete err.options;
      console.warn(err);
      return process.exitCode = 1;
    }

    validator.validate(options.openapi, options)
    .then(function(){
      console.log(options.outfile + " is Valid!");
    })
    .catch(function(err){
      console.log(options.outfile + " is Invalid!");
      console.warn(err.message);
      if (options.context) console.warn('Location',options.context.pop());
    });

    let s;
    try {
      s = JSON.stringify(options.openapi, null, options.indent||4);
    }
    catch (ex) {
      console.warn('The result cannot be represented safely in the chosen output format');
      s = '{}';
    }
    fs.writeFileSync(options.outfile, s, options.encoding || 'utf8');
  });
})();

