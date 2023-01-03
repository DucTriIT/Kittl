var extensionConfig;
var logs = ['AUTOMATE LOGS:'];

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

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
}
function getLocalStorage(name){
  return localStorage.getItem(name);
}
function setLocalStorage(name,storedObject){
  localStorage.setItem(name,JSON.stringify(storedObject));
}

chrome.runtime.onMessage.addListener(async function (event) {
  if (window.location.host.indexOf('kittl.com') === -1) {
    return;
  }

  logs = ['AUTOMATE LOGS:'];
  extensionConfig = event.extensionConfig;

  for (let i = 0; i < event.variables.length; i++) {
    let variable = event.variables[i];

    // for (let h = 0; h < Object.keys(variable).length; ++h) {
    //   let header = Object.keys(variable)[h];

    //   if (!variable[header] || variable[header] === '') {
    //     continue;
    //   }

    //   if (header != 'File Name') {
    //     await replaceVariable(header, variable[header]);
    //   }
    // }
    // Try to find the download button in the upper right hand corner.

    var downloadButton = validate(document.querySelector(extensionConfig.smallDownloadButton), 'download button');
    if(downloadButton){
       downloadButton=downloadButton.querySelector(extensionConfig.downloadButton);
    }
    if (!downloadButton) {
      log(`Page is too small, clicking the small up arrow download button.`); // the page is small to where we need to click on the up arrow button to get to download button
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
          } else if (!startedDownload && mutation.target.textContent == '') {

            startedDownload = true; // Click file type drop down arrow
            
            if (event.fileType === 'PNG') {
              try {
                var transparentDiv = strictFindByInnerText('div', extensionConfig.transparentDiv);
                if(transparentDiv){
                  var transparentButton = validate(transparentDiv.querySelector(event.pngTransparency?extensionConfig.transparentSwitcher:extensionConfig.notTransparentSwitcher), 'transparency button');
                  if(transparentButton){
                        click(transparentButton);
                        log(`Clicked the transparency button.`);
                  }
                }
              } catch (e) {
                log('tried clicking the transparent button');
                startedDownload = false;
                return;
              }
            }

           

            let fileType = event.fileType.indexOf(' ') != -1 ? event.fileType.split(' ')[0].toLowerCase() : event.fileType.toLowerCase(); // Tell background to change the file name before saving it.

            chrome.runtime.sendMessage({
              type: 'downloadDesign',
              filename: variable['File Name'] + '.' + fileType,
              subfolder: event.subfolder
            }, function (response) {
              // Close the successful download modal.
              try {
                click(validate(document.querySelector(extensionConfig.closeButton), 'close button'));
                startedDownload = false;
                mutationObserver.disconnect();
                done();
              } catch (e) {
                log('tried clicking close button');
              }
            });
            try {
              setTimeout(() => {
                click(
                  validate(
                    strictFindByInnerText("button", event.fileType),
                    "file type"
                  )
                );
                log(`Clicked the file type.`);
              }, 200);
            } catch (e) {
              log("tried clicking the file type");
              startedDownload = false;
              return;
            }
            
            try {
              click(document.querySelector('[aria-label="Remove download"]'));
            } catch {}
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
    } catch {} 

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