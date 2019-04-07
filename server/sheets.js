
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

let sheets = {
  bunkers: '1hTznrKNzJDImMyHuEg3yiktJf2nWfB8N0OWIjxu6uJ0',
  external: '1v-LIx1IzkAgr9V-E_1WD0GDV6BYCU7mktJyEnumMRBw',
  construction: '1-ViuHnzTD-6OpRC7nnfj2BzQxMKthfmCAyzGwSGRceU',
  material: '10f4xlmbpb_1Lu8raDjk5ofxBZA1REIOZzUilm_lMzIs'
};

function sheet(name,type,values) {
  fs.readFile('config/credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    let data = {
      content: JSON.parse(content),
      values: values,
      sheet: sheets[`${name}`]
    };
    if (type == 'read') return authorize(data, readSheet);
    if (type == 'update') return authorize(data,updateSheet);
  });
}

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.content.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client,credentials);
  });
};

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
};

function readSheet(auth, value) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: value.sheet,
    range: 'A:F',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      rows.map((row) => {
        console.log(`${row[0]},${row[1]},${row[2]}, ${row[3]}, ${row[4]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
};

function updateSheet(auth,value) {
  const sheets = google.sheets({version: 'v4', auth});
  console.log(value.values);
  let values = value.values;
  const resource = {
    values,
  };
  sheets.spreadsheets.values.append({
    spreadsheetId: value.sheet,
    range: "A1:F1",
    valueInputOption: "RAW",
    resource,
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    console.log(res.data);
  });
};

module.exports = {sheet}
