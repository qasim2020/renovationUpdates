require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');

hbs.handlebars === require('handlebars');
const _ = require('lodash');
const moment = require('moment');
const readXlsxFile = require('read-excel-file/node');

const {People} = require('./models/people');
const {mongoose} = require('./db/mongoose');
const {sendmail} = require('./js/sendmail');
const {sheet} = require('./server/sheets.js');
const {startcalc,addDays, updatecalc} = require('./life.js');

var app = express();
var port = process.env.PORT || 3000;
app.use(express.static(__dirname+'/static'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine','hbs');

hbs.registerHelper("fixText",function (text) {
  if (!text) return;
  // console.log(typeof text);
  text = text.toString().trim().replace(/\r\n/g,'').split(';');
  text = text.reduce((total,val) => {
    return total + `<p>` + val + `<p>`;
  }, '')
  return text;
})

hbs.registerHelper("ifTopic",function (data, compareTo) {
  return Object.keys(data).some(key => key == compareTo);
})

hbs.registerHelper("matchValues", function(page, val) {
  try {
    if (page == val) return true;
    let object = page[Object.keys(page)[0]].split(',').reduce((total,value) => {
      Object.assign(total,{
        [value.split('- ')[0].trim()]: value.split('- ')[1].trim()
      });
      return total;
    },{})
    // console.log({val,value: object[val], length: object[val].length});
    if (object[val].length > 0) return true;
    return false;
  } catch (e) {
    return false;
  }
})

hbs.registerHelper("checkValueExists", function(data, position) {
  try {
    let value = Object.keys(data)[0];
    return data[value].split(',')[position].split('- ')[1].length > 0
  }
  catch(e) {
    return false;
  }

})

hbs.registerHelper("getObjectValue", (data,position) => {
  // console.log(data);
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      return data[key].split(',')[position].split('- ')[1];
    }
  }
})

hbs.registerHelper("getTopicsListed", (data, key) => {
  return data[key].split(',').reduce((total,val) => {
    if (val.indexOf('Chapter') != -1) return total += `<li class="section">${val}</li>`;
    return total += `<li>${val}</li>`;
  },'');
})

hbs.registerHelper("getObjectUsingKey", (data, key) => {
  // let value = Object.keys(data)[0];
  let object = data[Object.keys(data)[0]].split(',').reduce((total,value) => {
    Object.assign(total,{
      [value.split('- ')[0].trim()]: value.split('- ')[1].trim()
    });
    return total;
  },{});
  return object[key];
})

app.get('/',(req,res) => {

  let dateToday = moment().format('YYYY-MM-DD');

  readXlsxFile(__dirname+'/server/life.xlsx').then((rows) => {
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
            {[nVal.split(': ')[0].replace('\r\n','')]: nVal.split(': ')[1].trim()}
          );
          return total;
        },[])
        val[key] = values;
      });
      return val;
    });

    let askedPage = req.query.pagerequest && req.query.pagerequest.toUpperCase() || 'SRE';

    sorted = sorted.map((val,index) => {
      return val[askedPage.toUpperCase()];
    })

    // console.log({pagerequest: req.query.pagerequest,sorted});

    sorted[0] = {
      Subject: sorted[0][0].Subject,
      Instructor: sorted[0][1].Instructor,
      ClassSenior: sorted[0][2].ClassSenior,
      Note: sorted[0][3].Note,
      CreditHours: sorted[0][4].CreditHours,
    }

    // console.log(sorted);

    console.log(askedPage.toUpperCase());

    res.render('abasyn.hbs',{
        sorted,
        [askedPage.toLowerCase()]: 'active',
        pagerequest: askedPage.toUpperCase()
      });
  });

});

app.get('/getSuggestions',(req,res) => {
  sheet('external','todayUpdates').then((msg)=> {
    res.status(200).send(msg);
  }).catch((e) => {
    console.log(e);
    res.status(400).send(e);
  });
});

app.get('/getOldData',(req,res) => {
  sheet('old','read').then((msg) => {
    res.status(200).send(msg);
  }).catch((e) => {
    console.log(e.response.status,e.response.statusText);
    res.status(400).send(e);
  });
})

app.post('/data',(req,res) => {
  // _.pick(req.body,['timestamp','date','loc','category','name','responsibility','work','quantity','unit','remarks']);
  let arr = req.body;
  if (arr.length != 10) return res.status(400).send('Please fill all the fields in the form.');
  sheet('external','update',[arr]).then((msg) => {
    return res.status(200).send(msg);
  }).catch((e) => {
    console.log(e);
    return res.status(400).send(e);
  })
});

app.post('/oldDataUpload',(req,res) => {
  sheet('oldformatted','batchUpdate',req.body).then((msg) => {
    return res.status(200).send(msg);
  }).catch((e) => {
    console.log(e);
    res.status(400).send(e);
  })
});

app.post('/sendmail',(req,res) => {
  console.log(req.body.val);
  sendmail('qasimali24@gmail.com',req.body.val,'Feedback from Abasyn').then((msg) => {
    res.status(200).send(msg)
  }).catch(e => {
    console.log(e);
    res.status(400).send(e);
  });
})

hbs.registerHelper("getDateForCol", (date) => {
  let isThisToday = `${date.getMonth()}${date.getDate()}${date.getYear()}` == `${new Date().getMonth()}${new Date().getDate()}${new Date().getYear()}`;
  let isThisLastDay = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate() == date.getDate();
  return `
  <th class="rotate partition_${isThisLastDay}" id="${date.getMonth()}${date.getDate()}${date.getYear()}">
    <div>
      <span id="col_${isThisToday}">${date.toString().trim().split(' ').slice(1,4).join(' ')}</span>
    </div>
  </th>`

})

