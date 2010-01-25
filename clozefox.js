/*
 * ClozeFox Firefox Jetpack Plug-in  
 *
 * developed by Emre Sevinc and Jozef Colpaert at University of Antwerp
 * http://www.ua.ac.be
 *
 * License: GNU GPL v3 and the X11/MIT license
 * See http://www.gnu.org/licenses/gpl.html
 *
*/


var manifest = {
    firstRunPage: 'http://dev.linguapolis.be/jetpack/firstRun.html',

    settings: [
	{
	    name: "twitter",
	    type: "group",
	    label: "Twitter",
	    settings: [
		{ name: "username", type: "text", label: "Username" },
		{ name: "password", type: "password", label: "Password" }
	    ]
	},
	
	{ name: "music", type: "boolean", label: "Music", default: true },
	{ name: "volume", type: "range", label: "Volume", min: 0, max: 10, default: 5 },
	{ name: "shareOnTwitter", type: "boolean", label: "Share on Twitter?", default: true}
    ]
};

jetpack.future.import("storage.settings");
jetpack.future.import("menu"); 

/*
  Initialize the JetPack storage system and bind myStorage to it.
*/

jetpack.future.import("storage.simple"); 
var myStorage = jetpack.storage.simple; 

/*
  Initialize the JetPack slidebar system and activate it.
*/

var cb; // used for slide later, be careful about this

var initialContent = '<style type="text/css"> \
h4 {font-family: Arial;} \
p.score {font-family: Verdana; font-size: 12px;} \
</style> \
<h4>ClozeFox Summary Statistics</h4> \
<div id="stats"></div> \
<h4>ClozeFox Test Scores</h4> \
<div id="content"></div>';

jetpack.future.import('slideBar'); 

jetpack.slideBar.append({
    width: 350,
    icon: 'http://dev.linguapolis.be/jetpack/images/ua_logo.png',
    html: initialContent,
    persist: true,
    onReady: function(slide) {
	cb = slide;
    },
    onSelect: function(slide) {
	displayScoreDetails($(slide.contentDocument).find("#content"));
	displayScoreStats($(slide.contentDocument).find("#stats"));
    }
});

jetpack.tabs.onFocus(function() {
  let scoreDetails = jetpack.storage.simple.scoreDetails;
  for (let i = 0; i < scoreDetails.length; i++) {
    if (this.url == scoreDetails[i].site)
      cb.notify();
  }
});


/*
  Define the relevant constants and variables. Please be aware that the const is a
  Mozilla-specific extension, it is not supported by IE.  see
  https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Statements/Const
  for details.
*/

/*
  Test type constants and variables
*/
const STRATEGY_RANDOM       = 1000;
const STRATEGY_PREPOSITION  = 1100;

var testStrategy = 0;
var testStrategyToString = [];
testStrategyToString[STRATEGY_RANDOM] = "#randomTest";
testStrategyToString[STRATEGY_PREPOSITION] = "#prepositionTest";


/*
  Language constants
*/
const ENGLISH               = 1000;
const DUTCH                 = 2000;
const UNKNOWN_LANGUAGE      = 9999;

/*
 Page type constants
*/
const SIMPLE_ENGLISH        = 1000;
const NORMAL_ENGLISH        = 1100;
const NORMAL_DUTCH          = 2000;
const SIMPLE_DUTCH          = 2100;

/*
  Language-specific constants
*/

const englishFrequencyList = ["the", "of", "and", "a", "in", "to", "it", "is", "to", "was", 
			    "I", "for", "that", "you", "he", "be", "with", "on", "by", "at"];

const englishPrepositionList = ["aboard", "about", "above", "across", "after", "against", 
				"along", "alongside", "amid", "amidst", "among", "amongst",
				"around", "as", "aside", "astride", "at", "atop", "barring",
				"before", "behind", "below", "beneath", "beside", "besides",
				"between", "beyond", "but", "by", "circa", "concerning", 
				"despite", "down", "during", "except", "excluding", "failing", 
				"following", "for", "from", "given", "in", "inside", "into", 
				"like", "near", "next", "of", "off", "on", "onto", 
				"opposite", "out", "outside", "over", "pace", "past", "per", 
				"plus", "qua", "regarding", "round", "save", "since", "than", 
				"through", "throughout", "till", "times", "to", "toward", 
				"towards", "under", "underneath", "unlike", "until", "up", 
				"upon", "versus", "via", "with", "within", "without"];


