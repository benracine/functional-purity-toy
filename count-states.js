var fs = require('fs');
var _ = require('underscore');
_.str = require('underscore.string');
var state_info = require('./states.json');
var STATES = Object.freeze(state_info.STATES);
var ABBRS = Object.freeze(state_info.ABBRS);
var UNION = Object.freeze(_.union(STATES, ABBRS));

// Impure functions
if (require.main === module) {
  var filename = process.argv[2] || './homesteading-cities.txt';
  main(filename);
}

function main(filename) { 
  fs.readFile(filename, 'utf8', processFile); 
}

function processFile(err, data) { 
  processString(data).forEach(print);
}

function print(line) { 
  console.log(line); 
}

// Pure functions (they may use globals, but these globals are made immutable with Object.freeze, so that's "ok" in the functional paradigm, I think)
function processString(data) {
  return _.chain(data.split('\n'))
    .filter(containsState)
    .map(extractState)
    .flatten()
    .map(unabbreviate)
    .countBy()
    .pairs()
    .sortBy(reverseByCount)
    .map(stringifyPair)
    .value();
}

function containsState(line) { 
  return RegExp(UNION.join('|')).test(line);
}

function extractState(line) {
  function addState(memo, state) { 
    if (_.str.contains(line, state))
      memo.push(state);
    return memo;
  }
  return _.reduce(UNION, addState, []);
}
 
function unabbreviate(state) {
  if (_.contains(STATES, state))
    return state;
  else if (_.contains(ABBRS, state))
    return createMapping(ABBRS, STATES)[state];
}

function createMapping(ABBRS, STATES) { 
  return _.reduce(_.zip(ABBRS, STATES), addKey, {});
}

// The mutation herein needs to / could be eliminated somehow probably
function addKey(memo, pair) {
  var obj = {};
  obj[pair[0]] = pair[1];
  return _.extend(memo, obj);
}

function reverseByCount(pair) { 
  return -1 * pair[1];
}

function stringifyPair(pair) { 
  return pair[0] + ' ' + pair[1];
}
