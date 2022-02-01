const fs = require('fs');
let spec = JSON.parse(fs.readFileSync('../example/convertedSpecExample.json', 'utf8'));

let CreateOrUpdate;

for (const operationGroup of Object.values(spec.paths)) {
  for (const operation of Object.values(operationGroup)) {
    // console.log(operationType, " ",operation.operationId);
    if (operation.operationId === 'ResourceGroups_CreateOrUpdate') {
      CreateOrUpdate = operation;
    }
  }
}

console.log(CreateOrUpdate);
