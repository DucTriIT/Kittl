var extensionConfig;
var logs = ['AUTOMATEPOD LOGS:'];

if (window.location.host.indexOf('photopea.com') !== -1) {
  if (confirm("The AutomatePOD extension will NOT work here.\nIf you'd like to automate your designs using Photopea, please visit https://automatepod.com/photopea\nPress Ok to go to automatepod.com")) {
    window.location = 'https://automatepod.com/photopea';
  }
}

function findByInnerText(tag, text, useSecond, baseElement) {
  var aTags = (baseElement || document).getElementsByTagName(tag);

  for (var i = 0; i < aTags.length; i++) {
    if (aTags[i].textContent.indexOf(text) != -1) {
      if (useSecond) {
        useSecond = false;
        continue;
      }

      return aTags[i];
    }
  }
}

function strictFindByInnerText(tag, text) {
  var aTags = document.getElementsByTagName(tag);

  for (var i = 0; i < aTags.length; i++) {
    if (aTags[i].textContent == text) {
      return aTags[i];
    }
  }
} // Finds the p tag and replaces the text inside of it.


async function replaceVariable(oldValue, newValue) {
  var e = findByInnerText('p', oldValue, false, document.querySelector('main'));

  if (!e) {
    e = findByInnerText('p', oldValue.toUpperCase(), true, document.querySelector('main'));
  } else {
    log(`Found element with value of ${oldValue}.`);
  }

  if (!e) {
    log(`Couldn't find an element with value ${oldValue}. Trying first capitalized element.`);
    e = findByInnerText('p', oldValue.toUpperCase(), false, document.querySelector('main'));
    if (e) log('found a capitalized element.');
  }

  try {
    click(e);
    click(e);
    log(`Clicked on the ${oldValue} element.`);
    e = findByInnerText('p', oldValue.toUpperCase(), document.querySelector('[aria-label="Uppercase"]').getAttribute('aria-pressed') != 'true', document.querySelector('main'));
  } catch (error) {
    log('tried to click: ' + oldValue);
  }

  await new Promise(done => setTimeout(done, 100));
  console.log(window.getSelection().anchorNode.parentElement.innerText);

  if (window.getSelection().anchorNode.parentElement.innerText.toLowerCase() !== oldValue.toLowerCase()) {
    if (!e) return Promise.resolve();

    try {
      click(e);
      click(e);
    } catch (error) {
      log('tried to click: ' + oldValue);
    }

    window.getSelection().anchorNode.parentElement.innerText = window.getSelection().anchorNode.parentElement.innerText.replace(oldValue, newValue);
    log(`Replaced ${oldValue} with ${newValue}`);
    window.getSelection().anchorNode.parentElement.innerText = window.getSelection().anchorNode.parentElement.innerText.replace(oldValue.toUpperCase(), newValue);
    log(`Trying to replace the capitalized ${oldValue} with ${newValue}`);
  } else {
    log(`window selection="${window.getSelection().anchorNode.parentElement.innerText.toLowerCase()}" does match "${oldValue.toLowerCase()}"`);
    window.getSelection().anchorNode.parentElement.innerText = window.getSelection().anchorNode.parentElement.innerText.replace(oldValue, newValue);
    log(`Replaced ${oldValue} with ${newValue}`);

    if (oldValue.match(/[a-z]/)) {
      window.getSelection().anchorNode.parentElement.innerText = window.getSelection().anchorNode.parentElement.innerText.replace(oldValue.toUpperCase(), newValue);
      log(`Trying to replace the capitalized ${oldValue} with ${newValue}`);
    }
  }

  return new Promise(done => {
    setTimeout(() => {
      try {
        click(validate(document.querySelector(extensionConfig.deselector), 'deselector'));
        log(`Clicked on the deselector.`);
      } catch (e) {
        log('tried clicking the deselector');
      }

      done();
    }, 100);
  });
} // Needed click function to correctly select text.


function click(element) {
  ["mouseover", "mousedown", "mouseup", "click"].forEach(evt => {
    var e = document.createEvent("MouseEvents");
    e.initEvent(evt, true, true);
    element.dispatchEvent(e);
  });
}

