const fs = require('fs');
const generator = require('.');

(async () => {
  // Optionally pass in a specification URL/path as a third command line argument -> node generateExamples spec
  // This will get snippets/models for all operations in spec
  const spec =
    process.argv[2] ||
    'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

  // Optionally pass in a boolean as a fourth command line argument -> node generateExamples spec boolean
  // If true, api may not be serialisable as JSON because of circular references
  const fullyDereference = process.argv[2] ? process.argv[3] === 'true' : false;

  // Optionally pass in a single operation ID as a fifth command line argument -> node generateExamples spec operationId
  // This will get snippets/models for just that one operation
  const singleOperation = process.argv[3] ? process.argv[4] : 'ResourceGroups_CreateOrUpdate';
  // 'Deployments_CreateOrUpdateAtScope' is a better one to test the body/model generators with (and needs full dereference to work)

  try {
    const { api, generated } = await generator(spec, fullyDereference, singleOperation);

    fs.writeFileSync('./example/api.json', JSON.stringify(api, null, 2));

    console.log(`API name: ${api.info.title}, Version: ${api.info.version}`);

    const getAllSamples = (sample) => generated.map((operation) => operation[sample]).join('');

    fs.writeFileSync('./example/javaSnippet.txt', getAllSamples('javaSnippet'));
    fs.writeFileSync('./example/pythonSnippet.txt', getAllSamples('pythonSnippet'));
    fs.writeFileSync('./example/csharpSnippet.txt', getAllSamples('csharpSnippet'));

    fs.writeFileSync('./example/requestBody.json', getAllSamples('requestBody'));

    fs.writeFileSync('./example/javaModel.java', getAllSamples('javaModel'));
    fs.writeFileSync('./example/pythonModel.py', getAllSamples('pythonModel'));
    fs.writeFileSync('./example/csharpModel.cs', getAllSamples('csharpModel'));

    fs.writeFileSync(
      './example/output.json',
      JSON.stringify({ apiInfo: api.info, generated }, null, 2)
    );
  } catch (err) {
    console.error(err);
  }
})();
