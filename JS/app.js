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
    let pythonSnippet = '';
    let csharpSnippet = '';

    getOperations(api)
      .filter((op) => op.operationId === 'ResourceGroups_CreateOrUpdate')
      .forEach((operation) => {
        const bodyProperties = operation.requestBody?.content['application/json'].schema.properties;

        javaSnippet += getJavaRequestCode(operation, api.info.version, bodyProperties);
        pythonSnippet += getPythonRequestCode(operation, api.info.version, bodyProperties);
        csharpSnippet += getCSharpRequestCode(operation, api.info.version, bodyProperties);

        if (bodyProperties) {
          const writeProperties = Object.entries(bodyProperties).filter(
            (prop) => !prop[1].readOnly
          );

          javaSnippet += getJSONRequestBody(writeProperties);
          pythonSnippet += getJSONRequestBody(writeProperties);
          csharpSnippet += getJSONRequestBody(writeProperties);
        }

        // javaSnippet += getJavaResponseCode(operation);
        // pythonSnippet += getPythonResponseCode(operation);
        // csharpSnippet += getCSharpResponseCode(operation);
      });

    fs.writeFileSync('../example/javaSnippet.txt', javaSnippet);
    fs.writeFileSync('../example/pythonSnippet.txt', pythonSnippet);
    fs.writeFileSync('../example/csharpSnippet.txt', csharpSnippet);
    console.log(javaSnippet);
    console.log(pythonSnippet);
    console.log(csharpSnippet);
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
# The Requests is not a standard Python library.
# Thus, please remember to import it
# by uncomment the next line
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
  const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return ` // ${operationId}
    
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

// TODO: Create response deserialiser model generator for Python
// function getPythonResponseCode(operation) {
//   return ``;
// }

// TODO: Create response deserialiser model generator for C#
// function getCSharpResponseCode(operation) {
//   return ``;
// }
