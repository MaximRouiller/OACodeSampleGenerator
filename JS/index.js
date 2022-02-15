const SwaggerParser = require('@apidevtools/swagger-parser');
const converter = require('swagger2openapi');
const { singular } = require('pluralize');
// const fs = require('fs');

module.exports = async (specURL) => {
  try {
    // Bundle
    let api = await SwaggerParser.bundle(specURL);
    // fs.writeFileSync('../example/bundledSpec.json', JSON.stringify(api, null, 2));

    // Convert
    api = (await converter.convertObj(api, {})).openapi;
    // fs.writeFileSync('../example/convertedSpec.json', JSON.stringify(api, null, 2));

    // Validate and dereference ('validate' calls 'dereference' internally)
    // https://apitools.dev/swagger-parser/docs/swagger-parser.html#validateapi-options-callback
    api = await SwaggerParser.validate(api);

    // Circular references are not supported by JSON so use the version below instead of the version
    // above to just partially dereference the spec and serialise it as JSON. This will significantly
    // reduce the number of operations whose responses are able to be deserialised with the model
    // generators later on, so only use this version if you need to more easily inspect the JSON.
    // api = await SwaggerParser.validate(api, { dereference: { circular: 'ignore' } });
    // fs.writeFileSync('../example/endSpec.json', JSON.stringify(api, null, 2));

    const generated = [];

    for (const operation of getOperations(api)) {
      const operationId = operation.operationId;

      const operationOutput = { operationId };

      const requestBodyProperties =
        operation.requestBody?.content['application/json'].schema.properties;

      const hasBody = requestBodyProperties !== undefined;

      operationOutput.javaSnippet = getJavaRequestCode(operation, api.info.version, hasBody);
      operationOutput.pythonSnippet = getPythonRequestCode(operation, api.info.version, hasBody);
      operationOutput.csharpSnippet = getCSharpRequestCode(operation, api.info.version, hasBody);

      if (hasBody) {
        operationOutput.requestBody = getJSONRequestBody(
          operationId,
          Object.entries(requestBodyProperties).filter((prop) => !prop[1].readOnly)
        );
      }

      const responseBodyProperties =
        operation.responses[200]?.content?.['application/json'].schema.properties;

      if (responseBodyProperties !== undefined) {
        operationOutput.javaModel = getJavaOrCSharpResponseCode(
          'java',
          operationId,
          Object.entries(responseBodyProperties)
        );
        // operationOutput.pythonModel = getPythonResponseCode(
        //   operationId,
        //   Object.entries(responseBodyProperties)
        // );
        operationOutput.csharpModel = getJavaOrCSharpResponseCode(
          'csharp',
          operationId,
          Object.entries(responseBodyProperties)
        );
      }

      generated.push(operationOutput);
    }

    return { apiInfo: api.info, generated };
  } catch (err) {
    console.error(err);
  }
};

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

// Response deserialiser model generator for both Java and C# (because these languages are very similar)
function getJavaOrCSharpResponseCode(language, className, properties, isRootClass = true) {
  return `class ${className} {${getFields()}${getClasses()}${getArrayElementClasses()}
}${isRootClass ? '\n\n' : ''}`;

  function getFields() {
    return properties
      .map((prop) => {
        let type = prop[1].type;
        if (type === 'array') {
          const items = prop[1].items;
          type = `List<${
            items.properties !== undefined ? capitalise(singular(prop[0])) : capitalise(items.type)
          }>`;
        } else if (type === undefined) {
          type = capitalise(prop[0]);
        } else {
          type = capitalise(type);
        }
        let variableName = prop[0];
        // 'namespace' is a C# keyword
        if (variableName === 'namespace' && language === 'csharp') variableName = '@namespace';
        return `
  ${type} ${variableName};`;
      })
      .join('');
  }

  function getClasses() {
    return properties
      .filter((prop) => !prop[1].type)
      .map(
        (prop) =>
          '\n\n' +
          indentString(
            getJavaOrCSharpResponseCode(
              language,
              capitalise(prop[0]),
              Object.entries(prop[1].properties),
              false
            )
          )
      )
      .join('');
  }

  function getArrayElementClasses() {
    return properties
      .filter(
        (prop) =>
          prop[1].type === 'array' &&
          prop[1].items.properties &&
          capitalise(singular(prop[0])) !== className // let's just say circular refs and recursion aren't a good mix
      )
      .map(
        (prop) =>
          '\n\n' +
          indentString(
            getJavaOrCSharpResponseCode(
              language,
              capitalise(singular(prop[0])),
              Object.entries(prop[1].items.properties),
              false
            )
          )
      )
      .join('');
  }
}

// TODO: Create response deserialiser model generator for Python
// function getPythonResponseCode(operationId, properties) {
//   return ``;
// }

// Utilities

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// https://www.30secondsofcode.org/js/s/indent-string
const indentString = (str, count = 2, indent = ' ') => str.replace(/^/gm, indent.repeat(count));
