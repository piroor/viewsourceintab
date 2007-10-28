var gViewSourceInRadio,
	gViewSourceInTab,
	gViewSourceInExternal,
	gExternalViewerPath,
	gExternalViewerButton;

function initGeneralPane()
{
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
}

function onChangeViewSourceInRadio()
{
	gViewSourceInTab.value      = gViewSourceInRadio.value == 'tab';
	gViewSourceInExternal.value = gViewSourceInRadio.value == 'external';

	gExternalViewerPath.disabled = gExternalViewerButton.disabled = gViewSourceInRadio.value != 'external';
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