chrome.runtime.onMessage.addListener(async function (event) {
  // This is only for canva!!
  if (window.location.host.indexOf('canva.com') === -1) {
    await photopea(event);
    return;
  }

  logs = ['AUTOMATEPOD LOGS:'];
  extensionConfig = event.extensionConfig;

  for (let i = 0; i < event.variables.length; i++) {
    let variable = event.variables[i];

    for (let h = 0; h < Object.keys(variable).length; ++h) {
      let header = Object.keys(variable)[h];

      if (!variable[header] || variable[header] === '') {
        continue;
      }

      if (header != 'File Name') {
        await replaceVariable(header, variable[header]);
      }
    }
    // Try to find the download button in the upper right hand corner.

    var downloadButton = validate(findByInnerText('span', extensionConfig.downloadButton), 'download button');

    if (!downloadButton) {
      log(`Page is too small, clicking the small up arrow download button.`); // the page is small to where we need to click on the up arrow button to get to download button

      try {
        click(document.querySelector(extensionConfig.upArrowButton));
        log(`Clicked the up arrow button.`);
      } catch (e) {
        log(`tried clicking the up arrow download button`);
      }

      await new Promise(done => setTimeout(() => {
        downloadButton = document.querySelector(extensionConfig.smallDownloadButton);
        done();
      }, 300));
    }

    click(downloadButton);
    log(`Clicked the share button.`);
    await new Promise(done => {
      var startedDownload = false;
      var mutationObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          //console.log(mutation);                
          if (!mutation || !mutation.target) {
            return;
          } else if (mutation.target.innerText.indexOf('Share this design') !== -1) {
            click(findByInnerText('button', 'Download'));
          } else if (!startedDownload && mutation.target.textContent == 'Download') {
            if (mutation.target.childNodes[0] && mutation.target.childNodes[0].childNodes[0] && mutation.target.childNodes[0].childNodes[0].childNodes[0] && mutation.target.childNodes[0].childNodes[0].childNodes[0].getAttribute('disabled') == '') {
              return;
            }

            startedDownload = true; // Click file type drop down arrow

            try {
              click(validate(findByInnerText('span', 'Suggested'), 'file type button'));
              log(`Clicked the file type button.`);
            } catch (e) {
              log('tried clicking the file type button');
              startedDownload = false;
              return;
            }

            try {
              click(validate(strictFindByInnerText('div', event.fileType), 'file type'));
              log(`Clicked the file type.`);
            } catch (e) {
              log('tried clicking the file type');
              startedDownload = false;
              return;
            }

            if (event.fileType === 'PNG' && event.pngTransparency) {
              try {
                click(validate(findByInnerText('p', extensionConfig.transparentButton), 'transparency button'));
                log(`Clicked the transparency button.`);
              } catch (e) {
                log('tried clicking the transparent button');
                startedDownload = false;
                return;
              }
            }

            try {
              click(findByInnerText('button', 'Download'));
              log(`Clicked the actual download button.`);
            } catch {
              startedDownload = false;
              return;
            }

            try {
              click(document.querySelector('[aria-label="Remove download"]'));
            } catch {}

            let fileType = event.fileType.indexOf(' ') != -1 ? event.fileType.split(' ')[0].toLowerCase() : event.fileType.toLowerCase(); // Tell background to change the file name before saving it.

            chrome.runtime.sendMessage({
              type: 'downloadDesign',
              filename: variable['File Name'] + '.' + fileType,
              subfolder: event.subfolder
            }, function (response) {
              // Close the successful download modal.
              try {
                click(validate(document.querySelector(extensionConfig.deselector), 'deselector'));
                startedDownload = false;
                mutationObserver.disconnect();
                done();
              } catch (e) {
                log('tried clicking close button');
              }
            });
          }
        });
      }); // Wait for the download options modal to come up.

      mutationObserver.observe(document.body, {
        attributes: true,
        subtree: true,
        childList: true,
        characterData: true
      });
    });
    await new Promise(done => setTimeout(done, 100));

    try {
      click(document.querySelector('[aria-label="Remove download"]'));
    } catch {} // Replace variables with original text


    for (var k = 0; k < Object.keys(variable).length; ++k) {
      var key = Object.keys(variable)[k];

      if (key !== 'File Name') {
        await replaceVariable(variable[key], key);
        log(`Finished ${variable[key]}.`);
      }
    }

    await new Promise(done => setTimeout(done, 500));
  }

  alert('done');
});

