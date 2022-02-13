const fs = require('fs');
const generator = require('./index');

(async () => {
  const specURL =
    'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

  const singleOperation = 'ResourceGroups_CreateOrUpdate';
  // const singleOperation = 'Deployments_CreateOrUpdateAtScope'; // this is a better one to test the model generators with
  // const singleOperation = ''; // to get snippets/models for all operations in spec

  try {
    const generated = await generator(specURL);

    if (singleOperation) {
      const operation = generated.find((op) => op.operationId === singleOperation);

      fs.writeFileSync('../example/javaSnippet.txt', operation.javaSnippet);
      fs.writeFileSync('../example/pythonSnippet.txt', operation.pythonSnippet);
      fs.writeFileSync('../example/csharpSnippet.txt', operation.csharpSnippet);

      fs.writeFileSync('../example/requestBody.txt', operation.requestBody);

      fs.writeFileSync('../example/javaModel.java', operation.javaModel);
      // fs.writeFileSync('../example/pythonModel.py', operation.pythonModel);
      fs.writeFileSync('../example/csharpModel.cs', operation.csharpModel);

      fs.writeFileSync('../example/snippetsAndModels.json', JSON.stringify(operation, null, 2));
    } else {
      fs.writeFileSync('../example/snippetsAndModels.json', JSON.stringify(generated, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
})();
