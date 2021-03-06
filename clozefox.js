/*
 * ClozeFox Firefox Jetpack Plug-in  
 *
 * developed by Emre Sevinc and Jozef Colpaert at Linguapolis Institute, 
 * University of Antwerp
 *
 * http://www.linguapolis.be/
 * http://www.ua.ac.be
 *
 * License: GNU GPL v3 
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
		{ name: "password", type: "password", label: "Password" },
		{ name: "shareOnTwitter", type: "boolean", label: "Share on Twitter?", default: true }
	    ]
	}
	// ,	
	// { name: "music", type: "boolean", label: "Music", default: true },
	// { name: "volume", type: "range", label: "Volume", min: 0, max: 10, default: 5 }
    ]
};

/**
 * Define the relevant constants and variables. Please be aware that the const is a
 * Mozilla-specific extension, it is not supported by IE.  see
 * https://developer.mozilla.org/En/Core_JavaScript_1.5_Reference/Statements/Const
 * for details.
 */

/**
 *
 * Test type constants and variables
 *
 */
const STRATEGY_RANDOM       = 1000;
const STRATEGY_PREPOSITION  = 1100;
const STRATEGY_VERB         = 1200;

var testStrategy = 0;
var testStrategyToString = [];
testStrategyToString[STRATEGY_RANDOM] = "#randomTest";
testStrategyToString[STRATEGY_PREPOSITION] = "#prepositionTest";
testStrategyToString[STRATEGY_VERB] = "#verbTest";


/**
 *
 * Language constants
 *
 */
const ENGLISH               = 1000;
const DUTCH                 = 2000;
const UNKNOWN_LANGUAGE      = 9999;

/**
 *
 * Page type constants
 *
 */
const SIMPLE_ENGLISH        = 1000;
const NORMAL_ENGLISH        = 1100;
const NORMAL_DUTCH          = 2000;
const SIMPLE_DUTCH          = 2100;

/**
 *
 * Language-specific constants
 *
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


/**
 *
 * http://en.wiktionary.org/wiki/Wiktionary:Frequency_lists#Dutch
 *
 */
const dutchFrequencyList =  ["de", "en", "het", "van", "ik", "te", "dat", "die", "in", "een",
			     "hij", "niet", "zijn"];
/**
 *
 * http://en.wiktionary.org/wiki/Category:Dutch_prepositions
 *
 */
const dutchPrepositionList = ["aan", "achter", "bij", "binnen", "dan", "door", "in", "langs", 
			      "met", "middels", "min", "na", "naar", "naast", "om", "onder", 
			      "op", "over", "ongeveer", "per", "rond", "sinds", "tegen", 
			      "tot", "tijdens", "tussen", "uit", "van", "vanaf", "vanuit", 
			      "via", "voor", "zonder"];

/**
 *
 * Icon used for notifications
 *
 */
const myIcon ="http://dev.linguapolis.be/jetpack/images/uaLogo.ico"; 


jetpack.future.import("storage.settings");
jetpack.future.import("menu");
jetpack.future.import('clipboard');

/**
 *
 * Initialize the JetPack storage system and bind myStorage to it.
 *
 */

jetpack.future.import("storage.simple"); 
var myStorage = jetpack.storage.simple; 

/**
 *
 * Initialize the JetPack slidebar system and activate it.
 *
 */

var cb; // used for slide later, be careful about this

var initialContent = '<style type="text/css"> \
div#content {background-color: white; height: 400px; padding-left: 3px; overflow: auto;} \
div#stats {background-color: white; height: 300px; padding-left: 3px; overflow: auto;-moz-border-radius: 20px} \
div#summaryTitle {background-color: #ECA30F; padding-left: 3px;-moz-border-radius: 20px} \
h4 {font-family: Arial} \
p.score {font-family: Verdana; font-size: 12px;} \
</style> \
<div id="summaryTitle"><h4>ClozeFox Summary Statistics</h4></div> \
<div id="stats"></div> \
<div id="summaryTitle"><h4>ClozeFox Test Scores</h4></div> \
<div id="content"></div> ';

jetpack.future.import('slideBar'); 

