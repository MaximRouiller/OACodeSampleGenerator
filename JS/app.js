const SwaggerParser = require('@apidevtools/swagger-parser');
const fs = require('fs');
const converter = require('swagger2openapi');

(async () => {
  try {
    const specURL =
      'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

    // Bundle
    let api = await SwaggerParser.bundle(specURL);
    fs.writeFileSync('../example/bundledSpecExample.json', JSON.stringify(api, null, 2));

    // Convert
    api = await converter.convertObj(api, {});
    fs.writeFileSync('../example/convertedSpecExample.json', JSON.stringify(api, null, 2));

    // Validate and dereference
    api = await SwaggerParser.validate(api.openapi, { dereference: { circular: 'ignore' } });
    fs.writeFileSync('../example/endSpecExample.json', JSON.stringify(api, null, 2));

    console.log('API name: %s, Version: %s', api.info.title, api.info.version);

    // Get ResourceGroups_CreateOrUpdate operation
    const ResourceGroups_CreateOrUpdate = getOperations(api).find(
      (op) => op.operation.operationId === 'ResourceGroups_CreateOrUpdate'
    );

    console.log(
      getGeneratedJavaRequestCode(
        ResourceGroups_CreateOrUpdate.operationType,
        ResourceGroups_CreateOrUpdate.operation
      )
    );
  } catch (err) {
    console.error(err);
  }
})();

// Split spec into operations
function getOperations(spec) {
  let operations = [];
  for (const operationGroup of Object.values(spec.paths)) {
    for (const [operationType, operation] of Object.entries(operationGroup)) {
      operations.push({ operationType, operation });
    }
  }
  return operations;
}

// With HTTPRequest
function getGeneratedJavaRequestCode(operationType, operation) {
  let snippet = '';
  return snippet;
}
