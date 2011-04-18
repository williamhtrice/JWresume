/* ////////////////////////////////////
JW Player Auto Resume Javascript Plugin
v1.00
23-02-2011
www.williamrice.co.uk

Please note that I have no intention of offering support for my plugin.
Use at risk of your own frustration.

///////////////////////////////////////

For this plugin to work, we need to do the following:

1) when the user browses to a page containing this script, we need to
check for a cookie(s), previously written by the script.

2) if a cookie was available, we need to build the player using the saved:
		playlist
		selected playlist item
		position
		state
		volume
		
	if a cookie was not available, we need to build the player using a default playlist.
	
3) when the user browses away from a page containing this script, we need to
retrieve the following from the JW player:
		playlist
		selected playlist item
		position
		state
		volume
		
4) we need to write all the retrieved data to a cookie(s) with an expiry date

////////////////////////////////////////

Known issues:

1) If the user has the player paused, but the file (non streaming) hasn't finished
downloading when they change page. The player will resume the file and state, but
NOT the position. This is a rare case because it's unlikely that the user will 
pause the player and then quickly switch to another page whilst the player is still
buffering. Furthermore, this scenario would be very unlikely to bother the user.

///////////////////////////////////// */



/* we set up the jwresume library with a global object container */
/* this is to create a nice external syntax and avoid cluttering the global namespace */
var jwresume = {};



/* get element by ID */
jwresume.Gid = function (elementId) {
	return document.getElementById(elementId);	
};



/* run debugger ouput at given interval (ms) */
setInterval("jwresume.Debug()",250);
/* read out some useful variables to an alert (for debugging) */
jwresume.Debug = function () {
	jwresume.Gid('debug-text').innerHTML =
		"DEBUGGER IS ENABLED:<br><br>"+
		"CONDITIONS LOADED FROM COOKIES (SAVED AT END OF LAST SESSION):<br>"+
		"jwresume.Item: "+jwresume.Item+"<br>"+
		"jwresume.Position: "+jwresume.Position+"<br>"+
		"jwresume.State: "+jwresume.State+"<br>"+
		"jwresume.Volume: "+jwresume.Volume+"<br>"+
		"jwresume.Playlist: "+jwresume.Playlist+"<br><br>"+
		"CURRENT CONDITIONS:<br>"+
		"jwresume.currentItem: "+jwresume.currentItem+"<br>"+
		"jwresume.currentPosition: "+jwresume.currentPosition+"<br>"+
		"jwresume.currentState: "+jwresume.currentState+"<br>"+
		"jwresume.currentVolume: "+jwresume.currentVolume+"<br>"+
		"jwresume.currentPlaylist: "+jwresume.currentPlaylist
	;
};



/* functions to read/write browser cookies */
jwresume.createCookie = function (name,value,seconds) {
	var expires = "";
	if (seconds) {
		var date = new Date();
		date.setTime(date.getTime()+(seconds*1000));
		expires = "; expires="+date.toGMTString();
	} else { 
		expires = "";
	}
	document.cookie = name+"="+escape(value)+expires+"; path=/";
};
jwresume.readCookie = function (name) {
  var results = document.cookie.match ( '(^|;) ?' + name + '=([^;]*)(;|$)' );

	if ( results ) {
		return ( unescape ( results[2] ) );
	} else {
		return null;
	}
};
jwresume.eraseCookie = function (name) {
	jwresume.createCookie(name,"",-1);
};



