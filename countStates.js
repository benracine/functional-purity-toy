const { assert } = require('console');
const fs = require('fs');
const { EOL } = require('os'); 
const util = require('util')
const _ = require('underscore');
const readFilePromise = util.promisify(fs.readFile);

const createStateFinder = (opts={}) => {
  let { stateFileName = null, textFileName = null} = opts;

  // Maximize pure methods/functions as these are easy to test
  const descendingCount = (pair) => -1 * pair[1];
  const pairToStr = (pair) => `${pair[0]} ${pair[1]}`; 

  const getUtils = () => {
    if (!stateFileName) return;
    const { states, abbrs } = require(stateFileName);
    const statesAndAbbrs = [...states, ...abbrs];
    const extendObjByPair = (memo, pair) => { 
      return {...memo, ...Object.fromEntries([pair])};
    };
    const createMapping = (abbrs, states) => {
      return _.zip(abbrs, states).reduce(extendObjByPair); 
    };
    return {
      lineContainsState: (line) => RegExp(statesAndAbbrs.join('|')).test(line),
      extractStateFromLine: (line) => {
        const addState = (memo, state) => { 
          return line.includes(state)
            ? [...memo, [state]]
            : memo;
        };
        return statesAndAbbrs.reduce(addState, []);
      },
      expandAbbreviations: (state) => {
        if (states.includes(state)) {
          return state;
        }
        else if (abbrs.includes(state)) {
          return createMapping(abbrs, states)[state];
        }
        else {
          return state;
        }
      }
    }
  };

  const processString = (entireString) => {
    // Lazily using getUtils allow the tool be re-used on various
    // text files and various definitions of what qualifies as a 
    // state or valid abbreviation
    const utils = getUtils(); 
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

  const yieldInterface = () => {
    return {
      processString,
      countStates,
      stateFileName,
      setStateFileName,
      textFileName,
      setTextFileName
    }
  };
  // End pure methods/functions

  // Begin impure methods/functions
  // Try to minimize the functionality herein as testing is more work
  const countStates = async () => {
    if (!textFileName) {
      return 'No file name available';
    }
    return processString(
      await readFilePromise(textFileName, 'utf8')
    );
  };

  const setStateFileName = (fName) => {
    stateFileName = fName;
    return yieldInterface();
  };

  const setTextFileName = (fName) => {
    textFileName = fName;
    return yieldInterface();
  };
  // End impure methods/functions

  return yieldInterface();
};

const main = async () => {
  return await createStateFinder()
    .setStateFileName('./states.json')
    .setTextFileName('./homesteading-cities.txt')
    .countStates();
};

const runTests = (results) => {
  console.log('results = ', results);
  assert(results[0] === 'Tennessee 9');
  assert(results[results.length - 1] === 'New York 1');
};

if (require.main === module) {
  main().then(runTests);
}
