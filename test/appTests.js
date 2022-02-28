const expect = require('chai').expect;
const index = require('../index.js');

it('Checks if spec is split into operations correctly', function () {
    
});

describe('Java request code generation', function () {

    const specUrl = '';

    before(function() {

        (async () => {

            const specURL =
            process.argv[2] ||
            'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

          const singleOperation = process.argv[2] ? process.argv[3] : 'ResourceGroups_CreateOrUpdate';
          
          try {
            const output = await generator(specURL);
            const { apiInfo, generated } = output;
        
            console.log(`API name: ${apiInfo.title}, Version: ${apiInfo.version}`);
        
            let javaSnippet = '';
            let pythonSnippet = '';
            let csharpSnippet = '';
    
            for (const operation of generated) {
              if (singleOperation && operation.operationId !== singleOperation) continue;
        
              javaSnippet += operation.javaSnippet;
              pythonSnippet += operation.pythonSnippet;
              csharpSnippet += operation.csharpSnippet;
              console.log(javaSnippet);
            }
            console.log(javaSnippet);
        } catch (err) {
            console.log(err);
        }

        });
    });

  it('Happy path (with args)', function () {});

  it('Invalid args', function () {});

  it('Null args', function () {});

});

describe('Python request code generation', function () {
  it('Happy path (with args)', function () {});

  it('Invalid args', function () {});

  it('Null args', function () {});
});

describe('C# request code generation', function () {
  it('Happy path (with args)', function () {});

  it('Invalid args', function () {});

  it('Null args', function () {});
});

describe('Tests for deserialised models', function () {
  it('Test for Java response model', function () {});

  it('Test for Python response model', function () {});

  it('Test for C# response model', function () {});
});

describe('Tests for utility functions', function () {
  it('Capitalise utility', function () {
    expect(index.capitalise('post')).to.equal('Post');
  });
});
