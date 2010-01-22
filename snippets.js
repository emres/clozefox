/*

  Arbitrary code snippets that I don't want to keep in original clozefox.js

*/

    // $(doc).find("div div:only-child").css("border", "3px blue solid");
    // $(doc).find("div div:only-child").each(function (index) {



    // for(var i = 0; i < results.length; i++) {
    // 	$(doc).find("#clozefox_paragraph_" + results[i]).remove();
    // }         


jetpack.future.import('notificationBox');

jetpack.notificationBox.show({
 message: 'Lookuphere! Hey! You guys! Lookuphere!',
 delay: 3,
 buttons: [{
  accessKey: null,
  label: 'Hoot',
  callback: function() { console.log('Woot!'); }
 }]
});



   // $.ajax({
    // 	type: "GET",
    // 	url: "http://feeds.delicious.com/v2/rss/YAFZ/clozefox",
    // 	datatype: "xml",
    // 	success: function(xml) {
    // 	    // var deliciousResponse = xml;
    // 	    jetpack.notifications.show(xml);
    // 	}
    // });



function testJQ() {
    var doc = jetpack.tabs.focused.contentDocument;
    var win = jetpack.tabs.focused.contentWindow;

    $.get("http://ajax.googleapis.com/ajax/libs/jquery/1.4.0/jquery.min.js", function(js) {

	var script = doc.createElement("script");
	script.innerHTML = js;
	// doc.body.appendChild(script);
	doc.getElementsByTagName('HEAD')[0].appendChild(script);

	$.get("http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/jquery-ui.min.js", function(js) {

	    var script = doc.createElement("script");
	    script.innerHTML = js;
	    // doc.body.appendChild(script);
	    doc.getElementsByTagName('HEAD')[0].appendChild(script);

	    $.get("http://ajax.googleapis.com/ajax/libs/jqueryui/1.7.2/themes/ui-lightness/jquery-ui.css", function(js) {

		var style = doc.createElement("style");
		style.innerHTML = js;
		doc.getElementsByTagName('HEAD')[0].appendChild(style);
				
		// var script = doc.createElement("script");
		// script.innerHTML  = 'var myDragFunc = function(){';
                // script.innerHTML +=    '$("<style type=text/css> .drg_style {margin:5px; padding:10px; width:250px; height:25px; background:green} </style>").appendTo("body");';
                // script.innerHTML +=    '$("<div> <div class=drg_style>Div1</div> <div class=drg_style>Div2</div> </div>").appendTo("body");';
		// script.innerHTML +=    '$(".drg_style").draggable();';
	        // script.innerHTML +=   '};';
		// doc.body.appendChild(script);		
		// win.wrappedJSObject['myDragFunc']();

		// script = doc.createElement("script");
		// script.innerHTML += 'var myDialogFunc = function () {';
		// script.innerHTML +=  '$("<div id=dialog title=\\"Basic Dialog\\"> <p>The dialog window can be moved, resized and closed with the X icon.</p></div>").appendTo("body");';
		// script.innerHTML += '$("#dialog").dialog({'
		// script.innerHTML += '      bgiframe: true, height: 140, modal: true';
		// script.innerHTML += '  });';
		// script.innerHTML += '};';
		// doc.body.appendChild(script);
		// win.wrappedJSObject['myDialogFunc']();

		script = doc.createElement("script");

		script.innerHTML = 'var myDialogFunc = function () {';
		script.innerHTML += '$("<div id=dialog title=\\"Basic Dialog\\"> <p>The dialog window can be moved, resized and closed with the X icon.</p></div>").appendTo("body");';
		script.innerHTML += '$("#dialog").dialog({'
		script.innerHTML += '      bgiframe: true, height: 140, modal: true';
		script.innerHTML += '  });';
		script.innerHTML += '};';
		
		// var dialogObject = {
		//     jsCode : (<><![CDATA[
		// 	var myDialogFunc = function () {
		// 	    // $("<div id=dialog title=Basic> <p>The dialog window can be moved, resized and closed with the X icon.</p></div>").appendTo("body");
		// 	    $("#dialog").dialog({
		// 		bgiframe: true, 
		// 		height: 140, 
		// 		modal: true
		// 	    });
		// 	};
		//    ]]</>).toString();
		// }
		// script.innerHTML = dialogObject.jsCode;

		// var test_object = {
		//     javascript_code: <> function ()  {return true;} </>,
		//     initialize: function(){
		// 	var doc = jetpack.tabs.focused.contentDocument;
		// 	var script = doc.createElement('script');
		// 	doc.body.appendChild(script);
		// 	script.innerHTML = test_object.javascript_code;
		//     }
		// }

		
		doc.body.appendChild(script);
		win.wrappedJSObject['myDialogFunc']();		
	    });
	});
    });
}
