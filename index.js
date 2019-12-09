require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');
// const hbs = {};
hbs.handlebars === require('handlebars');
const _ = require('lodash');
const moment = require('moment');
const readXlsxFile = require('read-excel-file/node');

const {sendmail} = require('./js/sendmail');
const {sheet} = require('./server/sheets.js');

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
  // console.log(req.body);
  sheet('oldformatted','batchUpdate',req.body).then((msg) => {
    return res.status(200).send(msg);
  }).catch((e) => {
    console.log(e);
    res.status(400).send(e);
  })
});

app.post('/sendmail',(req,res) => {
  // return console.log(req);
  // console.log(JSON.parse(req.body));
  console.log(req.body.val);
  sendmail('qasimali24@gmail.com',req.body.val,'Feedback from Abasyn').then((msg) => {
    res.status(200).send(msg)
  }).catch(e => {
    // console.log('asdfas');
    console.log(e);
    res.status(400).send(e);
  });
})

app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});
