const readXlsxFile = require('read-excel-file/node');

readXlsxFile(__dirname+'/server/leaveplan.xlsm').then((rows) => {
  let formattedData = rows.map(val => {
    return {name: val[1], rank: val[0], nextLeave: val[2], nextLeaveDuration: val[3], lastArrival: val[4], onleave: new Date() - val[4] < 0, onDutyPeriod: Math.round((new Date() - val[4]) / 24 / 60 / 60 / 1000)}
  }).filter(val => {
    return val.rank;
  });

  let longestPeriodSorted = formattedData.sort((a,b) => b.onDutyPeriod - a.onDutyPeriod).filter(val => val.onDutyPeriod > 0);

  let onLeave = formattedData.reduce((total,val) => {
    if (val.onleave) return total+1;
    return total;
  },0)

  console.log(longestPeriodSorted, onLeave);

  // let longestPeriodSorted = formattedData.sort((a,b) => b.onDutyPeriod - a.onDutyPeriod).filter(val => val.onDutyPeriod > 0);

  // console.log(longestPeriodSorted);

  // let leaveSlot = 6, todaysLeaves = [];
  //
  // for (var i = 0; i < 2; i++) {
  //
  //   let date = new Date();
  //   let iteratedDate = date.addDays(i)
  //
  //   let longestPeriodSorted = formattedData.sort((a,b) => b.onDutyPeriod - a.onDutyPeriod).filter(val => val.onDutyPeriod > 0);
  //
  //   let onLeave = formattedData.reduce((total,val) => {
  //     if (val.onleave) return total+1;
  //     return total;
  //   },0)
  //
  //   todaysLeaves.push(longestPeriodSorted.map(val => {
  //     if (onLeave > leaveSlot) return {index: i, name: val.name, leaveAlloted: false};
  //     leaveSlot = leaveSlot - 1;
  //     formattedData = formattedData.map(val => {
  //       return {... {
  //         leaveAlloted: val.nextLeave,
  //         leaveDuration: val.nextLeaveDuration,
  //       }}
  //     });
  //     return {index: i, name: val.name, onLeave: true, leaveAlloted: val.nextLeave, leaveDuration: val.nextLeaveDuration }
  //   }))
  //
  // }
  //
  // console.log(todaysLeaves);


  // let futureDays = [];

  // let date = new Date();
  //
  // for (i = 0; i < 30; i++) {
  //
  //   // futureDays.push(date.addDays(i));
  //
  //   if (onLeave > leaveSlot) return;
  //
  //   // check longest period without leave
  //
  //   let longestPeriod = formattedData.filter(val => {
  //     return
  //   })
  //
  //   //
  //
  // }
  //
  // // console.log(futureDays);
  //
  // // go through each person for each date
  //
  // let datavsdate = futureDays.map(val => {
  //   if (onLeave > leaveSlot)
  //   return {
  //     day: val,
  //     leaveAval: onLeave > leaveSlot,
  //   }
  // })
  //
  // console.log(datavsdate);

  // check the longest period a person is away

  // give leave as suggested

  // update that person record and show in console
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
