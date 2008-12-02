ViewSourceInTab.overrideExtensionsPreInit = function() {

	// Highlander
	if ('Highlander' in window) {
		eval('Highlander.overrideHandleLinkClick = '+
			Highlander.overrideHandleLinkClick.toSource().replace(
				/(var )?origHandleLinkClick/g,
				'window.__viewsourceintab__highlander__origHandleLinkClick'
			)
		);
	}

};
ViewSourceInTab.overrideExtensionsOnInitBefore = function() {
};
ViewSourceInTab.overrideExtensionsOnInitAfter = function() {
};
