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
Portions created by the Initial Developer are Copyright (C) 2008-2010
the Initial Developer. All Rights Reserved.

Contributor(s): SHIMODA Hiroshi <piro.outsider.reflex@gmail.com>

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

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');


function ViewSourceTabProtocolBase()
{
}

ViewSourceTabProtocolBase.prototype = {
	get contractID() {
		return '@mozilla.org/network/protocol;1?name='+this.scheme;
	},

	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsIProtocolHandler]),

	xpcom_categories: ['content-policy'],


	/* implementation */

	defaultPort   : -1,
	protocolFlags : Ci.nsIProtocolHandler.URI_NORELATIVE |
					Ci.nsIProtocolHandler.URI_NOAUTH |
//					Ci.nsIProtocolHandler.URI_DANGEROUS_TO_LOAD |
					Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

	allowPort: function(aPort, aScheme)
	{
		return false;
	},

	newURI: function(aSpec, aCharset, aBaseURI)
	{
		var uri = Cc['@mozilla.org/network/simple-uri;1']
					.createInstance(Ci.nsIURI);
		try {
			uri.spec = aSpec.split(':')[0]+':'+this.getInnerURI(aSpec);
		}
		catch(e) {
			dump(e+'\n');
		}
		return uri;
	},

	newChannel: function(aURI)
	{
		var uri = this.getDestinationURI(aURI.spec);
		var channel = IOService.newChannel(uri, null, null);
		return channel;
	},

	getDestinationURI : function(aURI)
	{
		return this.viewerURI+'?'+this.getInnerURI(aURI);
	},

	getInnerURI : function(aURI)
	{
		if (aURI.match(/^[^:]+:[^:]+:/)) {
			aURI = aURI.substring(aURI.indexOf(':')+1);
		}
		var uri = IOService.newURI(aURI, null, null);
		return uri.asciiSpec;
	}
};


function ViewSourceTabProtocol()
{
}

ViewSourceTabProtocol.prototype = {
	get classDescription() {
		return 'ViewSourceTabProtocol';
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
		return 'ViewPartialSourceTabProtocol';
	},
	get classID() {
		return Components.ID('{3ef379f0-3b71-11dd-ae16-0800200c9a66}');
	},

	/* implementation */
	scheme  : 'view-partial-source-tab',
	viewerURI : 'chrome://viewsourceintab/content/partialViewer.xul'
};

ViewPartialSourceTabProtocol.prototype.__proto__ = ViewSourceTabProtocolBase.prototype;



if (XPCOMUtils.generateNSGetFactory)
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([ViewSourceTabProtocol, ViewPartialSourceTabProtocol]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([ViewSourceTabProtocol, ViewPartialSourceTabProtocol]);
