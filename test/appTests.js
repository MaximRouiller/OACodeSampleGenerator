const expect = require('chai').expect;
const index = require('../index.js');

const SPEC_URL =
  'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

//getRequestCodeSnippet returns array with index:
//0 --> Java request snippet
//1 --> Python request snippet
//2 --> C# request snippet
async function getRequestCodeSnippet(specURL) {
  const singleOperation = process.argv[2] ? process.argv[3] : 'ResourceGroups_CreateOrUpdate';
  const output = await index(specURL);
  const { apiInfo, generated } = output;

  let javaSnippet = '';
  let pythonSnippet = '';
  let csharpSnippet = '';

  let requestBody = '';

  for (const operation of generated) {
    if (singleOperation && operation.operationId !== singleOperation) continue;

    javaSnippet += operation.javaSnippet;
    pythonSnippet += operation.pythonSnippet;
    csharpSnippet += operation.csharpSnippet;

    requestBody += operation.requestBody || '';
  }
  return [javaSnippet, pythonSnippet, csharpSnippet];
}

it('Checks if spec is split into operations correctly', function () {});

describe('Java request code generation', function () {

  it('Happy path (with args)', function () {
    let snippet = getRequestCodeSnippet(SPEC_URL)
    snippet.then(function(result) {
        expect(result[0]).not.to.equal(null);
        expect(result[0]).not.to.equal('');
        expect(result[0]).to.be.an('string');
        expect(result[0].length).to.be.at.least(300);
    })  
  });

  it('Invalid args', function () {
    let snippet = getRequestCodeSnippet("WRONG URL");
    snippet.then(function(result) {
        expect(result[0]).to.equal('');
        expect(result[0]).not.to.be.an('string');
        expect(result[0].length).not.to.be.at.least(300);
    })  
  });

  it('Null args', function () {
    let snippet = getRequestCodeSnippet(null)
    snippet.then(function(result) {
        expect(result[0]).to.equal('');
        expect(result[0]).not.to.be.an('string');
        expect(result[0].length).not.to.be.at.least(300);
    })
  });
});

describe('Python request code generation', function () {
  it('Happy path (with args)', function () {
    let snippet = getRequestCodeSnippet(SPEC_URL)
    snippet.then(function(result) {
        expect(result[1]).not.to.equal(null);
        expect(result[1]).not.to.equal('');
        expect(result[1]).to.be.an('string');
        expect(result[1].length).to.be.at.least(300);
    })
  });

  it('Invalid args', function () {
    let snippet = getRequestCodeSnippet("WRONG URL");
    snippet.then(function(result) {
        expect(result[0]).to.equal('');
        expect(result[0]).not.to.be.an('string');
        expect(result[0].length).not.to.be.at.least(300);
    })
  });

  it('Null args', function () {
    let snippet = getRequestCodeSnippet(null)
    snippet.then(function(result) {
        expect(result[0]).to.equal('');
        expect(result[0]).not.to.be.an('string');
        expect(result[0].length).not.to.be.at.least(300);
    })
  });
});

describe('C# request code generation', function () {
  it('Happy path (with args)', function () {
    let snippet = getRequestCodeSnippet(SPEC_URL)
    snippet.then(function(result) {
        expect(result[0]).not.to.equal(null);
        expect(result[0]).not.to.equal('');
        expect(result[0]).to.be.an('string');
        expect(result[0].length).to.be.at.least(300);
    })
  });

  it('Invalid args', function () {
    let snippet = getRequestCodeSnippet(SPEC_URL)
    snippet.then(function(result) {
      expect(result[0]).to.equal('');
      expect(result[0]).not.to.be.an('string');
      expect(result[0].length).not.to.be.at.least(300);
  })
  });

  it('Null args', function () {
    let snippet = getRequestCodeSnippet(null)
    snippet.then(function(result) {
        expect(result[0]).to.equal('');
        expect(result[0]).not.to.be.an('string');
        expect(result[0].length).not.to.be.at.least(300);
    })
  });
});

describe('Tests for deserialised models', function () {
  it('Test for Java response model', function () {});

  it('Test for Python response model', function () {});

  it('Test for C# response model', function () {});
});