/* this function will unravel the array of playlist objects received by a JW player getPlaylist() call */
/* into an array of strings that can be maniplulated by jwresume */
jwresume.makePlaylistStringArray = function (playlistArray) {
	var playlistStringArray=new Array();
	for (i in playlistArray) {
		var itemString="";
		if (playlistArray[i].author) {itemString += "author:::"+playlistArray[i].author+", ";}
		if (playlistArray[i].date) {itemString += "date:::"+playlistArray[i].date+", ";}
		if (playlistArray[i].description) {itemString += "description:::"+playlistArray[i].description+", ";}
		if (playlistArray[i].duration > 0) {itemString += "duration:::"+playlistArray[i].duration+", ";}
		if (playlistArray[i].file) {itemString += "file:::"+playlistArray[i].file+", ";}
		if (playlistArray[i].image) {itemString += "image:::"+playlistArray[i].image+", ";}
		if (playlistArray[i].link) {itemString += "link:::"+playlistArray[i].link+", ";}
		if (playlistArray[i].start) {itemString += "start:::"+playlistArray[i].start+", ";}
		if (playlistArray[i].streamer) {itemString += "streamer:::"+playlistArray[i].streamer+", ";}
		if (playlistArray[i].tags) {itemString += "tags:::"+playlistArray[i].tags+", ";}
		if (playlistArray[i].title) {itemString += "title:::"+playlistArray[i].title+", ";}
		if (playlistArray[i].type) {itemString += "type:::"+playlistArray[i].type+", ";}
		/* remove the trailing comma and space */
		itemString = itemString.substring(0, itemString.length-2);
		playlistStringArray.push(itemString);
	}
	return playlistStringArray;
};











/* ===== ENTRY POINT OF SCRIPT IS HERE ===== */
/* the jwresume.Recall function is called at runtime from the main page */
/* it loads any available cookies into properties of jwresume */
jwresume.Recall = function (defaultPlaylist, defaultItem) {
	/* we save the defaults for use in jwresume.Reset */
	jwresume.defaultPlaylist=defaultPlaylist;
	jwresume.defaultItem=defaultItem;
	/* now we read the cookies */
	var cookiePlaylist=jwresume.readCookie('jwresume-corePlayer-playlist');
	//alert("cookiePlaylist\n"+cookiePlaylist);
	if (cookiePlaylist == null) {
		jwresume.Playlist=defaultPlaylist;
		//alert("there was no cookie for jwresume.Playlist");
	} else {
		jwresume.Playlist=jwresume.makePlaylistObjectArray(cookiePlaylist);
		//alert("playlist loaded from cookie... \nlength: "+jwresume.Playlist.length+"\n"+jwresume.Playlist);
	}
	jwresume.Item=jwresume.readCookie('jwresume-corePlayer-item');
	if (jwresume.Item == null) {
		if (defaultItem !== undefined) {
			jwresume.Item=defaultItem;
			//alert("there was no cookie for jwresume.Item, using default: "+defaultItem);
		} else {
			jwresume.Item=0;
			//alert("there was no cookie or default for jwresume.Item, using fallback: 0");
		}
	}
	jwresume.Position=jwresume.readCookie('jwresume-corePlayer-position');
	if (jwresume.Position == null) {
		jwresume.Position=0;
		//alert("there was no cookie for jwresume.Position");
	}
	jwresume.State=jwresume.readCookie('jwresume-corePlayer-state');
	if (jwresume.State == null) {
		jwresume.State="IDLE";
		//alert("there was no cookie for jwresume.State");
	}
	jwresume.Volume=jwresume.readCookie('jwresume-corePlayer-volume');
	if (jwresume.Volume == null) {
		jwresume.Volume=90;
		//alert("there was no cookie for jwresume.State");
	}
	/* we now build the player using the previous playlist and selected item if present */
	//alert(jwresume.Playlist);
	buildCorePlayer();
};

/* when any JW player is ready on the page it will call this function */
function playerReady(obj) {
	/* we check that the function was called by our _corePlayer_ and if it was... */
	if(obj.id == 'corePlayer') {
		/* we assign the core player HTML element to a reference variable */
		corePlayer = jwresume.Gid(obj.id);
		/* we assign this variable to let us know that the player is loaded */
		jwresume.corePlayerLoaded=true;
		/* then we read the current configuration of the player */
		jwresume.readCorePlayerConfig();
		/* then we resume playback */
		jwresume.Resume();
		/*and add listeners to keep our jwresume.properties current*/
		jwresume.addListeners();
	}	
};



/* get the current states of the player once */
jwresume.readCorePlayerConfig = function () {
	jwresume.currentPlaylist=corePlayer.getPlaylist();
	jwresume.currentItem=corePlayer.getConfig().item;
	jwresume.currentPosition=corePlayer.getConfig().position;
	jwresume.currentState=corePlayer.getConfig().state;
	jwresume.currentVolume=corePlayer.getConfig().volume;
};


