const fs = require('fs');
const { EOL } = require('os'); 
const _ = require('underscore');

// Pure functions (lend themselves to trivial tests)
const processString = (entireString) => {
  return _.chain(entireString.split(EOL))
    .filter(utils.lineContainsState)
    .map(utils.extractStateFromLine)
    .flatten()
    .map(utils.expandAbbreviations)
    .countBy()
    .pairs()
    .sortBy(descendingCount)
    .map(pairToStr)
    .value();
}

const utils = (() => {
  const { STATES, ABBRS } = require('./states.json');
  const UNION = [...STATES, ...ABBRS];
  return {
    lineContainsState: (line) => RegExp(UNION.join('|')).test(line),
    extractStateFromLine: (line) => {
      const addState = (memo, state) => { 
        if (line.includes(state)) {
          return [...memo, [state]];
        }
        else {
          return memo;
        }
      }
      return UNION.reduce(addState, []);
    },
    expandAbbreviations: (state) => {
      if (STATES.includes(state)) return state;
      else if (ABBRS.includes(state)) return createMapping(ABBRS, STATES)[state];
      else return state;
    }
  }
})();

const zip = (arr, ...arrs) => {
  return arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));
};

const descendingCount = (pair) => -1 * pair[1];

const pairToStr = (pair) => `${pair[0]} ${pair[1]}`; 

const createMapping = (ABBRS, STATES) => {
  return zip(ABBRS, STATES).reduce(extendObjByPair); 
};

const extendObjByPair = (memo, pair) => { 
  return {...memo, ...pairToObj(pair)};
};

const pairToObj = (pair) => {
  var obj = {};
  obj[pair[0]] = pair[1];
  return obj;
};

// Impure functions
const processFile = (err, data) => {
  processString(data).forEach((line) => console.log(line));
};

const main = (filename) => fs.readFile(filename, 'utf8', processFile); 

if (require.main === module) {
  main('./homesteading-cities.txt');
}