/*
http://en.wiktionary.org/wiki/Wiktionary:Frequency_lists#Dutch
*/
const dutchFrequencyList =  ["de", "en", "het", "van", "ik", "te", "dat", "die", "in", "een",
			     "hij", "niet", "zijn"];
/*
http://en.wiktionary.org/wiki/Category:Dutch_prepositions
*/
const dutchPrepositionList = ["aan", "achter", "bij", "binnen", "dan", "door", "in", "langs", 
			      "met", "middels", "min", "na", "naar", "naast", "om", "onder", 
			      "op", "over", "ongeveer", "per", "rond", "sinds", "tegen", 
			      "tot", "tijdens", "tussen", "uit", "van", "vanaf", "vanuit", 
			      "via", "voor", "zonder"];


// Used for notifications
const myIcon ="http://dev.linguapolis.be/jetpack/images/uaLogo.ico";


function runClozeFox(strategy) { 
    var MIN_TEXT_LENGTH = 90;
    results = [];
    wholeText = "";
   
    var doc = jetpack.tabs.focused.contentDocument; 

    $(doc).find("div > p").each(function (index) {	
	var textStr = $(this).text();
	/*
         We need the pieces of text that are long and in natural language,
         and not some JS code snippets
        */
	if (textStr.length > MIN_TEXT_LENGTH && textStr.indexOf("<script") <= 0) {    
	    $(this).attr("id", "clozefox_paragraph_" + index);
	    results.push(index);
	    wholeText = wholeText + " " + textStr;
	}
    });
    
    /*
      If the enough amount of text cannot be found or grabbed correctly 
      by the system then immediately stop processing
    */
    if (wholeText.length <= 100) {
	var myBody = "Oops! Sorry, but ClozeFox could not find enough text on the page. Maybe it can suggest you a new page";
	myBody     += " if you right-click on the current page and select Suggest a Page.";
	jetpack.notifications.show({title: "Language error", body: myBody, icon: myIcon});
	return false;
    }        

    var fList;
    var fListArray = new Array();

    fList = calculateFrequencyList(wholeText);

    for (var item in fList) {	
	fListArray.push([item, fList[item]]);
    }   

    fListArray.sort(function (x, y) {return x[1] - y[1]});
    fListArray.reverse();

    var pageLanguage = detectLanguage(fListArray);
    switch (pageLanguage) {
	case ENGLISH:
	  //enableCalculateScore();
	  disableTestsAndEnableCalculateScore();
	  createTest(doc, strategy, ENGLISH);
	  languageTestUrl = jetpack.tabs.focused.contentWindow.location.href;
	  break;

	case DUTCH:
	  //enableCalculateScore();
	  disableTestsAndEnableCalculateScore();
	  createTest(doc, strategy, DUTCH);
          languageTestUrl = jetpack.tabs.focused.contentWindow.location.href;
	  break;

	default:
	  var myBody = "Oops! Sorry, ClozeFox could not find the main text of the page or the language of the page could not be detected." 
	  myBody     += " Maybe it can suggest you a new page if you right-click on the current page and select Suggest a Page";
	  jetpack.notifications.show({title: "Language error", body: myBody, icon: myIcon});
    }     
}

function calculateFrequencyList(txt) {
    var frequencyList = new Array();
    var listOfWords = txt.toLowerCase().split(/[\s,.]+/);
    
    for (var i = 0; i < listOfWords.length; i++) {
	var word = listOfWords[i];

	if (!frequencyList.hasOwnProperty(word)) {
	    frequencyList[word] = 1;	
	}
	else {
	    var wordCount = frequencyList[word];

	    if (typeof wordCount === 'number') {
		frequencyList[word]++;
	    }
	}
    }

    return frequencyList;
}

