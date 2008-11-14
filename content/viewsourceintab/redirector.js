if (window.parent &&
	window.parent != window &&
	window.parent.location.href.indexOf('chrome:') != 0) {
	location.replace(
		location.href
			.replace(/^view-source-tab:/, 'view-source:')
			.replace(/^chrome:\/\/viewsourceintab\/[^\?]+\?/, 'view-source:')
	);
}
