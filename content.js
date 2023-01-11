var extensionConfig;
var logs = ["AUTOMATE LOGS:"];
const waitFor = (callback) =>
  new Promise((resolve) => {
    let interval = setInterval(() => {
      if (callback() === true) {
        resolve();
        clearInterval(interval);
      }
    }, 1000);
  });
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
  var e = findByInnerText("p", oldValue, false, document.querySelector("main"));

  if (!e) {
    e = findByInnerText(
      "p",
      oldValue.toUpperCase(),
      true,
      document.querySelector("main")
    );
  } else {
    log(`Found element with value of ${oldValue}.`);
  }

  if (!e) {
    log(
      `Couldn't find an element with value ${oldValue}. Trying first capitalized element.`
    );
    e = findByInnerText(
      "p",
      oldValue.toUpperCase(),
      false,
      document.querySelector("main")
    );
    if (e) log("found a capitalized element.");
  }

  try {
    click(e);
    click(e);
    log(`Clicked on the ${oldValue} element.`);
    e = findByInnerText(
      "p",
      oldValue.toUpperCase(),
      document
        .querySelector('[aria-label="Uppercase"]')
        .getAttribute("aria-pressed") != "true",
      document.querySelector("main")
    );
  } catch (error) {
    log("tried to click: " + oldValue);
  }

  await new Promise((done) => setTimeout(done, 100));
  console.log(window.getSelection().anchorNode.parentElement.innerText);

  if (
    window.getSelection().anchorNode.parentElement.innerText.toLowerCase() !==
    oldValue.toLowerCase()
  ) {
    if (!e) return Promise.resolve();

    try {
      click(e);
      click(e);
    } catch (error) {
      log("tried to click: " + oldValue);
    }

    window.getSelection().anchorNode.parentElement.innerText = window
      .getSelection()
      .anchorNode.parentElement.innerText.replace(oldValue, newValue);
    log(`Replaced ${oldValue} with ${newValue}`);
    window.getSelection().anchorNode.parentElement.innerText = window
      .getSelection()
      .anchorNode.parentElement.innerText.replace(
        oldValue.toUpperCase(),
        newValue
      );
    log(`Trying to replace the capitalized ${oldValue} with ${newValue}`);
  } else {
    log(
      `window selection="${window
        .getSelection()
        .anchorNode.parentElement.innerText.toLowerCase()}" does match "${oldValue.toLowerCase()}"`
    );
    window.getSelection().anchorNode.parentElement.innerText = window
      .getSelection()
      .anchorNode.parentElement.innerText.replace(oldValue, newValue);
    log(`Replaced ${oldValue} with ${newValue}`);

    if (oldValue.match(/[a-z]/)) {
      window.getSelection().anchorNode.parentElement.innerText = window
        .getSelection()
        .anchorNode.parentElement.innerText.replace(
          oldValue.toUpperCase(),
          newValue
        );
      log(`Trying to replace the capitalized ${oldValue} with ${newValue}`);
    }
  }

  return new Promise((done) => {
    setTimeout(() => {
      try {
        click(
          validate(
            document.querySelector(extensionConfig.deselector),
            "deselector"
          )
        );
        log(`Clicked on the deselector.`);
      } catch (e) {
        log("tried clicking the deselector");
      }

      done();
    }, 100);
  });
} // Needed click function to correctly select text.

