/*
***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Original Code is the Source Viewer Tab.

The Initial Developer of the Original Code is SHIMODA Hiroshi.
Portions created by the Initial Developer are Copyright (C) 2008
the Initial Developer. All Rights Reserved.

Contributor(s): SHIMODA Hiroshi <piro@p.club.ne.jp>

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.

***** END LICENSE BLOCK *****
*/

var Cc = Components.classes;
var Ci = Components.interfaces;

const IOService = Cc['@mozilla.org/network/io-service;1']
		.getService(Ci.nsIIOService);

const XULAppInfo = Cc['@mozilla.org/xre/app-info;1']
		.getService(Ci.nsIXULAppInfo);

function isGecko18() {
	var version = XULAppInfo.platformVersion.split('.');
	return parseInt(version[0]) <= 1 && parseInt(version[1]) <= 8;
}


function ViewSourceTabProtocolBase()
{
}

ViewSourceTabProtocolBase.prototype = {
	get contractID() {
		return '@mozilla.org/network/protocol;1?name='+this.scheme;
	},

	QueryInterface: function(aIID)
	{
		if (!aIID.equals(Ci.nsIProtocolHandler) &&
			!aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	},


	/* implementation */

	defaultPort   : -1,
	protocolFlags : Ci.nsIProtocolHandler.URI_NORELATIVE |
					Ci.nsIProtocolHandler.URI_NOAUTH |
//					Ci.nsIProtocolHandler.URI_DANGEROUS_TO_LOAD |
					Ci.nsIProtocolHandler.URI_LOADED_BY_ANYONE,

	allowPort: function(aPort, aScheme)
	{
		return false;
	},

	newURI: function(aSpec, aCharset, aBaseURI)
	{
		var uri = Cc['@mozilla.org/network/simple-uri;1']
					.createInstance(Ci.nsIURI);
		try {
			uri.spec = aSpec;
		}
		catch(e) {
			dump(e+'\n');
		}
		return uri;
	},

	newChannel: function(aURI)
	{
		var uri = isGecko18() ? 'about:blank' : this.getDestinationURI(aURI.spec) ;
		var channel = IOService.newChannel(uri, null, null);
		return channel;
	},

	getDestinationURI : function(aURI)
	{
		aURI = aURI.substring(aURI.indexOf(':')+1);
		aURI = decodeURI(aURI);
		var uri = IOService.newURI(aURI, null, null);
		return this.viewerURI+'?'+uri.asciiSpec;
	}
};


function ViewSourceTabProtocol()
{
}

ViewSourceTabProtocol.prototype = {
	get classDescription() {
		return 'Source Viewer Tab Protocol';
	},
	get classID() {
		return Components.ID('{9cd42e30-3b70-11dd-ae16-0800200c9a66}');
	},

	/* implementation */
	scheme  : 'view-source-tab',
	viewerURI : 'chrome://viewsourceintab/content/viewer.xul'
};

ViewSourceTabProtocol.prototype.__proto__ = ViewSourceTabProtocolBase.prototype;


function ViewPartialSourceTabProtocol()
{
}

ViewPartialSourceTabProtocol.prototype = {
	get classDescription() {
		return 'Partial Source Viewer Tab Protocol';
	},
	get classID() {
		return Components.ID('{3ef379f0-3b71-11dd-ae16-0800200c9a66}');
	},

	/* implementation */
	scheme  : 'view-partial-source-tab',
	viewerURI : 'chrome://viewsourceintab/content/partialViewer.xul'
};

ViewPartialSourceTabProtocol.prototype.__proto__ = ViewSourceTabProtocolBase.prototype;


function ViewSourceTabRedirector()
{
}

ViewSourceTabRedirector.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/viewsourceintab/redirector;1';
	},
	get classDescription() {
		return 'Source Viewer Tab Redirect Service';
	},
	get classID() {
		return Components.ID('{2264ca30-3d58-11dd-ae16-0800200c9a66}');
	},

	QueryInterface : function(aIID)
	{
		if (!aIID.equals(Ci.nsIContentPolicy) &&
			!aIID.equals(Ci.nsISupportsWeakReference) &&
			!aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	},

	TYPE_OTHER			: Ci.nsIContentPolicy.TYPE_OTHER,
	TYPE_SCRIPT			: Ci.nsIContentPolicy.TYPE_SCRIPT,
	TYPE_IMAGE			: Ci.nsIContentPolicy.TYPE_IMAGE,
	TYPE_STYLESHEET		: Ci.nsIContentPolicy.TYPE_STYLESHEET,
	TYPE_OBJECT			: Ci.nsIContentPolicy.TYPE_OBJECT,
	TYPE_DOCUMENT		: Ci.nsIContentPolicy.TYPE_DOCUMENT,
	TYPE_SUBDOCUMENT	: Ci.nsIContentPolicy.TYPE_SUBDOCUMENT,
	TYPE_REFRESH		: Ci.nsIContentPolicy.TYPE_REFRESH,
	ACCEPT				: Ci.nsIContentPolicy.ACCEPT,
	REJECT_REQUEST		: Ci.nsIContentPolicy.REJECT_REQUEST,
	REJECT_TYPE			: Ci.nsIContentPolicy.REJECT_TYPE,
	REJECT_SERVER		: Ci.nsIContentPolicy.REJECT_SERVER,
	REJECT_OTHER		: Ci.nsIContentPolicy.REJECT_OTHER,

	shouldLoad : function(aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra)
	{
		var redirector;
		switch (aContentLocation.scheme)
		{
			default:
				return this.ACCEPT;

			case ViewSourceTabProtocol.prototype.scheme:
				redirector = ViewSourceTabProtocol;
				break;

			case ViewPartialSourceTabProtocol.prototype.scheme:
				redirector = ViewPartialSourceTabProtocol;
				break;
		}

		// aContext == <xul:browser/>
		var uri = aContentLocation.spec;
		uri = redirector.prototype.getDestinationURI(uri.substring(uri.indexOf(':')+1));
		aContext.stop();
		aContext.ownerDocument.defaultView.setTimeout(function() {
			aContext.loadURI(uri, null, null);
		}, this.redirectDelay);
		return this.ACCEPT;
	},

	shouldProcess : function(aContentType, aContentLocation, aRequestOrigin, aContext, aMimeTypeGuess, aExtra)
	{
		return this.ACCEPT;
	},

	get redirectDelay()
	{
		return Cc['@mozilla.org/preferences;1']
				.getService(Ci.nsIPrefBranch)
				.getIntPref('extensions.viewsourceintab.redirectDelay');
	}
};


