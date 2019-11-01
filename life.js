const readXlsxFile = require('read-excel-file/node');

let getLifeData = readXlsxFile(__dirname+'/server/life.xlsx').then((rows) => {
  let sorted = rows.map((val) =>
    val.reduce((total,inner,index) => {

      if (inner) Object.assign(total,{
        [rows[0][index]]: inner
      })
      return total;
    },{})
  ).filter((val,index) => index != 0);

  sorted.map(val => {
    Object.keys(val).forEach(key => {
      if (key == 'Date') return;
      let arr = val[key].replace('/\r/\n','').trim().split(';');
      let values = arr.reduce((total,nVal) => {
        if (!nVal) return total;
        total.push(
          {[nVal.split(':')[0].replace('\r\n','')]: nVal.split(':')[1].trim()}
        );
        return total;
      },[])
      val[key] = values;
    });
    return val;
  })

  console.log(sorted);
});

module.exports = {getLifeData}
