/***************************************************************************************************
Name: timer-set.js                     Author: Brendan Furey                       Date: 02-Oct-2018

Component module in the nodejs timer-set package. This package facilitates code timing for
instrumentation and other purposes, with very small footprint in both code and resource usage.

GitHub: https://github.com/BrenPatF/timer-set-nodejs

npm: $ npm install timer-set

See 'Code Timing and Object Orientation and Zombies' for the original idea implemented in Oracle 
   PL/SQL, Perl and Java
   http://www.scribd.com/doc/43588788/Code-Timing-and-Object-Orientation-and-Zombies
   Brendan Furey, November 2010

There is an example main program showing how to use the timer-set package, and a unit test program
====================================================================================================
|  Main/Test       |  Unit Module |  Notes                                                         |
|===================================================================================================
|  main-col-group  | *ColGroup*   |  Simple file-reading and group-counting module, with code      |
|                  |              |  timing. Example showing how to use the timer-set package      |
----------------------------------------------------------------------------------------------------
|  test-timer-set  |  TimerSet    |  Unit testing the timer-set package, uses npm trapit package   |
====================================================================================================

This file has a simple file-reading and group-counting module, with logging to file. It is used as 
an example showing how to use the timer-set package.

***************************************************************************************************/
"use strict";
const Utils = require ('../../lib/utils');
const fs = require('fs');
/***************************************************************************************************

readList: Private function returns the key-value map of (string, count)

***************************************************************************************************/
function readList(file, delim, col) { // input file, field delimiter, 0-based column index
  const lines=fs.readFileSync(file).toString().trim().split("\n");
  fs.appendFileSync(file + '.log', Date().substring(0, 24) + ": File " + file + ', delimiter \'' +
       delim + '\', column ' + col + "\n");
  var counter = new Map();
  for (const line of lines) {
    let val = line.split(delim)[col];
    let newVal = counter.get(val) + 1 || 1;
    counter.set(val, newVal);
  }
  return counter;
}
class ColGroup {

  /***************************************************************************************************

  ColGroup: Constructor sets the key-value map of (string, count), and the maximum key length

  ***************************************************************************************************/
  constructor(file, delim, col) {
    this.file = file;
    this.delim = delim;
    this.col = col;
    this.counter = readList(file, delim, col);
    this.maxLen = Utils.maxLen (this.counter);
  }
  /***************************************************************************************************

  prList: Prints the key-value list of (string, count) sorted as specified

  ***************************************************************************************************/
  prList(sortBy, keyValues) { // sort by label, key-value list of (string, count)
  
    console.log(Utils.heading ('Counts sorted by '+sortBy));
    Utils.colHeaders([{name: 'Team', len : -this.maxLen}, {name : '#apps', len : 5}]).map(l => {console.log(l)});
    for (const kv of keyValues) {
      console.log((Utils.lJust(kv[0], this.maxLen) + '  ' + Utils.rJust(kv[1], 5))); 
    }
  };
  /***************************************************************************************************

  listAsIs: Returns the key-value list of (string, count) unsorted

  ***************************************************************************************************/
  listAsIs() {
    return [...this.counter];
  };
  /***************************************************************************************************

  sortByKey, sortByValue: Returns the key-value list of (string, count) sorted by key or value

  ***************************************************************************************************/
  sortByKey() {
    return Array.from(this.counter.entries()).sort(function(a, b) { return a[0] > b[0] ? 1 : -1; });
  };

  sortByValue() {
    return [...this.counter].sort(function(a, b) { return (a[1] - b[1]) || (a[0] > b[0] ? 1 : -1); });
  };
}
module.exports = ColGroup;