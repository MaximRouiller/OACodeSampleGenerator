# OACodeSampleGenerator

Generate request snippets, a request body, and response models for each operation in a given Swagger/OpenAPI specification.

Currently generated: Java, Python, C#

Part of the purpose for our team of this package is to be able to generate code samples for the Azure REST API and create a statically-generated site which can show the samples. This can be found at [this repository](https://github.com/ArchawinWongkittiruk/azure-rest-api-code-samples).

This package has only been tested on Node.js v14+. 

## Installation

Install using [npm](https://docs.npmjs.com/about-npm/):

```bash
npm install oacodesamplegenerator
```

## Example Usage

```javascript
const generator = require('oacodesamplegenerator');

const specURL =
  'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

(async () => {
  // To generate samples for every operation in the spec
  try {
    const { generated } = await generator(specURL);

    console.log(`Samples generated for:\n${generated.map((op) => op.operationId).join('\n')}\n`);
  } catch (err) {
    console.error(err);
  }

  // To generate samples for just one operation in the spec
  try {
    const singleOperation = 'ResourceGroups_CreateOrUpdate';
    const { generated } = await generator(specURL, singleOperation); // See example/generated.json
    const operationSamples = generated[0];
    // This can also alternatively be done like such:
    // const operationSamples = (await generator(specURL)).generated.find(
    //   (op) => op.operationId === singleOperation
    // );

    [
      'javaSnippet',
      'pythonSnippet',
      'csharpSnippet',
      'requestBody',
      'javaModel',
      'pythonModel',
      'csharpModel',
    ].forEach((sample) => {
      console.log('----------------------------------------------------------\n\n');
      console.log(`${singleOperation} - ${sample}:\n\n${operationSamples[sample]}`);
    });
  } catch (err) {
    console.error(err);
  }
})();
```
