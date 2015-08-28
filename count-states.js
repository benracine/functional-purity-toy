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
  processString(data).forEach(function(line) { console.log(line); }); 
}

// Pure functions 
function processString(data) {
  return _.chain(data.split('\n'))
    .filter(state_functions.containsState)
    .map(state_functions.extractState)
    .flatten()
    .map(state_functions.unabbreviate)
    .countBy()
    .pairs()
    .sortBy(reverseByCount)
    .map(stringifyPair)
    .value();
}

var state_functions = (function() {
  var state_info = require('./states.json');
  var STATES = state_info.STATES;
  var ABBRS = state_info.ABBRS;
  var UNION = _.union(STATES, ABBRS);
  return {
    'containsState': function(line) { 
      return RegExp(UNION.join('|')).test(line); 
    },
    'extractState': function(line) {
      function addState(memo, state) { 
        if (_.str.contains(line, state))
          memo.push(state);
        return memo;
      }
      return _.reduce(UNION, addState, []);
    },
    'unabbreviate': function(state) {
      if (_.contains(STATES, state))
        return state;
      else if (_.contains(ABBRS, state))
        return createMapping(ABBRS, STATES)[state];
    }
  }
})();

function createMapping(ABBRS, STATES) { 
  return _.reduce(_.zip(ABBRS, STATES), extendObjByPair, {}); 
}

function extendObjByPair(memo, pair) { 
  return _.extend(memo, keyValuePairToObject(pair));
}

function keyValuePairToObject(pair) { 
  return _.object([pair[0]], [pair[1]]);
}

function reverseByCount(pair) { 
  return -1 * pair[1];
}

function stringifyPair(pair) { 
  return pair[0] + ' ' + pair[1]; 
}
