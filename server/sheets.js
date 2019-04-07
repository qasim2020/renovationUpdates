
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var sheets = google.sheets('v4');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_PATH = 'token.json';

function sheetGet(name) {
  fs.readFile('config/credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    if (name == 'Bunkers') {
      return authorize(JSON.parse(content), Bunkers);
    }
    if (name == 'External') {
      return authorize(JSON.parse(content), External);
    }
    if (name == 'Construction') {
      return authorize(JSON.parse(content), Construction);
    }
    if (name == 'Material') {
      return authorize(JSON.parse(content), Material);
    }

  });
}

function updateSheet(name,values) {
  fs.readFile('config/credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    let data = {
      data: JSON.parse(content),
      values: values
    };
    return authorize(data,BunkersUpdate);
  });
};

function BunkersUpdate(auth,data) {
  var request = {
    // The ID of the spreadsheet to update.
    spreadsheetId: '1hTznrKNzJDImMyHuEg3yiktJf2nWfB8N0OWIjxu6uJ0',  // TODO: Update placeholder value.

    // The A1 notation of the values to update.
    range: 'A6:F6',  // TODO: Update placeholder value.

    // How the input data should be interpreted.
    valueInputOption: '',  // TODO: Update placeholder value.

    resource: {
      // TODO: Add desired properties to the request body. All existing properties
      // will be replaced.
    },

    auth: auth,
  };

  sheets.spreadsheets.values.update(request, function(err, response) {
    if (err) {
      console.error(err);
      return;
    }

    // TODO: Change code below to process the `response` object:
    console.log(JSON.stringify(response, null, 2));
});
};

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed || credentials.data.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client,credentials.values);
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

function Bunkers(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1hTznrKNzJDImMyHuEg3yiktJf2nWfB8N0OWIjxu6uJ0',
    range: 'A:F',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      rows.map((row) => {
        console.log(`${row[2]}, ${row[5]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
};

function Construction(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1v-LIx1IzkAgr9V-E_1WD0GDV6BYCU7mktJyEnumMRBw',
    range: 'A:F',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      rows.map((row) => {
        console.log(`${row[2]}, ${row[5]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
};

function External(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1-ViuHnzTD-6OpRC7nnfj2BzQxMKthfmCAyzGwSGRceU',
    range: 'A:D',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      rows.map((row) => {
        console.log(`${row[2]}, ${row[3]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
};

function Material(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '10f4xlmbpb_1Lu8raDjk5ofxBZA1REIOZzUilm_lMzIs',
    range: 'A:F',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    if (rows.length) {
      rows.map((row) => {
        console.log(`${row[2]}, ${row[5]}`);
      });
    } else {
      console.log('No data found.');
    }
  });
};

module.exports = {sheetGet, updateSheet}
