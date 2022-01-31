#!/usr/bin/env node
// @ts-check

'use strict';

const converter = require('swagger2openapi');
const fs = require('fs');

let inputFile = "/Users/fuyingbo/Desktop/UCL/COMP0102 SASI/azure-rest-api-specs/specification/resources/resource-manager/Microsoft.Resources/stable/2019-08-01/resources.json";
let options = {};
options.resolve = true;
options.outfile = "/Users/fuyingbo/Desktop/resources-node.json";
options.patch = true;
options.source = inputFile;

converter.convertFile(options.source, options, function(err, options){
  let s;
  try {
    s = JSON.stringify(options.openapi, null, options.indent||4);
  }
  catch (ex) {
    console.warn('The result cannot be represented safely in the chosen output format');
    s = '{}';
  }
  fs.writeFileSync(options.outfile, s, options.encoding || 'utf8');
});
