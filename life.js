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
  let weekendsMissed = 0;
  console.log('-----++++----');


  // sort this person leaves
  let sortedLeaves = person.leave.sort((a,b) => b.end - a.end)
  // get only leaves that are before thisDate
  .filter(val => val.end < thisDate);

  console.log(sortedLeaves);

  let specialDays_Sum = sortedLeaves.reduce((sum,val) => {
    // if (/W/g.test(val)) return sum;
    console.log({specialDays: val.specialDays});
    return sum += Number(val.specialDays);
  },0);

  console.log('======');
  console.log({specialDays_Sum});
  console.log('-======');

  if (/P|C/g.test(leaveType)) {
    // Calculate weekends missed from prvs major leave till today
    // All leaves since previous major leave

    let weekendsAvailed = 0;

    while (/W/.test(sortedLeaves.shift())) {
      weekendsAvailed++;
    }

    2 - weekendsAvailed > 0 ? weekendsMissed = 2 - weekendsAvailed : weekendsMissed = 0;

    // no of weekends availed since today

  }

  // no of weekends missed before

  if (/W2/g.test(leaveType) && /W/g.test(sortedLeaves.shift())) weekendsMissed = 0;

  // console.log({weekendsAvailed});

  // return console.log(sortedLeaves);

  person.MC = person.MC + weekendsMissed - specialDays_Sum;

  console.log({leaveType, weekendsMissed, specialDays_Sum, MC: person.MC});


  // return console.log({specialDays_Sum});

  switch (leaveType) {
    case 'P':
      person['leave'].push({
        leaveType: 'P',
        start: addDays(thisDate,1),
        end: addDays(thisDate,30 + (Number(person['Addl Days']) || 0) + (person.MC || 0)),
        specialDays: person.MC
      });
      person['Last Maj Lve'] = addDays(thisDate,30 + (Number(person['Addl Days']) || 0) + (person.MC || 0));
      person['Returned(ing)'] = person['Last Maj Lve'];
      break;
    case 'C':
      person['leave'].push({
        leaveType: 'C',
        start: addDays(thisDate,1),
        end: addDays(thisDate,13 + (Number(person['Addl Days']) || 0) + (person.MC || 0)),
        specialDays: person.MC
      });
      person['Last Maj Lve'] = addDays(thisDate,13 + (Number(person['Addl Days']) || 0) + (person.MC || 0));
      person['Returned(ing)'] = person['Last Maj Lve'];
      break;
    case 'W1':
      person['leave'].push({
        leaveType: 'W1',
        start: addDays(thisDate,1),
        end: addDays(thisDate,4 + (Number(person['Addl Days']) || 0) + (person.MC || 0)),
        specialDays: person.MC
      });
      person['Returned(ing)'] = addDays(thisDate,4 + (Number(person['Addl Days']) || 0) + (person.MC || 0));
      break;
    case 'W2':
      person['leave'].push({
        leaveType: 'W2',
        start: addDays(thisDate,1),
        end: addDays(thisDate,3 + (Number(person['Addl Days']) || 0) + (person.MC || 0)),
        specialDays: person.MC
      });
      // person['Returned(ing)'] = addDays(thisDate,3 + (Number(person['Addl Days']) || 0) + (person.MC || 0));
      break;
    default: break;
  }
  person.MC = 0;
  // console.log(person);
  console.log(';;;;;;;;;');
  return person;
}

// People.find({}).lean().then(sorted => {
//   let slotArray = [],
//       daysToCalc = 60;
//
//   for (var i = 0; i < daysToCalc; i++) {
//     slotArray[i] = {
//       date: addDays(new Date(), i),
//       slot: 8
//     };
//   }
//   // console.log(sorted);
//
//   sorted = updatecalc(slotArray, 0, sorted, daysToCalc);
//
//   // console.log(sorted);
//
// }).catch(e => console.log(e));

