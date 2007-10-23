var gViewSourceInRadio,
	gViewSourceInTab,
	gViewSourceInExternal,
	gExternalViewerPath,
	gExternalViewerButton;

function initViewSourceInRadio()
{
	gViewSourceInRadio = document.getElementById('viewSourceIn-radiogroup');
	gViewSourceInTab = document.getElementById('extensions.viewsourceintab.enabled');
	gViewSourceInExternal = document.getElementById('view_source.editor.external');

	gViewSourceInRadio.value =
		gViewSourceInExternal.value ? 'external' :
		gViewSourceInTab.value ? 'tab' :
		'window' ;

	gExternalViewerPath = document.getElementById('view_source.editor.path-textbox');
	gExternalViewerButton = document.getElementById('view_source.editor.path-choose');

	gExternalViewerPath.disabled = gExternalViewerButton.disabled = gViewSourceInRadio.value != 'external';
}

function onChangeViewSourceInRadio()
{
	gViewSourceInTab.value      = gViewSourceInRadio.value == 'tab';
	gViewSourceInExternal.value = gViewSourceInRadio.value == 'external';

	gExternalViewerPath.disabled = gExternalViewerButton.disabled = gViewSourceInRadio.value != 'external';
	if (gViewSourceInRadio.value == 'external' &&
		!gExternalViewerPath.value)
		showFilePicker('view_source.editor.path-textbox', gExternalViewerButton.getAttribute('picker-title'));
}


function showFilePicker(aTarget, aTitle)
{
	var target = document.getElementById(aTarget);

	var filePicker = Components
			.classes['@mozilla.org/filepicker;1']
			.createInstance(Components.interfaces.nsIFilePicker);

	if (target.value) {
		var current = Components.classes['@mozilla.org/file/local;1'].createInstance();
		if (current instanceof Components.interfaces.nsILocalFile) {
			try {
				current.initWithPath(target.value);
				filePicker.displayDirectory = current.parent;
			}
			catch(e) {
			}
		}
	}

	filePicker.appendFilters(filePicker.filterApps | filePicker.filterAll);
	filePicker.init(window, aTitle, filePicker.modeOpen);

	if (filePicker.show() != filePicker.returnCancel) {
		target.value = filePicker.file.path;
		var event = document.createEvent('UIEvents');
		event.initUIEvent('input', true, false, window, 0);
		target.dispatchEvent(event);
	}
}