function detectLanguage(fListArray) {
    var numOfMatchingWords = 0;
    var resultLanguage = UNKNOWN_LANGUAGE;
    var l = 0;

    //
    // Check for English
    //
    numOfMatchingWords = 0;
    fListArrayLength = fListArray.length;
    englishFrequencyListLength = englishFrequencyList.length
    for (var i = 0; i < fListArrayLength; i++) {
	for (var j = 0; j < englishFrequencyListLength; j++) {
	    if (fListArray[i][0] == englishFrequencyList[j]) {
		numOfMatchingWords++;
	    }
	}
    }

    if(numOfMatchingWords > 8) {
	resultLanguage = ENGLISH;
	return resultLanguage;
    }

    //
    // Check for Dutch
    //
    numOfMatchingWords = 0; 
    fListArrayLength = fListArray.length;
    dutchFrequencyListLength = dutchFrequencyList.length
    for (var i = 0; i < fListArrayLength; i++) {
	for (var j = 0; j < dutchFrequencyListLength; j++) {
	    if (fListArray[i][0] == dutchFrequencyList[j]) {
		numOfMatchingWords++;
	    }
	}
    }


    if(numOfMatchingWords > 8) {
	resultLanguage = DUTCH;
	return resultLanguage;
    }

    return resultLanguage;
}

function createTest(doc, strategy, language) {
    switch (strategy) {
	case STRATEGY_RANDOM:
	  createRandomTest(doc, language);
	  break;
	case STRATEGY_PREPOSITION:
	  createPrepositionTest(doc, language);
	  break;
	default:
	  console.log("Error: Unknown test strategy!");	  
    }
}

function createRandomTest(doc, language) {
    var idCounter = 1;    
    $(doc).find("[id^=clozefox_paragraph]").each(function (index) {
	var textStr = $(this).text();
	var listOfWords = textStr.split(" ");
	
	var l = listOfWords.length;
	for (var i = 0; i < l; i++) {

	    if (idCounter > 50) { // don't try process every word on the page
		break;
	    }

	    if ((i % 7) === 0) {
		currentWord = listOfWords[i];
		listOfWords[i] = "<select id=\"clozefox_answer\"> <option value=\"wrongAnswer\">distractor</option>";
		listOfWords[i] += "<option value=\"trueAnswer\">" + currentWord + "</option></select>";
		idCounter++;
	    }
	}

	textStr = listOfWords.join(" ");
	$(this).html(textStr);
    });
}

Array.prototype.getRandomElements =  function(numElements) {
    var startRange = 0;
    var newArray = [];
    var tmpArray = this.slice(0); // copy (clone) the array

    for(var i = 0; i < numElements; i++) {
	var endRange = tmpArray.length - 1;
	var randomIndex = Math.floor((endRange - (startRange - 1)) * Math.random()) + startRange;
	newArray.push( (tmpArray.splice(randomIndex, 1))[0] );
    }

    return newArray;
}

Array.prototype.has = function(obj) {
    return this.indexOf(obj) >= 0;
} 

Array.prototype.shuffle = function() {
/*
  Fisher Yates shuffle algorithm adapted from
  http://sedition.com/perl/javascript-fy.html

  This is currently a destructive function!
  It modifies the array it acts upon, so use with care.
*/
  var i = this.length;
  if ( i == 0 ) return false;
  while ( --i ) {
     var j = Math.floor( Math.random() * ( i + 1 ) );
     var tempi = this[i];
     var tempj = this[j];
     this[i] = tempj;
     this[j] = tempi;
   }
}

