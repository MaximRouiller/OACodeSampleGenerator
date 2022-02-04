#!/usr/bin/env node
// @ts-check

'use strict';

const converter = require('swagger2openapi');
const validator = require('oas-validator');
const fs = require('fs');
let dir = "/Users/fuyingbo/Desktop/UCL/COMP0102 SASI/azure-rest-api-specs/specification/resources/resource-manager/Microsoft.Resources/stable";

let options = {};
options.resolve = true;
options.patch = true;

let convert = function(inputFile) {
    let options = {};
    options.source = inputFile;
    options.resolve = true;
    options.patch = true;
    options.outfile = inputFile.replace('.json', '-3.0.json');
    
    converter.convertFile(inputFile, options, function(err, options){
        if (err) {
            delete err.options;
            console.warn(err);
            return process.exitCode = 1;
        }
        
        validator.validate(options.openapi, options)
        .then(function(){
          console.log(options.outfile + " is Valid!");
        })
        .catch(function(err){
            console.log(options.outfile + " is Invalid!");
            console.warn(err.message);
            if (options.context) console.warn('Location',options.context.pop());
        });

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
}

let walk = function(dir) {
    let results = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else {
            /* Is a file */
            if (file.endsWith("resources.json")) results.push(file);
        }
    });
    return results;
}

let jsonFiles = walk(dir);
for (let i in jsonFiles) {
    convert(jsonFiles[i]);
}