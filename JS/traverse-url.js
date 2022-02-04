#!/usr/bin/env node
// @ts-check

'use strict';

const converter = require('swagger2openapi');
const validator = require('oas-validator');
const fs = require('fs');
const url = require('url');
let dir = "/Users/fuyingbo/Desktop/stable";

let options = {};
options.resolveresolveInternal = true;
options.patch = true;

function processResult(err, options) {
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
}

let convert = function(inputFile) {
    let options = {};
    options.source = inputFile;
    options.resolveInternal = true;
    options.patch = true;
    options.text = true;
    options.outfile = inputFile.replace('.json', '-3.0.json');
        
    let u = url.parse(options.outfile);
    if (u.protocol && u.protocol.startsWith('http')) {
        converter.convertUrl(options.outfile, options, processResult);
    }
    else {
        options.origin = options.url;
        converter.convertFile(options.outfile, options, processResult);
    }
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