function createPrepositionTest(doc, language) {
    var idCounter = 1;   
    var selectHeader = "<select id=\"clozefox_answer\">";
    var selectFooter = "</select>"
    var randomDistractors = englishPrepositionList.getRandomElements(3);
 
    $(doc).find("[id^=clozefox_paragraph]").each(function (index) {
	var textStr = $(this).text();
	var listOfWords = textStr.split(" ");		

	    switch (language) {		
		case ENGLISH:
		  var l = listOfWords.length;
		  for (var i = 0; i < l; i++) {		    
		      if (idCounter > 20) {      // don't try to process every word on the page
			  break;	    
		      }
		    
		      currentWord = listOfWords[i];

		      if (englishPrepositionList.has(currentWord)) {
			  /*
			    filter function:
			    https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
			    
			    Filter the preposition list array to remove the current word and return the remaining array
			  */
			  finalPrepositionList = englishPrepositionList.filter(function (element) {return element !== currentWord;});
			  randomDistractors = finalPrepositionList.getRandomElements(3);
			  
			  var tmpArray = ["<option value=\"wrongAnswer\">" + randomDistractors[0] + "</option>",
					  "<option value=\"wrongAnswer\">" + randomDistractors[1] + "</option>",
					  "<option value=\"wrongAnswer\">" + randomDistractors[2] + "</option>",
					  "<option value=\"trueAnswer\">" + currentWord + "</option>"];
		
			  tmpArray.shuffle();
			  tmpArray.push("<option value=\"wrongAnswer\">   </option>")
			  tmpArray.reverse();
			  listOfWords[i] = selectHeader + tmpArray.join('') + selectFooter;		    
			  idCounter++;
		      }
		  }
	    	  break;

	        case DUTCH:
		  var l = listOfWords.length;
		  for (var i = 0; i < l; i++) {		    
		      if (idCounter > 20) {     // don't try to process every word on the page
			  break;	    
		      }

		      currentWord = listOfWords[i];
		      
		      if (dutchPrepositionList.has(currentWord)) {		    
			  finalPrepositionList = dutchPrepositionList.filter(function (element) {return element !== currentWord;});
			  randomDistractors = finalPrepositionList.getRandomElements(3);			
			  
			  var tmpArray = ["<option value=\"wrongAnswer\">" + randomDistractors[0] + "</option>",
					  "<option value=\"wrongAnswer\">" + randomDistractors[1] + "</option>",
					  "<option value=\"wrongAnswer\">" + randomDistractors[2] + "</option>",
					  "<option value=\"trueAnswer\">" + currentWord + "</option>"];
		
			  tmpArray.shuffle();
			  tmpArray.push("<option value=\"wrongAnswer\">   </option>")
			  tmpArray.reverse();
			  listOfWords[i] = selectHeader + tmpArray.join('') + selectFooter;
			  idCounter++;
		      }
		  }
		  break;

		default:
		  return false;		
	    }

	textStr = listOfWords.join(" ");
	$(this).html(textStr);
    });
}

function calculateScore() {
    var doc = jetpack.tabs.focused.contentDocument;
    var numCorrectAnswer = 0;
    var numGaps = 0;
    var percentage = 0;
    var score = 0;
   
    $(doc).find("select[id='clozefox_answer']").each(function (index) {
	//
	// Why $(this).val(); does not work as expected and
	// returns the option text instead of option value is
	// strange indeed. So I had to use the following workaround.
	//
	var selectedValue = $(this).attr("value");

	if (selectedValue == "trueAnswer") {
	    numCorrectAnswer++;

	    // provide feedback for CORRECT answer
	    $(this).css("border", "1px blue solid");
	}
	else {

	    // provide feedback for WRONG answer
	    $(this).css("border", "1px red solid");
	}

	numGaps++;
    });

    score = numCorrectAnswer + " out of " + numGaps
    percentage = (numCorrectAnswer * 100) / numGaps;
    percentage = Math.round(percentage * 100) / 100; //round percentage to two decimals
    var mBody = numCorrectAnswer + " out of " + numGaps + "! ";
    mBody += "You have achieved %" + percentage;    
    
    jetpack.notifications.show({title: "ClozeFox test score =", body: mBody, icon: myIcon});

    /*
      let keyword is supported only by the Firefox
      for details please see the following documents
      https://developer.mozilla.org/en/New_in_JavaScript_1.7#Block_scope_with_let
      https://developer.mozilla.org/en/Core_JavaScript_1.5_Guide/Working_with_Closures
    */

    var time = new Date();
    var site = jetpack.tabs.focused.url;
    var pageTitle = jetpack.tabs.focused.contentDocument.title;


    let ctime = time.getMonth() + 1;
    ctime += "/" + time.getDate();
    ctime += " at " + time.getHours();
    ctime += ":" + time.getMinutes();
  
    let scoreDetail = {'site':site, 'time':ctime, 'title':pageTitle, 'score': mBody, 'percentage': percentage, 'strategy': testStrategy};
    let scoreDetails = myStorage.scoreDetails;

    if (!scoreDetails) { // if no scoreDetails are stored yet
	myStorage.scoreDetails = [scoreDetail];
    } 
    else {
	scoreDetails[scoreDetails.length] = scoreDetail;
	myStorage.scoreDetails = scoreDetails;
    }

    jetpack.storage.simple.sync();

    enableTestsAndDisableCalculateScore();    

    if (jetpack.storage.settings.shareOnTwitter) {

	var twitterStatusMessage = "#clozefox ";
	twitterStatusMessage += testStrategyToString[testStrategy] +  " ";
	twitterStatusMessage += mBody;

	$.get("http://ur.ly/new.json?href=" + encodeURI(site) , function(data){
	    var urlyResponse = JSON.parse(data);
	    var shortUrl = "http://ur.ly/" + urlyResponse.code;
	    twitterStatusMessage += " " + shortUrl;
	    jetpack.lib.twitter.statuses.update({ status: twitterStatusMessage }); 
	    jetpack.notifications.show("ClozeFox updated your Twitter status to show your score.");
	});	
    }
}

