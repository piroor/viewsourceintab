function getParentBrowserWindow()
{
	if (gParentBrowserWindow === void(0)) {
		try {
			gParentBrowserWindow = window
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIDocShell)
				.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
				.parent
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.document.defaultView;
			if (gParentBrowserWindow.location.href != 'chrome://browser/content/browser.xul')
				gParentBrowserWindow = null;
		}
		catch(e) {
			gParentBrowserWindow = null
		}
	}
	return gParentBrowserWindow;
}
var gParentBrowserWindow;

function getParentViewSourceInTab()
{
	if (!getParentBrowserWindow()) return null;
	return getParentBrowserWindow().ViewSourceInTab;
}

function getParentBrowserViewSourceInfo()
{
	if (!getParentViewSourceInTab()) return null;
	return getParentViewSourceInTab().targetInfo;
}

function getParentBrowserTab()
{
	if (!gOwnerTab) {
		var sv = getParentViewSourceInTab();
		var b = sv.getTabBrowserFromFrame(window);
		gOwnerTab = sv.getTabFromFrame(window, b);
	}
	return gOwnerTab;
}
var gOwnerTab;



var gViewSourceInTab = getParentViewSourceInTab();
var gViewSourceInfo = getParentBrowserViewSourceInfo();
if (gViewSourceInfo && gViewSourceInfo.frame) {
	gViewSourceInTab.setTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_URI, gViewSourceInfo.frame.location.href);
	gViewSourceInTab.setTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_CHARSET, gViewSourceInfo.charset);
	gViewSourceInTab.setTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_CONTEXT, gViewSourceInfo.context);
}
if (gViewSourceInTab && !window.arguments) {
	window.arguments = [
		gViewSourceInTab.getTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_URI),
		gViewSourceInTab.getTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_CHARSET),
		gViewSourceInfo ? gViewSourceInfo.reference : null ,
		gViewSourceInTab.getTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_CONTEXT)
	];
	delete gFindBar;

	var status = document.getElementById('status-bar');
	if (status) {
		document.getAnonymousElementByAttribute(status, 'class', 'statusbar-resizerpanel').setAttribute('hidden', true);
	}
}

var gViewSourceDone = false;
if ('onLoadViewSource' in window) {
	eval('window.onLoadViewSource = '+
		window.onLoadViewSource.toSource().replace( // prevent infinity reloading
			'{',
			<><![CDATA[
				{
					if (gViewSourceDone) return;
					gViewSourceDone = true;
					var bar = document.getElementById('FindToolbar');
					if (bar)
						bar.parentNode.removeChild(bar);
			]]></>
		).replace(
			'}',
			'; if (gViewSourceInfo) gViewSourceInfo.clear(); }'
		).replace(
			'gFindBar.initFindBar();',
			''
		)
	);
	eval('window.onUnloadViewSource = '+
		window.onUnloadViewSource.toSource().replace(
			'gFindBar.uninitFindBar();',
			''
		)
	);
}

if ('onLoadViewPartialSource' in window) {
	eval('window.onLoadViewPartialSource = '+
		window.onLoadViewPartialSource.toSource().replace( // prevent infinity reloading
			'{',
			<><![CDATA[
				{
					if (gViewSourceDone) return;
					gViewSourceDone = true;
					var bar = document.getElementById('FindToolbar');
					if (bar)
						bar.parentNode.removeChild(bar);
			]]></>
		).replace(
			'window._content.focus();',
			'if (gViewSourceInfo) { gViewSourceInfo.clear(); }; window._content.focus();'
		).replace(
			'gFindBar.initFindBar();',
			''
		)
	);
	eval('window.onUnloadViewPartialSource = '+
		window.onUnloadViewPartialSource.toSource().replace(
			'gFindBar.uninitFindBar();',
			''
		)
	);
}

if ('viewPartialSourceForSelection' in window) {
	eval('window.viewPartialSourceForSelection = '+
		window.viewPartialSourceForSelection.toSource().replace(
			'{',
			<><![CDATA[
				{
					var selectionSource = gViewSourceInTab ? gViewSourceInTab.getTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_SOURCE) : null ;
					if (!selectionSource) {
			]]></>
		).replace(
			/(getBrowser\(\)\.webNavigation\.[^\}]+)/,
			<><![CDATA[
				if (gViewSourceInTab && !gViewSourceInTab.getTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_SOURCE)) {
					gViewSourceInTab.setTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_SOURCE, encodeURIComponent(tmpNode.innerHTML));
				}
				$1;
			}
			else {
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
			<><![CDATA[
				{
					var fragmentSource = gViewSourceInTab ? gViewSourceInTab.getTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_SOURCE) : null ;
					if (!fragmentSource) {
			]]></>
		).replace(
			'var doc = ',
			<><![CDATA[
					if (gViewSourceInTab && !gViewSourceInTab.getTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_SOURCE)) {
						gViewSourceInTab.setTabValue(getParentBrowserTab(), gViewSourceInTab.kVIEWSOURCE_SOURCE, encodeURIComponent(source));
					}
				}
				else {
					var source = fragmentSource;
				}
				var doc = ]]></>
		)
	);
}

if ('drawSelection' in window) {
	eval('window.drawSelection = '+
		window.drawSelection.toSource().replace(
			'{',
			'{ try { window.document.getElementById("appcontent").removeEventListener("load", drawSelection, true); } catch(e) {};'
		)
	);
}
