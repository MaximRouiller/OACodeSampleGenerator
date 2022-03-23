const SwaggerParser = require('@apidevtools/swagger-parser');
const { singular } = require('pluralize');

/**
 * The main generator function which is the default export of this module
 *
 * @param {object|string} spec - A Swagger/OpenAPI object, or the file path or url of the specification
 * @param {string} singleOperation - An operation ID, to get samples for just that one operation
 * @returns {object} - The validated/dereferenced API and the generated output
 */
module.exports = async (spec, singleOperation = '') => {
  // Validate and dereference ('validate' calls 'dereference' internally)
  // https://apitools.dev/swagger-parser/docs/swagger-parser.html#validateapi-options-callback
  const api = await SwaggerParser.validate(spec);

  const isSwagger = api.swagger; // else is OpenAPI
  const baseRequestURL = isSwagger ? 'https://' + api.host : api.servers[0].url;
  const apiVersion = api.info.version;

  const generated = [];

  const operations = singleOperation
    ? getOperations(api).filter((op) => op.operationId === singleOperation)
    : getOperations(api);

  for (const operation of operations) {
    const { operationGroupPath, operationId } = operation;

    const operationOutput = { operationId };

    const requestURL = `${baseRequestURL}${operationGroupPath}?api-version=${apiVersion}`;

    const requestBodySchema = isSwagger
      ? operation.parameters?.find((parameter) => parameter.in === 'body')?.schema
      : operation.requestBody?.content?.['application/json']?.schema;

    const hasBody = requestBodySchema !== undefined && hasProperties(requestBodySchema);

    operationOutput.javaSnippet = getJavaRequestCode(operation, requestURL, hasBody);
    operationOutput.pythonSnippet = getPythonRequestCode(operation, requestURL, hasBody);
    operationOutput.csharpSnippet = getCSharpRequestCode(operation, requestURL, hasBody);

    if (hasBody) {
      operationOutput.requestBody = getJSONRequestBody(
        getAllProperties(requestBodySchema).filter((prop) => !prop[1].readOnly)
      );
    }

    const responseBodySchema = isSwagger
      ? operation.responses?.[200]?.schema
      : operation.responses?.[200]?.content?.['application/json']?.schema;

    if (responseBodySchema !== undefined && hasProperties(responseBodySchema)) {
      const properties = getAllProperties(responseBodySchema);
      operationOutput.javaModel = getJavaOrCSharpResponseCode('java', operationId, properties);
      operationOutput.pythonModel = getPythonResponseCode(operationId, properties);
      operationOutput.csharpModel = getJavaOrCSharpResponseCode('csharp', operationId, properties);
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
      if (!operation.operationId) continue;
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
function getJSONRequestBody(properties, key = '') {
  return JSON.stringify(
    JSON.parse(
      '{' +
        properties
          .filter((prop) => prop[1].type || prop[1].items || hasProperties(prop[1]))
          .map((prop) => {
            const type = prop[1].type;
            if (typeDefaults[type]) {
              defaultValue = typeDefaults[type];
            } else if (type === 'array') {
              const items = prop[1].items;
              defaultValue = `[${
                (!typeDefaults[items.type] || items.type === 'object') && prop[0] !== key
                  ? getJSONRequestBody(getAllProperties(items), prop[0])
                  : typeDefaults[items.type] || '{}'
              }]`;
            } else {
              defaultValue = getJSONRequestBody(getAllProperties(prop[1]), prop[0]);
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
        const initialType = prop[1].type;
        if (typeDefaults[initialType]) {
          type = capitalise(initialType);
        } else if (initialType === 'array') {
          const items = prop[1].items;
          type = `List<${
            hasProperties(items) ? capitalise(singular(prop[0])) : capitalise(items.type)
          }>`;
        } else {
          type = capitalise(prop[0]);
        }
        const variableName =
          prop[0] === 'namespace' && language === 'csharp' ? '@namespace' : prop[0];
        // 'namespace' is a C# keyword
        return `\n  ${type} ${variableName};`;
      })
      .join('');
  }

  function getClasses() {
    return properties
      .filter((prop) => hasProperties(prop[1]) && !prop[1].type)
      .map((prop) =>
        getJavaOrCSharpResponseCode(language, capitalise(prop[0]), getAllProperties(prop[1]))
      )
      .join('');
  }

  function getArrayElementClasses() {
    return properties
      .filter(
        (prop) =>
          prop[1].type === 'array' &&
          hasProperties(prop[1].items) &&
          capitalise(singular(prop[0])) !== className // circular refs and recursion aren't a good mix
      )
      .map((prop) =>
        getJavaOrCSharpResponseCode(
          language,
          capitalise(singular(prop[0])),
          getAllProperties(prop[1].items)
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
          const items = prop[1].items;
          const name = capitalise(singular(prop[0]));
          defaultValue = `[${
            !typeDefaults[items.type] || items.type === 'object'
              ? `_${name}()]\n\t${name} = _${name}`
              : `${typeDefaults[items.type]}]`
          }`;
        } else {
          const name = capitalise(prop[0]);
          defaultValue = `_${name}()\n\t${name} = _${name}`;
        }
        return `\n\t${prop[0]} = ${defaultValue}`;
      })
      .join('');
  }

  function getClasses() {
    return properties
      .filter((prop) => hasProperties(prop[1]) && !prop[1].type)
      .map((prop) => getPythonResponseCode('_' + capitalise(prop[0]), getAllProperties(prop[1])))
      .join('');
  }

  function getArrayElementClasses() {
    return properties
      .filter(
        (prop) =>
          prop[1].type === 'array' &&
          hasProperties(prop[1].items) &&
          '_' + capitalise(singular(prop[0])) !== className // circular refs and recursion aren't a good mix
      )
      .map((prop) =>
        getPythonResponseCode('_' + capitalise(singular(prop[0])), getAllProperties(prop[1].items))
      )
      .join('');
  }
}

// Utilities

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// https://swagger.io/docs/specification/data-models/data-types/
// Does not include default for array type
const typeDefaults = { boolean: 'true', integer: '0', number: '0', string: '""', object: '{}' };

const getAllProperties = (obj) =>
  Object.entries({
    ...obj.properties,
    ...(obj.allOf ? Object.fromEntries(getAllProperties(obj.allOf[0])) : {}),
  });

const hasProperties = (obj) => getAllProperties(obj).length !== 0;
