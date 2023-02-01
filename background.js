var baseTabId = 0;
var cuurentTabId = 0;
var requestDownloadDesign = null;
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.type) {
      case 'reset':
        reset(sendResponse);
        return true;
        
      case 'download':
        baseTabId = sender.tab.id;
        download(request.designId,request.fileName,request.message);
        sendResponse({
          complete: true
        })
        return true
      case 'startdownload':
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id, { from: 'background', type: 'startdownload',message:request.message }, function (response) {});
        });    
        break;
      // case 'closeTab':
      //   chrome.tabs.sendMessage(baseTabId, { from: 'background', type: 'downloadNext' }, function (response) {});
      //   sendResponse({
      //     complete: true
      //   })
      //   break;
      default:
        cuurentTabId = sender.tab.id;
        downloadDesign(request, sendResponse);
        return true;
    }
});
function downloadDesign(request, sendResponse) {
  requestDownloadDesign = request;
  sendResponse({
    complete: true
  })
  // try {
  //   console.log("event change file name");
  //   chrome.downloads.onDeterminingFilename.addListener(function a(downloadItem, suggest) {
  //     var file;

  //     if (request.subfolder) {
  //       file = `${request.subfolder}/${request.filename}`;
  //     } else {
  //       file = request.filename;
  //     }

  //     suggest({
  //       'filename': file,
  //       'conflict_action': "overwrite",
  //       'conflictAction': "overwrite"
  //     });
  //     console.log("changed file name");
  //     chrome.downloads.onDeterminingFilename.removeListener(a);
  //   });
  // } catch (e) {
  //   console.log(e);
  // }
  // try {
  //   console.log("event created file name");
  //   chrome.downloads.onCreated.addListener(function b() {
  //     chrome.downloads.onCreated.removeListener(b);
  //     console.log("done created file name");
  //     sendResponse({
  //       complete: true
  //     });
  //   });
  // } catch (e) {
  //   console.log(e);
  // }
  
}
try {
  chrome.downloads.onDeterminingFilename.addListener(function a(downloadItem, suggest) {
    var file;
    if(requestDownloadDesign!=null){
      if (requestDownloadDesign.subfolder) {
        file = `${requestDownloadDesign.subfolder}/${requestDownloadDesign.filename}`;
      } else {
        file = requestDownloadDesign.filename;
      }
  
      suggest({
        'filename': file,
        'conflict_action': "overwrite",
        'conflictAction': "overwrite"
      });
    }
    
  });
} catch (e) {
  console.log(e);
}
try{
    chrome.downloads.onCreated.addListener(function b() {
      chrome.tabs.remove(cuurentTabId);
      chrome.tabs.sendMessage(baseTabId, { from: 'background', type: 'downloadNext' }, function (response) {});
    });
}
catch(e){
  console.log(e);
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
  function requestTabListener(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete" && tabId === requestTabId) {
      var foundTabRecord = requestTabIds.filter((list) => { return list.tabId == requestTabId });
      if (foundTabRecord.length > 0) {
        chrome.tabs.sendMessage(tabId, { from: 'background', type: 'download',message:foundTabRecord[0].message,fileName:foundTabRecord[0].fileName});
      }
      
      chrome.tabs.onUpdated.removeListener(requestTabListener);
    }
  }
}

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
      chrome.tabs.create({
        url: 'https://www.kittl.com/designs'
      });
    }
  });