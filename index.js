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
const {startcalc,addDays, updatecalc} = require('./life.js');
const {loadData} = require('./LMS.js');

var app = express();
var port = process.env.PORT || 3000;
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine','hbs');

// app.use('/fonts', express.static(__dirname + '/node_modules/roboto-fontface'));
app.use(express.static(__dirname+'/static'));

app.get('/jquery-', function(req, res) {
    res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.js');
});

app.get('/roboto', function(req, res) {
    res.sendFile(__dirname + '/node_modules/roboto-fontface/css/roboto/roboto-fontface.css');
});


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

hbs.registerHelper("getDateForCol", (date) => {
  let isThisToday = `${date.getMonth()}${date.getDate()}${date.getYear()}` == `${new Date().getMonth()}${new Date().getDate()}${new Date().getYear()}`;
  let isThisLastDay = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate() == date.getDate();
  return `
  <th class="rotate partition_${isThisLastDay} ${date.toString().split(' ').slice(1,2).join('')}" id="${date.getMonth()}${date.getDate()}${date.getYear()}">
    <div>
      <span id="col_${isThisToday}">${date.toString().trim().split(' ').slice(1,4).join(' ')}</span>
    </div>
  </th>`

})

hbs.registerHelper("drawTableRows", (cols,person) => {
  cols = cols.map(val => {
    let found = person.tempLeave.find(elem => {
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

app.get('/test',(req,res) => {
  req.query.date = req.query.date || [];
  let date = new Date(), cols = [], rows = [];
  console.log(req.query.date, date);
  for (var i = 0; i < 31; i++) {
    let ndate = addDays(date, i);
    cols.push(ndate);
  }

  for (var i = 0; i < 31; i++) {
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
app.get('/', (req,res) => {

  req.query.date = req.query.date || [];
  let date = new Date(), cols = [], rows = [];
  console.log(req.query.date, date);
  for (var i = 0; i < 31; i++) {
    let ndate = addDays(date, i);
    cols.push(ndate);
  }

  for (var i = 0; i < 31; i++) {
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

  // let cols = [], rows = [];
  // for (var i = 0; i < 300; i++) {
  //   let date = addDays(new Date('1 Sep 2019'), i);
  //   cols.push(date);
  // }
  // for (var i = 0; i < 30; i++) {
  //   rows.push(i);
  // }
  //
  // let slotArray = [],
  //     daysToCalc = 30;
  //
  // for (var i = 0; i < daysToCalc; i++) {
  //   slotArray[i] = {
  //     date: addDays(new Date(), i),
  //     slot: 8
  //   };
  // }
  //
  // People.find().then((sorted) => {
	// 	res.render('office.hbs',{
	// 		rows,cols,sorted
	// 	})
	// }).catch(e => {
  //   console.log(e);
  //   res.status(400).send(e)
  // });

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
      daysToCalc = 30;

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
  					"update": {$set: {tempLeave: val.leave}}
  				}
  			}
  	}))
  }).then(msg => res.status(200).send('Leaves have been calculated.'))
  .catch(e => {
    console.log(e);
    res.status(400).send(e)
  });

})

hbs.registerHelper('inputDateFormat', function(val) {
  var d = new Date(val),
          month = '' + (d.getMonth() + 1),
          day = '' + d.getDate(),
          year = d.getFullYear();

  if (month.length < 2)
      month = '0' + month;
  if (day.length < 2)
      day = '0' + day;

  return [year, month, day].join('-');
  // The specified value "Mon Dec 23 2019 00:00:00 GMT+0500 (Pakistan Standard Time)" does not conform to the required format, "yyyy-MM-dd".

})

hbs.registerHelper('getDashedDate', function(val) {
  return `${val.toString().trim().split(' ').slice(1,4).join('-')}`;
})

app.get('/profile',(req,res) => {
  console.log(req.query.id);
  People.findById(mongoose.Types.ObjectId(req.query.id)).lean().then(person => {
    console.log(person);
    person.leave = person.leave.sort((a,b) => a.end - b.end);
    res.status(200).render('person.hbs',{person})
  }).catch(e => res.status(400).send(e));
})

app.post('/updatePerson',(req,res) => {
  console.log(req.body);
  People.updateOne(
    {'leave._id': mongoose.Types.ObjectId(req.body.leaveId)},
    {'$set': {
          'leave.$.leaveType': req.body.leaveType,
          'leave.$.start': req.body.start,
          'leave.$.end': req.body.end,
          'leave.$.specialDays': req.body.specialDays,
      }
    }
  ).then(msg => res.status(200).send(msg)).catch(e => res.status(400).send(e));
})

app.post('/deleteLeave', (req,res) => {
  People.updateOne(
    {_id: mongoose.Types.ObjectId(req.body.personId)},
    {'$pull': {
          'leave': {_id: mongoose.Types.ObjectId(req.body.leaveId)}
      }
    }).then(msg => res.status(200).send(msg)).catch(e => res.status(400).send(e));
})

app.post('/addNewLeave', (req,res) => {
  People.updateOne(
    {_id: mongoose.Types.ObjectId(req.body.personId)},
    {'$push': {'leave' : req.body.newLeave}}
  ).then(msg => res.status(200).send('Saved the leave. Page will refresh after you press Ok.')).catch(e => res.status(400).send(e));
});

app.post('/loadData', (req,res) => {
  loadData().then(msg => {
    console.log(msg);
    res.status(200).send(msg);
  }).catch(e => {
    console.log(e);
    res.status(400).send(e);
  })
})

app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});