jetpack.slideBar.append({
    width: 350,
    icon: 'http://dev.linguapolis.be/jetpack/images/ua_logo.png',
    html: initialContent,
    persist: false,
    onReady: function(slide) {
	cb = slide;
    },
    onSelect: function(slide) {
	displayScoreDetails($(slide.contentDocument).find("#content"));
	displayScoreStats($(slide.contentDocument).find("#stats"));
    }
});


/**
 *
 * Runs the language test on the current page
 * @param {Number} strategy This is the named constant for test strategy
 * @returns 
 *
 */
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

    fListArray.sort(function (x, y) {return x[1] - y[1];});
    fListArray.reverse();

    var pageLanguage = detectLanguage(fListArray);
    switch (pageLanguage) {
	case ENGLISH:
	  disableTestsAndEnableCalculateScore();
	  createTest(doc, strategy, ENGLISH);
	  languageTestUrl = jetpack.tabs.focused.contentWindow.location.href;
	  break;

	case DUTCH:
	  disableTestsAndEnableCalculateScore();
	  createTest(doc, strategy, DUTCH);
          languageTestUrl = jetpack.tabs.focused.contentWindow.location.href;
	  break;

	default:
	  var myBody = "Oops! Sorry, ClozeFox could not find the main text of the page or the language of the page could not be detected.";
	  myBody     += " Maybe it can suggest you a new page if you right-click on the current page and select Suggest a Page";
	  jetpack.notifications.show({title: "Language error", body: myBody, icon: myIcon});
    }     
}


/**
 *
 * Calculates the word frequency in a given text
 * @param {String} txt This is a string of characters
 * @returns frequencyList, an array that contains the words and their frequencies
 * @type Array
 *
 */
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

/**
 *
 * Detects the language based on an array of words and frequencies
 * @param {Array} fListArray This is an array of words and frequencies
 * @returns resultLanguage The integer code for the language
 * @type Number
 *
 */
