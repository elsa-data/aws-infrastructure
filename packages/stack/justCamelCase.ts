// OMG - I have copied this direct from just-camel-case - I can't waste any more time!
//
// For some reason the combination of:
// jsii
// pnpm
// esm
// commonjs
// is just not working
// (getting let cdkIdSafeDbName = camelCase(dbConfig.name);
//                                        ^
// TypeError: (0 , just_camel_case_1.camelCase) is not a function)
//
// Seemingly because there is a difference between the recently introduced cjs/mjs
// default exports of just-camel-case... but I can't be bothered investigating! Am at hour 2 working on this...

// any combination of spaces and punctuation characters
// thanks to http://stackoverflow.com/a/25575009
var wordSeparatorsRegEx =
  /[\s\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]+/;

var basicCamelRegEx =
  /^[a-z\u00E0-\u00FCA-Z\u00C0-\u00DC][\d|a-z\u00E0-\u00FCA-Z\u00C0-\u00DC]*$/;
var fourOrMoreConsecutiveCapsRegEx = /([A-Z\u00C0-\u00DC]{4,})/g;
var allCapsRegEx = /^[A-Z\u00C0-\u00DC]+$/;

export function camelCase(str: string) {
  var words = str.split(wordSeparatorsRegEx);
  var len = words.length;
  var mappedWords = new Array(len);
  for (var i = 0; i < len; i++) {
    var word = words[i];
    if (word === "") {
      continue;
    }
    var isCamelCase = basicCamelRegEx.test(word) && !allCapsRegEx.test(word);
    if (isCamelCase) {
      word = word.replace(
        fourOrMoreConsecutiveCapsRegEx,
        function (match, _p1, offset) {
          return deCap(match, word.length - offset - match.length == 0);
        },
      );
    }
    var firstLetter = word[0];
    firstLetter = i > 0 ? firstLetter.toUpperCase() : firstLetter.toLowerCase();
    mappedWords[i] =
      firstLetter +
      (!isCamelCase ? word.slice(1).toLowerCase() : word.slice(1));
  }
  return mappedWords.join("");
}

function deCap(match: any, endOfWord: any) {
  var arr = match.split("");
  var first = arr.shift().toUpperCase();
  var last = endOfWord ? arr.pop().toLowerCase() : arr.pop();
  return first + arr.join("").toLowerCase() + last;
}
