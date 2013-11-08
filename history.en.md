# History

 - master/HEAD
   * Modified: "jar" archive is no longer included.
   * Fixed: Make codes E4X-free, to work lately versions of Firefox.
 - 0.3.2010070401
   * Drops support for Firefox 2.0.0.x.
   * Works on Minefield 4.0b2pre.
 - 0.3.2010062901
   * ru-RU locale is updated by L'Autour.
 - 0.3.2010032902
   * Fixed: Related tabbrowser element couldn't be found from a frame.
 - 0.3.2010032901
   * Fixed: On Minefield 3.7a4pre, "view source" was wrongly locked into the webpage which was shown in the source viewer tab at first.
 - 0.3.2010032801
   * Modified: On Minefield 3.7a4pre or later, encoding of file path is automatically detected.
   * es-ES locale is available, translated by Rivica.
 - 0.3.2010020301
   * Improved: Soruce viewer tab uses cache.
   * Fixed: Too many links in a page doesn't freeze soruce viewer tab.
   * Fixed: Becomes safe about session restoring.
 - 0.3.2009090201
   * it-IT locale is updated by Godai71
 - 0.3.2009070701
   * Fixed: Works for pages with IDN, like [http://例え.テスト/](http://xn--r8jz45g.xn--zckzah/).
   * Updated: hu-HU locale is updated by Mikes Kaszmán István.
 - 0.3.2009062301
   * Fixed: "View Source" into tabs work correctly even if the toolbar in tabs is disabled.
   * Fixed: "View Source" into tabs work correctly for webpages which have un-decodable URI by "decodeURI()".
   * Modified: You can specify the encoding of file path for the external viewer. (Auto-detect is not available yet!)
   * Updated: it-IT locale is updated by Godai71
 - 0.3.2009051101
   * Improved: New option to hide "View Source" toolbar in source viewer tabs.
 - 0.3.2009042901
   * Fixed: "Partial Source" tabs for selections work correctly on Shiretoko 3.5b5pre and Minefield.
   * Improved: Configuration UI for "view_source.editor.args", a new secret preference introduced to Firefox 3.5, is available.
   * Improved: Non-ASCII characters in "view_source.editor.args" are parsed correctly.
 - 0.3.2009032501
   * Fixed: Appearance of UI elements of "view source" tab is improved.
   * Fixed: "Window" menu is correctly hidden in "view source" tab on Mac OS X.
 - 0.3.2009021201
   * Added: ru-RU locale is available. (by L'Autour)
 - 0.3.2008120201
   * Fixed: Works with [Highlander](https://addons.mozilla.org/firefox/addon/4086).
 - 0.3.2008111401
   * Improved: Middle-click or Ctrl-click (Command-click on Mac OS X) on menu items works as the reversed behavior.
   * Improved: Shown URI becomes decoded.
   * Improved: Linkified view-source on Minefield 3.1b2pre is supported.
   * Fixed: "Undo remove tab" works correctly for source viewer tabs.
   * Modified: "view-source-tab:" protocol is redirected to "view-source:" for webpages.
   * Hungarian translatiton by Mikes Kaszmán István is available.
 - 0.2.2008101501
   * Improved: Works on Minefield 3.1b2pre.
   * Fixed: "View Selection Source" works correctly for local files.
   * Fixed: "View Frame Source" shows the source of the focused frame correctly.
 - 0.2.2008061901
   * Fixed: Works on Firefox 2 again.
 - 0.2.2008061601
   * Fixed: Works on Firefox 3.
   * Improved: Inner status bar in tab disappeared and unified to Firefox's status bar.
   * Improved: "view-source-tab:" URL is available.
 - 0.1.2008030901
   * Works on Minefield 3.0b5pre.
 - 0.1.2008022301
   * Improved: Works on Firefox 3 beta3.
   * Improved: Page URI is shown in the toolbar of source viewer tab.
   * Fixed: Page URI is shwon as title if Firefox fails to get page's title.
 - 0.1.2007103001
   * Fixed: Wrong name in Japanese locale disappeared.
 - 0.1.2007102501
   * Modified: Renamed to "Source Viewer Tab" from "View Source in Tab" (because there is another extension which has same name.)
   * Improved: "Edit" menu is hidden in tab.
 - 0.1.2007102402
   * Fixed: Works on Minefield.
 - 0.1.2007102401
   * Released.