function detectLanguage(fListArray) {
    var numOfMatchingWords = 0;
    var resultLanguage = UNKNOWN_LANGUAGE;
    var fListArrayLength;
    var englishFrequencyListLength;
    var dutchFrequencyListLength;
    var l = 0;

    //
    // Check for English
    //
    numOfMatchingWords = 0;
    fListArrayLength = fListArray.length;
    englishFrequencyListLength = englishFrequencyList.length;
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
    dutchFrequencyListLength = dutchFrequencyList.length;
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

/**
 *
 * Creates the test for a given document, this is actually a dispatch function.
 * @param {Object} doc
 * @param {Number} strategy 
 * @param {Number} language
 *
 */
function createTest(doc, strategy, language) {
    switch (strategy) {
	case STRATEGY_RANDOM:
	  createRandomTest(doc, language);
	  break;
	case STRATEGY_PREPOSITION:
	  createPrepositionTest(doc, language);
	  break;
	case STRATEGY_VERB:
	  createVerbTest(doc, language);
	  break;
	default:
	  console.log("Error: Unknown test strategy!");	  
    }
}

/**
 *
 * Creates the random test for a given document
 * @param {String} doc
 * @param {Number} language
 *
 */
function createRandomTest(doc, language) {
    var idCounter = 1;   
    var selectHeader = "<select id=\"clozefox_answer\">";
    var selectFooter = "</select>";
    var randomDistractors = englishFrequencyList.getRandomElements(3);
 
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
		    
		      if ((i % 7) === 0) {
			  currentWord = listOfWords[i];

			  finalWordList = englishFrequencyList.filter(function (element) {return element !== currentWord;});
			  randomDistractors = finalWordList.getRandomElements(3);
		      
			  var tmpArray = ["<option value=\"wrongAnswer\">" + randomDistractors[0] + "</option>",
					  "<option value=\"wrongAnswer\">" + randomDistractors[1] + "</option>",
					  "<option value=\"wrongAnswer\">" + randomDistractors[2] + "</option>",
					  "<option value=\"trueAnswer\">" + currentWord + "</option>"];			  
			  tmpArray.shuffle();
			  tmpArray.push("<option value=\"wrongAnswer\">   </option>");
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

		      if ((i % 7) === 0) {
			  currentWord = listOfWords[i];
			  
			  finalWordList = dutchFrequencyList.filter(function (element) {return element !== currentWord;});
			  randomDistractors = finalWordList.getRandomElements(3);			
			  
			  var tmpArray = ["<option value=\"wrongAnswer\">" + randomDistractors[0] + "</option>",
					  "<option value=\"wrongAnswer\">" + randomDistractors[1] + "</option>",
					  "<option value=\"wrongAnswer\">" + randomDistractors[2] + "</option>",
					  "<option value=\"trueAnswer\">" + currentWord + "</option>"];		      
			  tmpArray.shuffle();
			  tmpArray.push("<option value=\"wrongAnswer\">   </option>");
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



/**
 *
 * Return an array of random elements constructed from the given array.
 * @param {Number} numElements
 * @returns newArray This is the new random array
 * @type Array
 *
 */
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
};

/**
 *
 * Checks if a given element exists in an array.
 * @param {Object} obj
 * @returns true if element exists otherwise false
 * @type Boolean
 *
 */
Array.prototype.has = function(obj) {
    return this.indexOf(obj) >= 0;
};

/**
 *
 * Shuffles a given array
 *
 */
Array.prototype.shuffle = function() {
/*
  Fisher Yates shuffle algorithm adapted from
  http://sedition.com/perl/javascript-fy.html

  This is currently a destructive function!
  It modifies the array it acts upon, so use with care.
*/
  var i = this.length;
  if (i === 0) {
      return false;
  }
  while (--i) {
     var j = Math.floor( Math.random() * ( i + 1 ) );
     var tempi = this[i];
     var tempj = this[j];
     this[i] = tempj;
     this[j] = tempi;
   }
};


/**
 *
 * Creates the preposition test for a given document
 * @param {Object} doc
 * @param {Number} language
 *
 */
function createPrepositionTest(doc, language) {
    var idCounter = 1;   
    var selectHeader = "<select id=\"clozefox_answer\">";
    var selectFooter = "</select>";
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
			  tmpArray.push("<option value=\"wrongAnswer\">   </option>");
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
			  tmpArray.push("<option value=\"wrongAnswer\">   </option>");
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


/**
 *
 * Creates the verb test for a given document
 * @param {Object} doc  
 * @param {Number} language
 *
 */
function createVerbTest(doc, language) {
    var idCounter = 1;   
    var selectHeader = "<select id=\"clozefox_answer\">";
    var selectFooter = "</select>";
    var randomDistractors = englishPrepositionList.getRandomElements(3);
    var serverResponse = "";
 
    $(doc).find("[id^=clozefox_paragraph]").each(function (index) {
	var currentParagraph = $(this);
	var textStr = currentParagraph.text();
   
	if (index < 2) {
	    
	    // send the text to the clozefoxServer app
	    $.post("http://localhost:8080/nltk", { content: textStr},
		   function (data) {
		       serverResponse = data;		    
		       textStr = serverResponse;
		       currentParagraph.html(serverResponse);
	    });
	}
    });
}



/**
 *
 * Calculates the score of the current test
 *
 */
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

    score = numCorrectAnswer + " out of " + numGaps;
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

    if (jetpack.storage.settings.twitter.shareOnTwitter) {

	var twitterStatusMessage = "#clozefox ";
	twitterStatusMessage += testStrategyToString[testStrategy] +  " ";
	twitterStatusMessage += mBody;

	$.get("http://ur.ly/new.json?href=" + encodeURI(site) , function(data){
	    var urlyResponse = JSON.parse(data);
	    var shortUrl = "http://ur.ly/" + urlyResponse.code;
	    twitterStatusMessage += " " + shortUrl;
	    jetpack.lib.twitter.statuses.update({
		data: { 
		    status: twitterStatusMessage 
		},
		username: jetpack.storage.settings.twitter.username,
		password: jetpack.storage.settings.twitter.password
						 
	    }); 
	    jetpack.notifications.show("ClozeFox updated your Twitter status to show your score.");
	});	
    }
}


/**
 *
 * Displays the details of test scores in the slidebar
 * @param {Object} content This is part of content marked by the plug-in
 *
 */
function displayScoreDetails(content) {    

    let toShow = '';
    let scoreDetails = jetpack.storage.simple.scoreDetails;

    //jetpack.tabs.focused.contentWindow.location.href = "http://yahoo.com";

    if (!scoreDetails) {
	content.attr('innerHTML', 'No scores saved yet!');
    } 
    else {	
	
	// order scoreDetails by time, that is reverse the array
	// because newest items were added to the end of it
	scoreDetails.reverse();

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

/**
 *
 * Displays the statistics  test scores in the slide bar
 * @param {Object} statsDiv
 *
 */
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

	let randomAveragePercentage = 0;
	let prepositionAveragePercentage = 0;

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
 
	if (numberOfRandomTests !== 0) {
	    randomAveragePercentage = (totalRandomTestScore / numberOfRandomTests);
	}
	
	randomAveragePercentage = Math.round(randomAveragePercentage * 100) / 100; //round percentage to two decimals
	toShow += '<p class="score">Number of random tests done = ' + numberOfRandomTests + '<br/>';
	toShow += 'Average percentage of success = %' + randomAveragePercentage + '</p>';
	
	if (numberOfPrepositionTests !== 0) {
	    prepositionAveragePercentage = (totalPrepositionTestScore / numberOfPrepositionTests);
	}

	prepositionAveragePercentage = Math.round(prepositionAveragePercentage * 100) / 100; //round percentage to two decimals
	toShow += '<p class="score">Number of preposition tests done = ' + numberOfPrepositionTests + '<br/>';
	toShow += 'Average percentage of success = %' + prepositionAveragePercentage + '</p>';

	let totalAveragePercentage = (totalScore / numberOfTestsDone);
	totalAveragePercentage = Math.round(totalAveragePercentage * 100) / 100; //round percentage to two decimals
	toShow += '<p class="score">Total number of tests done = ' + numberOfTestsDone + '<br/>';	
	toShow += 'Average percentage of success = %' + totalAveragePercentage + '</p>';

	toShow += '<p> <img src="http://chart.apis.google.com/chart?chs=300x100&amp;chf=a,s,EFEFEFF0&amp;chd=t:' + (totalRandomTestScore / numberOfRandomTests) + ',' + (totalPrepositionTestScore / numberOfPrepositionTests) + '&amp;cht=p3&amp;chl=Random|Preposition" alt="Sample chart"> </p>';

	statsDiv.attr('innerHTML', toShow);
    }
}


/**
 *
 * Deletes the score details storage permanently
 *
 */
function deleteScoreDetails() {
    let scoreDetails = myStorage.scoreDetails;
    scoreDetails = null;
    myStorage.scoreDetails = scoreDetails;
    myStorage.sync();
}

/**
 *
 * Suggests a page for easy start up.
 * @param {Number} pageType This is the integer code for the page type
 *
 */
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

/**
 *
 * Prints the About box for ClozeFox
 *
 */
function printAboutClozeFox() {
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
		js = js.replace("url(", "url(http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/ui-lightness/", "g"); 
		style.innerHTML = js;
		style.setAttribute("type", "text/css");
		style.setAttribute("media", "all");
		doc.getElementsByTagName('HEAD')[0].appendChild(style);
				
		script = doc.createElement("script");

		script.innerHTML = 'var myDialogFunc = function () {';
		script.innerHTML += '$("<div id=dialog title=\\"About ClozeFox\\"> <p>ClozeFox Firefox Jetpack Plug-in</p> <p>developed by Emre Sevinc and Jozef Colpaert at University of Antwerp</p> <p> <a href=\\"http://www.ua.ac.be\\">http://www.ua.ac.be</a> </p> </div>").appendTo("body");';
		script.innerHTML += '$("#dialog").dialog({';
		script.innerHTML += '      bgiframe: true, width: 350, height: 300, modal: true, draggable: false';
		script.innerHTML += '  });';
		script.innerHTML += '};';		
		  
		doc.body.appendChild(script);
		win.wrappedJSObject['myDialogFunc']();		
	    });
	});
    });
}

