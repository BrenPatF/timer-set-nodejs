"use strict";
/***************************************************************************************************
Name: utils.js                         Author: Brendan Furey                       Date: 02-Oct-2018

Component module in the nodejs timer-set package. This package facilitates code timing for
instrumentation and other purposes, with very small footprint in both code and resource usage.

GitHub: https://github.com/BrenPatF/timer-set-nodejs

npm: $ npm install timer-set

See 'Code Timing and Object Orientation and Zombies' for the original idea implemented in Oracle 
   PL/SQL, Perl and Java
   http://www.scribd.com/doc/43588788/Code-Timing-and-Object-Orientation-and-Zombies
   Brendan Furey, November 2010

As well as the entry point TimerSet module there is a helper module, Utils, of pure functions
====================================================================================================
|  Module    |  Notes                                                                              |
|===================================================================================================
|  TimerSet  |  Code timing class                                                                  |
----------------------------------------------------------------------------------------------------
| *Utils*    |  General utility functions                                                          |
====================================================================================================

This file has general utility functions.

***************************************************************************************************/
const DELIM = '|';
var self = module.exports = {

/***************************************************************************************************

heading: Returns a title with "=" underlining to its length, preceded by a blank line

***************************************************************************************************/
heading: (title) => {
  return '\n' + title + '\n' + '='.repeat(title.length);
}, // heading string
/***************************************************************************************************

csvToLis: Returns array by splitting csv string on DELIM

***************************************************************************************************/
csvToLis: (csv) => {return csv.split(DELIM)},
/***************************************************************************************************

rJust, lJust: Right/left-justify a string or number, using valJust to validate input

***************************************************************************************************/
valJust: (name, len) => { // string to print, width
  const sname = String(name);
  if (len < sname.length) throw new Error("*Just passed invalid parameters: " + sname + ", " + len);
  return [sname, ' '.repeat(len - sname.length)];
},
rJust: (name, len) => { // string to print, width
  const vals = self.valJust(name, len);
  return vals[1] + vals[0];
},
lJust: (name, len) => { // string to print, width
  const vals = self.valJust(name, len);
  return vals[0] + vals[1];
},
/***************************************************************************************************

colHeaders: Returns a set of column headers, input as arrays of values and length/justification's

***************************************************************************************************/
colHeaders: (items) => { // array of {name, length} objects, length < 0 -> left-justify
  let strings = items.map( (s) => {
      return s.len < 0 ? self.lJust(s.name, -s.len) : self.rJust(s.name, s.len)});
  let lines = [strings.join ('  ')];
  let unders = strings.map( (s) => {return '-'.repeat(s.length)})
  lines.push(unders.join ('  '));
  return lines;
},
/***************************************************************************************************

maxLen: Returns maximum length of string in a list of strings

***************************************************************************************************/
maxLen: (items) => { // list of strings
  return Array.from(items.keys()).reduce( (a, b) => { return a.length > b.length ? a : b; }).length;
},
/***************************************************************************************************

sleep: 'Proper' synchronous sleep for testing

***************************************************************************************************/
sleep: (time) => { // sleep time in ms
  const stop = Date.now();
  while (Date.now() < stop + +time) {
    ;
  }
}
}