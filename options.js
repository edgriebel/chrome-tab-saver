var storagefoldername = 'test_'+1;//+(new Date().getTime());
var _foldername = storagefoldername;

// Search the bookmarks when entering the search keyword.
$(function() {
  $('#save').click(function() {
     $('#status').empty();
     $('#status').append('<ul>');
     status('Saving options (stub)');
     var options = getOptionsFromScreen();
     chrome.storage.local.set(options, function() {
	     status("settings saved");
     });
  });
});

function getOptionsFromScreen() {
	rtn = {};
	rtn.rootfolder = $('#rootfolder').val();
	rtn.defaultfolder = $('#defaultfolder').val();
	return rtn;
}

function putOptionsToScreen(opts) {
	$('#rootfolder').val(opts.rootfolder);
	$('#defaultfolder').val(opts.defaultfolder);
}

function getOptionsFromStorage(func) {
	chrome.storage.local.get(null, func);
}

function status(msg) {
	console.log(arguments);
	var arg1 = '';
	if (arguments.length > 1) {
		arg1 = arguments[1];
	}
	$('#status').append($('<li>'+msg+(arg1&&arg1.name ? arg1.name:(arg1.title?arg1.title:''))+'</li>'));
}

function launchSaveTabs(foldername) {
	if (!foldername)
		foldername = _foldername;
	// ugly nested anon functions because we want to create closure
	// over foldername instead of using global _foldername
	// This would be a lot cleaner using promises!
	createTab(foldername, function(){
		chrome.tabs.query({currentWindow: true}, 
				function(tabQueryResults) { saveTabs(foldername, tabQueryResults); });
	});
}

function dumpTabs() {
	var tabs = chrome.tabs.query({currentWindow: true}, function(tab) {
		$('#tabs').append(dumpTabNodes(tab));
	});
}

function saveTabs(foldername, tabs) {
	chrome.bookmarks.search({"title":foldername}, function(b) {
		saveTabsToFolder(tabs, b[0]);
	});
}

function saveTabsToFolder(tabs, f) {
	status('save tabs to folder', f);
	tabs.forEach(function(t) { findAndCreateBookmark(t, f); });
}

function findAndCreateBookmark(tab, folder) {
	status('looking for tab '+tab.title + ' in folder '+folder.title, tab);
	chrome.bookmarks.search({"url": tab.url}, function(bookmarks) { checkExists(bookmarks, tab, folder) });
}

function checkExists(bookmarks, tab, folder) {
	var filterBookmarks = bookmarks.filter(function(b) {return b.parentId === folder.id; });
	if (bookmarks.length == 0 || filterBookmarks.length == 0) {
		createBookmark(tab, folder);
	}
	else {
		status('duplicate tab, not saving', tab);
		chrome.bookmarks.update(filterBookmarks[0]['id'], {"title":tab.title});
	}
}

function createBookmark(tab, folder) {
	status('saving tab', tab);
	chrome.bookmarks.create({"parentId": folder.id, "title": tab.title, "url": tab.url});
}

function createTab(foldername, callback){
	var newTab = {"title": foldername};
	chrome.bookmarks.search(newTab, function(b) { 
		if (b.length == 0) {
			status('adding tab ' + newTab.title);
			chrome.bookmarks.create(newTab, callback);
		} else {
			// logBookmark(b);
			chrome.bookmarks.removeTree(b[0].id, function() { createTab(foldername, callback)});
		}
	});
}

function logBookmark(b) {
	status("bookmark folder: ", b);
}

function dumpTabNodes(nodelist) {
	var list = $('<ul>');
	status('dumping ' + nodelist.length + ' tabs');
	return nodelist.map(dumpTabNode);
}

function dumpTabNode(tab) {
	// status('tab: ' , tab);
	var anchor = $('<a>');
	anchor.text(tab.title);
	anchor.attr('href',tab.url);
	var rtn = $('<div>');
	rtn.append(anchor);
	return rtn;
}

document.addEventListener('DOMContentLoaded', function () {
	getOptionsFromStorage(putOptionsToScreen);
  // launchSaveTabs();
  // chrome.tabs.query({currentWindow: true},function(x){);
});
