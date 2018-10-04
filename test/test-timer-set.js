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
const TimerSet = require('../lib/timer-set');
const fs = require('fs');
const ROOT = './test/';
const INPUT_JSON = ROOT + 'timer-set.json';

const DELIM = '|';
const [CON, 	INC, 	 INI, 	GET, 	 GETF, 	 SELF, 	 SELFF, 	RES] = 
      ["CON", "INC", "INI", "GET", "GETF", "SELF", "SELFF", "RES"];
const [EVENT_SEQUENCE, SCALARS] = ["Event Sequence", "Scalars"];
const [TIMER_SET_1, TIMER_SET_1_F, 			 TIMER_SET_2, TIMER_SET_2_F] = 
      ["Set 1", 		"Set 1 (formatted)", "Set 2", 		"Set 2 (formatted)"];
const [SELF_GRP, 					SELF_GRP_F, 									RES_GRP, 	 EXCEPTION] = 
      ["Self (unmocked)", "Self (unmocked, formatted)", "Results", "Exception"];
const testData = Trapit.getUTData(INPUT_JSON);
const [meta, callScenarios] = [testData.meta, testData.scenarios];
function purelyWrapUnit(callScenario) {

	const [mock_yn, timeWidth, dpTotals, dpPerCall, callsWidth] = 
	      [...Utils.csvToLis(callScenario.inp[SCALARS][0]).map(v => v === '' ? undefined : v)];
	const events = callScenario.inp[EVENT_SEQUENCE];
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
	for (const i in events) {
		const eLis = Utils.csvToLis(events[i]);
		const [setNm, timerNm, event, sleepTime, ela, usr, sys] = [...eLis];
		if (mock_yn != 'Y') Utils.sleep(sleepTime);
		switch(event) {
    	case CON:
    		if (mock_yn === 'Y') {
					timerSet[setNm] = new TimerSet(setNm, now, cpus);
				} else {
					timerSet[setNm] = new TimerSet(setNm);
				}
        break;
    	case INC:
				timerSet[setNm].incrementTime(timerNm);
        break;
    	case INI:
				timerSet[setNm].initTime();
        break;
    	case GET:
        outArr[setNm] = timerSet[setNm].getTimers().map(t => Object.values(t).join(DELIM));
        break;
    	case GETF:
    		try {
        	outArrF[setNm] = timerSet[setNm].formatTimers(timeWidth, dpTotals, dpPerCall, callsWidth);
        } catch(e) {
        	exceptions[0] = e.message;
        	exceptions[1] = e.stack;
        }
        break;
    	case SELF:
        selfTimer = [Object.values(TimerSet.getSelfTimer()).join(DELIM)];
        break;
    	case SELFF:
        selfTimerF = [TimerSet.formatSelfTimer()];
        break;
    	case RES:
        results = [timerSet[setNm].formatResults()];
        break;
    	default:
        throw `Error event ${event} not known`;
		}
	}
	return {
		inp: callScenario.inp,
		out: {
				[TIMER_SET_1] : {
					exp: callScenario.out[TIMER_SET_1], 
					act: outArr[TIMER_SET_1]
				},
				[TIMER_SET_1_F] : {
					exp: callScenario.out[TIMER_SET_1_F],
					act: outArrF[TIMER_SET_1]
				},
				[TIMER_SET_2] : {
					exp: callScenario.out[TIMER_SET_2], 
					act: outArr[TIMER_SET_2]
				},
				[TIMER_SET_2_F] : {
					exp: callScenario.out[TIMER_SET_2_F],
					act: outArrF[TIMER_SET_2]
				},
				[SELF_GRP] : {
					exp: callScenario.out[SELF_GRP],
					act: selfTimer
				},
				[SELF_GRP_F] : {
					exp: callScenario.out[SELF_GRP_F],
					act: selfTimerF
				},
				[RES_GRP] : {
					exp: callScenario.out[RES_GRP],
					act: results
				},
				[EXCEPTION] : {
					exp: callScenario.out[EXCEPTION],
					act: exceptions
				}
		}
	};
}

let scenarios = [];
for (const s in callScenarios) {
	if (!(callScenarios[s].enabled_yn === 'N')) { // optional in input json
		scenarios[s] = purelyWrapUnit(callScenarios[s]);
	}
};

Trapit.prUTResultsTextAndHTML(meta, scenarios, ROOT);