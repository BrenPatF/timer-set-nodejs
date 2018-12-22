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
| *main-col-group* |  ColGroup    |  Simple file-reading and group-counting module, with code      |
|                  |              |  timing. Example showing how to use the timer-set package      |
----------------------------------------------------------------------------------------------------
|  test-timer-set  |  TimerSet    |  Unit testing the timer-set package, uses npm trapit package   |
====================================================================================================

Main driver for simple file-reading and group-counting module, with code timing. It is used as an
example showing how to use the timer-set package.

To run from root (timer-set) folder:

$ node examples\col-group\main-col-group

***************************************************************************************************/
"use strict";
const Utils = require('../../lib/utils');
const ColGroup = require('./col-group');
const TimerSet = require('../../lib/timer-set'); // for npm package usage, use 'timer-set' instead
const [INPUT_FILE, 													   DELIM, COL] = 
      ['./examples/col-group/fantasy_premier_league_player_stats.csv', ',',   6];

const tsColGroup = new TimerSet('ColGroup Timers');
const grp = new ColGroup(INPUT_FILE, DELIM, COL);
tsColGroup.incrementTime('ColGroup');

grp.prList('(as is)', grp.listAsIs());
tsColGroup.incrementTime('listAsIs');

grp.prList('key', grp.sortByKey());
tsColGroup.incrementTime('sortByKey');

grp.prList('value', grp.sortByValue());
tsColGroup.incrementTime('sortByValue');

console.log(tsColGroup.formatResults());