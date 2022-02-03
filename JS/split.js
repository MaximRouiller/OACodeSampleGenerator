const fs = require('fs');
let spec = JSON.parse(fs.readFileSync('../example/endSpecExample.json'));

exports.getOperations = () => {
  let operations = [];
  for (const operationGroup of Object.values(spec.paths)) {
    for (const [operationType, operation] of Object.entries(operationGroup)) {
      operations.push({ operationType, operation });
    }
  }
  return operations;
};
