const expect = require('chai').expect;

it('Example test (equals)', function () {
  const num1 = 2;
  const num2 = 3;
  expect(num1 + num2).to.equal(5);
});

it('Example test (not equals)', function () {
  const num1 = 3;
  const num2 = 3;
  expect(num1 + num2).not.to.equal(4);
});
