require('./config/config');

const readXlsxFile = require('read-excel-file/node');
const {People} = require('./models/people');
const {mongoose} = require('./db/mongoose');
const {startcalc,addDays, allotLeave} = require('./life.js');

let loadData = function() {
  return new Promise(function(resolve, reject) {

    People.remove({}).then(() => {
      return readXlsxFile(__dirname+'/server/LMS.xlsx')
    }).then((row) => {

      let array = [];
      let sorted = row.map((val) =>
        val.reduce((total,inner,index) => {

          if (!inner) return total;

          if (row[0][index] == 'leave' && inner != 'leave') {
            if (!total.hasOwnProperty('leave')) total.leave = [];
            let arr = inner.replace('\r\n','').trim().split(';');
            let values = arr.reduce((total,nVal) => {
              if (!nVal) return total;
              Object.assign(total, {
                [nVal.split(':')[0].replace('\r\n','').trim()]: nVal.split(':')[1].trim()
              });
              // console.log(total);
              return total;
            },{})
            total['leave'][total.leave.length] = values;
          } else {
            Object.assign(total,{
              [row[0][index]]: inner
            })
          }

          return total;

        },{})
      ).filter((val,index) => Object.keys(val).length > 2 && index != 0);

      console.log(JSON.stringify(sorted, 0, 2));

      People.insertMany(sorted).then(msg => resolve('Excel data has been saved. Refresh the page now!')).catch(e => reject(e));

    });
  });
}

module.exports = {loadData}
