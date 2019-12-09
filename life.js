const readXlsxFile = require('read-excel-file/node');

readXlsxFile(__dirname+'/server/leaveplan.xlsm').then((rows) => {
  // console.log(rows);
  let sorted = rows.map((val) =>
    val.reduce((total,inner,index) => {
      if (inner) Object.assign(total,{
        [rows[0][index]]: inner
      })
      return total;
    },{})
  ).filter((val,index) => Object.keys(val).length > 2 && index != 0);

  sorted = startcalc(sorted, day);

  // Is it P lve ?

  // Allot C Lve || P Lve || Weekend
});

let slot = 2,
    today = new Date(),
    day = 0,
    counter = ['M','W1','W2'];


function startcalc(sorted, day) {
  if (day > 50) {
    return console.log(JSON.stringify(sorted, null, 4));
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
  if (daysSinceMajArrival < 90) {
    // console.log({daysSinceArrival: sorted[0].daysSinceArrival, daysSinceMajArrival});
    let R = sorted[0].daysSinceArrival;
    let M = daysSinceMajArrival;
    if (R < M + 30) {
      console.log('give 3 days weekend');
      if (!sorted[0]['leave']) sorted[0]['leave'] = [];
      let tempDate = new Date();
      sorted[0]['leave'].push({
        leave: 'W1',
        dateStart: thisDate,
        dateEnd: new Date(tempDate.setDate(thisDate.getDate() + 3 + (Number(sorted[0]['Addl Days']) || 0)))
      });
      sorted[0]['Returned(ing)'] = new Date(tempDate);
      return startcalc(sorted, day);
    }
    else {
      console.log('give 2 days weekend');
      if (!sorted[0]['leave']) sorted[0]['leave'] = [];
      let tempDate = new Date();
      sorted[0]['leave'].push({
        leave: 'W2',
        dateStart: thisDate,
        dateEnd: new Date(tempDate.setDate(thisDate.getDate() + 2 + (Number(sorted[0]['Addl Days']) || 0)))
      });
      sorted[0]['Returned(ing)'] = new Date(tempDate);
      return startcalc(sorted, day);
    }
  }

  // P leave in previous 3 months or next 3 months?
  let daysinPleave = Math.abs(Math.floor((sorted[0]['P Lve'] - thisDate)/1000/60/60/24));
  if (daysinPleave < 90) {
    console.log('give him p leave');
    if (!sorted[0]['leave']) sorted[0]['leave'] = [];
    let tempDate = new Date();
    sorted[0]['leave'].push({
      leave: 'P Lve',
      dateStart: thisDate,
      dateEnd: new Date(tempDate.setDate(thisDate.getDate() + 30 + (Number(sorted[0]['Addl Days']) || 0)))
    });

    sorted[0]['Last Maj Lve'] = new Date(tempDate);
    sorted[0]['Returned(ing)'] = new Date(tempDate);
    sorted[0]['P Lve'] = new Date(tempDate.setDate(thisDate.getDate() + 30 * 11));
    return startcalc(sorted, day);
  } else {
    console.log('give him c leave');
    if (!sorted[0]['leave']) sorted[0]['leave'] = [];
    let tempDate = new Date();
    sorted[0]['leave'].push({
      leave: 'C Lve',
      dateStart: thisDate,
      dateEnd: new Date(tempDate.setDate(thisDate.getDate() + 13 + (Number(sorted[0]['Addl Days']) || 0)))
    });

    sorted[0]['Last Maj Lve'] = new Date(tempDate);
    sorted[0]['Returned(ing)'] = new Date(tempDate);
    return startcalc(sorted, day);
  }
  
  console.log(JSON.stringify(sorted, null, 4));

}

// module.exports = {getLifeData}
