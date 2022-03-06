const SwaggerParser = require('@apidevtools/swagger-parser');
const { singular } = require('pluralize');

/**
 * The main generator function which is the default export of this module
 * Note: Fully dereference the spec (that is to dereference circular references as well) to make sure
 * that all of the request bodies and response models are able to be generated. Only partially
 * dereference the spec if you need to serialise the api as JSON in order to more easily inspect it.
 *
 * @param {string} api - A Swagger/OpenAPI object, or the file path or url of the specification
 * @param {boolean} fullyDereference - If false, api will be limited but will be JSON-serialisable
 * @param {string} singleOperation - An operation ID, to get samples for just that one operation
 * @returns {object} - The generated output, with API information
 */
module.exports = async (api, fullyDereference = true, singleOperation = '') => {
  // Validate and dereference ('validate' calls 'dereference' internally)
  // https://apitools.dev/swagger-parser/docs/swagger-parser.html#validateapi-options-callback
  api = await SwaggerParser.validate(api, {
    dereference: { circular: fullyDereference || 'ignore' },
  });

  const isSwagger = api.swagger; // else is OpenAPI
  const baseRequestURL = isSwagger ? 'https://' + api.host : api.servers[0].url;
  const apiVersion = api.info.version;

  const generated = [];

  let operations = getOperations(api);
  if (singleOperation) operations = operations.filter((op) => op.operationId === singleOperation);

  for (const operation of operations) {
    const { operationGroupPath, operationId } = operation;

    const operationOutput = { operationId };

    const requestURL = `${baseRequestURL}${operationGroupPath}?api-version=${apiVersion}`;

    const requestBodyProperties = isSwagger
      ? operation.parameters?.find((parameter) => parameter.in === 'body')?.schema?.properties
      : operation.requestBody?.content?.['application/json']?.schema?.properties;

    const hasBody = requestBodyProperties !== undefined;

    operationOutput.javaSnippet = getJavaRequestCode(operation, requestURL, hasBody);
    operationOutput.pythonSnippet = getPythonRequestCode(operation, requestURL, hasBody);
    operationOutput.csharpSnippet = getCSharpRequestCode(operation, requestURL, hasBody);

    if (hasBody) {
      operationOutput.requestBody = getJSONRequestBody(
        Object.entries(requestBodyProperties).filter((prop) => !prop[1].readOnly)
      );
    }

    const responseBodyProperties = isSwagger
      ? operation.responses?.[200]?.schema?.properties
      : operation.responses?.[200]?.content?.['application/json']?.schema?.properties;

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

  return { api, generated };
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
function getJSONRequestBody(properties) {
  return JSON.stringify(
    JSON.parse(
      '{' +
        properties
          .filter((prop) => prop[1].type || prop[1].items || prop[1].properties)
          .map((prop) => {
            const type = prop[1].type;
            if (typeDefaults[type]) {
              defaultValue = typeDefaults[type];
            } else if (type === 'array') {
              defaultValue = `[${
                typeDefaults[prop[1].items.type] ||
                getJSONRequestBody(Object.entries(prop[1].items.properties))
              }]`;
            } else {
              defaultValue = getJSONRequestBody(Object.entries(prop[1].properties));
            }
            return `"${prop[0]}": ${defaultValue}`;
          })
          .join(',') +
        '}'
    ),
    null,
    2
  );
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
        if (typeDefaults[type]) {
          type = capitalise(type);
        } else if (type === 'array') {
          const items = prop[1].items;
          type = `List<${!items.type ? capitalise(singular(prop[0])) : capitalise(items.type)}>`;
        } else {
          type = capitalise(prop[0]);
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
      .filter((prop) => prop[1].properties)
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
        const type = prop[1].type;
        if (typeDefaults[type]) {
          defaultValue = typeDefaults[type];
        } else if (type === 'array') {
          defaultValue = `[${
            !typeDefaults[prop[1].items.type]
              ? `_${capitalise(singular(prop[0]))}()]
\t${capitalise(singular(prop[0]))} = _${capitalise(singular(prop[0]))}`
              : `${typeDefaults[prop[1].items.type]}]`
          }`;
        } else {
          defaultValue = `_${capitalise(prop[0])}()\n\t${capitalise(prop[0])} = _${capitalise(
            prop[0]
          )}`;
        }
        return `
\t${prop[0]} = ${defaultValue}`;
      })
      .join('');
  }

  function getClasses() {
    return properties
      .filter((prop) => prop[1].properties)
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

// https://swagger.io/docs/specification/data-models/data-types/
// Does not include default for array type
const typeDefaults = { boolean: 'true', integer: '0', number: '0', string: '""', object: '{}' };

// Exports

exports.getJavaRequestCode = getJavaRequestCode;
exports.getPythonRequestCode = getPythonRequestCode;
exports.getCSharpRequestCode = getCSharpRequestCode;
exports.getOperations = getOperations;
