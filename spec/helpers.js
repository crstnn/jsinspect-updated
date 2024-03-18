const fs    = require('fs');
const parse = require('../lib/parser').parse;
const chalk = require('chalk');

let output = '';
const enabled = chalk.enabled;
const write = process.stdout.write;
const parseCache = {};

module.exports = {
  trimlines: function(str) {
    return str.split('\n').map(str => str.trim()).join('\n');
  },

  captureOutput: function() {
    chalk.enabled = false;
    output = '';
    process.stdout.write = function(string) {
      if (!string) return;
      output += string;
    };
  },

  collectMatches: function(inspector) {
    const array = [];
    inspector.on('match', function(match) {
      array.push(match);
    });
    return array;
  },

  getOutput: function() {
    return output;
  },

  restoreOutput: function() {
    chalk.enabled = enabled;
    process.stdout.write = write;
  },

  parse: function(filePath) {
    if (parseCache[filePath]) return parseCache[filePath];

    // Skip the root Program node
    const src = fs.readFileSync(filePath, {encoding: 'utf8'});
    const ast = parse(src, filePath).body;
    parseCache[filePath] = ast;

    return ast;
  }
};
