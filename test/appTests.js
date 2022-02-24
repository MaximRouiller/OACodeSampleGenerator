const expect = require('chai').expect;
const index = require('../index.js');

it('Checks if spec is split into operations correctly', function () {});

describe('Tests for request code snippet', function () {
  const operation = { operationGroupPath, operationId, operationType };
  operation.operationGroupPath = "";
  operation.operationId = "";
  operation.operationType = "";
  const apiversion = "";
  const hasBody = "";

  it('Checks if java request code is generated', function () {
    let generatedJavaCode = index.getJavaRequestCode(operation, apiversion, hasBody);
    expect(generatedJavaCode).to.not.be.empty;
  });

  it('Checks if python request code is generated', function () {
    let generatedPythonCode = index.getPythonRequestCode(operation, apiversion, hasBody);
  });

  it('Checks if C# request code is generated', function () {
    let generatedCSharpCode = index.getCSharpRequestCode(operation, apiversion, hasBody);
  });
});

describe('Tests for deserialised models', function () {
  it('Test for Java response model', function () {});

  it('Test for Python response model', function () {});

  it('Test for C# response model', function () {});
});

describe('Tests for utility functions', function () {});
