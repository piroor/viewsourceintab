var ViewSourceInTabOverlay = {

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
		toolbox.setAttribute('orient', 'horizontal');
		var toolbar = toolbox.appendChild(document.createElement('toolbar'));
		toolbar.setAttribute('flex', 1);
		toolbar.setAttribute('orient', 'horizontal');
		toolbar.setAttribute('align', 'center');
		var textbox = toolbar.appendChild(document.createElement('textbox'));
		textbox.setAttribute('flex', 1);
		textbox.setAttribute('readonly', true);
		textbox.setAttribute('onfocus', 'if (this.readableValue != this.originalValue) this.value = this.originalValue');
		textbox.setAttribute('onblur', 'if (this.readableValue != this.originalValue) this.value = this.readableValue');
		this.locationBar = textbox;

		toolbar.insertBefore(toolbox.firstChild, toolbar.firstChild);
		toolbar.firstChild.style.background = 'transparent';
		toolbar.firstChild.style.border = '0 none';
		toolbar.firstChild.style.MozAppearance = 'none';

		var status = document.getElementById('status-bar');
		if (status)
			status.setAttribute('hidden', true);

		this.updateLocationBar(window.arguments[0]);

		if (Components
				.classes['@mozilla.org/preferences;1']
				.getService(Components.interfaces.nsIPrefBranch)
				.getBoolPref('extensions.viewsourceintab.useViewSourceUI'))
			toolbar.removeAttribute('collapsed');
		else
			toolbar.setAttribute('collapsed', true);

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
					<><![CDATA[
						{
							if (!ViewSourceInTabOverlay.initializeOnLoad()) return;
					]]></>
				).replace(
					'}',
					<><![CDATA[;
						ViewSourceInTabOverlay.clearInfo();
						document.title = document.documentElement.getAttribute('titlepreface') + (getBrowser().contentDocument.title || window.arguments[0]);
					}]]></>
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
					<><![CDATA[$&
						if (!ViewSourceInTabOverlay.initializeOnLoad()) return;
					]]></>
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
					<><![CDATA[$&
						var selectionSource = ViewSourceInTabOverlay.source;
						if (!selectionSource) {
					]]></>
				).replace(
					/(getBrowser\(\)\.webNavigation\.[^\}]+)/,
					<><![CDATA[
						if (ViewSourceInTabOverlay.service && !ViewSourceInTabOverlay.source) {
							ViewSourceInTabOverlay.setTabValue(ViewSourceInTabOverlay.kVIEWSOURCE_SOURCE, encodeURIComponent(tmpNode.innerHTML));
						}
						$1;
					}
					else {
						if (decodeURIComponent(selectionSource).indexOf(MARK_SELECTION_START) > -1) {
							window.document.getElementById('appcontent').addEventListener('load', drawSelection, true);
						}
						getBrowser().webNavigation.loadURI(
							'view-source:data:text/html;charset=utf-8,' + selectionSource,
							loadFlags, null, null, null);
					}]]></>
				)
			);
		}

		if ('viewPartialSourceForFragment' in window) {
			eval('window.viewPartialSourceForFragment = '+
				window.viewPartialSourceForFragment.toSource().replace(
					'{',
					<><![CDATA[$&
						var fragmentSource = ViewSourceInTabOverlay.source;
						if (!fragmentSource) {
					]]></>
				).replace(
					/(var doc = |getBrowser\(\).loadURI\()/,
					<><![CDATA[
							if (ViewSourceInTabOverlay.service && !ViewSourceInTabOverlay.source) {
								ViewSourceInTabOverlay.setTabValue(ViewSourceInTabOverlay.kVIEWSOURCE_SOURCE, encodeURIComponent(source));
							}
						}
						else {
							var source = fragmentSource;
						}
						$1]]></>
				)
			);
		}

		if ('drawSelection' in window) {
			eval('window.drawSelection = '+
				window.drawSelection.toSource().replace(
					'{',
					<><![CDATA[$&
							try {
								window.document.getElementById('appcontent').removeEventListener('load', drawSelection, true);
							}
							catch(e) {
							}
					]]></>
				).replace(
					'getBrowser().contentDocument.title',
					'document.title'
				)
			);
		}

		if ('viewSource' in window) {
			eval('window.viewSource = '+
				window.viewSource.toSource().replace(
					/(webNavigation\.sessionHistory = Components\.classes\[[^\]]+\]\.createInstance\([^\)]*\);)/,
					<><![CDATA[
						try {
							$1
						}
						catch(e) {
							//Components.utils.reportError(e);
						}
					]]></>
				)
			);
		}

		if ('updateStatusBar' in window) {
			eval('window.updateStatusBar = '+
				window.updateStatusBar.toSource().replace(
					'document.getElementById("statusbar-line-col")',
					'ViewSourceInTabOverlay.service.statusBarPanel'
				).replace(
					/(\}\)?)$/,
					'ViewSourceInTabOverlay.service.statusTextModified = true; $1'
				)
			);
		}
	},

	updateLocationBar : function(aValue)
	{
		this.locationBar.originalValue = aValue;
		var readableURI = aValue;
		try {
			readableURI = decodeURI(aValue);
		}
		catch(e) {
		}
		this.locationBar.readableValue =
			this.locationBar.value = readableURI;
	},
	locationBar : null,

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
			(this.info ? this.info.reference : null ),
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

		var charset   = window.arguments[1];
		var reference = window.arguments[2];
		var context   = window.arguments[3];
		if (query && !reference) {
			/charset=([^;\)]+)/.test(query);
			charset = decodeURIComponent(RegExp.$1 || '') || null ;
			/reference=([^;\)]+)/.test(query);
			reference = decodeURIComponent(RegExp.$1 || '') || null ;
			/context=([^;\)]+)/.test(query);
			context = decodeURIComponent(RegExp.$1 || '') || null ;
		}
		window.arguments = [uri, charset, reference, context];
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
		var uri = getBrowser().currentURI.spec.replace('view-source:', '');
		this.setTabValue(this.kVIEWSOURCE_URI, uri);
		if (this.isSelection) return;
		this.updateLocationBar(uri);
		var root = document.documentElement;
		document.title = root.getAttribute('titlepreface') + uri + root.getAttribute('titlemenuseparator') + root.getAttribute('titlemodifier');
	}

};
ViewSourceInTabOverlay.__proto__ = ViewSourceInTab;



ViewSourceInTabOverlay.updateInfo();
if (ViewSourceInTabOverlay.service && !window.arguments) {
	delete gFindBar;
	ViewSourceInTabOverlay.init();
}