function displayScoreDetails(content) {    

    let toShow = '';
    let scoreDetails = jetpack.storage.simple.scoreDetails;

    //jetpack.tabs.focused.contentWindow.location.href = "http://yahoo.com";

    if (!scoreDetails) {
	content.attr('innerHTML', 'No scores saved yet!');
    } 
    else {	
	
	for (let i = 0; i < scoreDetails.length; i++) {
	    //toShow += "Page tile  " +  scoreDetails[i].time + " score = " + scoreDetails[i].score + "<br/>";
	    toShow += "<p class=\"score\">Test title: <a href=\"" + scoreDetails[i].site + "\" target=\"_new\">" +  scoreDetails[i].title + "</a><br/>";
	    toShow += "You scored " + scoreDetails[i].score;
	    toShow += " for " + testStrategyToString[scoreDetails[i].strategy] ;
	    toShow += " on " + scoreDetails[i].time;
	    toShow += "<hr/>";
	}		
	
	content.attr('innerHTML', toShow);
    }
}

function displayScoreStats(statsDiv) {    

    let toShow = '';
    let scoreDetails = jetpack.storage.simple.scoreDetails;

    if (!scoreDetails) {
	content.attr('innerHTML', 'No stats yet!');
    } 
    else {

	let numberOfTestsDone = scoreDetails.length;
	let numberOfRandomTests = scoreDetails.filter(function(element) {return element.strategy === STRATEGY_RANDOM;}).length;
	let numberOfPrepositionTests = scoreDetails.filter(function(element) {return element.strategy === STRATEGY_PREPOSITION;}).length;
	/*
	  see 
	  http://stackoverflow.com/questions/2118123/why-does-reduceright-return-nan-in-javascript
	  for details about reduceRight 
	*/
	let totalScore = scoreDetails.reduceRight(function(x, y) {return x + y.percentage;}, 0);

	let totalRandomTestScore = scoreDetails
	                           .filter(function(element) {return element.strategy === STRATEGY_RANDOM;})
	                           .reduceRight(function(x, y) {return x + y.percentage;}, 0);

	let totalPrepositionTestScore = scoreDetails
	                           .filter(function(element) {return element.strategy === STRATEGY_PREPOSITION;})
	                           .reduceRight(function(x, y) {return x + y.percentage;}, 0);
 

	toShow += '<p class="score">Number of random tests done = ' + numberOfRandomTests + '<br/>';
	toShow += 'Average percentage of success = %' + (totalRandomTestScore / numberOfRandomTests)  + '</p>';

	toShow += '<p class="score">Number of preposition tests done = ' + numberOfPrepositionTests + '<br/>';
	toShow += 'Average percentage of success = %' + (totalPrepositionTestScore / numberOfPrepositionTests)+ '</p>';

	toShow += '<p class="score">Total number of tests done = ' + numberOfTestsDone + '<br/>';
	toShow += 'Average percentage of success = %' + (totalScore / numberOfTestsDone) + '</p>';

	toShow += '<p> <img src="http://chart.apis.google.com/chart?chs=300x100&amp;chf=a,s,EFEFEFF0&amp;chd=t:' + (totalRandomTestScore / numberOfRandomTests) + ',' + (totalScore / numberOfTestsDone) + '&amp;cht=p3&amp;chl=Random|Preposition" alt="Sample chart"> </p>';
	toShow += "<hr/>";

	statsDiv.attr('innerHTML', toShow);
    }
}