/* this function is a generic addEventListener function */
jwresume.addEventListener = function (element, eventType, handler, capture) {

	if (element.addEventListener)
		/* class compliant browser ::smiley face:: */
		element.addEventListener(eventType, handler, capture);
	else if (element.attachEvent)
		/* M$ Internet Exploder ::sadface:: */
		element.attachEvent("on" + eventType, handler);
};


/* set up some listeners, called from the playerReady function */
jwresume.addListeners = function () {
	
	jwresume.playlistListener = function (obj) { 
		jwresume.currentPlaylist = obj.playlist;
	}
	jwresume.itemListener = function (obj) { 
		jwresume.currentItem = obj.index;
	}
	jwresume.positionListener = function (obj) { 
		jwresume.currentPosition = obj.position;
	}
	jwresume.stateListener = function (obj) { 
		jwresume.currentState = obj.newstate;
	}
	jwresume.volumeListener = function (obj) { 
		jwresume.currentVolume = obj.percentage;
	}
	
	if (corePlayer) {
		corePlayer.addControllerListener("PLAYLIST", "jwresume.playlistListener");
		corePlayer.addControllerListener("ITEM", "jwresume.itemListener");
		corePlayer.addModelListener("TIME", "jwresume.positionListener");
		corePlayer.addModelListener("STATE", "jwresume.stateListener");
		corePlayer.addControllerListener("VOLUME", "jwresume.volumeListener");
	
		/* this is where we add a click listener for href HTML elements if the corePlayer has loaded */
		/* we create an array of elements representing our HTML <a> tags */
		var links = document.getElementsByTagName('a');
		/* then for each a tag... */
		for (i in links) {
			/* we check to see that this tag links to an mp3 */
			if (links[i].toString().slice(links[i].toString().length - 4) == ".mp3") {
				/* then we check to see if there's a corresponding XML file for this mp3 */
				
				/* if there is, then we add our listener to add the xml playlist into corePlayer */
				jwresume.addEventListener(links[i], "click", function(e)
				{
	
					jwresume.addPlaylist(e.target.href.substr(0, e.target.href.length - 4)+".xml");
					//alert("you clicked a link to "+e.target.href+", existence: "+", and corePlayer is present... horah!");
					
					if (e.preventDefault) e.preventDefault();
					else e.returnResult = false;
					if (e.stopPropagation) e.stopPropagation();
					else e.cancelBubble = true;
				}, false);
			}
		}
	
	} else {
		//alert("corePlayer was either not yet ready, or not present at all");
	}	
};	
		
jwresume.checkURL = function (url) {
	
	var request = false;
	
	if (window.XMLHttpRequest) {
		request = new XMLHttpRequest;
	} else if (window.ActiveXObject) {
		request = new ActiveXObject("Microsoft.XMLHttp");
	}
	
	if (request) {
		request.open("GET", url);
		if (request.status == 200) { return true; }
	}
	
	return false;
};

/* this gets called once the player is ready and the listers are set up */
/* it jumps to the correct timeline position, and resumes the player state */
jwresume.Resume = function () {
	corePlayer.sendEvent('LOAD', jwresume.Playlist);
	corePlayer.sendEvent('ITEM', jwresume.Item);
	if (jwresume.State == 'IDLE' || jwresume.State == 'PAUSED') {
		corePlayer.sendEvent('STOP');
	} else if (jwresume.State == 'PLAYING' || jwresume.State == 'BUFFERING') {
		//corePlayer.sendEvent('VOLUME', 0);
		//jwresume.currentVolume = 0;
		jwresume.goToAndPlay(jwresume.Position);
		//alert("fading to "+jwresume.Volume);
		//jwresume.fadeTo(jwresume.Volume);
		
	} else if (jwresume.State == 'COMPLETED') {
		corePlayer.sendEvent('PLAY', true);
	} else {
		//alert("err... oops... JW player had no state!? No cookie?");
	}
};