function updatecalc(slotArray, day, sorted, daysToCalc) {

  let originalPeople = sorted;

  // console.log(originalPeople);

  if (day > daysToCalc - 1) return sorted;

  // is slot available

  var thisDate = addDays(new Date(), day);

  let onLeave = sorted.map(val => {
    return val.leave.some(val => thisDate >= val.start && thisDate <= val.end ); // true if in between
  }).filter(val => val).length;

  let todaysSlot = slotArray.find(val => `${val.date.getDate()}, ${val.date.getMonth()}, ${val.date.getMonth()}` == `${thisDate.getDate()}, ${thisDate.getMonth()}, ${thisDate.getMonth()}` )

  if (onLeave >= todaysSlot.slot) {
    day += 1;
    return updatecalc(slotArray, day, originalPeople, daysToCalc);
  }

  // get fwd and back distance

  sorted = sorted.filter(val => val.leave.every(val => !(thisDate >= val.start && thisDate <= val.end) ))
  .map(val => {
    console.log(thisDate, val.leave, val.leave.filter(val => thisDate > val.end));
      return Object.assign(val,{
        back: val.leave.filter(val => thisDate > val.end).sort((a,b) => b.end - a.end)[0].end,
        backMaj: val.leave.filter(val => thisDate > val.end && /C|P/g.test(val.leaveType)).sort((a,b) => b.end - a.end)[0].end,
        fwd: getFwdDistance(val, thisDate, 'C|P|W1|W2'),
        fwdMaj: getFwdDistance(val, thisDate, 'C|P')
      })
  }).filter(val => diff(val.back, thisDate) > 30 || diff(val.fwd, thisDate) > 30) // leave not granted in last 30 days
  .sort((a,b) => a.back - b.back)
  .slice(0,todaysSlot.slot); // Get elements with slot list available

  // console.log('+++++++');
  // console.log(sorted);
  // console.log('------');


  // Swtich to allot leave

  sorted = sorted.map(p => {
    console.log({
      // name: p.Name.split(' ')[0],
      back: diff(p.back, thisDate),
      backMaj: diff(p.backMaj, thisDate),
      // backDate: p.backMaj,
      fwd: diff(p.fwd, thisDate),
      fwdMaj: diff(p.fwdMaj, thisDate)
    });
    switch (true) {
      case (diff(p.back, thisDate) > 30 && diff(p.backMaj, thisDate) < 70 && diff(p.fwd, thisDate) > 30):
        if (p.back == p.backMaj) {
          console.log('give 3 days weekend');
          p = allotLeave('W1',p,thisDate);
        }
        else {
          console.log('give 2 days weekend');
          p = allotLeave('W2',p,thisDate);
        }
        break;
      case (diff(p.backMaj,thisDate) > 70 && diff(p.fwdMaj,thisDate) > 60 && diff(p.back, thisDate) > 30 && diff(p.fwd, thisDate) > 30):
        let daysinPleave = Math.abs(Math.floor(p['P Lve'] - thisDate)/1000/60/60/24);
        if (daysinPleave < 60) {
          console.log('give him p leave');
          p = allotLeave('P',p,thisDate);
          p['P Lve'] = addDays(thisDate, 30 * 11);
        } else {
          console.log('give him c leave');
          p = allotLeave('C',p,thisDate);
        }
        break;
      default:
        console.log('No condition met');
    }
    return p;
  })

  // console.log(sorted[0]);

  // console.log('+=+=+++++++=======+');

  originalPeople = originalPeople.map(o => {
    let person = sorted.find(val => val._id == o._id) || o;
    return o;
  })

  // console.log(originalPeople);


  // console.log('*******');

  // console.log(JSON.stringify(sorted, 0,2));

  // TODO: add 1 to day and re run current function for next day

  day += 1;

  return updatecalc(slotArray, day, originalPeople, daysToCalc);

}

function diff(date, thisDate) {
  return Math.abs(Math.floor((date - thisDate) /1000/60/60/24));
}

function getFwdDistance(val, thisDate, regex) {
  try {
    var regex = new RegExp(regex);
    return val.leave.filter(val => {
      return thisDate < val.start && regex.test(val.leaveType);
    }).sort((a,b) => a.start - b.start)[0].start
  } catch (e) {
    return addDays(thisDate, 365);
  }
}

module.exports = {startcalc, addDays, allotLeave, updatecalc}