const categoryManager = Cc['@mozilla.org/categorymanager;1']
		.getService(Ci.nsICategoryManager);

var gModule = { 
	_firstTime: true,

	registerSelf : function (aComponentManager, aFileSpec, aLocation, aType)
	{
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		}
		aComponentManager = aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			if (!obj.available) continue;
			aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
			if (obj.isContentPolicy)
				categoryManager.addCategoryEntry('content-policy', obj.contractID, obj.contractID, true, true);
		}
	},

	unregisterSelf : function (aComponentManager, aFileSpec, aLocation)
	{
		aComponentManager = aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			if (!obj.available) continue;
			aComponentManager.unregisterFactoryLocation(obj.CID, aFileSpec);
			if (obj.isContentPolicy)
				categoryManager.deleteCategoryEntry('content-policy', obj.contractID, true);
		}
	},

	getClassObject : function (aComponentManager, aCID, aIID)
	{
		if (!aIID.equals(Ci.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		for (var key in this._objects) {
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		managerForViewSourceTabProtocol : {
			CID        : ViewSourceTabProtocol.prototype.classID,
			contractID : ViewSourceTabProtocol.prototype.contractID,
			className  : ViewSourceTabProtocol.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new ViewSourceTabProtocol()).QueryInterface(aIID);
				}
			},
			available : true
		},
		managerForViewPartialSourceTabProtocol : {
			CID        : ViewPartialSourceTabProtocol.prototype.classID,
			contractID : ViewPartialSourceTabProtocol.prototype.contractID,
			className  : ViewPartialSourceTabProtocol.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new ViewPartialSourceTabProtocol()).QueryInterface(aIID);
				}
			},
			available : true
		},
		managerForViewSourceTabRedirector : {
			CID        : ViewSourceTabRedirector.prototype.classID,
			contractID : ViewSourceTabRedirector.prototype.contractID,
			className  : ViewSourceTabRedirector.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new ViewSourceTabRedirector()).QueryInterface(aIID);
				}
			},
			get available() {
				return isGecko18();
			},
			isContentPolicy : true
		}
	},

	canUnload : function (aComponentManager)
	{
		return true;
	}
};

function NSGetModule(compMgr, fileSpec)
{
	return gModule;
}