function deleteScoreDetails() {
    let scoreDetails = myStorage.scoreDetails;
    scoreDetails = null;
    myStorage.scoreDetails = scoreDetails;
    myStorage.sync();
}

function suggestPage(pageType) {
    var tagList = "clozefox";
    var url = "http://feeds.delicious.com/v2/json/YAFZ/";    

    switch (pageType) {
	case SIMPLE_ENGLISH:
	  tagList += "+simple+english";
	  break;
        case NORMAL_ENGLISH:
	  tagList += "+normal+english";
	  break;
	case NORMAL_DUTCH:
	  tagList += "+normal+dutch";
	  break;
        case SIMPLE_DUTCH:
	  tagList += "+simple+dutch";
	  break;
	default:
	  return false;
    }

    url += tagList;

    $.get(url, function(data) {
    	var deliciousResponse = JSON.parse(data);
	deliciousResponse.shuffle();
    	var url =  deliciousResponse[0].u;
    	jetpack.tabs.focused.contentWindow.location.href = url;
    });

    enableTestsAndDisableCalculateScore();
}

function testJQ() {
    var doc = jetpack.tabs.focused.contentDocument;
    var win = jetpack.tabs.focused.contentWindow;

    $.get("http://ajax.googleapis.com/ajax/libs/jquery/1.4.0/jquery.min.js", function(js) {

	var script = doc.createElement("script");
	script.innerHTML = js;
	doc.getElementsByTagName('HEAD')[0].appendChild(script);

	$.get("http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.min.js", function(js) {

	    var script = doc.createElement("script");
	    script.innerHTML = js;
	    doc.getElementsByTagName('HEAD')[0].appendChild(script);

	    $.get("http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/ui-lightness/jquery-ui.css", function(js) {

		var style = doc.createElement("style");
		style.innerHTML = js;
		// style.setAttribute("type") = "text/css";
		// style.setAttribute("media") = "all";
		doc.getElementsByTagName('HEAD')[0].appendChild(style);
				
		script = doc.createElement("script");

		script.innerHTML = 'var myDialogFunc = function () {';
		script.innerHTML += '$("<div id=dialog title=\\"Basic Dialog\\"> <p>The dialog window can be moved, resized and closed with the X icon.</p></div>").appendTo("body");';
		script.innerHTML += '$("#dialog").dialog({'
		script.innerHTML += '      bgiframe: true, height: 140, modal: true';
		script.innerHTML += '  });';
		script.innerHTML += '};';		
		
		doc.body.appendChild(script);
		win.wrappedJSObject['myDialogFunc']();		
	    });
	});
    });
}

var clozeFoxMenu =  new jetpack.Menu([
    { 
	label: "Random Test", 
	command: function () {
	    testStrategy = STRATEGY_RANDOM;
	    runClozeFox(STRATEGY_RANDOM);
	}
    },
    {
	label: "Preposition Test", 
	command: function () {
	    testStrategy = STRATEGY_PREPOSITION;
	    runClozeFox(STRATEGY_PREPOSITION);
	}
    },
    
    null, // separator

    {
	label: "Calculate Score", 
	command: function () {
	    calculateScore();
	},
	disabled: true
    }, 

    null, 

    {
	label: "Suggest a Page (Simple English)",
	command: function () {
	    suggestPage(SIMPLE_ENGLISH);
	}
    },
    {
	label: "Suggest a Page (Normal English)",
	command: function () {
	    suggestPage(NORMAL_ENGLISH);
	}
    }, 
    {
	label: "Suggest a Page (Normal Dutch)",
	command: function () {
	    suggestPage(NORMAL_DUTCH);
	}
    },
    {
	label: "Suggest a Page (Simple Dutch)",
	command: function () {
	    suggestPage(SIMPLE_DUTCH);
	}
    },

    null,

    {
	label: "Delete score details",
	command: function () {
	    jetpack.notifications.show("Deleting Score Deails!");
	    deleteScoreDetails();
	}
    },

    null,
    {
	label: "Help",
	command: function () {
	    let helpPage = "http://dev.linguapolis.be/jetpack/firstRun.html";
	    jetpack.tabs.open(helpPage).focus(); 
	}
    },
    {
	label: "Test jQuery UI",
	command: function () {
	    testJQ();
	}
    }
]);

