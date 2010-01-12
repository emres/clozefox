var manifest = {
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
p.score {font-family: Verdana; font-size: 10px;} \
</style> \
<h4>ClozFox Test Scores</h4> \
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
  Define the relevant constants. Please be aware that the const is a
  Mozilla-specific extension, it is not supported by IE.  see
  https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Statements/Const
  for details.
*/
const STRATEGY_RANDOM       = 1000;
const STRATEGY_PREPOSITION  = 1100;

const ENGLISH               = 1000;
const DUTCH                 = 2000;
const UNKNOWN_LANGUAGE      = 9999;

/*
I had to use a global variable because during the initialization

$(widget).click(runClozeFox);

ran immediately when preparing the status bar!

So this is the default strategy
*/
var testStrategy = STRATEGY_PREPOSITION;


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


function runClozeFox() { 
    var MIN_TEXT_LENGTH = 90;
    results = [];
    wholeText = "";
   
    var doc = jetpack.tabs.focused.contentDocument; 

    // $(doc).find("div div:only-child").css("border", "3px blue solid");
    // $(doc).find("div div:only-child").each(function (index) {

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

    // for(var i = 0; i < results.length; i++) {
    // 	$(doc).find("#clozefox_paragraph_" + results[i]).remove();
    // }     


    /*
      If the enough amount of text cannot be found or grabbed correctly 
      by the system then immediately stop processing
    */
    if (wholeText.length <= 100) {
	var myBody = "ClozeFox could not find enough text on the page.";
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
	  createTest(doc, testStrategy, ENGLISH);
	  break;

	case DUTCH:
	  createTest(doc, testStrategy, DUTCH);
	  break;

	default:
	  var myBody = "ClozeFox could not find the main text of the page or the language of the page could not be detected, sorry!";
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
    var l = englishFrequencyList.length;

    //
    // Check for English
    //
    numOfMatchingWords = 0;
    for (var i = 0; i < l; i++) {
	for (var j = 0; j < l; j++) {
	    // console.log("englishFrequencyList[" + i + "] = " + englishFrequencyList[i] + " " + "fListArray[" + j + "] = " + fListArray[j]);
	    if (englishFrequencyList[i] == fListArray[j][0]) {
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
    for (var i = 0; i < l; i++) {
	for (var j = 0; j < l; j++) {
	    if (dutchFrequencyList[i] == fListArray[j][0]) {
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

	    if (idCounter > 50) {
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

Array.prototype.indexOf = function(obj) {
    for (var i = 0; i < this.length; i++) {
	if (this[i] === obj)
	    return i;
    }
    return -1;
}

Array.prototype.has = function(obj) {
    return this.indexOf(obj) >= 0;
} 

Array.prototype.shuffle = function() {
/*
  Fisher Yates shuffle algorithm adapted from
  http://sedition.com/perl/javascript-fy.html

  This is currently a destructive function.
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
		    if (idCounter > 20) {
			break;	    
		    }
		    
		    currentWord = listOfWords[i];
		    if (englishPrepositionList.has(currentWord)) {		    
			randomDistractors = englishPrepositionList.getRandomElements(3);
			
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
		    if (idCounter > 20) {
			break;	    
		    }

		    currentWord = listOfWords[i];

		    if (dutchPrepositionList.has(currentWord)) {		    
			randomDistractors = dutchPrepositionList.getRandomElements(3);
		    
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
  
    let scoreDetail = {'site':site, 'time':ctime, 'title':pageTitle, 'score': mBody, 'percentage': percentage};
    let scoreDetails = myStorage.scoreDetails;

    if (!scoreDetails) { // if no scoreDetails are stored yet
	myStorage.scoreDetails = [scoreDetail];
    } 
    else {
	scoreDetails[scoreDetails.length] = scoreDetail;
	myStorage.scoreDetails = scoreDetails;
    }

    jetpack.storage.simple.sync();

    if (jetpack.storage.settings.shareOnTwitter) {

	var twitterStatusMessage = "#clozefox ";
	twitterStatusMessage += "#prepositionTest ";
	twitterStatusMessage += mBody;

	/*
	  http://wiki.github.com/ajstiles/urly
	  http://ur.ly/
	*/
	$.get("http://ur.ly/new.json?href=" + encodeURI(site) , function(data){
	    var urlyResponse = JSON.parse(data);
	    var shortUrl = "http://ur.ly/" + urlyResponse.code;
	    twitterStatusMessage += " " + shortUrl;
	    // jetpack.notifications.show(twitterStatusMessage);
	    jetpack.lib.twitter.statuses.update({ status: twitterStatusMessage }); 
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
	    toShow += " on " + scoreDetails[i].time;
	    toShow += "<hr/>";
	}		
	
	content.attr('innerHTML', toShow);
    }
}


jetpack.statusBar.append({ 
    html: "Run ClozeFox!", 
    width: 75, 
    onReady: function(widget){ 
	$(widget).click(runClozeFox);
    } 
});

jetpack.statusBar.append({ 
    html: "Calculate score", 
    width: 80, 
    onReady: function(widget){ 
	$(widget).click(calculateScore); 
    } 
});


jetpack.menu.context.page.add({
  label: "ClozeFox",
  icon: "http://dev.linguapolis.be/jetpack/images/ua_logo.png",
    menu: new jetpack.Menu(["Random Test", "Preposition Test", null, "Calculate Score"]),
    command: function (menuitem) {
	switch(menuitem.label) {
	case "Random Test":
	    testStrategy = STRATEGY_RANDOM;
	    runClozeFox();
	    break;
	case "Preposition Test":
	    testStrategy = STRATEGY_PREPOSITION;
	    runClozeFox();
	    break;
	case "Calculate Score":
	    calculateScore();
	    break;
	default:
	    return false;
	}
	//jetpack.notifications.show(menuitem.label);
    }
});