jwresume.fadeTo = function (fadeTarget) {
	jwresume.fadeTarget=fadeTarget;
	if (jwresume.currentVolume < jwresume.fadeTarget) {
		jwresume.currentVolume = jwresume.currentVolume+1;
		corePlayer.sendEvent('VOLUME',jwresume.currentVolume);
		setTimeout("jwresume.fadeTo(jwresume.fadeTarget)",2);
	} else if (jwresume.currentVolume > jwresume.fadeTarget) {
		jwresume.currentVolume = jwresume.currentVolume-1;
		corePlayer.sendEvent('VOLUME',jwresume.currentVolume);
		setTimeout("jwresume.fadeTo(jwresume.fadeTarget)",2);
	} else if (jwresume.currentVolume == jwresume.fadeTarget) {
		//alert("fade complete");
	}
};



/* this function seeks the position you send it and set the play state */
/* arguments: (position / secs, andplay / true or false) */
jwresume.goToAndPlay = function (position) {
	jwresume.goToPosition=position;
	/* if the player is in an idle state we cannot seek so we trigger play and try again */
	if (jwresume.currentState == 'IDLE' || jwresume.currentState == 'COMPLETED') {
		corePlayer.sendEvent('PLAY', true);
		setTimeout("jwresume.goToAndPlay(jwresume.goToPosition)",10);
	/* if the player is buffering we cannot seek, PLAY will soon follow so we try again */
	} else if (jwresume.currentState == 'BUFFERING') {
		setTimeout("jwresume.goToAndPlay(jwresume.goToPosition)",10);
	/* if the player is neither idle or buffering then we can seek */
	} else {
		corePlayer.sendEvent('SEEK', jwresume.Position);
	}			
};

/* this calls the save function on window unload */
window.onbeforeunload = function () {
	if (jwresume.corePlayerLoaded == true) {
		//alert("saving...");
		jwresume.Save(30);
	} else {
		//alert("I was going to save, but the corePlayer is not present, so I won't bother");
	}
};

/* this is the function that is called on unLoad and will save all the variables to cookies for us */
jwresume.Save = function (expiry) {
	/* this fixes an odd behaviour in Safari whereby the currentState would change momentarily */
	/* from PLAYING to IDLE during unLoad, leading to a false representation of state in the cookie */
	if (jwresume.currentState == 'IDLE' && jwresume.currentPosition > 0) {
		//alert("odd Safari case where PLAYING would be recorded IDLE");
		jwresume.currentState='PLAYING';
	}		
	/* clean up the listeners to try and prevent further changes as the player unloads */
	corePlayer.removeControllerListener("PLAYLIST", "jwresume.playlistListener");
	corePlayer.removeControllerListener("ITEM", "jwresume.itemListener");
	corePlayer.removeModelListener("TIME", "jwresume.positionListener");
	corePlayer.removeModelListener("STATE", "jwresume.stateListener");
	corePlayer.removeControllerListener("VOLUME", "jwresume.volumeListener");
	var playlistStringArray = jwresume.makePlaylistStringArray(jwresume.currentPlaylist);
	var playlistString = playlistStringArray.join("###");
	//alert("playlist saving to cookie... \nlength: "+jwresume.currentPlaylist.length+"\n"+playlistString);
	jwresume.createCookie('jwresume-corePlayer-playlist',playlistString,expiry);
	jwresume.createCookie('jwresume-corePlayer-item',jwresume.currentItem,expiry);
	jwresume.createCookie('jwresume-corePlayer-position',jwresume.currentPosition,expiry);
	jwresume.createCookie('jwresume-corePlayer-state',jwresume.currentState,expiry);
	//alert("volume at time of writing cookie: "+jwresume.currentVolume);
	jwresume.createCookie('jwresume-corePlayer-volume',jwresume.currentVolume,expiry);
};



/* this function if called, will reset the corePlayer to the default */
/* playlist and item in an idle state (if it's present)*/
jwresume.Reset = function () {
	if (jwresume.corePlayerLoaded == true) {
		//alert("resetting...");
		corePlayer.sendEvent('LOAD',jwresume.defaultPlaylist);
		corePlayer.sendEvent('ITEM',jwresume.defaultItem);
		jwresume.currentPosition = 0;
		corePlayer.sendEvent('STOP');
		corePlayer.sendEvent('VOLUME',90);
	} else {
		//alert("I was going to reset, but the corePlayer is not present, so I won't bother");
	}
};



