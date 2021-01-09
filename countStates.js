const { assert } = require('console');
const fs = require('fs');
const { EOL } = require('os'); 
const _ = require('underscore');

/*
I wrote this code just to toy around with a hybrid OO / FP coding style
*/

const createStateFinder = (statesFile) => {
  const descendingCount = (pair) => -1 * pair[1];
  const pairToStr = (pair) => `${pair[0]} ${pair[1]}`; 
  const pairToObj = (pair) => {
    let obj = {};
    obj[pair[0]] = pair[1];
    return obj;
  };
  const extendObjByPair = (memo, pair) => { 
    return {...memo, ...pairToObj(pair)};
  };
  const createMapping = (ABBRS, STATES) => {
    return _.zip(ABBRS, STATES).reduce(extendObjByPair); 
  };

  const utils = (() => {
    const { STATES, ABBRS } = require(statesFile);
    const UNION = [...STATES, ...ABBRS];
    return {
      lineContainsState: (line) => RegExp(UNION.join('|')).test(line),
      extractStateFromLine: (line) => {
        const addState = (memo, state) => { 
          return line.includes(state)
            ? [...memo, [state]]
            : memo;
        };
        return UNION.reduce(addState, []);
      },
      expandAbbreviations: (state) => {
        if (STATES.includes(state)) return state;
        else if (ABBRS.includes(state)) return createMapping(ABBRS, STATES)[state];
        else return state;
      }
    }
  })();
  
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
  };

  return {
    processString,
  }
};

// Impure functions
const findStates = (err, fileContents) => {
  let stateFinder = createStateFinder('./states.json');
  let results = stateFinder.processString(fileContents);
  results.forEach((line) => console.log(line));
  runTests(results);
};

const runTests = (results) => {
  assert(results[0] === 'Tennessee 9');
  assert(results[results.length - 1] === 'New York 1');
};

const main = (filename) => fs.readFile(filename, 'utf8', findStates); 

if (require.main === module) {
  main('./homesteading-cities.txt');
}
