var ViewSourceInTab = { 
	PREFROOT : 'extensions.viewsourceintab@piro.sakura.ne.jp',

	kVIEWSOURCE_URI     : 'viewsource-uri',
	kVIEWSOURCE_CHARSET : 'viewsource-charset',
	kVIEWSOURCE_REF     : 'viewsource-reference',
	kVIEWSOURCE_CONTEXT : 'viewsource-context',
	kVIEWSOURCE_SOURCE  : 'viewsource-source',

	get SessionStore() {
		delete this.SessionStore;
		return this.SessionStore = Components.classes['@mozilla.org/browser/sessionstore;1']
									.getService(Components.interfaces.nsISessionStore);
	},

	get XULAppInfo() {
		delete this.XULAppInfo;
		return this.XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1']
									.getService(Components.interfaces.nsIXULAppInfo);
	},

	get Comparator() {
		delete this.Comparator;
		return this.Comparator = Components.classes['@mozilla.org/xpcom/version-comparator;1']
									.getService(Components.interfaces.nsIVersionComparator);
	},
	
	targetInfo : { 
		clear : function()
		{
			this.frame      = null;
			this.uri        = null;
			this.charset    = null;
			this.descriptor = null;
			this.reference  = null;
			this.context    = null;
		},
		frame      : null,
		uri        : null,
		charset    : null,
		descriptor : null,
		reference  : null,
		context    : null
	},
 
	get shouldLoadInTab() 
	{
		return (
			this._overrideShouldLoadInTab === null ||
			this._overrideShouldLoadInTab === void(0)
			) ?
			this.getPref('extensions.viewsourceintab.enabled') :
			this._overrideShouldLoadInTab ;
	},
	set shouldLoadInTab(aValue)
	{
		this._overrideShouldLoadInTab = aValue;
		return aValue;
	},
 
/* Utilities */ 
	
	get browser() 
	{
		return 'SplitBrowser' in window ? SplitBrowser.activeBrowser : gBrowser ;
	},
 
	get statusBarPanel() { 
		return document.getElementById('statusbar-display');
	},
 
	get statusText() { 
		return this.statusBarPanel.label;
	},
	set statusText(aValue) {
		this.statusBarPanel.label = aValue;
		return aValue;
	},
	statusTextModified : false,
 
	getTabFromEvent : function(aEvent) 
	{
		var target = aEvent.originalTarget || aEvent.target;
		while (target.localName != 'tab' && target.localName != 'tabs' && target.parentNode)
			target = target.parentNode;

		return (target.localName == 'tab') ? target : null ;
	},
 
	getTabFromFrame : function(aFrame, aTabBrowser) 
	{
		var b = aTabBrowser || this.browser;
		var docShell = aFrame.top
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIWebNavigation)
			.QueryInterface(Components.interfaces.nsIDocShell);
		var tabs = this.getTabs(b);
		var tab;
		for (var i = 0, maxi = tabs.snapshotLength; i < maxi; i++)
		{
			tab = tabs.snapshotItem(i);
			if (tab.linkedBrowser.docShell == docShell)
				return tab;
		}
		return null;
	},
 
	getTabBrowserFromChild : function(aElement) 
	{
		if (!aElement) return null;
		var b = aElement.ownerDocument.evaluate(
				'ancestor-or-self::*[local-name()="tabbrowser"] | '+
				'ancestor-or-self::*[local-name()="tabs"][@tabbrowser]',
				aElement,
				null,
				XPathResult.FIRST_ORDERED_NODE_TYPE,
				null
			).singleNodeValue;
		return (b && b.tabbrowser) || b;
	},
 
	getTabBrowserFromFrame : function(aFrame) 
	{
		return ('SplitBrowser' in window) ?
				this.getTabBrowserFromChild(SplitBrowser.getSubBrowserAndBrowserFromFrame(aFrame.top).browser) :
				gBrowser ;
	},
 
	getTabs : function(aTabBrowser) 
	{
		return aTabBrowser.ownerDocument.evaluate(
				'descendant::*[local-name()="tab"]',
				aTabBrowser.mTabContainer,
				null,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
	},
 
	getTabValue : function(aTab, aKey) 
	{
		var value = null;
		try {
			value = this.SessionStore.getTabValue(aTab, aKey);
		}
		catch(e) {
		}

		return value;
	},
 
	setTabValue : function(aTab, aKey, aValue) 
	{
		if (!aValue) {
			return this.deleteTabValue(aTab, aKey);
		}
		aTab.setAttribute(aKey, aValue);
		try {
			this.checkCachedSessionDataExpiration(aTab);
			this.SessionStore.setTabValue(aTab, aKey, aValue);
		}
		catch(e) {
		}
		return aValue;
	},
 
	deleteTabValue : function(aTab, aKey) 
	{
		aTab.removeAttribute(aKey);
		try {
			this.checkCachedSessionDataExpiration(aTab);
			this.SessionStore.setTabValue(aTab, aKey, '');
			this.SessionStore.deleteTabValue(aTab, aKey);
		}
		catch(e) {
		}
	},
 
	// workaround for http://piro.sakura.ne.jp/latest/blosxom/mozilla/extension/treestyletab/2009-09-29_debug.htm
	checkCachedSessionDataExpiration : function(aTab) 
	{
		var data = aTab.linkedBrowser.__SS_data || // Firefox 3.6-
					aTab.linkedBrowser.parentNode.__SS_data; // -Firefox 3.5
		if (data &&
			data._tabStillLoading &&
			aTab.getAttribute('busy') != 'true' &&
			!aTab.linkedBrowser.__SS_restoring)
			data._tabStillLoading = false;
	},
 
	replaceViewSourceLink : function(aURI) 
	{
		return aURI.replace(/^view-source:/, 'view-source-tab:');
	},
 
	convertEncodingForPlatformFilePath : function(aPath) 
	{
		var encoding = this.getPref('extensions.viewsourceintab.path.encoding');
		if (encoding) {
			try {
				var UCONV = Components
								.classes['@mozilla.org/intl/scriptableunicodeconverter']
								.getService(Ci.nsIScriptableUnicodeConverter);
				UCONV.charset = 'Shift_JIS';
				aPath = UCONV.ConvertFromUnicode(aPath);
			}
			catch(e) {
			}
		}
		return aPath;
	},
 
	getViewSourceTabURI : function() 
	{
		var uri = this.targetInfo.uri || this.targetInfo.frame.location.href;
		var withUI = this.getPref('extensions.viewsourceintab.useViewSourceUI');
		var prefix = withUI ? 'view-source-tab:' : 'view-source:' ;
		return prefix + uri + this.createQuery(this.targetInfo);
	},
  
/* Initializing */ 
	
	init : function() 
	{
		if (!('gBrowser' in window)) return;

		window.removeEventListener('load', this, false);

		if (this.overrideExtensionsOnInitBefore) this.overrideExtensionsOnInitBefore();

		window.addEventListener('unload', this, false);
		document.getElementById('appcontent').addEventListener('select', this, false);

		var func;

		// Firefox 3.6 or older
		func = 'viewPartialSource __ctxextensions__viewPartialSource'.split(' ');
		func.forEach(function(aItem) {
			if (!(aItem in nsContextMenu.prototype)) return;
			eval('nsContextMenu.prototype.'+aItem+' = '+
				nsContextMenu.prototype[aItem].toSource().replace(
					'window.openDialog(',
					<><![CDATA[
						if (ViewSourceInTab.shouldLoadInTab) {
							ViewSourceInTab.targetInfo.clear();
							ViewSourceInTab.targetInfo.frame     = focusedWindow;
							ViewSourceInTab.targetInfo.uri       = docUrl;
							ViewSourceInTab.targetInfo.charset   = docCharset;
							ViewSourceInTab.targetInfo.reference = reference;
							ViewSourceInTab.targetInfo.context   = arguments[0];
							if ('TreeStyleTabService' in window)
								TreeStyleTabService.readyToOpenChildTab(focusedWindow);
							var b = ViewSourceInTab.getTabBrowserFromFrame(focusedWindow);
							var uri = focusedWindow.location.href;
							if (uri.indexOf('#') > -1) uri = uri.substring(0, uri.indexOf('#'));
							b.loadOneTab(
								'view-partial-source-tab:'+
									uri+
									ViewSourceInTab.createQuery(ViewSourceInTab.targetInfo),
								null, null, null, false);
						}
						else
							window.openDialog(]]></>
				)
			);
		});

		eval('nsContextMenu.prototype.viewFrameSource = '+
			nsContextMenu.prototype.viewFrameSource.toSource().replace(
				'{',
				<><![CDATA[
					{
						ViewSourceInTab.targetInfo.clear();
						ViewSourceInTab.targetInfo.frame = this.target.ownerDocument.defaultView;
				]]></>
			)
		);

		func = 'BrowserViewSourceOfDocument __ctxextensions__BrowserViewSourceOfDocument'.split(' ');
		func.forEach(function(aItem) {
			if (!(aItem in window)) return;
			eval('window.'+aItem+' = '+
				window[aItem].toSource().replace(
					/((ViewSourceOfURL|top\.gViewSourceUtils\.viewSource)\()/,
					<><![CDATA[
						if (aDocument || !ViewSourceInTab.targetInfo.frame) {
							ViewSourceInTab.targetInfo.clear();
							ViewSourceInTab.targetInfo.frame = aDocument ? aDocument.defaultView : ViewSourceInTab.browser.contentWindow ;
							ViewSourceInTab.targetInfo.descriptor = pageCookie;
						}
						$1]]></>
				)
			);
		});

		if ('ViewSourceOfURL' in window) { // Firefox 3.0.x
			eval('window.ViewSourceOfURL = '+
				window.ViewSourceOfURL.toSource().replace(
					/((gViewSourceUtils|utils)\.openInExternalEditor\()/,
					<><![CDATA[
						ViewSourceInTab.targetInfo.clear();
						$1]]></>
				)
			);
		}
		if ('viewSource' in gViewSourceUtils) { // Firefox 3.5 or later
			eval('gViewSourceUtils.viewSource = '+
				gViewSourceUtils.viewSource.toSource().replace(
					'this.openInExternalEditor(',
					<><![CDATA[
						ViewSourceInTab.targetInfo.clear();
						$&]]></>
				)
			);
		}

		eval('gViewSourceUtils.openInInternalViewer = '+
			gViewSourceUtils.openInInternalViewer.toSource().replace(
				/(openDialog\([^\)]+\))/,
				<><![CDATA[
					if (ViewSourceInTab.shouldLoadInTab) {
						if ('TreeStyleTabService' in window)
							TreeStyleTabService.readyToOpenChildTab(ViewSourceInTab.targetInfo.frame);
						var b = ViewSourceInTab.getTabBrowserFromFrame(ViewSourceInTab.targetInfo.frame);
						b.loadOneTab(
							ViewSourceInTab.getViewSourceTabURI(),
							null, null, null, false
						);
						if (!ViewSourceInTab.getPref('extensions.viewsourceintab.useViewSourceUI'))
							ViewSourceInTab.targetInfo.clear();
					}
					else {
						ViewSourceInTab.targetInfo.clear();
						$1;
					}
				]]></>
			)
		);

		eval('gViewSourceUtils.getExternalViewSourceEditor = '+
			gViewSourceUtils.getExternalViewSourceEditor.toSource().replace(
				'initWithPath(prefPath)',
				'initWithPath(decodeURIComponent(escape(prefPath)))'
			)
		);

		if (this.Comparator.compare(this.XULAppInfo.version, '3.7a4pre') >= 0) {
			eval('gViewSourceUtils.openInExternalEditor = '+
				gViewSourceUtils.openInExternalEditor.toSource().replace(
					'path = uri.QueryInterface(Components.interfaces.nsIFileURL).file.path;',
					'$& path = ViewSourceInTab.convertEncodingForPlatformFilePath(path);'
				)
			);

			eval('gViewSourceUtils.viewSourceProgressListener.onStateChange = '+
				gViewSourceUtils.viewSourceProgressListener.onStateChange.toSource().replace(
					'prefs.getCharPref("view_source.editor.args")',
					'decodeURIComponent(escape($&))'
				).replace(
					/(this\.file\.path)/g,
					'ViewSourceInTab.convertEncodingForPlatformFilePath($1)'
				)
			);
		}

		func = 'handleLinkClick __splitbrowser__handleLinkClick __ctxextensions__handleLinkClick __treestyletab__highlander__origHandleLinkClick'.split(' ');
		func.some(function(aFunc) {
			if (!(aFunc in window) ||
				!/^function handleLinkClick/.test(window[aFunc].toString()))
				return false;
			eval('window.'+aFunc+' = '+
				window[aFunc].toSource().replace(
					/((openNewTabWith|openNewWindowWith)\()/g,
					'href = ViewSourceInTab.replaceViewSourceLink(href); $1'
				)
			);
			return true;
		});

		this.viewSourceItems = [
				document.evaluate('/descendant::*[local-name()="menuitem" and @command="View:PageSource"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue,
				document.getElementById('context-viewsource'),
				document.getElementById('context-viewframesource'),
				document.getElementById('context-viewpartialsource-selection'),
				document.getElementById('context-viewpartialsource-mathml')
			];
		this.viewSourceItems.forEach(function(aItem) {
			if (aItem) aItem.addEventListener('click', this, false);
		}, this);

		if (this.overrideExtensionsOnInitAfter) this.overrideExtensionsOnInitAfter();
	},
 
	createQuery : function(aInfo) 
	{
		var info = [];
		if (aInfo.charset) info.push('charset='+encodeURIComponent(aInfo.charset));
		if (aInfo.reference) info.push('reference='+encodeURIComponent(aInfo.reference));
// restoring of view-source tab from query causes crash, so I don't put cacheKey information into the query...
//		if (aInfo.descriptor) {
//			let key = aInfo.descriptor.QueryInterface(Components.interfaces.nsISHEntry).cacheKey;
//			if (key) {
//				key = key.QueryInterface(Components.interfaces.nsISupportsPRUint32);
//				info.push('cacheKey='+encodeURIComponent(key.data));
//			}
//		}
		if (aInfo.context) info.push('context='+encodeURIComponent(aInfo.context));
		return info.length ? '#viewsourceintab('+info.join(';')+')' : '' ;
	},
 
	destroy : function() 
	{
		window.removeEventListener('unload', this, false);
		document.getElementById('appcontent').removeEventListener('select', this, false);

		this.viewSourceItems.forEach(function(aItem) {
			if (aItem) aItem.removeEventListener('click', this, false);
		}, this);
	},
 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'DOMContentLoaded':
				window.removeEventListener('DOMContentLoaded', this, false);
				if (this.overrideExtensionsPreInit) this.overrideExtensionsPreInit();
				return;

			case 'load':
				this.init();
				return;

			case 'unload':
				this.destroy();
				return;

			case 'select':
				var tab = aEvent.originalTarget;
				if (tab.localName != 'tabs') return;
				tab = tab.selectedItem;
				var b = tab.linkedBrowser;
				if (this.viewerURIPattern.test(b.currentURI.spec)) {
					b.contentWindow.setTimeout('updateStatusBar()', 0);
				}
				else {
					if (this.statusTextModified) {
						this.statusText = '';
						this.statusTextModified = false;
					}
				}
				return;

			case 'click':
				this.onClickMenuItem(aEvent);
				return;
		}
	},
	viewerURIPattern : /^(view-source-tab:|view-partial-source-tab:|chrome:\/\/viewsourceintab\/content\/(viewer\.xul|partialViewer\.xul)\?)/,
	
	onClickMenuItem : function(aEvent) 
	{
		var inTabCommand = (aEvent.button == 1 || (navigator.platform.toLowerCase().indexOf('mac') == -1 ? aEvent.ctrlKey : aEvent.metaKey ));
		if (!inTabCommand) return;
		if (this.getPref('extensions.viewsourceintab.enabled')) {
			inTabCommand = !inTabCommand;
		}

		var useExternal = this.getPref('view_source.editor.external');
		if (useExternal) {
			this.setPref('view_source.editor.external', false);
		}
		else {
			this.shouldLoadInTab = inTabCommand;
		}

		var item = aEvent.currentTarget;
		var popups = document.evaluate('ancestor::*[local-name()="menupopup" or local-name()="popup"]', item, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (item.hasAttribute('command')) {
			item = document.getElementById(item.getAttribute('command'));
		}
		var command = item.getAttribute('oncommand');
		if (command) {
			try {
				var func;
				eval('func = function(event) {'+command+'};');
				func.call(item, aEvent);
			}
			catch(e) {
			}
		}

		if (useExternal) {
			this.setPref('view_source.editor.external', true);
		}
		this.shouldLoadInTab = null;

		for (var i = popups.snapshotLength-1; i > -1; i--)
		{
			try {
				popups.snapshotItem(i).hidePopup();
			}
			catch(e) {
			}
		}
	}
    
}; 
(function() {
	var namespace = {};
	Components.utils.import('resource://viewsourceintab-modules/prefs.js', namespace);
	Components.utils.import('resource://viewsourceintab-modules/namespace.jsm', namespace);
	ViewSourceInTab.__proto__ = namespace.prefs;
})();
 	
