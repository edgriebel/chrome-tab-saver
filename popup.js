var storagefoldername = 'test_'+1;//+(new Date().getTime());
var _foldername = storagefoldername;
var _rootfoldername = "Other Bookmarks"; // chrome default too

// Search the bookmarks when entering the search keyword.
$(function() {
  $('#go').click(function() {
     $('#status').empty();
     // repeat? $('#status').append('<ul class="list-group list-group-flush">');
     _foldername = $('#folder').val();
     if (!_foldername)
	     _foldername = storagefoldername;
     status('Saving tabs in this window to '+_foldername);
     launchSaveTabs(_foldername);
     // dumpBookmarks($('#search').val());
  });
});

function status(msg) {
	var arg1 = '';
	if (arguments.length > 1) {
		arg1 = arguments[1];
		console.log(arguments);
	}
	else {
		console.log(arguments[0]);
	}
	$('#status').append($('<li class="list-group-item">'+msg+(arg1&&arg1.name ? arg1.name:(arg1.title?arg1.title:''))+'</li>'));
}

function launchSaveTabs(foldername) {
	status('launchSaveTabs('+foldername+')');
	if (!foldername)		
		foldername = _foldername;
	// ugly nested anon functions because we want to create closure
	// over foldername instead of using global _foldername
	// This would be a lot cleaner using promises!
	createFolder(foldername, function(){
		chrome.tabs.query({currentWindow: true}, 
				function(tabQueryResults) { 
					saveTabs(foldername, tabQueryResults); 
				});
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
	status('save ' + tabs.length + ' tabs to folder', f);
	tabs.forEach(function(t) { 
		findAndCreateBookmark(t, f); 
	});
	status('done saving tabs to folder');
}

function findAndCreateBookmark(tab, folder) {
	// status('looking for tab '+tab.title + ' in folder '+folder.title, tab);
	chrome.bookmarks.search({"url": tab.url}, function(bookmarks) { 
		checkExists(bookmarks, tab, folder); 
	});
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

function createRootFolder(foldername) {
	status('create root folder (stub) '+foldername);
}

function createBookmark(tab, folder) {
	// status('saving tab', tab);
	chrome.bookmarks.create({"parentId": folder.id, "title": tab.title, "url": tab.url});
}

function createFolder(foldername, callback){
	var newFolder = {"title": foldername};
	chrome.bookmarks.search(newFolder, function(b) { 
		if (b.length == 0) {
			status('adding folder ' + newFolder.title);
			chrome.bookmarks.create(newFolder, callback);
		} else {
			// logBookmark(b);
			chrome.bookmarks.removeTree(b[0].id, function() { 
				createFolder(foldername, callback)
			});
		}
	});
}

function logBookmark(b) {
	status("bookmark folder: ", b);
}

function dumpTabNodes(nodelist) {
	var list = $('<ul class="list-group list-group-flush">');
	status('dumping ' + nodelist.length + ' tabs');
	return list.append(nodelist.map(dumpTabNode));
}

function dumpTabNode(tab) {
	// status('tab: ' , tab);
	var anchor = $('<li class="list-group-item"><a class="card-link"></li>');
	anchor.text(tab.title);
	anchor.attr('href',tab.url);
	// var rtn = $('<div>');
	// rtn.append(anchor);
	return anchor;
}

function getOptionsFromStorage(func) {
	chrome.storage.local.get(null, func);
}

function findBookmark(name, bk) {
	if (!bk) {
		return null;
	}
	if (bk.title === name) {
		return bk;
	}
	else
		return findBookmark(bk.children);
}

function dumpCurrentFolders() {
	chrome.bookmarks.getTree(function(b) { console.log('treebk',b);});
	var newTab = {"title": "MDI"};
	chrome.bookmarks.search(newTab, function(b) { 
		b.forEach(function(bk){
			status('found bookmark ' + bk.title);
			console.log('bookmark found: ',bk);
		}
		)
	});
	var x = $('<li class="list-group-item" id="f"></li>');
	x.append('<i>&lt;example...&gt;</i>');
	_ex = $('#currfolders').append(x)
}

document.addEventListener('DOMContentLoaded', function () {
  dumpCurrentFolders();
  dumpTabs();
 
  getOptionsFromStorage(function(opts) {
	console.log(opts);
	if (opts.defaultfolder) {
		storagefoldername = opts.defaultfolder;
		_foldername = storagefoldername;
		$('#folder').val(opts.defaultfolder);
	}
	if (opts.rootfolder) {
		createRootFolder(opts.rootfolder);
		rootfolder = opts.rootfolder;
	}
  });

  // launchSaveTabs();
  // chrome.tabs.query({currentWindow: true},function(x){);
});
