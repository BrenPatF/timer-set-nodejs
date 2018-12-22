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

As well as the entry point TimerSet module there is a helper module, Utils, of pure functions
====================================================================================================
|  Module    |  Notes                                                                              |
|===================================================================================================
| *TimerSet* |  Code timing class                                                                  |
----------------------------------------------------------------------------------------------------
|  Utils     |  General utility functions                                                          |
====================================================================================================

This file has the entry point TimerSet module. See the example in folder examples, and unit test in
folder test.

***************************************************************************************************/
"use strict";
const os = require('os');
const Utils = require('./utils');
const [CALLS_WIDTH, TIME_WIDTH, TIME_DP, TIME_RATIO_DP] = 
      [10,          8,          2,       5];
const [TOT_TIMER, OTH_TIMER, SELF_TIME, TIME_FACTOR] = 
      ['Total',   '(Other)', 0.1,       1000];
/***************************************************************************************************

getTimes: Gets CPU and elapsed times using system calls and return in object

***************************************************************************************************/
function getTimes(now, cpus) {
  let usr = 0, sys = 0;
  const ela = now();
  const cpuLis = cpus();

  for (const cpu of cpuLis) {
    usr += +cpu.times.user;
    sys += +cpu.times.sys;
  }
  return {ela : ela, usr : usr / cpuLis.length, sys : sys / cpuLis.length};
}
/***************************************************************************************************

valWidths: Handle parameter defaulting, and validate width parameters, int() where necessary
    Parameters: time width and decimal places, time ratio dp, calls width

***************************************************************************************************/
function valWidths(time_width, time_dp, time_ratio_dp, calls_width = 5) {
  if (calls_width < 5) 
    throw new Error('Error, calls_width must be > 4, actual: ' + calls_width);
  else if (time_width < 0 || time_dp < 0 || time_ratio_dp < 0) 
    throw new Error('Error, time_width, time_dp, time_ratio_dp must be > 0, actual: ' + 
                    time_width + ', ' + time_dp + ', ' + time_ratio_dp);
  else if (+time_width + +time_dp < 7)
    throw new Error('Error, time_width + time_dp must be > 6, actual: ' + time_width + ' + ' +
                    time_dp);
  else if (+time_width + +time_ratio_dp < 8)
    throw new Error('Error, time_width + time_ratio_dp must be > 7, actual: ' + time_width + 
                    ' + ' + time_ratio_dp);
}
/***************************************************************************************************

form*: Formatting methods that return formatted times and other values as strings

***************************************************************************************************/
function formTime(t, dp, time_width) { // time, decimal places to print, time width
  return Utils.rJust((t / TIME_FACTOR).toFixed (dp), time_width + dp);
}
function formTimeTrim(t, dp, time_width) { // time, decimal places to print, time width
  return formTime(t, dp, time_width).trim();
}
function formName(name, maxName) { // timer name, maximum timer name length
  return Utils.lJust(name, maxName);
}
function formCalls(calls, calls_width) { // timer name, maximum timer name length
  return Utils.rJust(calls.toString(), calls_width);
}
/***************************************************************************************************

timerLine: Returns a formatted timing line
  Parameters: timer name, maximum timer name length, elapsed, cpu times, number of calls to timer,
              time fields width, decimal places for times and time ratios, calls field width

***************************************************************************************************/
function timerLine(timer, maxName, ela, usr, sys, calls, time_width, time_dp, time_ratio_dp, 
                   calls_width) {
   return [formName( timer,     maxName),     
           formTime( ela,       time_dp,       time_width),
           formTime( usr,       time_dp,       time_width),
           formTime( sys,       time_dp,       time_width),
           formCalls(calls,     calls_width),
           formTime( ela/calls, time_ratio_dp, time_width),
           formTime( usr/calls, time_ratio_dp, time_width),
           formTime( sys/calls, time_ratio_dp, time_width)].join ('  ');
}
class TimerSet {

