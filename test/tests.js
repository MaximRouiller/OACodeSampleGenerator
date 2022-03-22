const { expect } = require('chai');
const generator = require('..');

const SPEC_URL =
  'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

const SINGLE_OPERATION = 'ResourceGroups_CreateOrUpdate';

async function getGenerated(input) {
  return (await generator(input, SINGLE_OPERATION)).generated[0];
}

function test(sampleName) {
  it('Happy path (with args)', () => {
    getGenerated(SPEC_URL).then((generated) => {
      const sample = generated[sampleName];
      expect(sample).not.to.equal(null);
      expect(sample).not.to.equal('');
      expect(sample).to.be.an('string');
    });
  });

  it('Invalid args', () => {
    getGenerated('WRONG_URL').then((generated) => {
      const sample = generated[sampleName];
      expect(sample).to.equal('');
      expect(sample).not.to.be.an('string');
    });
  });

  it('Null args', () => {
    getGenerated(null).then((generated) => {
      const sample = generated[sampleName];
      expect(sample).to.equal('');
      expect(sample).not.to.be.an('string');
    });
  });
}

describe('Java request code generation', () => test('javaSnippet'));
describe('Python request code generation', () => test('pythonSnippet'));
describe('C# request code generation', () => test('csharpSnippet'));

describe('JSON request body generation', () => test('requestBody'));

describe('Java response code generation', () => test('javaModel'));
describe('Python response code generation', () => test('pythonModel'));
describe('C# response code generation', () => test('csharpModel'));
