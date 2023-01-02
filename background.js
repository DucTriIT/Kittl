chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.type) {
      case 'reset':
        reset(request);
        break;
    
      default:
        downloadDesign(request, sendResponse);
        break;
    }
  
    return true;
  });
  function downloadDesign(request, sendResponse) {
    try {
      chrome.downloads.onDeterminingFilename.addListener(function a(downloadItem, suggest) {
        var file;
  
        if (request.subfolder) {
          file = `${request.subfolder}/${request.filename}`;
        } else {
          file = request.filename;
        }
  
        suggest({
          'filename': file,
          'conflict_action': "overwrite",
          'conflictAction': "overwrite"
        });
        chrome.downloads.onDeterminingFilename.removeListener(a);
      });
    } catch (e) {}
  
    chrome.downloads.onCreated.addListener(function b() {
      chrome.downloads.onCreated.removeListener(b);
      sendResponse({
        complete: true
      });
    });
  }
  
  function reset(sendResponse) {
    chrome.runtime.reload();
    sendResponse({
      complete: true
    });
  }
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
      chrome.tabs.create({
        url: 'https://www.kittl.com/designs'
      });
    }
  });