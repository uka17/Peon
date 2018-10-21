//Schedule main engine
var getDateTime = require('../tools/utools').getDateTime;
var addDate = require('./date_time').addDate;
var parseDateTime = require('./date_time').parseDateTime;

/**
 * Calculates next run time for already calculated day
 * @param {object} schedule Schedule for which next run time should be calculated
 * @param {object} runDate Day of next run with 00:00 time
 * @returns {object} Next run date and time or null in case if next run time is out of runDate range (e.g. attempt to calculate 'each 13 hours' at 19:00)
 */
function calculateTimeOfRun(schedule, runDate) {  
    let runDateTime = runDate;

    if(schedule.dailyFrequency.hasOwnProperty('occursOnceAt')) {
        let time = schedule.dailyFrequency.occursOnceAt.split(':');
        runDateTime.setUTCHours(time[0], time[1], time[2]); //it should put time in UTC, but it puts it in local        
        return runDateTime;                     
    }

    if(schedule.dailyFrequency.hasOwnProperty('occursEvery')) {
        let time = schedule.dailyFrequency.start.split(':');
        //milliseconds should be removed?
        runDateTime.setUTCHours(time[0], time[1], time[2], 0);
        while(runDateTime < getDateTime()) {
            //TODO nice to have interval like 03:30 (both hour and minutes)
            switch(schedule.dailyFrequency.occursEvery.intervalType) {
                case 'minute':
                    runDateTime = addDate(runDateTime, 0, 0, 0, 0, schedule.dailyFrequency.occursEvery.intervalValue, 0);
                break;
                case 'hour':
                    runDateTime = addDate(runDateTime, 0, 0, 0, schedule.dailyFrequency.occursEvery.intervalValue, 0, 0);
                break;
            }
        }
        if(runDate.getUTCDate() == runDateTime.getUTCDate())
            return runDateTime;   
        else
            return null;
        
    }
}
/**
 * Scans week which starts with weekStart and tries to find date for run
 * @param {object} schedule Schedule for which next run time should be calculated
 * @param {object} weekStart Date of sunday (0 day of week)
 * @returns {object} Date or next run or null in case if date was not calculated
 */
function calculateWeekDayOfRun(schedule, weekStart) {
    let currentDay = weekStart;
    let weekDayList = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    let weekDayLastIndex = 0;
    for (let i = 0; i < schedule.dayOfWeek.length; i++) {
        let weekDayIndex = weekDayList.indexOf(schedule.dayOfWeek[i]);
        if(weekDayIndex != -1) {
            currentDay = addDate(currentDay, 0, 0, weekDayIndex - weekDayLastIndex, 0, 0, 0);
            weekDayLastIndex = weekDayIndex;
            //day calculating time found - don't go next
            let calculationResult = calculateTimeOfRun(schedule, currentDay);
            if(calculationResult) {            
                if(calculationResult > getDateTime() && calculationResult > schedule.startDateTime)
                    return calculationResult;
                currentDay = calculationResult;
            }
        }        
    }   
    return null;
}

/**
 * Calculates next run date and time 
 * @param {object} schedule Schedule for which next run date and time should be calculated
 * @returns {object} Next run date and time or null in case if next run date and time can not be calculated
 */ 
module.exports.calculateNextRun = (schedule) => {   
    let result = null; 
    //oneTime
    if(schedule.hasOwnProperty('oneTime')) {        
        let oneTime = schedule.oneTime;
        if(oneTime > getDateTime())
            result = oneTime;
    }

    //eachNDay 
    if(schedule.hasOwnProperty('eachNDay')) {        
        //searching for a day of run        
        let currentDate = new Date((new Date()).setUTCHours(0, 0, 0, 0));
        //due to save milliseconds and not link newDateTime object with schedule.startDateTime
        let newDateTime = new Date(parseDateTime(schedule.startDateTime));
        newDateTime.setUTCHours(0, 0, 0, 0);
        while(newDateTime < currentDate) {
            newDateTime = addDate(newDateTime, 0, 0, schedule.eachNDay, 0, 0, 0);
        }        
        //as far as day was found - start to search moment in a day for run
        result = calculateTimeOfRun(schedule, newDateTime);

        if(result < getDateTime() && schedule.dailyFrequency.hasOwnProperty('occursOnceAt'))
            //happened today, but already missed - go to future, to next N day
            result = addDate(result, 0, 0, schedule.eachNDay, 0, 0, 0);
        
        //day overwhelming after adding interval, go to future, to next N day
        if(result == null) {
            result = addDate(newDateTime, 0, 0, schedule.eachNDay, 0, 0, 0);
            let time = schedule.dailyFrequency.start.split(':');
            result.setUTCHours(time[0], time[1], time[2]);
        }
    }    
    //eachNWeek
    if(schedule.hasOwnProperty('eachNWeek')) {               
        //due to save milliseconds and not link newDateTime object with schedule.startDateTime
        let newDateTime = new Date(parseDateTime(schedule.startDateTime));
        newDateTime.setUTCHours(0, 0, 0, 0);
        //find Sunday of start week 
        newDateTime = addDate(newDateTime, 0, 0, -newDateTime.getUTCDay(), 0, 0, 0);
        //make start point as Sunday of start week + (eachNWeek-1) weeks due to find first sunday for checking            
        newDateTime = addDate(newDateTime, 0, 0, 7*(schedule.eachNWeek - 1), 0, 0, 0);
        //find Sunday of current week    
        let currentDate = new Date((new Date()).setUTCHours(0, 0, 0, 0));
        let currentWeekSunday = addDate(currentDate, 0, 0, -currentDate.getUTCDay(), 0, 0, 0);            
        //find Sunday of week where next run day(s) are        
        while(newDateTime < currentWeekSunday) {
            newDateTime = addDate(newDateTime, 0, 0, 7*schedule.eachNWeek, 0, 0, 0);
        }          
        
        let calculationResult = calculateWeekDayOfRun(schedule, newDateTime);
        if(calculationResult)
            newDateTime = calculationResult;

        //as far as begining of the week was found - start to search day for execution
        while(newDateTime < schedule.startDateTime || newDateTime < getDateTime()) {
            newDateTime = addDate(newDateTime, 0, 0, 7*schedule.eachNWeek, 0, 0, 0);   
            calculationResult = calculateWeekDayOfRun(schedule, newDateTime);       
            if(calculationResult)
                newDateTime = calculationResult;
        }         
        result = newDateTime;      
    }  
    //month
    //check
    if(schedule.endDateTime) {
        if(result)
            return result > schedule.endDateTime ? null : result;
        else
            return null;
    }
    else
        return result;

}