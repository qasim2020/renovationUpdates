const readXlsxFile = require('read-excel-file/node');

readXlsxFile(__dirname+'/server/leaveplan.xlsm').then((rows) => {
  let formattedData = rows.map(val => {
    return {
      name: val[1],
      rank: val[0],
      nextLeave: val[2],
      nextLeaveDuration: val[3],
      lastArrival: val[4],
      onleave: new Date() - val[4] < 0,
      onDutyPeriod: Math.round((new Date() - val[4]) / 24 / 60 / 60 / 1000)
    }
  }).filter(val => {
    return val.rank;
  });

  let leaveSlot = 10;

  for (var i = 0; i < 30; i++) {

    let longestPeriodSorted = formattedData.sort((a,b) => b.onDutyPeriod - a.onDutyPeriod).filter(val => val.onDutyPeriod > 0);

    let onLeave = formattedData.reduce((total,val) => {
      if (val.onleave) return total+1;
      return total;
    },0)

    console.log({onLeave});

    let date = (new Date()).addDays(i);

    console.log(`this is ${date}`);

    if (leaveSlot <= onLeave) {
      console.log('empty data into the array');
      formattedData = formattedData.map(val => {
        // console.log(val.name, (new Date()).addDays(i) - val.lastArrival < 0);
        return Object.assign(val, {
          onleave: (new Date()).addDays(i) - val.lastArrival < 0,
        })
      })
      continue;
    }

    while (leaveSlot > onLeave) {
      console.log(`giving leave to ${longestPeriodSorted[0].name}`);
      leaveSlot = leaveSlot - 1;
      switch (true) {
        case /(WW)$/.test(longestPeriodSorted[0].nextLeave):
          formattedData = updateData(formattedData, longestPeriodSorted[0], 'WWC', 10)
          console.log(`matched *WW ${longestPeriodSorted[0].nextLeave}  C`);
          console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
          break;
        case /(WC)$/.test(longestPeriodSorted[0].nextLeave):
          formattedData = updateData(formattedData, longestPeriodSorted[0], 'WCW', 4)
          console.log(`matched *WC ${longestPeriodSorted[0].nextLeave}  W`);
          console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
          break;
        case /(CW)$/.test(longestPeriodSorted[0].nextLeave):
          formattedData = updateData(formattedData, longestPeriodSorted[0], 'CWW', 4)
          console.log(`matched *CW ${longestPeriodSorted[0].nextLeave}  W`);
          console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
          break;
        case /(PW)$/.test(longestPeriodSorted[0].nextLeave):
          formattedData = updateData(formattedData, longestPeriodSorted[0], 'PWW', 4)
          console.log(`matched *PW ${longestPeriodSorted[0].nextLeave}  W`);
          console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
          break;
        case /(WP)$/.test(longestPeriodSorted[0].nextLeave):
          formattedData = updateData(formattedData, longestPeriodSorted[0], 'WPW', 4)
          console.log(`matched *WP ${longestPeriodSorted[0].nextLeave}  W`);
          console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
          break;
        default:
          console.log(longestPeriodSorted[0].nextLeave);
      }

      longestPeriodSorted.shift();

    }

  }

}).catch((e) => {
  console.log(e);
  res.status(400).render('1-redirect.hbs',{
    message: e,
    token: req.params.token,
    page: 'Add people',
    timer: 6,
    token: req.session.token
  })
})


Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function updateData(data, object, string, duration) {
  let updated = data.map(val => {
    if (val.name == object.name) {
      return Object.assign(val,{
        nextLeave: string,
        nextLeaveDuration: duration,
        lastArrival: (new Date()).addDays(duration),
        onDutyPeriod: Math.round((new Date() - (new Date()).addDays(duration)) / 24 / 60 / 60 / 1000),
        onleave: new Date() - (new Date()).addDays(duration) < 0
      })
    }
    return val;
  })

  return updated;
}
