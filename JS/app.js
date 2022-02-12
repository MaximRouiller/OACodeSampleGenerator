const SwaggerParser = require('@apidevtools/swagger-parser');
const fs = require('fs');
const converter = require('swagger2openapi');

(async () => {
  try {
    const specURL =
      'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

    const singleOperation = 'ResourceGroups_CreateOrUpdate'; // a better one to test the model generators with is e.g. Deployments_CreateOrUpdateAtScope
    // const singleOperation = '';

    // Bundle
    let api = await SwaggerParser.bundle(specURL);
    fs.writeFileSync('../example/bundledSpec.json', JSON.stringify(api, null, 2));

    // Convert
    api = await converter.convertObj(api, {});
    fs.writeFileSync('../example/convertedSpec.json', JSON.stringify(api, null, 2));

    // Validate and dereference ('validate' calls 'dereference' internally)
    // https://apitools.dev/swagger-parser/docs/swagger-parser.html#validateapi-options-callback
    api = await SwaggerParser.validate(api.openapi);

    // Circular references are not supported by JSON so use the version below instead of the version
    // above to just partially dereference the spec and serialise it as JSON. This will significantly
    // reduce the number of operations whose responses are able to be deserialised with the model
    // generators later on, so only use this version if you need to more easily inspect the JSON.
    // api = await SwaggerParser.validate(api.openapi, { dereference: { circular: 'ignore' } });
    // fs.writeFileSync('../example/endSpec.json', JSON.stringify(api, null, 2));

    console.log(`API name: ${api.info.title}, Version: ${api.info.version}`);

    let javaSnippet = '';
    let pythonSnippet = '';
    let csharpSnippet = '';

    let requestBody = '';

    let javaModel = '';
    // let pythonModel = '';
    // let csharpModel = '';

    for (const operation of getOperations(api)) {
      const operationId = operation.operationId;

      if (singleOperation && operationId !== singleOperation) continue;

      const requestBodyProperties =
        operation.requestBody?.content['application/json'].schema.properties;

      javaSnippet += getJavaRequestCode(operation, api.info.version, requestBodyProperties);
      pythonSnippet += getPythonRequestCode(operation, api.info.version, requestBodyProperties);
      csharpSnippet += getCSharpRequestCode(operation, api.info.version, requestBodyProperties);

      if (requestBodyProperties) {
        requestBody += getJSONRequestBody(
          operationId,
          Object.entries(requestBodyProperties).filter((prop) => !prop[1].readOnly)
        );
      }

      const responseBodyProperties =
        operation.responses[200]?.content?.['application/json'].schema.properties;

      if (responseBodyProperties) {
        javaModel += getJavaResponseCode(operationId, Object.entries(responseBodyProperties));
        // pythonModel += getPythonResponseCode(operationId, Object.entries(responseBodyProperties));
        // csharpModel += getCSharpResponseCode(operationId, Object.entries(responseBodyProperties));
      }
    }

    fs.writeFileSync('../example/javaSnippet.txt', javaSnippet);
    fs.writeFileSync('../example/pythonSnippet.txt', pythonSnippet);
    fs.writeFileSync('../example/csharpSnippet.txt', csharpSnippet);

    fs.writeFileSync('../example/requestBody.txt', requestBody);

    fs.writeFileSync('../example/javaModel.txt', javaModel);
    // fs.writeFileSync('../example/pythonModel.txt', pythonModel);
    // fs.writeFileSync('../example/csharpModel.txt', csharpModel);
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

// With Requests for python 2.7 & 3.6+ https://docs.python-requests.org/en/latest/
// Request is synchronous
function getPythonRequestCode(
  { operationGroupPath, operationType, operationId },
  apiVersion,
  hasBody
) {
  return `# ${operationId}

# import requests

headers = {"Content-Type": "application/json"}

response = requests.${operationType}(
  "https://managemement.azure.com${operationGroupPath}? \\
  api-version=${apiVersion}",
  headers=headers${hasBody ? ', files={"file": open("body.json", "r")}' : ''})

print(response.status_code)
print(response.content)

`;
}

// With HTTPClient for C# https://docs.microsoft.com/en-us/dotnet/api/system.net.http.httpclient?view=net-6.0
// Request is Asynchronous
function getCSharpRequestCode(
  { operationGroupPath, operationType, operationId },
  apiVersion,
  hasBody
) {
  return `// ${operationId}
    
HttpClient client = new HttpClient();
HttpRequestMessage req = new HttpRequestMessage(HttpMethod.${capitalise(
    operationType
  )}, "https://managemement.azure.com${operationGroupPath}?api-version=${apiVersion}");
req.Content = new StringContent(${
    hasBody ? 'System.IO.File.ReadAllText(@"body.json"), Encoding.UTF8, "application/json"' : ''
  });

HttpResponseMessage httpResponseMessage = await client.SendAsync(req);
httpResponseMessage.EnsureSuccessStatusCode();
HttpContent httpContent = httpResponseMessage.Content;
string responseString = await httpContent.ReadAsStringAsync();
string responseStatus = httpResponseMessage.StatusCode.ToString();
Console.WriteLine(responseString);
Console.WriteLine(responseString);

`;
}

function getJSONRequestBody(operationId, properties) {
  return `${operationId} - body.json:

{${properties.map(
    (prop) => `
  "${prop[0]}": ...`
  )}
}

`;
}

function getJavaResponseCode(operationId, properties) {
  return `class ${operationId} {${properties
    .map((prop) => {
      let type = prop[1].type;
      if (type === 'array') type = 'List<Object>';
      return `
  ${capitalise(type || 'object')} ${prop[0]};`;
    })
    .join('')} 
}

`;
}

// TODO: Create response deserialiser model generator for Python
// function getPythonResponseCode(operationId, properties) {
//   return ``;
// }

// TODO: Create response deserialiser model generator for C#
// function getCSharpResponseCode(operationId, properties) {
//   return ``;
// }

// Utilities

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);
