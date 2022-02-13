const fs = require('fs');
const generator = require('./index');

(async () => {
  const specURL =
    'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

  const singleOperation = 'ResourceGroups_CreateOrUpdate';
  // const singleOperation = 'Deployments_CreateOrUpdateAtScope'; // this is a better one to test the model generators with
  // const singleOperation = ''; // to get snippets/models for all operations in spec

  try {
    const generated = await generator(specURL, singleOperation);

    fs.writeFileSync('../example/javaSnippet.txt', generated.javaSnippet);
    fs.writeFileSync('../example/pythonSnippet.txt', generated.pythonSnippet);
    fs.writeFileSync('../example/csharpSnippet.txt', generated.csharpSnippet);

    fs.writeFileSync('../example/requestBody.txt', generated.requestBody);

    fs.writeFileSync('../example/javaModel.txt', generated.javaModel);
    // fs.writeFileSync('../example/pythonModel.txt', generated.pythonModel);
    // fs.writeFileSync('../example/csharpModel.txt', generated.csharpModel);

    fs.writeFileSync('../example/snippetsAndModels.json', JSON.stringify(generated, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