hbs.registerHelper("drawTableRows", (cols,person) => {
  cols = cols.map(val => {
    let found = person.leave.find(elem => {
      if (elem.specialDays < 0) {
        return val >= elem.start && val <= addDays(elem.end, Math.abs(elem.specialDays));
      } else {
        return val >= elem.start && val <= elem.end;
      }
    });

    let newCol = "";
    let isThisLastDay = new Date(val.getFullYear(), val.getMonth()+1, 0).getDate() == val.getDate();
    let isThisLessThenToday = new Date().getTime() > val.getTime();

    if (!found) {
      newCol = `<td class="partition_${isThisLastDay}"><div class="${val.toString().trim().split(' ').slice(1,4).join('-')}"></div></td>`;

    } else {

      let data = `<p>${person.Rank} ${person.Name}</p>
  		<p>Leave: ${found.leaveType}</p>
  		<p>Starts: ${found.start.toString().trim().split(' ').slice(0,4).join(' ')}</p>
  		<p>Ends: ${found.end.toString().trim().split(' ').slice(0,4).join(' ')}</p>`;
      if (found.specialDays < 0) {
        console.log({
          specialDays: found.specialDays,
          diff: (found.end - val)/1000/60/60/24,
          bool:  ((found.end - val)/1000/60/60/24) >= found.specialDays
        });
      }
      switch (true) {
        case (found.specialDays < 0 && ((found.end - val)/1000/60/60/24) >= found.specialDays && val > found.end):
          console.log('negative special days');
          newCol = `<td class="low_${isThisLessThenToday}"><div my_id="${person._id}" class="${val.toString().trim().split(' ').slice(1,4).join('-')} specialDays_minus active">${found.specialDays}</div></td>`;
          break;
        case (found.specialDays > 0 && (found.end - val)/1000/60/60/24 <= found.specialDays):
          console.log('positive special days');
          newCol = `<td class="low_${isThisLessThenToday}"><div my_id="${person._id}" data-today="${val.toString().trim().split(' ').slice(1,4).join('-')}" class="${val.toString().trim().split(' ').slice(1,4).join('-')} ${found.leaveType} active specialDays_plus" leave-ending="${found.end}" my-data="${data}">${found.leaveType}</div></td>`
          break;
        default:
          newCol = `<td class="low_${isThisLessThenToday}"><div my_id="${person._id}" data-today="${val.toString().trim().split(' ').slice(1,4).join('-')}" class="${val.toString().trim().split(' ').slice(1,4).join('-')} ${found.leaveType} active" leave-ending="${found.end}" my-data="${data}">${found.leaveType}</div></td>`
      }

    }

    return newCol;

  })
  return cols.join('');
})

app.get('/updateFromExcel', (req,res) => {
	readXlsxFile(__dirname+'/server/leaveplan.xlsm').then((row) => {
    let sorted = row.map((val) =>
      val.reduce((total,inner,index) => {
        if (inner) Object.assign(total,{
          [row[0][index]]: inner
        })
        return total;
      },{})
    ).filter((val,index) => Object.keys(val).length > 2 && index != 0);

		sorted = startcalc(sorted, 0);

		People.insertMany(sorted).then(msg => res.status(200).send(msg)).catch(e => res.status(400).send(e));
	})

})


app.get('/office', (req,res) => {

  let cols = [], rows = [];
  for (var i = 0; i < 300; i++) {
    let date = addDays(new Date('1 Sep 2019'), i);
    cols.push(date);
  }
  for (var i = 0; i < 30; i++) {
    rows.push(i);
  }

  People.find().then((sorted) => {
		res.render('office.hbs',{
			rows,cols,sorted
		})
	}).catch(e => {
    console.log(e);
    res.status(400).send(e)
  });

})

app.post('/updateManualCtr', (req,res) => {

	// People.bulkWrite(req.body.onLeave.map(val => {
	// 		return {
	// 			updateOne: {
	// 				"filter" : {_id: val.id},
	// 				"update": {$set: {leave: '', 'Returned(ing)': val.returning}}
	// 			}
	// 		}
	// })).then(msg => console.log(msg));
  //
	// People.updateMany({_id: {$in: req.body.notOnLeave}},{$set: {leave: '', 'manualCtr': req.body.extraDaysBonus}}).then(msg => console.log(msg));
	return res.status(200).send(req.body);

})

app.post('/saveCalculated', (req,res) => {
  let slotArray = [],
      daysToCalc = 300;

  for (var i = 0; i < daysToCalc; i++) {
    slotArray[i] = {
      date: addDays(new Date(), i),
      slot: 8
    };
  }
  People.find().then((sorted) => {
    sorted = updatecalc(slotArray, 0, sorted, daysToCalc);
    return People.bulkWrite(sorted.map(val => {
  			return {
  				updateOne: {
  					"filter" : {_id: val._id},
  					"update": {$set: {leave: val.leave}}
  				}
  			}
  	}))
  }).then(msg => console.log(msg))
  .catch(e => {
    console.log(e);
    res.status(400).send(e)
  });

})

app.get('/profile',(req,res) => {
  console.log(req.query.id);
  People.findById(mongoose.Types.ObjectId(req.query.id)).lean().then(person => {
    console.log(person);
    person.leave = person.leave.sort((a,b) => a.end - b.end);
    res.status(200).render('person.hbs',{person})
  }).catch(e => res.status(400).send(e));
})

app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});
