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
|  main-col-group  |  ColGroup    |  Simple file-reading and group-counting module, with logging   |
|                  |              |  to file. Example of testing impure units, and error display   |
----------------------------------------------------------------------------------------------------
| *test-timer-set* |  TimerSet    |  Unit testing the timer-set package, uses npm trapit package   |
====================================================================================================

This file is a unit test program for the timer-set package, using npm trapit package.

To run from root (timer-set) folder:

$ npm test

***************************************************************************************************/
"use strict";
const Trapit = require('trapit');
const Utils = require('../lib/utils');
const TimerSet = require('../lib/timer-set'); // for npm package usage, use 'timer-set' instead
const fs = require('fs');
const ROOT = __dirname + '/';
const INPUT_JSON = ROOT + 'timer-set.json';

const DELIM = '|';
const [CON,   INC,   INI,   GET,   GETF,   SELF,   SELFF,   RES] = 
      ["CON", "INC", "INI", "GET", "GETF", "SELF", "SELFF", "RES"];
const [EVENT_SEQUENCE, SCALARS] = ["Event Sequence", "Scalars"];
const [TIMER_SET_1, TIMER_SET_1_F,       TIMER_SET_2, TIMER_SET_2_F] = 
      ["Set 1",     "Set 1 (formatted)", "Set 2",     "Set 2 (formatted)"];
const [SELF_GRP,          SELF_GRP_F,                   RES_GRP,   EXCEPTION] = 
      ["Self (unmocked)", "Self (unmocked, formatted)", "Results", "Exception"];
/**************************************************************************************************

purelyWrapUnit: Unit test wrapper function. This is called within a loop over input scenarios, 
    returning an object that includes the input object and has the actual program outputs
    inserted

**************************************************************************************************/
function purelyWrapUnit(inpGroups) {// input groups object

  const [mock_yn, timeWidth, dpTotals, dpPerCall, callsWidth] = 
        [...Utils.csvToLis(inpGroups[SCALARS][0]).map(v => v === '' ? undefined : v)];
  const events = inpGroups[EVENT_SEQUENCE];
  const times = events.map(e => Utils.csvToLis(e));
  let timerSet = {};
  let counter_n = 0; 
  function now() {
    counter_n += 1;
    return times[counter_n - 1][3];
  }
  let counter_c = 0;
  function cpus() {
    counter_c += 1;
    return [
        {times: {user: times[counter_c - 1][4], sys: times[counter_c - 1][5]}}, 
        {times: {user: times[counter_c - 1][6], sys: times[counter_c - 1][7]}}
    ];
  }
  let [outArr, outArrF, exceptions, selfTimer, selfTimerF, results] = 
  [{[TIMER_SET_1]: [], [TIMER_SET_2]: []}, {[TIMER_SET_1]: [], [TIMER_SET_2]: []}, [], [], [], []];
  for (const eventCsv of events) {
    const eLis = Utils.csvToLis(eventCsv);
    const [setNm, timerNm, event, sleepTime] = [...eLis];
    if (mock_yn != 'Y') Utils.sleep(sleepTime);
    if (event == CON) {
      timerSet[setNm] = (mock_yn === 'Y') ? new TimerSet(setNm, now, cpus) : new TimerSet(setNm);
    } else if (event == INC) {
      timerSet[setNm].incrementTime(timerNm);
    } else if (event == INI) {
      timerSet[setNm].initTime();
    } else if (event == GET) {
      outArr[setNm] = timerSet[setNm].getTimers().map(t => Object.values(t).join(DELIM));
    } else if (event == GETF) {
      try {
        outArrF[setNm] = timerSet[setNm].formatTimers(timeWidth, dpTotals, dpPerCall, callsWidth);
      } catch(e) {
        exceptions = [e.message, e.stack]
      }
    } else if (event == SELF) {
      selfTimer = [Object.values(TimerSet.getSelfTimer()).join(DELIM)];
    } else if (event == SELFF) {
      selfTimerF = [TimerSet.formatSelfTimer()];
    } else if (event == RES) {
      results = [timerSet[setNm].formatResults()];
    } else {
      throw `Error event ${event} not known`;
    }
  }
  return {
              [TIMER_SET_1] : outArr[TIMER_SET_1],
              [TIMER_SET_1_F] : outArrF[TIMER_SET_1],
              [TIMER_SET_2] : outArr[TIMER_SET_2],
              [TIMER_SET_2_F] : outArrF[TIMER_SET_2],
              [SELF_GRP] : selfTimer,
              [SELF_GRP_F] : selfTimerF,
              [RES_GRP] : results,
              [EXCEPTION] : exceptions
  };
}

Trapit.fmtTestUnit(INPUT_JSON, ROOT, purelyWrapUnit);