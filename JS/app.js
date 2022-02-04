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

    console.log(`API name: ${api.info.title}, Version: ${api.info.version}`);

    let javaSnippet = '';

    getOperations(api)
      .filter((op) => op.operationId === 'ResourceGroups_CreateOrUpdate')
      .forEach((operation) => {
        const bodyProperties = operation.requestBody?.content['application/json'].schema.properties;

        javaSnippet += getJavaRequestCode(operation, api.info.version, bodyProperties);

        if (bodyProperties) {
          const writeProperties = Object.entries(bodyProperties).filter(
            (prop) => !prop[1].readOnly
          );

          javaSnippet += getJSONRequestBody(writeProperties);
        }

        // javaSnippet += getJavaResponseCode(operation);
      });

    fs.writeFileSync('../example/javaSnippet.txt', javaSnippet);
    console.log(javaSnippet);
  } catch (err) {
    console.error(err);
  }
})();

// Split spec into operations
function getOperations(spec) {
  let operations = [];
  for (const [operationGroupPath, operationGroup] of Object.entries(spec.paths)) {
    for (const [operationType, operation] of Object.entries(operationGroup)) {
      operations.push({ operationGroupPath, operationType, ...operation });
    }
  }
  return operations;
}

// With HTTPClient for Java 11+ https://openjdk.java.net/groups/net/httpclient/intro.html
// Request is synchronous
function getJavaRequestCode(
  { operationGroupPath, operationType, operationId },
  apiVersion,
  hasBody
) {
  return `// ${operationId}

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
  .uri(URI.create("https://managemement.azure.com${operationGroupPath}?api-version=${apiVersion}"))
  .header("Content-Type", "application/json")
  .${operationType.toUpperCase()}(${hasBody ? 'BodyPublishers.ofFile(Paths.get("body.json"))' : ''})
  .build();

HttpResponse<String> response = client.send(request, BodyHandlers.ofString());
System.out.println(response.statusCode());
System.out.println(response.body());

`;
}

function getJSONRequestBody(properties) {
  return `-----

body.json:

{${properties.map(
    (prop) => `
  "${prop[0]}": ...`
  )}
}

`;
}

// TODO: Create response deserialiser model generator for Java
// function getJavaResponseCode(operation) {
//   return ``;
// }