/* this function loads and returns an XML file (URL passed as argument) */
jwresume.loadXML = function (xmlURL) {
	if (window.XMLHttpRequest) {
		// code for IE7+, Firefox, Chrome, Opera, Safari
		var xmlhttp = new XMLHttpRequest();
	} else	{
		// code for IE6, IE5
		var xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.open("GET",xmlURL,false);
	xmlhttp.send();
	return xmlhttp.responseXML;
};














/* this function needs to receive a playlist as an argument in the form of a string with tracks separated by ### */
/* and convert it into an array of object blocks where each object has properties "file, track, title" etc. */
jwresume.makePlaylistObjectArray = function (playlistString) {
	/* create the array into which we're puting the object blocks */
	var playlistObjectArray = new Array();
	/* split our playlist string into an array of strings, each index in this array represents one track */
	var playlistStringArray=playlistString.split("###");
	/* for every track in the playlist */
	for (i in playlistStringArray) {
		/* create an object to which we will assign property/value pairs - file, author, track etc. */
		var itemObject = new Object();
		/* isolate the properties of this track into a dedicated string */
		var itemPropertiesString=playlistStringArray[i];
		/* split the string represeting track i into an array of property value pairs */
		var itemPropertiesArray=itemPropertiesString.split(", ");
		//alert("playlist item "+i+" properties: "+itemPropertiesArray);
		/* for each property of this track */
		//alert("the second property is: "+itemPropertiesArray[1]);
		for (j in itemPropertiesArray) {
			/* isolate this property into a dedicated string representing one property value pair */
			var itemPropertyValueString = itemPropertiesArray[j];
			/* split the property and value into two indexes of the itemPropertyAndValue array */
			var itemPropertyValueArray = itemPropertyValueString.split(":::");
			/* and then separate the property and value into unique variables */
			var itemProperty = itemPropertyValueArray[0];
			var propertyValue = itemPropertyValueArray[1];
			//alert(
			//	"track: "+i+
			//	"\nproperty: "+j+" - "+itemProperty+
			//	"\nvalue: "+propertyValue
			//);
			/* now write properties to the object for this track */
			itemObject[itemProperty] = propertyValue;
		}
		/* and once the object for this track has all properties assigned, add it to the playlistObjectArray */
		//alert("track "+i+" title: "+itemObject.title);
		playlistObjectArray[i] = itemObject;
	}
	//alert("playlist should now be an array of objects: "+playlistObjectArray+" of length "+playlistObjectArray.length);
	//alert("track 2 file: "+playlistObjectArray[1].file+"track 2 title: "+playlistObjectArray[1].title);
	return playlistObjectArray;
};














/* this function needs to receive a playlist as an argument in the form of an XMLDoc containing a XSPF playlist */
/* and convert it into an array of track objects where each object has properties "file, track, title" etc. */
jwresume.XSPFxmlDocToPlaylistObjectArray = function (XSPFxmlDoc) {
	/* check that what we have received is an XSPF playlist, if not, return an error */
	if (XSPFxmlDoc.getElementsByTagName('playlist')[0].getAttribute('xmlns')=="http://xspf.org/ns/0/" 
	&& XSPFxmlDoc.getElementsByTagName('playlist')[0].getAttribute('version')==1) {	
		//alert("Playlist is XSPF formatted with correct headers. We're good to go!");
	} else {
		alert("you are trying to load an xml file that is not in the XSPF format, or that is malformed");
		return;
	}
	/* load our track nodes into a variable */
	var xspfTracklist = XSPFxmlDoc.getElementsByTagName('track');
	/* create the array into which we're going to put our track objects */
	var playlistObjectArray = new Array();
	/* for every track in the XSPFxmlDoc */
	for (var i = 0; i < xspfTracklist.length; i++) {
		//alert(i);
		var xspfTrack=xspfTracklist[i];
		/* create an object to which we will assign property/value pairs - file, author, track etc. */
		var itemObject = new Object();
		/* check the XSPFxmlDoc for all possible child nodes of the current track */
		/* assign them as property/value pairs to the item object representing the current track */
		
		/* JW author is equivalent to XSPF creator */
		var author=xspfTrack.getElementsByTagName('creator')[0];
		if (author) {
			itemObject.author=author.childNodes[0].nodeValue;
			//alert(itemObject.author);
		}

		/* JW description is equivalent to XSPF annotation */
		var description=xspfTrack.getElementsByTagName('annotation')[0];
		if (description) {
			itemObject.description=description.childNodes[0].nodeValue;
			//alert(itemObject.description);
		}
		
		/* JW duration is equivalent to XSPF duration */
		var duration=xspfTrack.getElementsByTagName('duration')[0];
		if (duration) {
			itemObject.duration=duration.childNodes[0].nodeValue;
			//alert(itemObject.duration);
		}
		
		/* JW file is equivalent to XSPF location */
		var file=xspfTrack.getElementsByTagName('location')[0];
		if (file) {
			itemObject.file=file.childNodes[0].nodeValue;
			//alert(itemObject.file);
		}
		
		/* JW link is equivalent to XSPF info */
		var link=xspfTrack.getElementsByTagName('info')[0];
		if (link) {
			itemObject.link=link.childNodes[0].nodeValue;
			//alert(itemObject.link);
		}
		
		/* JW image is equivalent to XSPF image */
		var image=xspfTrack.getElementsByTagName('image')[0];
		if (image) {
			itemObject.image=image.childNodes[0].nodeValue;
			//alert(itemObject.image);
		}
		
		/* JW title is equivalent to XSPF title */
		var title=xspfTrack.getElementsByTagName('title')[0];
		if (title) {
			itemObject.title=title.childNodes[0].nodeValue;
			//alert(itemObject.title);
		}
						
		/* once the object for this track has all properties assigned, add it to the playlistObjectArray */
		playlistObjectArray[i]=itemObject;		
	}
	/* return the playlist array of track objects ready for use by the JW player */
	return playlistObjectArray;
};

/* this function removes duplicate TRACKS from an array (by file) */
/* it assumes that the second instance is to be retained */

jwresume.removeDuplicateTracksFromPlaylistObjectArray = function (a) {
   var r = new Array();
   o:for(var i = 0, n = a.length; i < n; i++) {
      for(var x = i + 1 ; x < n; x++)
      {
         if(a[x].file==a[i].file) continue o;
      }
      r[r.length] = a[i];
   }
   jwresume.numberOfDuplicateTracksRemoved=a.length-r.length;
   //alert("number of dupes removed is "+jwresume.numberOfDuplicateTracksRemoved);
   return r;
};


/* this function if called, will load the contents of an XML playlist (url passed in as argument) */
/* and add the contents of the new playlist to the current playlist and play the first new item */
jwresume.addPlaylist = function (playlistURL) {

	/* Load the new XML playlist */
	var xmlDoc=jwresume.loadXML(playlistURL);
	/* Check that the xmlDoc we just loaded is an XSPF playlist, and if so, convert it to an Object/Property Array playlist */
	var newPlaylist=jwresume.XSPFxmlDocToPlaylistObjectArray(xmlDoc);
	/* add the new playlist to the current playlist */
	var combinedPlaylist=jwresume.currentPlaylist.concat(newPlaylist);
	/* remove any duplicate tracks we've just created (removes first instance [by URL] retaining last) */
	var combinedPlaylistNoDupes=jwresume.removeDuplicateTracksFromPlaylistObjectArray(combinedPlaylist);
	/* set the new play item as the first of the new tracks */
	var playItem=jwresume.currentPlaylist.length-jwresume.numberOfDuplicateTracksRemoved;
	//alert("first new item is item "+playItem);
	/* load the new combined playlist */
	corePlayer.sendEvent('LOAD',combinedPlaylistNoDupes);
	/* jump to the first new item and play */
	corePlayer.sendEvent('ITEM', playItem);
};