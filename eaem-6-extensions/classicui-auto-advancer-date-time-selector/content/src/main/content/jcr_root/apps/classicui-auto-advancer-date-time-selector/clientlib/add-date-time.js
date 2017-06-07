(function(){
    var DATE_TIME_AA_CLASS = "apps.experienceaem.autoadvancer.datetime.DateTimeAutoAdvancer";
    var DATE_TIME_SEL_VALUE = -1;
    var DATE_TIMES_PROP = "./metaData/eaemTimeoutDateTimes";

    var pathName = window.location.pathname;

    if( pathName.indexOf("/etc/workflow") != 0 ){
        return;
    }

    function getDialog(dateTimesHidden){
        var datetimes = new  CQ.form.MultiField({
            border: false,
            fieldLabel: "Date and Time",
            fieldConfig: {
                "xtype": "datetime"
            }
        });

        var times = new CQ.form.MultiField({
            border: false,
            fieldLabel: "Time",
            fieldConfig: {
                "xtype": "timefield"
            }
        });

        var text = "<BR> Time: The times in a day, handler should timeout - Date and Time: The exact date&time, handler should timeout<BR><BR>" +
                   "Example: Workflow - Request for Activation, Handler Step: Waiting for Activation, Previous Step - Approve Content <BR><BR>" +
                   "Scenario 1: 'Time' is set to '4:00 PM', '5:00 PM', '6:00 PM' and 'Approve Content' step is completed at '4:30 PM', " +
                   "'Waiting for Activation' step is guaranteed to timeout at '5:00 PM' <BR><BR>" +
                   "Scenario 2: 'Time' is set to '4:00 PM', '5:00 PM', '6:00 PM' and " +
                   "'Date and Time' is set to 'May 04, 2015, 5:10 PM', 'June 13, 2015, 4:30 PM'; " +
                   "If 'Approve Content' step completes on 'May 04, 2015, 4:20 PM', the 'Waiting for Activation' timesout at " +
                   "'5:00 PM' and not '5:10 PM'. 'Approve Content' step completed on 'June 13, 2015, 4:20 PM' will timeout " +
                   "'Waiting for Activation' at '4:30 PM'";

        var config = {
            "jcr:primaryType": "cq:Dialog",
            width: 600,
            height: 400,
            title: "Date Time",
            items: {
                "jcr:primaryType": "cq:Panel",
                bodyStyle: "padding: 10px",
                html: text,
                items: {
                    "jcr:primaryType": "cq:WidgetCollection",
                    times: times,
                    datetimes: datetimes
                }
            },
            ok: function(){
                var value = {
                    times: times.getValue(),
                    datetimes: datetimes.getValue()
                };

                dateTimesHidden.setValue(JSON.stringify(value));

                this.close();
            },
            cancel: function(){
                this.close();
            }
        };

        var dateTimeValues = dateTimesHidden.getValue();

        if(!_.isEmpty(dateTimeValues)){
            dateTimeValues = JSON.parse(dateTimeValues);

            datetimes.setValue(dateTimeValues.datetimes);
            times.setValue(dateTimeValues.times);
        }

        return CQ.WCM.getDialog(config);
    }

    function initTimeoutSelection(dialog, timeoutType){
        var dateTimeOption = {
            text: "Date Time",
            value: DATE_TIME_SEL_VALUE
        };

        var dateTimesHidden = dialog.addHidden({ "./metaData/eaemTimeoutDateTimes" : ""})[DATE_TIMES_PROP];

        $.getJSON(dialog.form.url + ".infinity.json").done(function(data){
            if(_.isEmpty(data.metaData) || _.isEmpty(data.metaData.eaemTimeoutDateTimes)){
                return;
            }
            dateTimesHidden.setValue(data.metaData.eaemTimeoutDateTimes);
        });

        timeoutType.options.push(dateTimeOption);

        timeoutType.setOptions(timeoutType.options);

        timeoutType.reset();

        return dateTimesHidden;
    }

    function handleTimeoutChange(timesDialog, handlerType, dateTimesHidden, timeoutValue){
        if(timeoutValue != DATE_TIME_SEL_VALUE){
            return timesDialog;
        }

        if(handlerType.getValue() != DATE_TIME_AA_CLASS){
            CQ.Ext.Msg.alert("Invalid", "Handler selected cannot handle datetime");

            this.setValue("Off");

            return timesDialog;
        }

        //to handle the change event fired by combo in timeout selection
        if(timesDialog && timesDialog.isVisible()){
            return timesDialog;
        }

        timesDialog = getDialog(dateTimesHidden);

        timesDialog.show();

        return timesDialog;
    }

    function handleTimeoutHandlerChange(timeoutType, handlerValue){
        if(handlerValue != DATE_TIME_AA_CLASS){
            timeoutType.setValue("Off");
        }
    }

    function registerDateTime(dialog, handlerType, timeoutType){
        if(dialog.eaemListenersAdded){
            return;
        }

        dialog.eaemListenersAdded = true;

        var dateTimesHidden = initTimeoutSelection(dialog, timeoutType);

        var timesDialog;

        handlerType.on("selectionchanged", function(t, value){
            handleTimeoutHandlerChange(timeoutType, value);
        });

        timeoutType.on("selectionchanged", function(t, value){
            timesDialog = handleTimeoutChange.call(this, timesDialog, handlerType, dateTimesHidden, value);
        });
    }

    function findTimeoutHandler(editable){
        function handler(){
            var dialog = editable.dialogs[CQ.wcm.EditBase.EDIT];

            var selTypes = dialog.findByType("selection");

            if(_.isEmpty(selTypes)){
                return;
            }

            var handlerType, timeoutType;

            _.each(selTypes, function(selType){
                if(selType.name == "./metaData/timeoutHandler"){
                    handlerType = selType;
                }else if(selType.name == "./metaData/timeoutMillis"){
                    timeoutType = selType;
                }
            });

            //wait until the dialog gets opened by ootb handlers & initialized
            if(!handlerType || !timeoutType){
                return;
            }

            clearInterval(INTERVAL);

            registerDateTime(dialog, handlerType, timeoutType);
        }

        var INTERVAL = setInterval(handler, 250);
    }

    var INTERVAL = setInterval(function(){
        var editables = CQ.WCM.getEditables();

        if(_.isEmpty(editables)){
            return;
        }

        clearInterval(INTERVAL);

        _.each(editables, function(editable){
            editable.el.on('dblclick', function(e){
                findTimeoutHandler(editable);
            }, this);
        });
    }, 250);
})();
