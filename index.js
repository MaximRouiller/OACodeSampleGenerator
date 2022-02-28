const SwaggerParser = require('@apidevtools/swagger-parser');
const converter = require('swagger2openapi');
const { singular } = require('pluralize');
// const fs = require('fs');

/**
 * The main generator function which is the default export of this module
 *
 * @param {string} api - A Swagger/OpenAPI object, or the file path or url of the specification
 * @returns {object} - The generated output, with API information
 */
module.exports = async (api) => {
  try {
    // Bundle
    api = await SwaggerParser.bundle(api);
    // fs.writeFileSync('./processed-specifications/bundledSpec.json', JSON.stringify(api, null, 2));

    // Convert
    api = (await converter.convertObj(api, {})).openapi;
    // fs.writeFileSync('./processed-specifications/convertedSpec.json', JSON.stringify(api, null, 2));

    // Validate and dereference ('validate' calls 'dereference' internally)
    // https://apitools.dev/swagger-parser/docs/swagger-parser.html#validateapi-options-callback
    api = await SwaggerParser.validate(api);

    // Circular references are not supported by JSON so use the version below instead of the version
    // above to just partially dereference the spec and serialise it as JSON. This will significantly
    // reduce the number of operations whose responses are able to be deserialised with the model
    // generators later on, so only use this version if you need to more easily inspect the JSON.
    // api = await SwaggerParser.validate(api, { dereference: { circular: 'ignore' } });
    // fs.writeFileSync('./processed-specifications/endSpec.json', JSON.stringify(api, null, 2));

    const baseRequestURL = api.servers[0].url;

    const generated = [];

    for (const operation of getOperations(api)) {
      const { operationGroupPath, operationId } = operation;

      const operationOutput = { operationId };

      const requestURL = `${baseRequestURL}${operationGroupPath}?api-version=${api.info.version}`;

      const requestBodyProperties =
        operation.requestBody?.content?.['application/json']?.schema?.properties;

      const hasBody = requestBodyProperties !== undefined;

      operationOutput.javaSnippet = getJavaRequestCode(operation, requestURL, hasBody);
      operationOutput.pythonSnippet = getPythonRequestCode(operation, requestURL, hasBody);
      operationOutput.csharpSnippet = getCSharpRequestCode(operation, requestURL, hasBody);

      if (hasBody) {
        operationOutput.requestBody = getJSONRequestBody(
          operationId,
          Object.entries(requestBodyProperties).filter((prop) => !prop[1].readOnly)
        );
      }

      const responseBodyProperties =
        operation.responses[200]?.content?.['application/json']?.schema?.properties;

      if (responseBodyProperties !== undefined) {
        operationOutput.javaModel = getJavaOrCSharpResponseCode(
          'java',
          operationId,
          Object.entries(responseBodyProperties)
        );
        operationOutput.pythonModel = getPythonResponseCode(
          operationId,
          Object.entries(responseBodyProperties)
        );
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
  const operations = [];
  for (const [operationGroupPath, operationGroup] of Object.entries(spec.paths)) {
    for (const [operationType, operation] of Object.entries(operationGroup)) {
      operations.push({ operationGroupPath, operationType, ...operation });
    }
  }
  return operations;
}

// With HTTPClient for Java 11+ https://openjdk.java.net/groups/net/httpclient/intro.html
// Request is synchronous
function getJavaRequestCode({ operationId, operationType }, requestURL, hasBody) {
  return `// ${operationId}

HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
  .uri(URI.create("${requestURL}"))
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
function getPythonRequestCode({ operationId, operationType }, requestURL, hasBody) {
  return `# ${operationId}

# import requests

headers = {"Content-Type": "application/json"}

response = requests.${operationType}(
  "${requestURL}",
  headers=headers${hasBody ? ', files={"file": open("body.json", "r")}' : ''})

print(response.status_code)
print(response.content)

`;
}

// With HTTPClient for C# https://docs.microsoft.com/en-us/dotnet/api/system.net.http.httpclient?view=net-6.0
// Request is Asynchronous
function getCSharpRequestCode({ operationId, operationType }, requestURL, hasBody) {
  return `// ${operationId}

HttpClient client = new HttpClient();
HttpRequestMessage req = new HttpRequestMessage(HttpMethod.${capitalise(
    operationType
  )}, "${requestURL}");
req.Content = new StringContent(${
    hasBody ? 'System.IO.File.ReadAllText(@"body.json"), Encoding.UTF8, "application/json"' : ''
  });

HttpResponseMessage httpResponseMessage = await client.SendAsync(req);
httpResponseMessage.EnsureSuccessStatusCode();
HttpContent httpContent = httpResponseMessage.Content;
string responseString = await httpContent.ReadAsStringAsync();
string responseStatus = httpResponseMessage.StatusCode.ToString();
Console.WriteLine(responseString);
Console.WriteLine(responseStatus);

`;
}

// JSON request body generator
function getJSONRequestBody(key, properties, isRootClass = true) {
  return `${isRootClass ? `${key} - body.json:\n\n{` : ''}${properties
    .filter((prop) => !prop[1].readOnly)
    .map((prop) => {
      let type = prop[1].type;
      if (type === 'boolean') {
        defaultValue = 'true';
      } else if (type === 'integer') {
        defaultValue = '0';
      } else if (type === 'string') {
        defaultValue = '""';
      } else if (type === 'object') {
        defaultValue = '{}';
      } else if (type === 'array') {
        defaultValue = `[${
          prop[1].items.type !== 'string' ? `${getArrayElementObject(prop)}]` : '""]'
        }`;
      } else {
        defaultValue = `${getObject(prop)}`;
      }
      return `${
        defaultValue === '{\n}' || defaultValue === '{  \n  }'
          ? ''
          : `
  "${prop[0]}": ${defaultValue}`
      }`;
    })
    .filter((prop) => prop !== '')
    .join(',')}
}${isRootClass ? '\n\n' : ''}`;

  function getObject(prop) {
    if (!prop[1].type) {
      return (
        '{' + indentString(getJSONRequestBody(prop[0], Object.entries(prop[1].properties), false))
      );
    }
  }

  function getArrayElementObject(prop) {
    if (prop[1].type === 'array' && prop[1].items.properties && prop[0] !== key) {
      return (
        '{' +
        indentString(getJSONRequestBody(prop[0], Object.entries(prop[1].items.properties), false))
      );
    }
  }
}

// Response deserialiser model generator for both Java and C# (because these languages are very similar)
function getJavaOrCSharpResponseCode(language, className, properties) {
  return `${getClasses()}${getArrayElementClasses()}class ${className} {${getFields()}
}

`;

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
      .map((prop) =>
        getJavaOrCSharpResponseCode(
          language,
          capitalise(prop[0]),
          Object.entries(prop[1].properties)
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
      .map((prop) =>
        getJavaOrCSharpResponseCode(
          language,
          capitalise(singular(prop[0])),
          Object.entries(prop[1].items.properties)
        )
      )
      .join('');
  }
}

// Response deserialiser model generator for Python
function getPythonResponseCode(className, properties) {
  return `${getClasses()}${getArrayElementClasses()}class ${className}:${getFields()}

`;

  function getFields() {
    return properties
      .map((prop) => {
        let type = prop[1].type;
        if (type === 'integer') {
          defaultValue = 0;
        } else if (type === 'string') {
          defaultValue = '""';
        } else if (type === 'object') {
          defaultValue = '{}';
        } else if (type === 'array') {
          defaultValue = `[${
            prop[1].items.type !== 'string'
              ? `_${capitalise(singular(prop[0]))}()]
\t${capitalise(singular(prop[0]))} = _${capitalise(singular(prop[0]))}`
              : '""]'
          }`;
        } else {
          defaultValue = `_${capitalise(prop[0])}()\n\t${capitalise(prop[0])} = _${capitalise(
            prop[0]
          )}`;
        }
        let variableName = prop[0];
        return `
\t${variableName} = ${defaultValue}`;
      })
      .join('');
  }

  function getClasses() {
    return properties
      .filter((prop) => !prop[1].type)
      .map((prop) =>
        getPythonResponseCode('_' + capitalise(prop[0]), Object.entries(prop[1].properties))
      )
      .join('');
  }

  function getArrayElementClasses() {
    return properties
      .filter(
        (prop) =>
          prop[1].type === 'array' &&
          prop[1].items.properties &&
          '_' + capitalise(singular(prop[0])) !== className // let's just say circular refs and recursion aren't a good mix
      )
      .map((prop) =>
        getPythonResponseCode(
          '_' + capitalise(singular(prop[0])),
          Object.entries(prop[1].items.properties)
        )
      )
      .join('');
  }
}

// Utilities

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// https://www.30secondsofcode.org/js/s/indent-string
const indentString = (str, count = 2, indent = ' ') => str.replace(/^/gm, indent.repeat(count));

// Exports

exports.getJavaRequestCode = getJavaRequestCode;
exports.getPythonRequestCode = getPythonRequestCode;
exports.getCSharpRequestCode = getCSharpRequestCode;
exports.getOperations = getOperations;
