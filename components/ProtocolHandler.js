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

const IOService = Components
		.classes['@mozilla.org/network/io-service;1']
		.getService(Components.interfaces.nsIIOService);

const XULAppInfo = Components
		.classes['@mozilla.org/xre/app-info;1']
		.getService(Components.interfaces.nsIXULAppInfo);

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
		if (!aIID.equals(Components.interfaces.nsIProtocolHandler) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	},


	/* implementation */

	defaultPort   : -1,
	protocolFlags : Components.interfaces.nsIProtocolHandler.URI_NORELATIVE | Components.interfaces.nsIProtocolHandler.URI_NOAUTH,

	allowPort: function(aPort, aScheme)
	{
		return false;
	},

	newURI: function(aSpec, aCharset, aBaseURI)
	{
		var uri = Components.classes['@mozilla.org/network/simple-uri;1']
					.createInstance(Components.interfaces.nsIURI);
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
		return this.viewerURI+'?'+aURI;
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
		if (!aIID.equals(Components.interfaces.nsIContentPolicy) &&
			!aIID.equals(Components.interfaces.nsISupportsWeakReference) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	},

	TYPE_OTHER			: Components.interfaces.nsIContentPolicy.TYPE_OTHER,
	TYPE_SCRIPT			: Components.interfaces.nsIContentPolicy.TYPE_SCRIPT,
	TYPE_IMAGE			: Components.interfaces.nsIContentPolicy.TYPE_IMAGE,
	TYPE_STYLESHEET		: Components.interfaces.nsIContentPolicy.TYPE_STYLESHEET,
	TYPE_OBJECT			: Components.interfaces.nsIContentPolicy.TYPE_OBJECT,
	TYPE_DOCUMENT		: Components.interfaces.nsIContentPolicy.TYPE_DOCUMENT,
	TYPE_SUBDOCUMENT	: Components.interfaces.nsIContentPolicy.TYPE_SUBDOCUMENT,
	TYPE_REFRESH		: Components.interfaces.nsIContentPolicy.TYPE_REFRESH,
	ACCEPT				: Components.interfaces.nsIContentPolicy.ACCEPT,
	REJECT_REQUEST		: Components.interfaces.nsIContentPolicy.REJECT_REQUEST,
	REJECT_TYPE			: Components.interfaces.nsIContentPolicy.REJECT_TYPE,
	REJECT_SERVER		: Components.interfaces.nsIContentPolicy.REJECT_SERVER,
	REJECT_OTHER		: Components.interfaces.nsIContentPolicy.REJECT_OTHER,

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
		return Components
				.classes['@mozilla.org/preferences;1']
				.getService(Components.interfaces.nsIPrefBranch)
				.getIntPref('extensions.viewsourceintab.redirectDelay');
	}
};


const categoryManager = Components
		.classes['@mozilla.org/categorymanager;1']
		.getService(Components.interfaces.nsICategoryManager);

var gModule = { 
	_firstTime: true,

	registerSelf : function (aComponentManager, aFileSpec, aLocation, aType)
	{
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		}
		aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
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
		aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
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
		if (!aIID.equals(Components.interfaces.nsIFactory))
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
