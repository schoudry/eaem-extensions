CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.MultiFieldPanel = CQ.Ext.extend(CQ.Ext.Panel, {
    panelValue: '',

    constructor: function(config){
        config = config || {};
        ExperienceAEM.MultiFieldPanel.superclass.constructor.call(this, config);
    },

    initComponent: function () {
        ExperienceAEM.MultiFieldPanel.superclass.initComponent.call(this);

        this.panelValue = new CQ.Ext.form.Hidden({
            name: this.name
        });

        this.add(this.panelValue);

        var multifield = this.findParentByType('multifield'),
            dialog = this.findParentByType('dialog');

        dialog.on('beforesubmit', function(){
            var value = this.getValue();

            if(value){
                this.panelValue.setValue(value);
            }
        },this);

        dialog.on('loadcontent', function(){
            if(_.isEmpty(multifield.dropTargets)){
                multifield.dropTargets = [];
            }

            multifield.dropTargets = multifield.dropTargets.concat(this.getDropTargets());

            _.each(multifield.dropTargets, function(target){
                if (!target.highlight) {
                    return;
                }

                var dialogZIndex = parseInt(dialog.el.getStyle("z-index"), 10);

                if (!isNaN(dialogZIndex)) {
                    target.highlight.zIndex = dialogZIndex + 1;
                }
            })
        }, this);

        if(dialog.eaemInit){
            return;
        }

        var tabPanel = multifield.findParentByType("tabpanel");

        if(tabPanel){
            tabPanel.on("tabchange", function(panel){
                panel.doLayout();
            });
        }

        dialog.on('hide', function(){
            var editable = CQ.utils.WCM.getEditables()[this.path];

            //dialog caching is a real pain when there are multifield items; donot cache
            delete editable.dialogs[CQ.wcm.EditBase.EDIT];
            delete CQ.WCM.getDialogs()["editdialog-" + this.path];
        }, dialog);

        dialog.eaemInit = true;
    },

    afterRender : function(){
        ExperienceAEM.MultiFieldPanel.superclass.afterRender.call(this);

        this.items.each(function(){
            if(!this.contentBasedOptionsURL
                || this.contentBasedOptionsURL.indexOf(CQ.form.Selection.PATH_PLACEHOLDER) < 0){
                return;
            }

            this.processPath(this.findParentByType('dialog').path);
        })
    },

    getValue: function () {
        var pData = {};

        this.items.each(function(i){
            if(i.xtype == "label" || i.xtype == "hidden" || !i.hasOwnProperty("dName")){
                return;
            }

            pData[i.dName] = i.getValue();
        });

        return $.isEmptyObject(pData) ? "" : JSON.stringify(pData);
    },

    setValue: function (value) {
        this.panelValue.setValue(value);

        var pData = JSON.parse(value);

        this.items.each(function(i){
            if(i.xtype == "label" || i.xtype == "hidden" || !i.hasOwnProperty("dName")){
                return;
            }

            i.setValue(pData[i.dName]);

            i.fireEvent('loadcontent', this);
        });
    },

    getDropTargets : function() {
        var targets = [], t;

        this.items.each(function(){
            if(!this.getDropTargets){
                return;
            }

            t = this.getDropTargets();

            if(_.isEmpty(t)){
                return;
            }

            targets = targets.concat(t);
        });

        return targets;
    },

    validate: function(){
        var valid = true;

        this.items.each(function(i){
            if(!i.hasOwnProperty("dName")){
                return;
            }

            if(!i.isVisible()){
                i.allowBlank = true;
                return;
            }

            if(!i.validate()){
                valid = false;
            }
        });

        return valid;
    },

    getName: function(){
        return this.name;
    }
});

CQ.Ext.reg("multi-field-panel", ExperienceAEM.MultiFieldPanel);

//copy the countries node from /apps/classic-ui-multi-field-panel/sample-multi-field/countries
//to the component instance created in /content eg. /content/geometrixx/en/jcr:content/par/sample-multi-field
ExperienceAEM.fillStates = function () {
    var cValue = this.getValue(),
        panel = this.findParentByType('multi-field-panel'),
        state = panel.getComponent('state');

    state.setValue(null);

    if(_.isEmpty(cValue)){
        return;
    }

    var india = [   { value : "TELANGANA", text : "Telangana"},
                    { value : "ANDHRA", text : "Andhra" }],
        usa = [   { value : "TEXAS", text : "Texas"},
                  { value : "FLORIDA", text : "Florida" } ];

    if(cValue == "INDIA"){
        state.setOptions(india);
    }else if(cValue == "USA"){
        state.setOptions(usa);
    }
};