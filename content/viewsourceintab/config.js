const XULAppInfo = Components.classes['@mozilla.org/xre/app-info;1']
		.getService(Components.interfaces.nsIXULAppInfo);
const comparator = Components.classes['@mozilla.org/xpcom/version-comparator;1']
					.getService(Components.interfaces.nsIVersionComparator);

var gViewSourceInRadio,
	gViewSourceInTab,
	gViewSourceInExternal,
	gTabViewerItems,
	gExternalViewerPath,
	gExternalViewerButton,
	gExternalViewerItems;

function initGeneralPane()
{
	var container = document.getElementById('view_source.editor.args-container');
	if (comparator.compare(XULAppInfo.version, '3.1') < 0)
		container.setAttribute('collapsed', true);
	else
		container.removeAttribute('collapsed');

	gViewSourceInRadio = document.getElementById('viewSourceIn-radiogroup');
	gViewSourceInTab = document.getElementById('extensions.viewsourceintab.enabled');
	gViewSourceInExternal = document.getElementById('view_source.editor.external');

	gViewSourceInRadio.value =
		gViewSourceInExternal.value ? 'external' :
		gViewSourceInTab.value ? 'tab' :
		'window' ;

	gExternalViewerPath = document.getElementById('view_source.editor.path-filefield');
	gExternalViewerButton = document.getElementById('view_source.editor.path-choose');
	gExternalViewerPath.file = document.getElementById(gExternalViewerPath.getAttribute('preference')).value;
	gExternalViewerPath.disabled = gExternalViewerButton.disabled = gViewSourceInRadio.value != 'external';

	gTabViewerItems = [
		document.getElementById('extensions.viewsourceintab.useViewSourceUI-check'),
	];
	gExternalViewerItems = [
		gExternalViewerPath,
		gExternalViewerButton,
		document.getElementById('view_source.editor.args-textbox'),
		document.getElementById('view_source.editor.args-label'),
		document.getElementById('view_source.editor.args-description')
	];
}

function onChangeViewSourceInRadio()
{
	gViewSourceInTab.value      = gViewSourceInRadio.value == 'tab';
	gViewSourceInExternal.value = gViewSourceInRadio.value == 'external';

	gTabViewerItems.forEach(function(aItem) {
		if (gViewSourceInRadio.value != 'tab')
			aItem.setAttribute('disabled', true);
		else
			aItem.removeAttribute('disabled');
	});
	gExternalViewerItems.forEach(function(aItem) {
		if (gViewSourceInRadio.value != 'external')
			aItem.setAttribute('disabled', true);
		else
			aItem.removeAttribute('disabled');
	});
	if (gViewSourceInRadio.value == 'external' &&
		!gExternalViewerPath.file)
		showFilePicker('view_source.editor.path-filefield', gExternalViewerButton.getAttribute('picker-title'));
}


function showFilePicker(aTarget, aTitle)
{
	var target = document.getElementById(aTarget);

	var filePicker = Components
			.classes['@mozilla.org/filepicker;1']
			.createInstance(Components.interfaces.nsIFilePicker);

	if (target.file) {
		filePicker.displayDirectory = target.file.parent;
	}

	filePicker.appendFilters(filePicker.filterApps | filePicker.filterAll);
	filePicker.init(window, aTitle, filePicker.modeOpen);

	if (filePicker.show() != filePicker.returnCancel) {
		target.file  = filePicker.file;
//		target.label = target.file.path;
		document.getElementById(target.getAttribute('preference')).value = filePicker.file;
	}
}

