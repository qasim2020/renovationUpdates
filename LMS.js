const readXlsxFile = require('read-excel-file/node');

readXlsxFile(__dirname+'/server/LMS.xlsx').then((row) => {
  let sorted = row.map((val) =>
    val.reduce((total,inner,index) => {

      if (inner) Object.assign(total,{
        [row[0][index]]: inner
      })

      return total;
    },{})
  ).filter((val,index) => Object.keys(val).length > 2 && index != 0);

  console.log(sorted);

});
