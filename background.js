chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.type) {
      case 'reset':
        reset(request);
        break;
      case 'download':
        download(request.designId,request.fileName,request.message);
        break;
      case 'closeTab':
        setTimeout(() => {
          chrome.tabs.remove(sender.tab.id);
        }, 2000)
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
var requestTabIds = [];
var requestTabId = 0;
function download(designId,fileName,message) {
  chrome.tabs.create({
    url: `https://app.kittl.com/?did=${designId}`,
  }, function (tabs) {
    console.log(tabs)
    var temp = {}; 
    requestTabId =(tabs.id);
    temp.tabId = requestTabId;
    temp.message = message;
    temp.fileName = fileName;
    requestTabIds.push(temp);
    chrome.tabs.onUpdated.addListener(requestTabListener);
  });
  // chrome.windows.getCurrent((tabWindow) => {
  //  const top = Math.floor(tabWindow.height / 4 * 3);
  //  const left = Math.floor(tabWindow.left / 4 * 3);
  //  const height = Math.floor(tabWindow.height / 4);
  //  const width = Math.floor(tabWindow.width / 2);
  
  // });
}
function requestTabListener(tabId, changeInfo, tab) {
	if (changeInfo.status === "complete" && tabId === requestTabId) {
    var foundTabRecord = requestTabIds.filter((list) => { return list.tabId == requestTabId });
		if (foundTabRecord.length > 0) {
      setTimeout(() => {
      chrome.tabs.sendMessage(requestTabId, { from: 'background', type: 'download',message:foundTabRecord[0].message,fileName:foundTabRecord[0].fileName});
      }, 1000);
		}
		
		chrome.tabs.onUpdated.removeListener(requestTabListener);
	}
}
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
      chrome.tabs.create({
        url: 'https://www.kittl.com/designs'
      });
    }
  });