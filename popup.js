// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var tabname = 'test_'+1;//+(new Date().getTime());

// Search the bookmarks when entering the search keyword.
$(function() {
  $('#search').change(function() {
     $('#bookmarks').empty();
     // dumpBookmarks($('#search').val());
  });
});

function status(msg) {
	console.log(arguments);
	var arg1 = '';
	if (arguments.length > 1) {
		arg1 = arguments[1];
	}
	$('#status').append($('<li>'+msg+(arg1&&arg1.name ? arg1.name:(arg1.title?arg1.title:''))+'</li>'));
}

function launchSaveTabs() {
	createTab(function(){
		chrome.tabs.query({currentWindow: true}, saveTabs)
	});
}

function dumpTabs() {
	var tabs = chrome.tabs.query({currentWindow: true}, function(tab) {
		$('#tabs').append(dumpTabNodes(tab));
	});
}

function saveTabs(tabs) {
	chrome.bookmarks.search({"title":tabname}, function(b) {
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

function createTab(callback){
	var newTab = {"title": tabname};
	chrome.bookmarks.search(newTab, function(b) { 
		if (b.length == 0) {
			status('adding tab '+tabname);
			chrome.bookmarks.create({"title": tabname}, callback);
		} else {
			// logBookmark(b);
			chrome.bookmarks.removeTree(b[0].id, function() { createTab(callback)});
		}
	});
}

function logBookmark(b) {
	status("bookmark folder: ", b);
}

function dumpTabNodes(nodelist) {
	var list = $('<ul>');
	return nodelist.map(dumpTabNode);
}

function dumpTabNode(tab) {
	status('tab: ' , tab);
	var anchor = $('<a>');
	anchor.text(tab.title);
	anchor.attr('href',tab.url);
	var rtn = $('<div>');
	rtn.append(anchor);
	return rtn;
}

document.addEventListener('DOMContentLoaded', function () {
  dumpTabs();
  launchSaveTabs();
});