jetpack.menu.context.page.add({
    label: "ClozeFox",
    icon: "http://dev.linguapolis.be/jetpack/images/ua_logo.png",
    menu: clozeFoxMenu
});


function enableCalculateScore() {
    clozeFoxMenu.beforeShow = function () {
	clozeFoxMenu.item("Calculate Score").disabled = false;
    };
}


function disableCalculateScore() {
    clozeFoxMenu.beforeShow = function () {
	clozeFoxMenu.item("Calculate Score").disabled = true;
    };
}

function enableTestsAndDisableCalculateScore() {
    clozeFoxMenu.beforeShow = function () {
	clozeFoxMenu.item("Random Test").disabled = false;
	clozeFoxMenu.item("Preposition Test").disabled = false;
	clozeFoxMenu.item("Calculate Score").disabled = true;
    };
}


function disableTestsAndEnableCalculateScore() {
    clozeFoxMenu.beforeShow = function () {
	clozeFoxMenu.item("Random Test").disabled = true;
	clozeFoxMenu.item("Preposition Test").disabled = true;
	clozeFoxMenu.item("Calculate Score").disabled = false;
    };
}


jetpack.tabs.onClose(function () {
    if (languageTestUrl === jetpack.tabs.focused.contentWindow.location.href) {
	disableCalculateScore();
	enableTests();
    }
});


//
// Dictionary Jetpack
//
// http://jetpackgallery.mozillalabs.com/jetpacks/52
//
jetpack.statusBar.append({
    html: '<span style="background-color: yellow;">define</span>',
    width:55,
    onReady: function(doc) {
	$(doc).click( function () {
	    var rnd = Math.floor(Math.random()*1000);
	    var wrd = jetpack.tabs.focused.contentDocument.getSelection();
	    if(wrd!="") {
		// $.get("http://en.wiktionary.org/wiki/leraar", {q: ""}, function(data) {  // Why does this try to refresh the whole page!?
		$.get("http://google.com/search", {q: "define:" + wrd}, function (data) {  
		    var cTab=jetpack.tabs.focused;
		    var handle=cTab.contentDocument.createElement("img");
		    handle.setAttribute("onclick","document.body.removeChild(document.getElementById('dfjtpck"+rnd+"'))");
		    handle.setAttribute("style","background-color:black;position:fixed;bottom:386px;right:1px;");
		    handle.setAttribute("src","http://ericburling.org/jetpacks/close-icon.gif");
		    var div=cTab.contentDocument.createElement("div");
		    div.setAttribute("style","text-align:left;border:1px solid;position:fixed;width:450px;bottom:0px;height:400px;right:0px;background-color:white;overflow:auto;z-index:10000");
		    var def=cTab.contentDocument.createElement("div");
		    def.setAttribute("style","width:400px");
		    //def.innerHTML=data.substr(data.indexOf("Definitions of"),data.indexOf("")-data.indexOf("Definitions of"));   
		    def.innerHTML = data;
		    div.appendChild(handle);
		    div.appendChild(def);
		    div.setAttribute("id","dfjtpck"+rnd);
		    cTab.contentDocument.body.appendChild(div);
		    delete cTab;
		    delete handle;
		    delete div;
		    delete def;
		    delete wrd;
		    delete rnd;
		});
	    }
	});
    }});