function click(element) {
  ["mouseover", "mousedown", "mouseup", "click"].forEach((evt) => {
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
function getLocalStorage(name) {
  return localStorage.getItem(name);
}
function setLocalStorage(name, storedObject) {
  localStorage.setItem(name, JSON.stringify(storedObject));
}
function insertControlsHtml() {
  let cont_html = `<style>
        #loading {
          position: fixed;
          display: block;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          text-align: center;
          opacity: 0.7;
          background-color: #fff;
          z-index: 99;
        }
        
        #loading-image {
          position: absolute;
          top: 100px;
          left: 240px;
          z-index: 100;
        }
        </style>
        <link rel="stylesheet" href="${chrome.runtime.getURL("loader.css")}">
  <div id="loading">
  <img id="loading-image" src="${chrome.runtime.getURL(
    "ajax-loader.gif"
  )}" alt="Please do not close this tab while app is running..." />
  </div>`;
  document.body.innerHTML += cont_html;
}
chrome.runtime.onMessage.addListener(async function (event) {
  if (window.location.host.indexOf("kittl.com") === -1) {
    return;
  }
  logs = ["AUTOMATE LOGS:"];
  if ((event.from = "background" && event.type == "download")) {
    extensionConfig = event.message.extensionConfig;

    // Try to find the download button in the upper right hand corner.
    var downloadButton = validate(
      document.querySelector(extensionConfig.smallDownloadButton),
      "download button"
    );
    if (downloadButton) {
      downloadButton = downloadButton.querySelector(
        extensionConfig.downloadButton
      );
    }
    if (!downloadButton) {
      log(`Page is too small, clicking the small up arrow download button.`); // the page is small to where we need to click on the up arrow button to get to download button
    }
    waitFor(() => downloadButton.disabled == false);
    click(downloadButton);
    log(`Clicked the share button.`);
    await new Promise((done) => {
      var startedDownload = false;
      var mutationObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          //console.log(mutation);
          if (!mutation || !mutation.target) {
            return;
          } else if (
            mutation.target.innerText &&
            mutation.target.innerText == "Download"
          ) {
            click(downloadButton);
          } else if (!startedDownload && mutation.target.textContent == "") {
            startedDownload = true; // Click file type drop down arrow

            if (event.message.fileType === "PNG") {
              try {
                var transparentDiv = strictFindByInnerText(
                  "div",
                  extensionConfig.transparentDiv
                );
                if (transparentDiv) {
                  var transparentButton = validate(
                    transparentDiv.querySelector(
                      event.message.pngTransparency
                        ? extensionConfig.transparentSwitcher
                        : extensionConfig.notTransparentSwitcher
                    ),
                    "transparency button"
                  );
                  if (transparentButton) {
                    click(transparentButton);
                    log(`Clicked the transparency button.`);
                  }
                }
              } catch (e) {
                log("tried clicking the transparent button");
                startedDownload = false;
                return;
              }
            }
            try {
              var optimizeQualityDiv = strictFindByInnerText(
                "div",
                extensionConfig.optimizeQualityDiv
              );
              if (optimizeQualityDiv) {
                var qualityButton = validate(
                  optimizeQualityDiv.querySelector(
                    event.message.optimizeQuality
                      ? extensionConfig.optimizeQualitySwitcher
                      : extensionConfig.notoptimizeQualitySwitcher
                  ),
                  "quality button"
                );
                if (qualityButton) {
                  click(qualityButton);
                  log(`Clicked the quality button.`);
                }
              }
            } catch (e) {
              log("tried clicking the quality button");
              startedDownload = false;
              return;
            }

            let fileType =
              event.message.fileType.indexOf(" ") != -1
                ? event.message.fileType.split(" ")[0].toLowerCase()
                : event.message.fileType.toLowerCase(); // Tell background to change the file name before saving it.
            console.log(fileType);
            chrome.runtime.sendMessage(
              {
                type: "downloadDesign",
                filename: event.fileName + "." + fileType,
                subfolder: event.message.subfolder,
              },
              function (response) {
                // Close the successful download modal.
                try {
                  var closeButton = validate(
                    document.querySelector(extensionConfig.closeButton),
                    "close button"
                  );
                  if (closeButton) {
                    click(closeButton);
                  }
                  startedDownload = false;
                  mutationObserver.disconnect();
                  chrome.runtime.sendMessage({ type: "closeTab" });
                  done();
                } catch (e) {
                  log("tried clicking close button");
                }
              }
            );
            try {
              setTimeout(() => {
                var fileTypeButton = validate(
                  strictFindByInnerText("button", event.message.fileType),
                  "file type"
                );
                if (fileTypeButton) {
                  click(fileTypeButton);
                  log(`Clicked the file type.`);
                }
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
        characterData: true,
      });
    });
    return;
  }

  let htcUserAccessToken = getCookie("htcUserAccessToken");
  let artboardStorage = getLocalStorage("artboard");
  //clone artboardStorage
  let artboardStorageOrg = JSON.parse(artboardStorage);
  const formData = new FormData();
  if (artboardStorageOrg.config.designId != undefined) {
    formData.append("id", artboardStorageOrg.config.designId);
  } else {
    alert("Please save your design first!");
    document.getElementById("loading").remove();
    return;
  }
  for (let i = 0; i < event.variables.length; i++) {
    let variable = event.variables[i];
    let artboardStorageClone = JSON.parse(artboardStorage);
    for (let h = 0; h < Object.keys(variable).length; ++h) {
      let header = Object.keys(variable)[h];

      if (!variable[header] || variable[header] === "") {
        continue;
      }

      if (header != "File Name") {
        artboardStorageClone.objects.forEach((object) => {
          if (object.type === "pathText" && object.text === header) {
            object.text = variable[header];
          }
        });
      }
      else {
        if (formData.has("name")) {
          formData.set("name", variable[header]);
        } else {
          formData.append("name", variable[header]);
        }
        artboardStorageClone.config.title = variable[header];
      }
    }
    if (formData.has("state")) {
      formData.set("state", JSON.stringify(artboardStorageClone));
    } else {
      formData.append("state", JSON.stringify(artboardStorageClone));
    }
    const response = await updateKittl(htcUserAccessToken, formData);
    const data = await response.json();
    if (data.id) {
      chrome.runtime.sendMessage({
        type: "download",
        designId: artboardStorageClone.config.designId,
        fileName: variable["File Name"],
        message: event,
      });
      log(`Updated artboard ${i + 1} of ${event.variables.length}.`);
    } else {
      log(`Failed to update artboard ${i + 1} of ${event.variables.length}.`);
    }
    await new Promise((done) => setTimeout(done,event.optimizeQuality?10000:5000));
  }
  //press Ctr + S to save the file
  if (formData.has("name")) {
    formData.set("name", artboardStorageOrg.config.title);
  } else {
    formData.append("name", artboardStorageOrg.config.title);
  }
  if (formData.has("state")) {
    formData.set("state", artboardStorage);
  } else {
    formData.append("state", artboardStorage);
  }
  await new Promise((done) => {
    setTimeout(async() => {
      await updateKittl(htcUserAccessToken, formData);
      done();
    }, 1000);
  });
  alert("done");
});

function validate(thingToValidate, name) {
  if (thingToValidate === undefined || thingToValidate === null) {
    log(`${name} is not defined.`);
  }

  return thingToValidate;
}
async function updateKittl(htcUserAccessToken, formData) {
  return await fetch("https://api.kittl.com/designs/update", {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      authorization: `Bearer ${htcUserAccessToken}`,
      pragma: "no-cache",
      "sec-ch-ua":
        '"Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
    },
    referrer: "https://app.kittl.com/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: formData,
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
}
function log(message) {
  logs.push(message);
  console.log(message);
}
