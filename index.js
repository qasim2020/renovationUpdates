require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const hbs = require('hbs');
const _ = require('lodash');
const moment = require('moment');

const {sheet} = require('./server/sheets.js');

var app = express();
var port = process.env.PORT || 3000;
app.use(express.static(__dirname+'/static'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
hbs.registerPartials(__dirname + '/views/partials');
app.set('view engine','hbs');

// sheet('external','read');
// sheet('bunkers','read');
// sheet('construction','read');
// sheet('material','read');
// sheet('material','update',[
// [new Date().toString(),'MES','Sand','2000', 'cft','Brought it for const of Washroom']
// ]);

app.get('/',(req,res) => {

  console.log('home page opened');
  let dateToday = moment().format('YYYY-MM-DD');
  res.render('index.hbs',{
    dateToday,
  });

});

app.get('/getSuggestions',(req,res) => {
  sheet('external','todayUpdates').then((msg)=> {
    res.status(200).send(msg);
  }).catch((e) => {
    console.log(e);
    res.status(400).semd(e);
  });
})

app.post('/data',(req,res) => {
  _.pick(req.body,['timestamp','date','loc','category','name','responsibility','work','quantity','unit','remarks']);
  var arr = _.values(req.body);
  if (arr.length != 10) return res.status(400).send('Please fill all the fields in the form.');
  sheet('external','update',[arr]).then((msg) => {
    return res.status(200).send(msg);
  }).catch((e) => {
    console.log(e);
    return res.status(400).send(e);
  })
});

app.listen(port, () => {
  console.log(`listening on port ${port}...`);
});
