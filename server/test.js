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

  let longestPeriodSorted = [];

  let leaveSlot = 10;

  for (var i = 0; i < 10; i++) {

    longestPeriodSorted = formattedData.sort((a,b) => b.onDutyPeriod - a.onDutyPeriod).filter(val => val.onDutyPeriod > 0);

    let onLeave = formattedData.reduce((total,val) => {
      if (val.onleave) return total+1;
      return total;
    },0)

    // console.log({onLeave, leaveSlot});

    console.table(longestPeriodSorted)


    while (onLeave < leaveSlot) {
      onLeave = onLeave + 1;
      if (longestPeriodSorted.length < 1) continue;
      switch (true) {
          case /(WW)$/.test(longestPeriodSorted[0].nextLeave):
            formattedData = updateData(formattedData, longestPeriodSorted[0], 'WWC', 10, i)
            // console.log(`matched *WW ${longestPeriodSorted[0].nextLeave}  C`);
            console.table(formattedData.find(val => longestPeriodSorted[0].name == val.name));
            break;
          case /(WC)$/.test(longestPeriodSorted[0].nextLeave):
            formattedData = updateData(formattedData, longestPeriodSorted[0], 'WCW', 4, i)
            // console.log(`matched *WC ${longestPeriodSorted[0].nextLeave}  W`);
            console.table(formattedData.find(val => longestPeriodSorted[0].name == val.name));
            break;
          case /(CW)$/.test(longestPeriodSorted[0].nextLeave):
            formattedData = updateData(formattedData, longestPeriodSorted[0], 'CWW', 4, i)
            // console.log(`matched *CW ${longestPeriodSorted[0].nextLeave}  W`);
            console.table(formattedData.find(val => longestPeriodSorted[0].name == val.name));
            break;
          case /(PW)$/.test(longestPeriodSorted[0].nextLeave):
            formattedData = updateData(formattedData, longestPeriodSorted[0], 'PWW', 4, i)
            // console.log(`matched *PW ${longestPeriodSorted[0].nextLeave}  W`);
            console.table(formattedData.find(val => longestPeriodSorted[0].name == val.name));
            break;
          case /(WP)$/.test(longestPeriodSorted[0].nextLeave):
            formattedData = updateData(formattedData, longestPeriodSorted[0], 'WPW', 4, i)
            // console.log(`matched *WP ${longestPeriodSorted[0].nextLeave}  W`);
            console.table(formattedData.find(val => longestPeriodSorted[0].name == val.name));
            break;
          default:
            console.log(longestPeriodSorted[0].nextLeave);
        }

        longestPeriodSorted.shift();
    }

    formattedData = formattedData.map(val => {
      return Object.assign(val, {
        onleave: (new Date()).addDays(i) - val.lastArrival < 0,
        onDutyPeriod: Math.round(((new Date()).addDays(i) - val.lastArrival)/ 24 / 60 / 60 / 1000),
      })
    })

  };

  console.table(formattedData);

  // return;
    //
    // let longestPeriodSorted = formattedData.sort((a,b) => b.onDutyPeriod - a.onDutyPeriod).filter(val => val.onDutyPeriod > 0);
    //
    // let onLeave = formattedData.reduce((total,val) => {
    //   if (val.onleave) return total+1;
    //   return total;
    // },0)
    //
    // console.table({onLeave, leaveSlot});
    //
    // let date = (new Date()).addDays(i);
    //
    // console.log(`this is ${date}`);
    //
    // if (leaveSlot <= onLeave) {
    //   console.log('empty data into the array');
    //   formattedData = formattedData.map(val => {
    //     return Object.assign(val, {
    //       onleave: (new Date()).addDays(i) - val.lastArrival < 0,
    //     })
    //   })
    //   continue;
    // }
    //
    // while (leaveSlot > onLeave) {
    //   console.log(`giving leave to ${longestPeriodSorted[0].name}`);
    //   leaveSlot = leaveSlot - 1;
    //   switch (true) {
    //     case /(WW)$/.test(longestPeriodSorted[0].nextLeave):
    //       formattedData = updateData(formattedData, longestPeriodSorted[0], 'WWC', 10)
    //       // console.log(`matched *WW ${longestPeriodSorted[0].nextLeave}  C`);
    //       // console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
    //       break;
    //     case /(WC)$/.test(longestPeriodSorted[0].nextLeave):
    //       formattedData = updateData(formattedData, longestPeriodSorted[0], 'WCW', 4)
    //       // console.log(`matched *WC ${longestPeriodSorted[0].nextLeave}  W`);
    //       // console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
    //       break;
    //     case /(CW)$/.test(longestPeriodSorted[0].nextLeave):
    //       formattedData = updateData(formattedData, longestPeriodSorted[0], 'CWW', 4)
    //       // console.log(`matched *CW ${longestPeriodSorted[0].nextLeave}  W`);
    //       // console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
    //       break;
    //     case /(PW)$/.test(longestPeriodSorted[0].nextLeave):
    //       formattedData = updateData(formattedData, longestPeriodSorted[0], 'PWW', 4)
    //       // console.log(`matched *PW ${longestPeriodSorted[0].nextLeave}  W`);
    //       // console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
    //       break;
    //     case /(WP)$/.test(longestPeriodSorted[0].nextLeave):
    //       formattedData = updateData(formattedData, longestPeriodSorted[0], 'WPW', 4)
    //       // console.log(`matched *WP ${longestPeriodSorted[0].nextLeave}  W`);
    //       // console.log(formattedData.find(val => longestPeriodSorted[0].name == val.name));
    //       break;
    //     default:
    //       console.log(longestPeriodSorted[0].nextLeave);
    //   }
    //
    //   longestPeriodSorted.shift();
    //
    // }
    //
    // leaveSlot = 10;

  // }

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

function updateData(data, object, string, duration, count) {
  // count total leaves alloted so far
  // let count = val.reduce((total,val) => {
  //   if (val.leave && val.leave.length > 0) return total += 1;
  //   return total;
  // },0)
  //
  let updated = data.map(val => {
    if (val.name == object.name) {

      return Object.assign(val,{
        nextLeave: string,
        lastArrival: (new Date()).addDays(duration),
        onleave: true,
        onDutyPeriod: (new Date()) - (new Date()).addDays(duration),
        [`${((new Date()).addDays(count)).getDate()} - ${((new Date()).addDays(count)).getMonth()} - ${((new Date()).addDays(count)).getFullYear()}`]: `${duration + val.nextLeaveDuration} days ${string.substr(-1)} leave`
      })
    }
    return val;
  })

  return updated;
}
