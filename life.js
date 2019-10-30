const readXlsxFile = require('read-excel-file/node');

let getLifeData = readXlsxFile(__dirname+'/server/life.xlsx').then((rows) => {
  let sorted = rows.map((val) =>
    val.reduce((total,inner,index) => {

      if (inner) Object.assign(total,{
        [rows[0][index]]: inner
      })
      return total;
    },{})
  )
  console.log(sorted);
});

module.exports = {getLifeData}
