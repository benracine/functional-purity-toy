var fs = require('fs');
var _ = require('underscore');
_.str = require('underscore.string');

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

// Pure functions 
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

// Wrap in a closure to avoid polluting the global namespace
function stateFunctions() {
  var state_info = require('./states.json');
  var STATES = state_info.STATES;
  var ABBRS = state_info.ABBRS;
  var UNION = _.union(STATES, ABBRS);
  return {
    'containsState': function containsState(line) {
      return RegExp(UNION.join('|')).test(line);
    },
    'extractState': function extractState(line) {
      function addState(memo, state) { 
        if (_.str.contains(line, state))
          memo.push(state);
        return memo;
      }
      return _.reduce(UNION, addState, []);
    },
    'unabbreviate': function unabbreviate(state) {
      if (_.contains(STATES, state))
        return state;
      else if (_.contains(ABBRS, state))
        return createMapping(ABBRS, STATES)[state];
    },
    'createMapping': function createMapping(ABBRS, STATES) {
      return _.reduce(_.zip(ABBRS, STATES), addKey, {});
    }
  }
}
var state_functions = stateFunctions();
var containsState = state_functions['containsState'];
var extractState = state_functions['extractState'];
var unabbreviate = state_functions['unabbreviate'];
var createMapping = state_functions['createMapping'];

function addKey(memo, pair) {
  var obj = {};
  // This next line is a mutation that needs to be removed
  obj[pair[0]] = pair[1];
  return _.extend(memo, obj);
}

function reverseByCount(pair) { 
  return -1 * pair[1];
}

function stringifyPair(pair) { 
  return pair[0] + ' ' + pair[1];
}