/**
 *
 * The context menu definition
 *
 */
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
    {
	label: "Verb Test", 
	command: function () {
	    testStrategy = STRATEGY_VERB;
	    runClozeFox(STRATEGY_VERB);
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
	label: "Copy the test to clipboard",
	command: function () {
	    let currentUrl = jetpack.tabs.focused.contentWindow.location.href;
	    currentUrl += '?ClozeFoxTestStrategy=' +  testStrategyToString[testStrategy];
	    jetpack.clipboard.set(currentUrl);
	    let mBody = "The current test is copied to your clipboard. You can paste it into your mail and share it.";
	    jetpack.notifications.show({title: "Clipboard", body: mBody, icon: myIcon});
	}
    },

    {
	label: "Delete score details",
	command: function () {
	    let currentWindow = jetpack.tabs.focused.contentWindow;
	    let confirmed = false;
	    confirmed =  currentWindow.confirm('Are you sure to delete your previous scores?');
	    if (confirmed) {
		jetpack.notifications.show("Score details are deleted!");
		deleteScoreDetails();
	    }
	    else {
		return false;
	    }
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
	label: "About ClozeFox",
	command: function () {
	    printAboutClozeFox();
	}
    }
]);

jetpack.menu.context.page.add({
    label: "ClozeFox",
    icon: "http://dev.linguapolis.be/jetpack/images/ua_logo.png",
    menu: clozeFoxMenu
});