  /*************************************************************************************************

  TimerSet: Constructor sets the timer set name and initialises the instance timing arrays

  *************************************************************************************************/
  constructor(timerSetName, p_now = Date.now, p_cpus = os.cpus) {// timer set name, timing functions
    this.now = p_now;
    this.cpus = p_cpus;
    this.timerSetName = timerSetName;
    this.timBeg = getTimes(this.now, this.cpus);
    this.timPri = this.timBeg;
    this.timerHash = new Map();
    this.stime = Date().substring(0,24);
    this.results = [];
  }
  /*************************************************************************************************

  initTime: Initialises (or resets) the instance timing array

  *************************************************************************************************/
  initTime() {
    if (this.results.length != 0) {
      throw new Error('Timer set complete: Exiting ');
    }
    this.timPri = getTimes(this.now, this.cpus);
  }
  /*************************************************************************************************

  incrementTime: Increments the timing accumulators for a timer set and timer

  *************************************************************************************************/
  incrementTime(timerName) { // timer name

    if (this.results.length != 0) {
      throw new Error('Timer set complete: Exiting ');
    }
    const initHashVal = {ela : 0, usr : 0, sys : 0, calls : 0};
    const curTim = getTimes(this.now, this.cpus);
    const curHashVal = this.timerHash.get(timerName) || initHashVal;
    this.timerHash.set(timerName, { ela:   +curHashVal.ela + +curTim.ela - this.timPri.ela,
                                    usr:   +curHashVal.usr + +curTim.usr - this.timPri.usr,
                                    sys:   +curHashVal.sys + +curTim.sys - this.timPri.sys,
                                    calls: curHashVal.calls + 1
                    });
    this.timPri = curTim;
  }
  /*************************************************************************************************

  getTimers: Returns the results for timer set in an array of objects

  *************************************************************************************************/
  getTimers() {
    if (this.results.length === 0) {
      const tim = getTimes(this.now, this.cpus);
      const totTim = {ela: tim.ela - this.timBeg.ela, usr: tim.usr - this.timBeg.usr, 
                      sys: tim.sys - this.timBeg.sys};
      const sumTim = Array.from(this.timerHash.values()).reduce(function(t, s) {
        return {ela: t.ela + s.ela, usr: t.usr + s.usr, sys: t.sys + s.sys, 
                calls: t.calls + s.calls}; });

      this.results = Array.from(this.timerHash.entries()).map(
        e => {return {timer: e[0], ela: e[1].ela, usr: e[1].usr, sys: e[1].sys, 
                      calls: e[1].calls};});
      this.results.push({timer: OTH_TIMER, ela: totTim.ela - sumTim.ela, 
                                           usr: totTim.usr - sumTim.usr, 
                                           sys: totTim.sys - sumTim.sys, calls: 1});
      this.results.push({timer: TOT_TIMER, ela: totTim.ela, usr: totTim.usr, sys: totTim.sys, 
                         calls: sumTim.calls + 1});
    }
    return this.results;
  }
  /*************************************************************************************************

  formatTimers: Writes the timers to an array of formatted strings for the timer set

  *************************************************************************************************/
  formatTimers(time_width = TIME_WIDTH, time_dp = TIME_DP, time_ratio_dp = TIME_RATIO_DP, 
               calls_width = CALLS_WIDTH) {
    valWidths(time_width, time_dp, time_ratio_dp, calls_width);
    const timerArr = this.getTimers(time_width, time_dp, time_ratio_dp, calls_width);
    const maxName = Utils.maxLen(this.timerHash);
    const [lenTime, lenTimeRatio] = [+time_width + +time_dp, +time_width + +time_ratio_dp];

    let fmtArr =  Utils.colHeaders( [{name: 'Timer',  len: -maxName},
                     {name: 'Elapsed',  len: lenTime},
                     {name: 'USR',      len: lenTime},
                     {name: 'SYS',      len: lenTime},
                     {name: 'Calls',    len: calls_width},
                     {name: 'Ela/Call', len: lenTimeRatio},
                     {name: 'USR/Call', len: lenTimeRatio},
                     {name: 'SYS/Call', len: lenTimeRatio}]);

    for (const [i, t] of timerArr.entries()) {
      fmtArr.push(timerLine(t.timer, maxName, t.ela, t.usr, t.sys, t.calls, +time_width, +time_dp,
                            +time_ratio_dp, +calls_width));
      if (i > timerArr.length - 3) {fmtArr.push(fmtArr[1])};
    };
    return fmtArr;
  }
  /*************************************************************************************************

  getSelfTimer: Static function returns object with timings per call for calling incrementTime

  *************************************************************************************************/
  static getSelfTimer() {
    const timerTimer = new TimerSet('timer');
    let [t, i] = [0, 0];
    while (t < SELF_TIME) {
      timerTimer.incrementTime('x'); 
      if (++i % 100 == 0) t = timerTimer.timerHash.get('x').ela;
    };
    const timerTimes = timerTimer.timerHash.get('x');
    return {ela: timerTimes.ela/i, usr: timerTimes.usr/i, 
            sys: timerTimes.sys/i};
  }
  /*************************************************************************************************

  formatSelfTimer: Returns formatted string with the results of getSelfTimer

  *************************************************************************************************/
  static formatSelfTimer(time_width = TIME_WIDTH, time_dp = TIME_DP, 
                         time_ratio_dp = TIME_RATIO_DP) {
    valWidths(time_width, time_dp, time_ratio_dp);
    const t = TimerSet.getSelfTimer();
    return '[Timer timed (per call in ms): Elapsed: ' + formTimeTrim(TIME_FACTOR*t.ela, 
      time_ratio_dp, time_width) + ', USR: ' + formTimeTrim(TIME_FACTOR*t.usr, time_ratio_dp, 
      time_width) + ', SYS: ' +  formTimeTrim(TIME_FACTOR*t.sys, time_ratio_dp, time_width) + ']';
  }
  /*************************************************************************************************

  formatResults: Returns formatted string with the complete results, using formatTimers; includes
                 self timing results

  ***************************************************************************************************/
  formatResults(time_width = TIME_WIDTH, time_dp = TIME_DP, time_ratio_dp = TIME_RATIO_DP, 
                calls_width = CALLS_WIDTH) {
    
    valWidths(time_width, time_dp, time_ratio_dp, calls_width);
    return Utils.heading("Timer set: " + this.timerSetName + ", constructed at " + this.stime + 
      ", written at " + Date().substring(0,24)) + '\n' + 
      (this.formatTimers(time_width, time_dp, time_ratio_dp,calls_width)).reduce(
        function(s, l) {return s + '\n' + l}) + '\n' + 
      TimerSet.formatSelfTimer(time_width, time_dp, time_ratio_dp);
  }
};
module.exports = TimerSet;