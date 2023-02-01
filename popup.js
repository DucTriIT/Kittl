chrome = chrome || browser;
var variables = [];
var extensionConfig = {
  upArrowButton: 'button path[d="M4.5 11.75V19a.5.5 0 0 0 .5.5h14a.5.5 0 0 0 .5-.5v-7.25a.75.75 0 1 1 1.5 0V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7.25a.75.75 0 1 1 1.5 0zm8.323-6.19v9.69a.75.75 0 0 1-1.5 0l-.001-9.69-3.037 3.215a.751.751 0 0 1-1.062-1.06l4.318-4.495a.751.751 0 0 1 1.062 0l4.18 4.495a.749.749 0 1 1-1.06 1.06l-2.9-3.216z"]',
  smallDownloadButton: 'div[class="sc-dkPtRN sc-hKwDye jlYchU"]',
  downloadButton: 'button[class="sc-ieecCq gRSmSL"]:nth-of-type(3)',
  downloadOption: 'div[class="sc-brSvTw duXmCe"]',
  deselector: '[data-page-id="0"] div div div',
  transparentDiv: 'Remove Background',
  transparentSwitcher: 'div[class="sc-jdhwqr bFCftM"]',
  notTransparentSwitcher: 'div[class="sc-jdhwqr hZzPBQ"]',
  optimizeQualityDiv: 'Optimize Quality',
  optimizeQualitySwitcher: 'div[class="sc-jdhwqr bFCftM"]',
  notoptimizeQualitySwitcher: 'div[class="sc-jdhwqr hZzPBQ"]',
  closeButton: 'div[data-testid="panel-header-close"]'
};

window.onload = () => {
    document.querySelector('#downloadTemplate').addEventListener('click', evt => {
        download('template.csv', 'Year,Name,File Name\n2020,John,john_2020\n2021,Bob,bob_2021\n2022,Jane,jane_2023');
    });
  if (document.querySelector('#fileType').value !== 'PNG') {
    document.querySelector('#pngOptions').style.display = 'none';
  }

  document.querySelector('#fileType').addEventListener('change', evt => {
    if (document.querySelector('#fileType').value !== 'PNG') {
      document.querySelector('#pngOptions').style.display = 'none';
    } else {
      document.querySelector('#pngOptions').style.display = 'block';
    }
  });
  document.querySelector('#upload').addEventListener('change', event => {
    variables = [];
    var url = event.target.value;
    var extension = url.substring(url.lastIndexOf('.') + 1).toLowerCase();

    if (event.target.files && event.target.files[0] && extension == "csv") {
      var reader = new FileReader();

      reader.onload = function () {
        var fileData = reader.result.split(/\r\n|\n|\r/);
        fileData = fileData.filter(line => line != ''); // Read in headers

        var headers = CSVToArray(fileData[0])[0]; // Read in values

        for (let row = 1; row < fileData.length; row++) {
          const values = CSVToArray(fileData[row])[0];
          variables.push(headers.reduce((acc, curr, i) => {
            acc[curr] = values[i].trim(); //remove extra spaces for vars

            if (curr != 'File Name') acc[curr] = acc[curr].replace(/\s{2,}/g, ' ');
            return acc;
          }, {}));
        }
      };

      reader.readAsText(event.target.files[0]);
    } else {
      document.querySelector('#errors').innerHTML = 'Please upload file with .csv extension!';
    }
  });
  document.querySelector('#go').addEventListener('click', () => {
    var message = {
      variables,
      fileType: document.querySelector('#fileType').value,
      fileWidth: document.querySelector('#fileWidth').value,
      pngTransparency: document.querySelector('#pngTransparency').checked,
      optimizeQuality: document.querySelector('#pngOptimize').checked,
      subfolder: document.querySelector('#subfolder').value,
      extensionConfig: extensionConfig
    };
    chrome.runtime.sendMessage({ from: 'popup', type: 'startdownload',message:message }, function (response) {});
  }); // Get extension configs
};

function call(method, url, options) {
  return new Promise((resolve, reject) => {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", resolve);
    oReq.open(method, url);
    oReq.setRequestHeader('content-type', 'application/json');
    Object.keys(options.headers).forEach(h => {
      oReq.setRequestHeader(h, options.headers[h]);
    });
    if (options.body) oReq.send(JSON.stringify(options.body));else oReq.send();
  });
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
} // This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.


function CSVToArray(strData, strDelimiter) {
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = strDelimiter || ","; // Create a regular expression to parse the CSV values.

  var objPattern = new RegExp( // Delimiters.
  "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + // Quoted fields.
  "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + // Standard fields.
  "([^\"\\" + strDelimiter + "\\r\\n]*))", "gi"); // Create an array to hold our data. Give the array
  // a default empty first row.

  var arrData = [[]]; // Create an array to hold our individual pattern
  // matching groups.

  var arrMatches = null; // Keep looping over the regular expression matches
  // until we can no longer find a match.

  while (arrMatches = objPattern.exec(strData)) {
    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[1]; // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.

    if (strMatchedDelimiter.length && strMatchedDelimiter != strDelimiter) {
      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push([]);
    } // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).


    if (arrMatches[2]) {
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
    } else {
      // We found a non-quoted value.
      var strMatchedValue = arrMatches[3];
    } // Now that we have our value string, let's add
    // it to the data array.


    arrData[arrData.length - 1].push(strMatchedValue);
  } // Return the parsed data.


  return arrData;
}
