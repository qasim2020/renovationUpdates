require('./config/config');
const readXlsxFile = require('read-excel-file/node');
const {People} = require('./models/people');
const {mongoose} = require('./db/mongoose');

let slot = 7,
    today = new Date();

function startcalc(sorted, day) {
  if (day > 200) {
    return sorted;
    // return console.log(JSON.stringify(sorted, null, 4));
  }
  var thisDate = new Date();
  thisDate.setDate(today.getDate() + day);

  sorted = sorted.map(val => {
    val.daysSinceArrival = Math.floor((thisDate - val['Returned(ing)'])/1000/60/60/24);
    return val;
  })

  onleave = sorted.reduce((total,val) => {
    if (val.daysSinceArrival > 0) return total;
    return total += 1;
  },0)

  // is slot available
  if (onleave >= slot) {
    day += 1;
    console.log('slot not available, next day');
    return startcalc(sorted, day);
  }

  // sort list with days since arrival
  sorted.sort((a,b) => b.daysSinceArrival - a.daysSinceArrival);

  // 1st name arrival > 30 days ?
  if (sorted[0].daysSinceArrival < 30) {
    day += 1;
    console.log('not due a leave, next day. Last arrival is ' + sorted[0].daysSinceArrival);
    return startcalc(sorted, day);
  }

  // Days since last M > 90 Days ?
  let daysSinceMajArrival = Math.floor((thisDate - sorted[0]['Last Maj Lve'])/1000/60/60/24);
  // console.log({daysSinceMajArrival, daysSinceArrival: sorted[0]['daysSinceArrival']});
  if (daysSinceMajArrival < 90 && sorted[0]['daysSinceArrival'] > 29) {
    // console.log({daysSinceArrival: sorted[0].daysSinceArrival, daysSinceMajArrival});
    let R = sorted[0].daysSinceArrival;
    let M = daysSinceMajArrival;
    if (R == M) {
      console.log('give 3 days weekend');
      sorted[0] = allotLeave('W1',sorted[0],thisDate);
      return startcalc(sorted, day);
    }
    else {
      console.log('give 2 days weekend');
      sorted[0] = allotLeave('W2',sorted[0],thisDate);
      return startcalc(sorted, day);
    }
  }

  // P leave in previous 3 months or next 3 months?
  let daysinPleave = Math.abs(Math.floor((sorted[0]['P Lve'] - thisDate)/1000/60/60/24));
  if (daysinPleave < 60) {
    console.log('give him p leave');
    sorted[0] = allotLeave('P Lve',sorted[0],thisDate);
    sorted[0]['P Lve'] = addDays(thisDate, 30 * 11);
    return startcalc(sorted, day);
  } else {
    console.log('give him c leave');
    sorted[0] = allotLeave('C Lve',sorted[0],thisDate);
    return startcalc(sorted, day);
  }

}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function allotLeave(leaveType,person,thisDate) {
  if (!person['leave']) person['leave'] = [];
  if (!person['MC']) person['MC'] = 0;
  switch (leaveType) {
    case 'P Lve':
      person['leave'].push({
        leave: 'P Lve',
        start: addDays(thisDate,1),
        end: addDays(thisDate,30 + (Number(person['Addl Days']) || 0) + (person.MC || 0)),
        specialDays: person.MC
      });
      person['Last Maj Lve'] = addDays(thisDate,30 + (Number(person['Addl Days']) || 0) + (person.MC || 0));
      person['Returned(ing)'] = person['Last Maj Lve'];
      break;
    case 'C Lve':
      person['leave'].push({
        leave: 'C Lve',
        start: addDays(thisDate,1),
        end: addDays(thisDate,13 + (Number(person['Addl Days']) || 0) + (person.MC || 0)),
        specialDays: person.MC
      });
      person['Last Maj Lve'] = addDays(thisDate,13 + (Number(person['Addl Days']) || 0) + (person.MC || 0));
      person['Returned(ing)'] = person['Last Maj Lve'];
      break;
    case 'W1':
      person['leave'].push({
        leave: 'W1',
        start: addDays(thisDate,1),
        end: addDays(thisDate,4 + (Number(person['Addl Days']) || 0) + (person.MC || 0)),
        specialDays: person.MC
      });
      person['Returned(ing)'] = addDays(thisDate,4 + (Number(person['Addl Days']) || 0) + (person.MC || 0));
      break;
    case 'W2':
      person['leave'].push({
        leave: 'W2',
        start: addDays(thisDate,1),
        end: addDays(thisDate,3 + (Number(person['Addl Days']) || 0) + (person.MC || 0)),
        specialDays: person.MC
      });
      person['Returned(ing)'] = addDays(thisDate,3 + (Number(person['Addl Days']) || 0) + (person.MC || 0));
      break;
    default: break;
  }
  person.MC = 0;
  return person;
}

People.find({}).then(sorted => {
  let slotArray = [],
      daysToCalc = 100;

  for (var i = 0; i < daysToCalc; i++) {
    slotArray[i] = {
      date: addDays(new Date(), i),
      slot: 8
    };
  }

  updatecalc(slotArray, 0, sorted, daysToCalc);

}).catch(e => console.log(e));

function updatecalc(slotArray, day, sorted, daysToCalc) {

  if (day > daysToCalc - 1) return sorted;

  // is slot available

  var thisDate = addDays(new Date(), day);

  let onLeave = sorted.map(val => {
    return val.leave.some(val => thisDate >= val.start && thisDate <= val.end ); // true if in between
  }).filter(val => val).length;

  let todaysSlot = slotArray.find(val => `${val.date.getDate()}, ${val.date.getMonth()}, ${val.date.getMonth()}` == `${thisDate.getDate()}, ${thisDate.getMonth()}, ${thisDate.getMonth()}` )

  if (todaysSlot.slot >= onLeave) return updatecalc(slotArray, day + 1, sorted, daysToCalc);

  // sort list with daysSinceArrival

}











module.exports = {startcalc, addDays, allotLeave, updatecalc}
