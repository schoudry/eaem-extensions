(function ($, $document) {
    var VIEW_SETTINGS_COLUMN_CONFIG = {},
        FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        REPORTS_FORM = "#customcolumnsForm",
        DAM_ADMIN_REPORTS_PAGE = ".cq-damadmin-admin-reportspage",
        METADATA_COL_MAPPING = "data-eaem-col-mapping",
        EXPORT_BUTTON = ".dam-admin-reports-export",
        QB = "/bin/querybuilder.json?",
        EXPORT_URL = "/apps/eaem-asset-reports-dynamic-columns/dialog/export.html",
        REPORT_RESULT_URL = "/mnt/overlay/dam/gui/content/reports/reportsresult.html",
        EAEM_COL = "eaemCol",
        FORM_FIELD_WRAPPER = ".coral-Form-fieldwrapper",
        COOKIE_REPORT_LIST_VIEW_COLUMNS = "eaem.report.listview.columns",
        REPORTS_CONFIGURE_COLUMNS_DIALOG = "reports-configure-columns-dialog",
        COLUMN_URL = "/apps/eaem-asset-reports-dynamic-columns/dialog/columns/column.html",
        COLUMNS_MODAL = "/apps/eaem-asset-reports-dynamic-columns/dialog/modal.html",
        DYNAMIC_COLS_CONFIG_URL = "/etc/experience-aem/report-columns/jcr:content/list.infinity.json",
        MAIN_COLUMN = "dam/gui/coral/components/admin/reports/columns/main",
        MAIN_COLUMN_WIDTH = 22,
        COLUMN_CACHE = [], COLUMN_WIDTH = "0%", CELL_DATA = [], searchUrl;

    if (typeof EAEM == "undefined") {
        EAEM = { REPORT : {} };
    }

    EAEM.REPORT.storeEnabledColumns = storeEnabledColumns;

    loadColumnsConfiguration();

    $document.on(FOUNDATION_CONTENT_LOADED, function(event){
        _.defer(function(){
            handleContentLoad(event);
        });
    });

    $document.on("submit", "form.foundation-form", function(e) {
        searchUrl = getSearchUrl();
    });

    function loadColumnsConfiguration() {
        if(!_.isEmpty(VIEW_SETTINGS_COLUMN_CONFIG)){
            return;
        }

        $.ajax(DYNAMIC_COLS_CONFIG_URL).done(function(data){
            if(_.isEmpty(data)){
                return;
            }

            _.each(data, function(obj, key){
                if(key.indexOf("item") !== 0){
                    return;
                }

                VIEW_SETTINGS_COLUMN_CONFIG[obj.value] = obj["jcr:title"];
            });
        });
    }

    function handleContentLoad(event){
        var target = event.target;

        if(isConfigureColumnsDialog(target)){
            addDynamicColumnsInModal();
        }else if(isReportsPage(event)){
            handleReportsPage();
        }
    }

    function handleReportsPage(){
        var $reportsPage = $(DAM_ADMIN_REPORTS_PAGE);

        if(_.isEmpty($reportsPage)){
            return;
        }

        var enabledColumns = getEnabledColumnsObj()[getReportPath()];

        if(_.isEmpty(enabledColumns)){
            return;
        }

        handleHeaders();
    }

    function handleHeaders(){
        var $reportsPage = $(DAM_ADMIN_REPORTS_PAGE),
            $hContainers = $reportsPage.find("header > .label"),
            $aContainers = $reportsPage.find("article");

        if(customHeadersAdded($hContainers)){
            handlePagination($aContainers);
            return;
        }

        handleExport();

        var enabledColumns = getEnabledColumnsObj()[getReportPath()];

        $.ajax(COLUMN_URL).done(function(colHtml) {
            _.each(enabledColumns, function(colMetaPath){
                addColumnHeaders($hContainers, $aContainers, colHtml, colMetaPath);
            });

            if(!searchUrl){
                return;
            }

            $.get(searchUrl).done(function(data){
                if(_.isEmpty(data.hits)){
                    return;
                }

                CELL_DATA = data.hits;

                addCellValues();
            });
        });
    }

    function handlePagination($aContainers){
        var $labelContainers = $aContainers.find(".label"),
            $lContainer;

        $labelContainers.each(function(index, aContainer){
            $lContainer = $(aContainer);

            if(customHeadersAdded($lContainer)){
                return;
            }

            _.each(COLUMN_CACHE, function(cellHtml){
                $lContainer.append(cellHtml);
            })
        });

        fixCellWidths($labelContainers, COLUMN_WIDTH);

        addCellValues();
    }

    function addColumnHeaders($hContainers, $aContainers, colHtml, colMetaPath){
        var $columnHeader, $labelContainers = $aContainers.find(".label"),
            cellHtml;

        $columnHeader = $(colHtml).appendTo($hContainers);

        $columnHeader.attr(METADATA_COL_MAPPING, colMetaPath)
                        .html(VIEW_SETTINGS_COLUMN_CONFIG[colMetaPath]);

        COLUMN_WIDTH = fixHeaderWidths($hContainers);

        if(_.isEmpty($labelContainers)){
            return;
        }

        cellHtml = getCellHtml(colMetaPath, "");

        $labelContainers.append(cellHtml);

        fixCellWidths($labelContainers, COLUMN_WIDTH);

        COLUMN_CACHE.push(cellHtml);
    }

    function addCellValues( ){
        var $reportsPage = $(DAM_ADMIN_REPORTS_PAGE),
            $aContainers = $reportsPage.find("article"),
            $aParent = $aContainers.parent(),
            $article, $cell,
            enabledColumns = getEnabledColumnsObj()[getReportPath()];

        _.each(CELL_DATA, function(hit){
            $article = $aParent.find("article[data-path='" + hit["jcr:path"] + "']");

            if(_.isEmpty($article)){
                return;
            }

            _.each(enabledColumns, function(colMetaPath){
                $cell = $article.find("[" + METADATA_COL_MAPPING + "='" + colMetaPath + "']");
                $cell.html(nestedPluck(hit, colMetaPath));
            })
        })
    }

    function fixCellWidths($lContainers, colWidth){
        $lContainers.children("div").removeClass("small-col large-col")
            .css("width", MAIN_COLUMN_WIDTH + "%");

        $lContainers.children("p").removeClass("small-col large-col")
            .css("width", colWidth).css("float", "left");
    }

    function getCellHtml(colMapping, colText){
        return "<p "
            + METADATA_COL_MAPPING + "='" + colMapping + "'>"
                + colText +
            "</p>";
    }

    function fixHeaderWidths($hContainer){
        var $hDivs = $hContainer.children("div"), $hDiv,
            colWidth = ((100 - MAIN_COLUMN_WIDTH) / ($hDivs.length - 1)) + "%";

        $hDivs.each(function(index, hDiv){
            $hDiv = $(hDiv);

            $hDiv.removeClass("small-col large-col");

            if( $hDiv.data("itemresourcetype") === MAIN_COLUMN){
                $hDiv.css("width", MAIN_COLUMN_WIDTH + "%");
                return;
            }

            $hDiv.css("width", colWidth);
        });

        return colWidth;
    }

    function customHeadersAdded($hContainers){
        return !_.isEmpty($hContainers.find("[" + METADATA_COL_MAPPING + "]"));
    }

    function isReportsPage(event){
        var target = event.target;

        if(!target){
            return false;
        }

        var $target = (!target.$ ? $(target) : target.$);

        return (!_.isEmpty($target.find(DAM_ADMIN_REPORTS_PAGE))
                    || $target.hasClass(DAM_ADMIN_REPORTS_PAGE.substr(1)));
    }

    function isConfigureColumnsDialog(target){
        if(!target || (target.tagName !== "CORAL-DIALOG")){
            return false;
        }

        var $target = (!target.$ ? $(target) : target.$);

        return $target.hasClass(REPORTS_CONFIGURE_COLUMNS_DIALOG);
    }

    function addDynamicColumnsInModal(){
        var url = COLUMNS_MODAL + getReportPath();

        $.ajax(url).done(handler);

        function handler(html){
            if(_.isEmpty(html)){
                return;
            }

            var $html, $column, $input, $form = $(REPORTS_FORM),
                enabledColumns = getEnabledColumnsObj()[getReportPath()];

            _.each(VIEW_SETTINGS_COLUMN_CONFIG, function(colTitle, colPath){
                $html = $(html);

                $input = $html.find("input[title='" + EAEM_COL + "']")
                            .attr(METADATA_COL_MAPPING, colPath)
                            .val("");

                if(contains(enabledColumns, colPath)){
                    $input.attr("checked", "checked");
                }

                $input.attr("onchange", "EAEM.REPORT.storeEnabledColumns()");

                $column = $input.closest(FORM_FIELD_WRAPPER);

                $column.find(".coral-Checkbox-description").html(colTitle);

                $form.append($column[0].outerHTML);
            });

            styleDialog();
        }
    }

    function handleExport(){
        $document.off("click", EXPORT_BUTTON).fipo("tap", "click", EXPORT_BUTTON, handler);

        function handler(){
            var currReportPath = getReportPath();

            if(currReportPath.indexOf("default") !== -1) {
                return;
            }

            var $form = $(".dam-admin-reports").find("[report-path='" + currReportPath + "']").find('form'),
                $sliderrange = $form.find(".sliderrange");

            setSliderValue($sliderrange);

            var url = Granite.HTTP.externalize(EXPORT_URL + currReportPath + "?" + $form.serialize());

            var downloadURL = function (url) {
                $('<iframe>', {
                    id: 'idown',
                    src: url
                }).hide().appendTo('body');
            };

            downloadURL(url);
        }

        function setSliderValue($form){
            var tickValues = $form.find(".coral-Slider").attr("data-tickvalues").split(","),
                lowerInd = $form.find(".coral-Slider.lower").attr('value'),
                upperInd = $form.find(".coral-Slider.upper").attr('value'),
                order = $form.find(".coral-Slider").attr("data-order"), tmp;

            if (order && order === "increasing") {
                if (lowerInd > upperInd) {
                    tmp = lowerInd;
                    lowerInd = upperInd;
                    upperInd = tmp;
                }
            } else if (lowerInd < upperInd) {
                tmp = lowerInd;
                lowerInd = upperInd;
                upperInd = tmp;
            }

            $form.find(".coral-Slider.lower .lowervalue").val(tickValues[lowerInd]);
            $form.find(".coral-Slider.upper .uppervalue").val(tickValues[upperInd]);
        }
    }

    function getReportPath(){
        return $('input[name=dam-asset-report]:checked').attr("report-path");
    }

    function getEnabledColumnsObj(){
        var cookieValue = getCookie(COOKIE_REPORT_LIST_VIEW_COLUMNS);

        if(!cookieValue){
            cookieValue = {};
        }else{
            cookieValue = JSON.parse(decodeURIComponent(cookieValue));
        }

        return cookieValue;
    }

    function storeEnabledColumns(){
        var $input, columns = [], colMapping;

        $(REPORTS_FORM).find("input:checked").each(function(index, input){
            $input = $(input);

            colMapping = $input.attr(METADATA_COL_MAPPING);

            if(_.isEmpty(colMapping)){
                return;
            }

            columns.push(colMapping);
        });

        var cookieObj = getEnabledColumnsObj();

        cookieObj[getReportPath()] = columns;

        addCookie(COOKIE_REPORT_LIST_VIEW_COLUMNS, JSON.stringify(cookieObj));
    }

    function getCookie(cookieName){
        var cookieValue = "";

        if(_.isEmpty(cookieName)){
            return;
        }

        var cookies = document.cookie.split(";"), tokens;

        _.each(cookies, function(cookie){
            tokens = cookie.split("=");

            if(tokens[0].trim() !== cookieName){
                return;
            }

            cookieValue = tokens[1].trim();
        });

        return cookieValue;
    }

    function addCookie(cookieName, value){
        if(_.isEmpty(cookieName)){
            return;
        }

        $.cookie(cookieName, value, { expires: 365, path: "/" } );
    }

    function contains(arrOrObj, key){
        var doesIt = false;

        if(_.isEmpty(arrOrObj) || _.isEmpty(key)){
            return doesIt;
        }

        if(_.isArray(arrOrObj)){
            doesIt = (arrOrObj.indexOf(key) !== -1);
        }

        return doesIt;
    }

    function styleDialog(){
        var $form = $(REPORTS_FORM);

        $form.css("max-height", "21.5rem").css("overflow-y", "auto");
    }

    function getSearchUrl(){
        var $form = $("form[action='" + REPORT_RESULT_URL + getReportPath() + "']");
        return QB + $form.serialize() + "&p.nodedepth=2&p.hits=full";
    }

    function nestedPluck(object, key) {
        if (!_.isObject(object) || _.isEmpty(object) || _.isEmpty(key)) {
            return [];
        }

        if (key.indexOf("/") === -1) {
            return object[key];
        }

        var nestedKeys = _.reject(key.split("/"), function(token) {
            return token.trim() === "";
        }), nestedObjectOrValue = object;

        _.each(nestedKeys, function(nKey) {
            if(_.isUndefined(nestedObjectOrValue)){
                return;
            }

            if(_.isUndefined(nestedObjectOrValue[nKey])){
                nestedObjectOrValue = undefined;
                return;
            }

            nestedObjectOrValue = nestedObjectOrValue[nKey];
        });

        return nestedObjectOrValue;
    }
})(jQuery, jQuery(document));