/**
 *
 * Enables the test menu items and disables Calculate Score menu item
 *
 */
function enableTestsAndDisableCalculateScore() {
    clozeFoxMenu.beforeShow = function () {
	clozeFoxMenu.item("Random Test").disabled = false;
	clozeFoxMenu.item("Preposition Test").disabled = false;
	clozeFoxMenu.item("Verb Test").disabled = false;
	clozeFoxMenu.item("Calculate Score").disabled = true;
    };
}

/**
 *
 * Enables the Calculate Score menu item and disables the test menu items
 *
 */
function disableTestsAndEnableCalculateScore() {
    clozeFoxMenu.beforeShow = function () {
	clozeFoxMenu.item("Random Test").disabled = true;
	clozeFoxMenu.item("Preposition Test").disabled = true;
	clozeFoxMenu.item("Verb Test").disabled = true;
	clozeFoxMenu.item("Calculate Score").disabled = false;
    };
}


/**
 *
 * Retrieve the score details when focused
 *
 */
jetpack.tabs.onFocus(function () {
  let scoreDetails = jetpack.storage.simple.scoreDetails;
  for (let i = 0; i < scoreDetails.length; i++) {
    if (this.url == scoreDetails[i].site) {
	cb.notify();
    }
  }
});

/**
 *
 * Check if the page needs to be converted into a test automatically
 * and convert according to test strategy.
 *
 */
jetpack.tabs.onReady(function () {
    let currentUrl = jetpack.tabs.focused.contentWindow.location.href;

    // testStrategy = STRATEGY_PREPOSITION;
    // runClozeFox(STRATEGY_PREPOSITION);

    if (currentUrl.indexOf('ClozeFoxTestStrategy=#prepositionTest') > 0) {
    	testStrategy = STRATEGY_PREPOSITION;
    	runClozeFox(STRATEGY_PREPOSITION);
    }

    if (currentUrl.indexOf('ClozeFoxTestStrategy=#randomTest') > 0) {
    	testStrategy = STRATEGY_RANDOM;
    	runClozeFox(STRATEGY_RANDOM);
    }
});

/**
 *
 * Check if the test page has been closed and if that is the case
 * enable the tests and disable the Calculate Score menu item
 *
 */
jetpack.tabs.onClose(function () {
    if (languageTestUrl === jetpack.tabs.focused.contentWindow.location.href) {
	enableTestsAndDisableCalculateScore();
    }
});


/**
 *
 *
 * Dictionary Jetpack
 *
 * http://jetpackgallery.mozillalabs.com/jetpacks/52
 *
*/
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
