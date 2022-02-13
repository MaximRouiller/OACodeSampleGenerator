const fs = require('fs');
const generator = require('./index');

(async () => {
  const specURL =
    'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

  const singleOperation = 'ResourceGroups_CreateOrUpdate';
  // const singleOperation = 'Deployments_CreateOrUpdateAtScope'; // this is a better one to test the model generators with
  // const singleOperation = ''; // to get snippets/models for all operations in spec

  try {
    const {
      javaSnippet,
      pythonSnippet,
      csharpSnippet,
      requestBody,
      javaModel,
      // pythonModel,
      // csharpModel,
    } = await generator(specURL, singleOperation);

    fs.writeFileSync('../example/javaSnippet.txt', javaSnippet);
    fs.writeFileSync('../example/pythonSnippet.txt', pythonSnippet);
    fs.writeFileSync('../example/csharpSnippet.txt', csharpSnippet);

    fs.writeFileSync('../example/requestBody.txt', requestBody);

    fs.writeFileSync('../example/javaModel.txt', javaModel);
    // fs.writeFileSync('../example/pythonModel.txt', pythonModel);
    // fs.writeFileSync('../example/csharpModel.txt', csharpModel);
  } catch (err) {
    console.error(err);
  }
})();
