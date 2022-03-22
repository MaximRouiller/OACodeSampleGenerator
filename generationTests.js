const { expect } = require('chai');
const generator = require('.');

const SPEC_URL =
  'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

const SINGLE_OPERATION = 'ResourceGroups_CreateOrUpdate';

describe('Generator invocation', () => {
  it('with a valid url parameter should return a non-null output', async () => {
    expect(await generator(SPEC_URL)).not.to.equal(null);
  });

  it('with an invalid url parameter should throw an error', async () => {
    try {
      await generator('WRONG_URL');
    } catch (err) {
      expect(err).not.to.equal(null);
    }
  });

  it('with a null parameter should throw an error', async () => {
    try {
      await generator(null);
    } catch (err) {
      expect(err).not.to.equal(null);
    }
  });
});

function testSample(sampleName) {
  it('should be a non-empty string', async () => {
    const sample = (await generator(SPEC_URL, SINGLE_OPERATION)).generated[0][sampleName];
    expect(sample).not.to.equal(null);
    expect(sample).not.to.equal('');
    expect(sample).to.be.a('string');
  });
}

describe('Java request snippet', () => testSample('javaSnippet'));
describe('Python request snippet', () => testSample('pythonSnippet'));
describe('C# request snippet', () => testSample('csharpSnippet'));

describe('JSON request body', () => testSample('requestBody'));

describe('Java response model', () => testSample('javaModel'));
describe('Python response model', () => testSample('pythonModel'));
describe('C# response model', () => testSample('csharpModel'));
