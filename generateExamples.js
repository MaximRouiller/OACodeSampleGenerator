const fs = require('fs');
const generator = require('.');

(async () => {
  // Optionally pass in a specification URL as a third command line argument -> node app url
  // This will get snippets/models for all operations in spec

  const specURL =
    process.argv[2] ||
    'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

  // Optionally pass in a single operation ID as a fourth command line argument -> node app url operationId
  // This will get snippets/models for just that one operation

  const singleOperation = process.argv[2] ? process.argv[3] : 'ResourceGroups_CreateOrUpdate';
  // const singleOperation = 'Deployments_CreateOrUpdateAtScope'; // this is a better one to test the model generators with
  // const singleOperation = ''; // to get snippets/models for all operations in spec

  try {
    const output = await generator(specURL);
    const { apiInfo, generated } = output;

    console.log(`API name: ${apiInfo.title}, Version: ${apiInfo.version}`);

    let javaSnippet = '';
    let pythonSnippet = '';
    let csharpSnippet = '';

    let requestBody = '';

    let javaModel = '';
    let pythonModel = '';
    let csharpModel = '';

    for (const operation of generated) {
      if (singleOperation && operation.operationId !== singleOperation) continue;

      javaSnippet += operation.javaSnippet;
      pythonSnippet += operation.pythonSnippet;
      csharpSnippet += operation.csharpSnippet;

      requestBody += operation.requestBody || '';

      javaModel += operation.javaModel || '';
      pythonModel += operation.pythonModel || '';
      csharpModel += operation.csharpModel || '';
    }

    fs.writeFileSync('./example/javaSnippet.txt', javaSnippet);
    fs.writeFileSync('./example/pythonSnippet.txt', pythonSnippet);
    fs.writeFileSync('./example/csharpSnippet.txt', csharpSnippet);

    fs.writeFileSync('./example/requestBody.txt', requestBody);

    fs.writeFileSync('./example/javaModel.java', javaModel);
    fs.writeFileSync('./example/pythonModel.py', pythonModel);
    fs.writeFileSync('./example/csharpModel.cs', csharpModel);

    if (singleOperation) {
      const operation = generated.find((op) => op.operationId === singleOperation);
      fs.writeFileSync('./example/samples.json', JSON.stringify(operation, null, 2));
    }

    fs.writeFileSync('./example/output.json', JSON.stringify(output, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
