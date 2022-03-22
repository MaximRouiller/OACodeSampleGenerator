const { expect } = require('chai');
const generator = require('..');

const SPEC_URL =
  'https://raw.githubusercontent.com/Azure/azure-rest-api-specs/main/specification/resources/resource-manager/Microsoft.Resources/stable/2021-04-01/resources.json';

const SINGLE_OPERATION = 'ResourceGroups_CreateOrUpdate';

describe('Generator invocation', () => {
  it('with a valid url parameter returns a non-null output', async () => {
    expect(await generator(SPEC_URL)).not.to.equal(null);
  });

  it('with an invalid url parameter throws an error', async () => {
    try {
      await generator('WRONG_URL');
    } catch (err) {
      expect(err).not.to.equal(null);
    }
  });

  it('with a null parameter throws an error', async () => {
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

describe('Java request code', () => testSample('javaSnippet'));
describe('Python request code', () => testSample('pythonSnippet'));
describe('C# request code', () => testSample('csharpSnippet'));

describe('JSON request body', () => testSample('requestBody'));

describe('Java response code', () => testSample('javaModel'));
describe('Python response code', () => testSample('pythonModel'));
describe('C# response code', () => testSample('csharpModel'));
