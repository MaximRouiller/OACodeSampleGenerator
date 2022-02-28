const fs = require('fs');
const generator = require('.');

(async () => {
  // Optionally pass in a specification URL/path as a third command line argument -> node generateExamples spec
  // This will get snippets/models for all operations in spec

  const spec =
    process.argv[2] ||
    'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

  // Optionally pass in a single operation ID as a fourth command line argument -> node generateExamples spec operationId
  // This will get snippets/models for just that one operation

  const singleOperation = process.argv[2] ? process.argv[3] : 'ResourceGroups_CreateOrUpdate';
  // const singleOperation = 'Deployments_CreateOrUpdateAtScope'; // this is a better one to test the model generators with
  // const singleOperation = ''; // to get snippets/models for all operations in spec

  try {
    const output = await generator(spec, singleOperation);
    const { apiInfo, generated } = output;

    console.log(`API name: ${apiInfo.title}, Version: ${apiInfo.version}`);

    fs.writeFileSync('./example/javaSnippet.txt', getAllSamples('javaSnippet'));
    fs.writeFileSync('./example/pythonSnippet.txt', getAllSamples('pythonSnippet'));
    fs.writeFileSync('./example/csharpSnippet.txt', getAllSamples('csharpSnippet'));

    fs.writeFileSync('./example/requestBody.txt', getAllSamples('requestBody'));

    fs.writeFileSync('./example/javaModel.java', getAllSamples('javaModel'));
    fs.writeFileSync('./example/pythonModel.py', getAllSamples('pythonModel'));
    fs.writeFileSync('./example/csharpModel.cs', getAllSamples('csharpModel'));

    fs.writeFileSync('./example/output.json', JSON.stringify(output, null, 2));

    function getAllSamples(sample) {
      return generated.map((operation) => operation[sample]).join('');
    }
  } catch (err) {
    console.error(err);
  }
})();
