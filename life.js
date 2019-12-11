const readXlsxFile = require('read-excel-file/node');

let slot = 2,
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
  if (daysSinceMajArrival < 90 && sorted[0]['daysSinceArrival'] > 30) {
    // console.log({daysSinceArrival: sorted[0].daysSinceArrival, daysSinceMajArrival});
    let R = sorted[0].daysSinceArrival;
    let M = daysSinceMajArrival;
    if (R < M + 30) {
      console.log('give 3 days weekend');
      if (!sorted[0]['leave']) sorted[0]['leave'] = [];
      sorted[0]['leave'].push({
        leave: 'W1',
        start: addDays(thisDate,1),
        end: addDays(thisDate,3 + (Number(sorted[0]['Addl Days']) || 0))
      });
      sorted[0]['Returned(ing)'] = addDays(thisDate,3 + (Number(sorted[0]['Addl Days']) || 0));
      return startcalc(sorted, day);
    }
    else {
      console.log('give 2 days weekend');
      if (!sorted[0]['leave']) sorted[0]['leave'] = [];
      sorted[0]['leave'].push({
        leave: 'W2',
        start: addDays(thisDate,1),
        end: addDays(thisDate,2 + (Number(sorted[0]['Addl Days']) || 0))
      });
      sorted[0]['Returned(ing)'] = addDays(thisDate,2 + (Number(sorted[0]['Addl Days']) || 0));
      return startcalc(sorted, day);
    }
  }

  // P leave in previous 3 months or next 3 months?
  let daysinPleave = Math.abs(Math.floor((sorted[0]['P Lve'] - thisDate)/1000/60/60/24));
  if (daysinPleave < 90) {
    console.log('give him p leave');
    if (!sorted[0]['leave']) sorted[0]['leave'] = [];
    sorted[0]['leave'].push({
      leave: 'P Lve',
      start: addDays(thisDate,1),
      end: addDays(thisDate,30 + (Number(sorted[0]['Addl Days']) || 0))
    });

    sorted[0]['Last Maj Lve'] = addDays(thisDate,30 + (Number(sorted[0]['Addl Days']) || 0));
    sorted[0]['Returned(ing)'] = sorted[0]['Last Maj Lve'];
    sorted[0]['P Lve'] = addDays(thisDate, 30 * 11);
    return startcalc(sorted, day);
  } else {
    console.log('give him c leave');
    if (!sorted[0]['leave']) sorted[0]['leave'] = [];
    sorted[0]['leave'].push({
      leave: 'C Lve',
      start: addDays(thisDate,1),
      end: addDays(thisDate,13 + (Number(sorted[0]['Addl Days']) || 0))
    });

    sorted[0]['Last Maj Lve'] = addDays(thisDate,13 + (Number(sorted[0]['Addl Days']) || 0));
    sorted[0]['Returned(ing)'] = sorted[0]['Last Maj Lve'];
    return startcalc(sorted, day);
  }

  // console.log(JSON.stringify(sorted, null, 4));

}

function addDays(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

module.exports = {startcalc}
