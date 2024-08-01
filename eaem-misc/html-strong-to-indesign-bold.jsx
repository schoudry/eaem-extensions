function createPageItem(spread) {
    var rect = spread.textFrames.add();

    var y1 = 10; // upper left  Y-Coordinate
    var x1 = 10; // upper left  X-Coordinate
    var y2 = 50; // lower right Y-Coordinate
    var x2 = 40; // lower right X-Coordinate

    rect.geometricBounds = [y1, x1, y2, x2];

    return rect;
}

function getPlaceSpread(document) {
    var lastSpread = document.spreads.lastItem();

    return lastSpread;
}

function getBoldStyle(document) {
    var boldCharacterStyle = document.characterStyles.add();

    boldCharacterStyle.appliedFont = app.fonts[6];

    boldCharacterStyle.fontStyle = "Bold";

    return boldCharacterStyle;
}

try {
    var document = app.documents.add();

    var spread = getPlaceSpread(document);

    var rect = createPageItem(spread);

    rect.contents = "This is a <strong>Strong Text</strong> in Indesign";

    app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;

    app.changeGrepPreferences.changeTo = "$3";

    app.changeGrepPreferences.appliedCharacterStyle = getBoldStyle(document);

    app.findGrepPreferences.findWhat = "(<strong(\\s.*)?>)(.+?)(</strong(\\s.*)?>)";

    rect.changeGrep();

    app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;

} catch (err) {
    $.writeln(err)
}
