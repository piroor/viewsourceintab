(function() {
let { inherit } = Components.utils.import('resource://viewsourceintab-modules/inherit.jsm', {});

var ViewSourceInTabOverlay = window.ViewSourceInTabOverlay = inherit(ViewSourceInTab, {

	get browserWindow()
	{
		if (this._browserWindow === void(0)) {
			try {
				this._browserWindow = window
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShell)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
					.parent
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.document.defaultView;
				if (this._browserWindow.location.href != 'chrome://browser/content/browser.xul')
					this._browserWindow = null;
			}
			catch(e) {
				this._browserWindow = null
			}
		}
		return this._browserWindow;
	},
//	_browserWindow : null,

	get service()
	{
		if (!this.browserWindow) return null;
		return this.browserWindow.ViewSourceInTab;
	},

	get isSelection()
	{
		return /^(view-source:)?data:/.test(getBrowser().currentURI.spec);
	},

	get info()
	{
		if (!this.service) return null;
		return this.service.targetInfo;
	},

	clearInfo : function()
	{
		var info = this.info;
		if (info) info.clear();
	},

	get tab()
	{
		if (!this._tab) {
			var b = this.service.getTabBrowserFromFrame(window);
			this._tab = this.service.getTabFromFrame(window, b);
		}
		return this._tab;
	},
	_tab : null,


	get source()
	{
		return this.getTabValue(this.kVIEWSOURCE_SOURCE);
	},


	getTabValue : function(aKey)
	{
		return this.service.getTabValue(this.tab, aKey);
	},

	setTabValue : function(aKey, aValue)
	{
		this.service.setTabValue(this.tab, aKey, aValue);
	},


	init : function()
	{
		this.initWindowArguments();
		this.updateUI();
		this.updateFunctions();

		window.addEventListener('load', this, false);
		window.addEventListener('unload', this, false);
	},


	initializeOnLoad : function()
	{
		if (this._initialized) return false;
		this._initialized = true;

		var bar = document.getElementById('FindToolbar');
		if (bar)
			bar.parentNode.removeChild(bar);

		[
			document.getElementById('menu_edit'),
			document.getElementById('helpMenu'),
			document.getElementById('windowMenu') // Mac OS X
		].forEach(function(aMenu) {
			if (aMenu) aMenu.setAttribute('hidden', true);
		});

		var toolbox = document.getElementsByTagName('toolbox')[0];
		if (Components
				.classes['@mozilla.org/preferences;1']
				.getService(Components.interfaces.nsIPrefBranch)
				.getBoolPref('extensions.viewsourceintab.useViewSourceUI'))
			toolbox.removeAttribute('collapsed');
		else
			toolbox.setAttribute('collapsed', true);

		var b = getBrowser();

		// In-content window cannot load "view-source:" URIs, so
		// we have to tell the engine that the inline frame is
		// fake "top level" window.
		// See: https://bugzilla.mozilla.org/show_bug.cgi?id=995917
		if (b.docShell.setIsBrowserInsideApp && Components.interfaces.nsIScriptSecurityManager)
			b.docShell.setIsBrowserInsideApp(Components.interfaces.nsIScriptSecurityManager.NO_APP_ID);

		return true;
	},
	_initialized : false,

	updateUI : function()
	{
		var status = document.getElementById('status-bar');
		if (status) {
			document.getAnonymousElementByAttribute(status, 'class', 'statusbar-resizerpanel').setAttribute('hidden', true);
		}

		document.documentElement.setAttribute('active', true);
	},

	updateFunctions : function()
	{
		if ('onLoadViewSource' in window) {
			eval('window.onLoadViewSource = '+
				window.onLoadViewSource.toSource().replace( // prevent infinity reloading
					'{',
					'{\n' +
					'  if (!ViewSourceInTabOverlay.initializeOnLoad()) return;\n'
				).replace(
					'}',
					';\n' +
					'ViewSourceInTabOverlay.clearInfo();\n' +
					'document.title = document.documentElement.getAttribute("titlepreface") + (getBrowser().contentDocument.title || window.arguments[0]);\n' +
					'}\n'
				).replace(
					'gFindBar.initFindBar();',
					''
				)
			);
			if ('onUnloadViewSource' in window) {
				eval('window.onUnloadViewSource = '+
					window.onUnloadViewSource.toSource().replace(
						'gFindBar.uninitFindBar();',
						''
					)
				);
			}
		}

		if ('onLoadViewPartialSource' in window) {
			eval('window.onLoadViewPartialSource = '+
				window.onLoadViewPartialSource.toSource().replace( // prevent infinity reloading
					'{',
					'$&\n' +
					'  if (!ViewSourceInTabOverlay.initializeOnLoad()) return;\n'
				).replace(
					'window._content.focus();',
					'ViewSourceInTabOverlay.clearInfo(); $&'
				).replace(
					'gFindBar.initFindBar();',
					''
				)
			);
			if ('onUnloadViewPartialSource' in window) {
				eval('window.onUnloadViewPartialSource = '+
					window.onUnloadViewPartialSource.toSource().replace(
						'gFindBar.uninitFindBar();',
						''
					)
				);
			}
		}

		if ('viewPartialSourceForSelection' in window) {
			eval('window.viewPartialSourceForSelection = '+
				window.viewPartialSourceForSelection.toSource().replace(
					'{',
					'{\n' +
					'  var selectionSource = ViewSourceInTabOverlay.source;\n' +
					'  if (!selectionSource) {\n'
				).replace(
					/(((?:getBrowser\(\)|gBrowser)\.webNavigation|getWebNavigation\(\))\.[^\}]+)/,
					'  if (ViewSourceInTabOverlay.service && !ViewSourceInTabOverlay.source) {\n' +
					'    ViewSourceInTabOverlay.setTabValue(ViewSourceInTabOverlay.kVIEWSOURCE_SOURCE, encodeURIComponent(tmpNode.innerHTML));\n' +
					'  }\n' +
					'  $1;\n' +
					'}\n' +
					'else {\n' +
					'  if (decodeURIComponent(selectionSource).indexOf(MARK_SELECTION_START) > -1) {\n' +
					'    window.document.getElementById("appcontent").addEventListener("load", drawSelection, true);\n' +
					'  }\n' +
					'  $2.loadURI(\n' +
					'    "view-source:data:text/html;charset=utf-8," + selectionSource,\n' +
					'    loadFlags, null, null, null);\n' +
					'}\n'
				)
			);
		}

		if ('viewPartialSourceForFragment' in window) {
			eval('window.viewPartialSourceForFragment = '+
				window.viewPartialSourceForFragment.toSource().replace(
					'{',
					'{\n' +
					'  var fragmentSource = ViewSourceInTabOverlay.source;\n' +
					'  if (!fragmentSource) {\n'
				).replace(
					/(var doc = |(getBrowser\(\)|gBrowser).loadURI\()/,
					'  if (ViewSourceInTabOverlay.service && !ViewSourceInTabOverlay.source) {\n' +
					'    ViewSourceInTabOverlay.setTabValue(ViewSourceInTabOverlay.kVIEWSOURCE_SOURCE, encodeURIComponent(source));\n' +
					'  }\n' +
					'}\n' +
					'else {\n' +
					'  var source = fragmentSource;\n' +
					'}\n' +
					'$1\n'
				)
			);
		}

		if ('drawSelection' in window) {
			eval('window.drawSelection = '+
				window.drawSelection.toSource().replace(
					'{',
					'{\n' +
					'    try {\n' +
					'      window.document.getElementById("appcontent").removeEventListener("load", drawSelection, true);\n' +
					'    }\n' +
					'    catch(e) {\n' +
					'    }\n'
				).replace(
					/(getBrowser\(\)|gBrowser)\.contentDocument\.title/,
					'document.title'
				)
			);
		}

		if ('viewSource' in window) {
			eval('window.viewSource = '+
				window.viewSource.toSource().replace(
					/(webNavigation\.sessionHistory = Components\.classes\[[^\]]+\]\.createInstance\([^\)]*\);)/,
					'try {\n' +
					'  $1\n' +
					'}\n' +
					'catch(e) {\n' +
					'  //Components.utils.reportError(e);\n' +
					'}\n'
				).replace(
					/(getBrowser\(\)|gBrowser)(\.webNavigation)?\.sessionHistory\.QueryInterface\(Ci\.nsISHistoryInternal\)\.addEntry\(shEntry, true\);/,
					'shEntry = (function(aChild) {\n' +
					'  var history = ViewSourceInTabOverlay.tab.linkedBrowser\n' +
					'          .webNavigation\n' +
					'          .sessionHistory;\n' +

					'  var entry = Cc["@mozilla.org/browser/session-history-entry;1"]\n' +
					'          .createInstance(Ci.nsISHEntry)\n' +
					'          .QueryInterface(Ci.nsISHContainer);\n' +
					'  entry.setURI(makeURI(location.href, null, null));\n' +
					'  entry.setTitle(location.href);\n' +
					'  entry.loadType = Ci.nsIDocShellLoadInfo.loadHistory;\n' +

					'  aChild.setIsSubFrame(true);\n' +
					'  entry.AddChild(aChild, 0);\n' +

					'  // destroy current history because the existing entry doesn"t work correctly.\n' +
					'  history.PurgeHistory(history.index+1);\n' +

					'  return entry;\n' +
					'})(shEntry);\n' +

					'// we have to add the entry to the parent browser"s history.\n' +
					'ViewSourceInTabOverlay.tab.linkedBrowser\n' +
					'  .webNavigation\n' +
					'  .sessionHistory\n' +
					'  .QueryInterface(Ci.nsISHistoryInternal)\n' +
					'  .addEntry(shEntry, true);\n'
				).replace(
					/(catch \(ex\) \{\})/g,
					'catch(ex){alert(ex);}'
				)
			);
		}

		// disable back/forward command on this window itself
		window.UpdateBackForwardCommands = function() {};
	},

	losslessDecodeURI : function(aURI)
	{
		var browser = Components.classes['@mozilla.org/appshell/window-mediator;1']
					.getService(Components.interfaces.nsIWindowMediator)
					.getMostRecentWindow('navigator:browser');
		if (browser && browser.losslessDecodeURI) {
			aURI = Components.classes['@mozilla.org/network/io-service;1']
					.getService(Components.interfaces.nsIIOService)
					.newURI(aURI, null, null);
			return browser.losslessDecodeURI(aURI);
		}

		// fallback: snapshot from http://mxr.mozilla.org/mozilla-central/source/browser/base/content/browser.js at 2009.9.9
		var value = aURI;
		if (!/%25(?:3B|2F|3F|3A|40|26|3D|2B|24|2C|23)/i.test(value)) {
			try {
				value = decodeURI(value)
						.replace(/%(?!3B|2F|3F|3A|40|26|3D|2B|24|2C|23)|[\r\n\t]/ig, encodeURIComponent);
			}
			catch(e) {
			}
		}
		return value
				.replace(/[\v\x0c\x1c\x1d\x1e\x1f\u00ad\u200b\ufeff\u2028\u2029\u2060\u2062\u2063\ufffc]/g, encodeURIComponent)
				.replace(/[\u200e\u200f\u202a\u202b\u202c\u202d\u202e]/g, encodeURIComponent);
	},

	updateInfo : function()
	{
		var info = this.info;
		if (info && info.frame) {
			this.setTabValue(this.kVIEWSOURCE_URI, info.frame.location.href);
			this.setTabValue(this.kVIEWSOURCE_CHARSET, info.charset);
			this.setTabValue(this.kVIEWSOURCE_CONTEXT, info.context);
		}
	},

	initWindowArguments : function()
	{
		window.arguments = [
			this.getTabValue(this.kVIEWSOURCE_URI),
			this.getTabValue(this.kVIEWSOURCE_CHARSET),
			(this.info ? (this.info.descriptor || this.info.reference) : null ),
			this.getTabValue(this.kVIEWSOURCE_CONTEXT)
		];

		var uri = location.href;

		var viewerURIPattern = /^(?:view-source-tab:|view-partial-source-tab:|chrome:\/\/viewsourceintab\/content\/(?:viewer\.xul|partialViewer\.xul)\?)(.+)$/;
		if (!viewerURIPattern.test(uri)) return;

		uri = RegExp.$1;

		var query = '';
		var startPoint = '#viewsourceintab(';
		if (uri.indexOf(startPoint) > -1) {
			[uri, query] = uri.split(startPoint);
		}
		uri = decodeURI(uri);
		if (uri == window.arguments[0]) return;

		var charset    = window.arguments[1];
		var descriptor = window.arguments[2];
		var reference  = window.arguments[2];
		var context    = window.arguments[3];
		if (query && !reference) {
			/charset=([^;\)]+)/.test(query);
			charset = decodeURIComponent(RegExp.$1 || '') || null ;
			if (/cacheKey=([^;\)]+)/.test(query) && RegExp.$1) {
				descriptor = Components
								.classes['@mozilla.org/browser/session-history-entry;1']
								.createInstance(Components.interfaces.nsISHEntry);
				let cacheKey = Components
								.classes['@mozilla.org/supports-PRUint32;1']
								.createInstance(Components.interfaces.nsISupportsPRUint32);
				cacheKey.data = RegExp.$1;
				descriptor.cacheKey = cacheKey;
			}
			else {
				/reference=([^;\)]+)/.test(query);
				reference = decodeURIComponent(RegExp.$1 || '') || null ;
			}
			/context=([^;\)]+)/.test(query);
			context = decodeURIComponent(RegExp.$1 || '') || null ;
		}
		window.arguments = [uri, charset, descriptor || reference, context];

		if (
			this.info &&
			this.info.descriptor &&
			this.info.descriptor.QueryInterface(Components.interfaces.nsISHEntry).URI.spec != uri
			)
			window.arguments[2] = null;
	},


	handleEvent : function(aEvent)
	{
		switch(aEvent.type)
		{
			case 'load':
				if (aEvent.currentTarget == window) {
					this.onLoad();
				}
				else {
					this.onContentLoad();
				}
				return;

			case 'unload':
				this.onUnload();
				return;

			case 'click':
			case 'keypress':
				return this.onHandleLink(aEvent);
		}
	},

	onLoad : function()
	{
		window.removeEventListener('load', this, false);
		getBrowser().addEventListener('load', this, false);
	},

	onUnload : function()
	{
		window.removeEventListener('unload', this, false);
		getBrowser().removeEventListener('load', this, false);
	},

	onContentLoad : function()
	{
		if (gSelectionListener && !gSelectionListener.attached) {
			try {
				onLoadContent();
			}
			catch(e) {
				Components.utils.reportError(e);
			}
		}

		var b = getBrowser();
		var uri = b.currentURI.spec.replace('view-source:', '');
		this.setTabValue(this.kVIEWSOURCE_URI, uri);

		if (!this.isSelection) {
			let root = document.documentElement;
			document.title = root.getAttribute('titlepreface') + uri;
		}

		b.contentWindow.addEventListener('click', this, true);
		b.contentWindow.addEventListener('keypress', this, true);
	},

	// We have to re-dispatch events on links on this chrome document,
	// to load linked URL into the tab itself, instead of the iframe.
	onHandleLink : function(aEvent)
	{
		var target = aEvent.originalTarget;
		while (target && !target.href)
		{
			target = target.parentNode;
		}
		if (!target || !target.href)
			return true;

		aEvent.stopPropagation();
		aEvent.stopImmediatePropagation();
		aEvent.preventDefault();

		if (this.lastLink) {
			this.lastLink.parentNode.removeChild(this.lastLink);
		}

		this.lastLink = target.cloneNode(true);
		this.lastLink.href = this.lastLink.href.replace(/^view-source:/, 'view-source-tab:');
		document.getElementById('last-link-container').appendChild(this.lastLink);

		if (aEvent.type == 'click') {
			let event = document.createEvent('MouseEvents');
			event.initMouseEvent(aEvent.type, aEvent.bubbles, aEvent.cancelable, aEvent.view,
				aEvent.detail, aEvent.screenX, aEvent.screenY, aEvent.clientX, aEvent.clientY,
				aEvent.ctrlKey, aEvent.altKey, aEvent.shiftKey, aEvent.metaKey,
				aEvent.button, null);
			this.lastLink.dispatchEvent(event);
		}
		else {
			let event = document.createEvent('KeyEvents');
			event.initKeyEvent(aEvent.type, aEvent.bubbles, aEvent.cancelable, aEvent.view,
				aEvent.ctrlKey, aEvent.altKey, aEvent.shiftKey, aEvent.metaKey,
				aEvent.keyCode, aEvent.charCode);
			this.lastLink.dispatchEvent(event);
		}

		return false;
	}

});



ViewSourceInTabOverlay.updateInfo();
if (ViewSourceInTabOverlay.service && !window.arguments) {
	delete gFindBar;
	ViewSourceInTabOverlay.init();
}

})();
