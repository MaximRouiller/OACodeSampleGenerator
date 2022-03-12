const expect = require('chai').expect;
const index = require('../index.js');

const SPEC_URL =
  'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

//getResponseCodeModel returns array with index:
//0 --> Java response model
//1 --> Python response model
//2 --> C# response model
async function getResponseCodeModel(specURL) {
  const singleOperation = process.argv[2] ? process.argv[3] : 'ResourceGroups_CreateOrUpdate';
  const output = await index(specURL);
  const { apiInfo, generated } = output;

  let javaModel = '';
  let pythonModel = '';
  let csharpModel = '';

  for (const operation of generated) {
    if (singleOperation && operation.operationId !== singleOperation) continue;

    javaModel += operation.javaModel;
    pythonModel += operation.pythonModel;
    csharpModel += operation.csharpModel;
  }
  return [javaModel, pythonModel, csharpModel];
}

it('Checks if spec is split into operations correctly', function () {});

describe('Java response code generation', function () {
  it('Happy path (with args)', function () {
    let model = getResponseCodeModel(SPEC_URL);
    model.then(function (result) {
      expect(result[0]).not.to.equal(null);
      expect(result[0]).not.to.equal('');
      expect(result[0]).to.be.an('string');
      expect(result[0].length).to.be.at.least(300);
    });
  });

  it('Invalid args', function () {
    let model = getResponseCodeModel('WRONG URL');
    model.then(function (result) {
      expect(result[0]).to.equal('');
      expect(result[0]).not.to.be.an('string');
      expect(result[0].length).not.to.be.at.least(300);
    });
  });

  it('Null args', function () {
    let model = getResponseCodeModel(null);
    model.then(function (result) {
      expect(result[0]).to.equal('');
      expect(result[0]).not.to.be.an('string');
      expect(result[0].length).not.to.be.at.least(300);
    });
  });
});

describe('Python response code generation', function () {
  it('Happy path (with args)', function () {
    let model = getResponseCodeModel(SPEC_URL);
    model.then(function (result) {
      expect(result[1]).not.to.equal(null);
      expect(result[1]).not.to.equal('');
      expect(result[1]).to.be.an('string');
      expect(result[1].length).to.be.at.least(300);
    });
  });

  it('Invalid args', function () {
    let model = getResponseCodeModel('WRONG URL');
    model.then(function (result) {
      expect(result[1]).to.equal('');
      expect(result[1]).not.to.be.an('string');
      expect(result[1].length).not.to.be.at.least(300);
    });
  });

  it('Null args', function () {
    let model = getResponseCodeModel(null);
    model.then(function (result) {
      expect(result[1]).to.equal('');
      expect(result[1]).not.to.be.an('string');
      expect(result[1].length).not.to.be.at.least(300);
    });
  });
});

describe('C# response code generation', function () {
  it('Happy path (with args)', function () {
    let model = getResponseCodeModel(SPEC_URL);
    model.then(function (result) {
      expect(result[2]).not.to.equal(null);
      expect(result[2]).not.to.equal('');
      expect(result[2]).to.be.an('string');
      expect(result[2].length).to.be.at.least(300);
    });
  });

  it('Invalid args', function () {
    let model = getResponseCodeModel(SPEC_URL);
    model.then(function (result) {
      expect(result[2]).to.equal('');
      expect(result[2]).not.to.be.an('string');
      expect(result[2].length).not.to.be.at.least(300);
    });
  });

  it('Null args', function () {
    let model = getResponseCodeModel(null);
    model.then(function (result) {
      expect(result[2]).to.equal('');
      expect(result[2]).not.to.be.an('string');
      expect(result[2].length).not.to.be.at.least(300);
    });
  });
});
