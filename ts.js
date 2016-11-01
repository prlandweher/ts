//// GLOBAL VARS (keep track of user state)
var pageIndex = 0;
var pageSize = 10;
var numPages = 0;
var currentSearch = "";

////JSONP LOGIC (model-ish things)

/***
* Returns an encoded url for a twitch.tv JSONP search request.
* searchString - user's search string
* index - the search offset used for pagination
* callbackServerVar - The GET request variable the service uses to specify JSONP callback assignment. Defaults to "callback"
* callbackClientVar - The GET request variable used to specify the client side function callback. Defaults to "defaultTwitchCallback"
***/
var getTwitchSearchURL = function(searchString, index, callbackServerVar, callbackClientVar) {
	if(typeof index === "undefined") {
		var index = 0;
	}
	if(typeof callbackServerVar === "undefined") {
		var callbackServerVar = "callback";
	}
	if(typeof callbackClientVar === "undefined") {
		var callbackClientVar = "defaultTwitchCallback";
	}
	//Base twitch API url for searching streams with manditory AppId included
	var baseURL = "https://api.twitch.tv/kraken/search/streams?client_id=5wn12qivo0smx133jw5e108rf4fdlx7";
	//Append search string and callback portions of the query
	var queryURI = baseURL + "&q=" + searchString + "&offset=" + index + "&limit=" + pageSize + "&" + callbackServerVar + "=" + callbackClientVar;
	//Return final encoded URL
	return encodeURI(queryURI);
};

/***
* Creates a script tag to run the given JSONP query and appends it to the document head.
* queryURL - an encoded url for a JSONP request
* index - the search offset used for pagination
***/
var runJSONP = function(queryURL, index) {
	var targetURL = getTwitchSearchURL(queryURL, index);
	var contentHolderScript = document.createElement('script');
	contentHolderScript.setAttribute("type","text/javascript");
	contentHolderScript.setAttribute("id", "scriptsrc"); //use to clear from DOM later if warrented
	contentHolderScript.setAttribute("src", targetURL);
	document.getElementsByTagName("head")[0].appendChild(contentHolderScript);
};

//// HTML GENERATION (view-ish things)

/***
* Function called by the twitch API's JSONP return. Will fill page with results.
* jsonpValue - twitch returned JSON object
***/
var defaultTwitchCallback = function(jsonpValue) {
	//logging
	console.log(jsonpValue);
	if(typeof jsonpValue.streams.length === "undefined") {
		console.log("expected array of stream objects");
	}
	//total results
	document.getElementById("totalResults").innerHTML = "Total Results: " + jsonpValue._total;
	//nav buttons
	numPages = Math.ceil(jsonpValue._total / pageSize);
	document.getElementById("currentPage").innerHTML = (pageIndex+1) + "/" + numPages;
	//generate result list
	var outputStr = "";
	for(var i = 0; i < jsonpValue.streams.length; i++) {
		outputStr += getStreamItem(jsonpValue.streams[i]);
	}
	document.getElementById("resultsList").innerHTML = outputStr;
	//unhide header items
	document.getElementById("totalResults").style.display = "block";
	document.getElementById("pageNav").style.display = "block";
	//cleanup JSONP from DOM
	var scriptItem = document.getElementById("scriptsrc");
	scriptItem.parentNode.removeChild(scriptItem);
};

/***
* Generate list item for a single stream entry.
* streamObj - individual twitch stream object
***/
var getStreamItem = function(streamObj) {
	var viewerPlural = streamObj.viewers == 1 ? " viewer" : " viewers";
	var outputStr = "<li>";
	outputStr += "<a class='streamThumb' href='"+streamObj.channel.url+"' style='"+"background: url(\""+streamObj.preview.small+"\") top center no-repeat"+"'></a>";
	outputStr += "<div class='streamName'><a href='"+streamObj.channel.url+"'>"+streamObj.channel.display_name+"</a></div>";
	outputStr += "<div class='streamStatus'>"+streamObj.game + " - " + streamObj.viewers + viewerPlural + "</div>";
	outputStr += "<div class='streamDesc'>"+streamObj.channel.status+"</div>";
	outputStr += "</li>";
	return outputStr;
};

//// USER HOOKS (controller-ish things)

/***
* Navigate to the previous page of query results if availible.
***/
var navPrev = function() {
	if(pageIndex !== 0) {
		pageIndex--;
		runJSONP(currentSearch, pageIndex * pageSize);
	}
};

/***
* Navigate to the next page of query results if availible.
***/
var navNext = function() {
	if(pageIndex+1 < numPages) {
		pageIndex++;
		runJSONP(currentSearch, pageIndex * pageSize);
	}
};

/***
* Run a search for the user entered query
***/
var runSearch = function() {
	//get search query
	var searchField = document.getElementById("searchField").value;
	//reset search globals
	pageIndex = 0;
	numPages = 0;
	currentSearch = searchField;
	//search
	runJSONP(searchField);
};

/***
* Bind user interface events
***/
var bindUserInput = function(){
	//bind enter key for search field
	document.getElementById('searchField').onkeyup = function(event){
		if(event.keyCode === 13) {
			runSearch();
		}
	};
	//bind click for navigation buttons
	document.getElementById('searchButton').onclick = runSearch;
	document.getElementById('prevBtn').onclick = navPrev;
	document.getElementById('nextBtn').onclick = navNext;
};
window.onload = bindUserInput;