function validate(thingToValidate, name) {
  if (thingToValidate === undefined || thingToValidate === null) {
    log(`${name} is not defined.`);
  }

  return thingToValidate;
}

function log(message) {
  logs.push(message);
  console.log(message);
}
/*********************** PHOTOPEA **************************/


var blob;
window.addEventListener("message", async e => {
  if (typeof e.data == "object" && e.data.byteLength) {
    blob = e.data;
  } else if (typeof e.data == "object" && e.data.hasOwnProperty('filename')) {
    var type;

    switch (e.data.filename.split('.')[1]) {
      case 'png':
        type = 'image/png';
        break;

      case 'svg':
        type = 'image/svg';
        break;

      case 'jpg':
        type = 'image/jpg';
        break;

      case 'pdf':
        type = 'application/pdf';
        break;

      default:
        type = 'image/png';
        break;
    }

    let url = URL.createObjectURL(new Blob([new Uint8Array(blob, 0, blob.byteLength)], {
      type
    }));
    chrome.runtime.sendMessage({
      type: 'photopea',
      url,
      filename: e.data.filename,
      subfolder: e.data.subfolder
    }, () => URL.revokeObjectURL(url));
  }
});

async function photopea(event) {
  let photopea = document.getElementById('photopea').contentWindow;
  let fileType = event.fileType.indexOf(' ') != -1 ? event.fileType.split(' ')[0].toLowerCase() : event.fileType.toLowerCase();

  for (let i = 0; i < event.variables.length; i++) {
    let variable = event.variables[i]; // iterate through entire row

    for (let h = 0; h < Object.keys(variable).length; ++h) {
      let header = Object.keys(variable)[h]; // skip if its not found or empty

      if (!variable[header] || variable[header] === '') {
        continue;
      }

      if (header != 'File Name') {
        photopea.postMessage(`
                for (var i=0; i < app.activeDocument.layers.length; i++) {
                    if(app.activeDocument.layers[i].name.indexOf('${header}') != -1) {
                        app.activeDocument.layers[i].textItem.contents = app.activeDocument.layers[i].name.replace('${header}', '${variable[header]}');
                    }
                }`, '*');
      }

      await new Promise(done => setTimeout(() => {
        done();
      }, 50));
    }

    if (event.pngTransparency) {
      photopea.postMessage(`
                for (var i=0; i < app.activeDocument.layers.length; i++) {                 
                    if(app.activeDocument.layers[i].name.indexOf('Background') != -1) {
                        app.activeDocument.layers[i].opacity = 0;
                    }
                }`, '*');
      await new Promise(done => setTimeout(() => {
        done();
      }, 50));
    } // // Tell background to change the file name before saving it.


    photopea.postMessage(`app.activeDocument.saveToOE("${fileType}:1");app.echoToOE({filename: "${variable['File Name'] + '.' + fileType}", subfolder: "${event.subfolder}"});`, '*');
    await new Promise(done => setTimeout(() => {
      done();
    }, 1000)); // change back to header value

    for (let h = 0; h < Object.keys(variable).length; ++h) {
      let header = Object.keys(variable)[h]; // skip if its not found or empty

      if (!variable[header] || variable[header] === '') {
        continue;
      }

      if (header != 'File Name') {
        photopea.postMessage(`
                for (var i=0; i < app.activeDocument.layers.length; i++) {
                    if(app.activeDocument.layers[i].name.indexOf('${header}') != -1) {
                        app.activeDocument.layers[i].textItem.contents = app.activeDocument.layers[i].name.replace('${variable[header]}', '${header}');
                    }
                }`, '*');
        await new Promise(done => setTimeout(() => {
          done();
        }, 50));
      }
    }

    if (event.pngTransparency) {
      photopea.postMessage(`
                for (var i=0; i < app.activeDocument.layers.length; i++) {                 
                    if(app.activeDocument.layers[i].name.indexOf('Background') != -1) {
                        app.activeDocument.layers[i].opacity = 255;
                    }
                }`, '*');
      await new Promise(done => setTimeout(() => {
        done();
      }, 50));
    }
  }

  alert('done!');
}
