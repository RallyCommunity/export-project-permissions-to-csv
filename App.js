Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
     items: [
        {
            xtype: 'container',
            itemId: 'exportBtn'
        },
        {
            xtype: 'container',
            itemId: 'gridContainer'
        }
    ],
    launch: function() {
        this._myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Please wait.This may take long depending on the size of your data..."});
        this._myMask.show();
        Ext.create('Rally.data.wsapi.Store',{
            model: 'ProjectPermission',
            autoLoad: true,
            remoteSort: false,
            fetch:['User','Role','Name', 'Project','UserName','SubscriptionAdmin','Workspace', 'c_EmployeeID'],
            limit: Infinity,
            listeners: {
                load: this._onDataLoaded,
                scope:this
            }
   	});
   },
   
   _onDataLoaded:function(store,results) {
        var permissions = [];
        _.remove(results, function(result){
            return result.get('User').SubscriptionAdmin === true ;
        });
        
        _.each(results, function(result){
            if (result.get('User').UserName) {
                var permission  = {
                    User: result.get('User').UserName,
                    Project: result.get('Project')._refObjectName,
                    Role: result.get('Role'),
                    ID: result.get('User')._refObjectName.slice(0,2).toUpperCase() + '' + (result.get('User').c_EmployeeID ? result.get('User').c_EmployeeID : '000')
                };
            permissions.push(permission);
            }
            
        });
       
        this._makeGrid(permissions);
    },
    
    _makeGrid:function(permissions){
        this._myMask.hide();
        var store = Ext.create('Rally.data.custom.Store', {
            data: permissions  
        });
        this._permissions = permissions;
        this._grid = Ext.create('Rally.ui.grid.Grid',{
            itemId: 'permissionsGrid',
            store: store,
            columnCfgs: [
                {
                   text: 'User', dataIndex: 'User',minWidth: 200
                },
                {
                    text: 'Role', dataIndex: 'Role'
                },
                {
                    text: 'Project', dataIndex: 'Project',minWidth: 200
                },
                {
                    text: 'EmployeeID', dataIndex: 'ID'
                }
                
            ]
        });
        this.down('#gridContainer').add(this._grid);
         this.down('#exportBtn').add({
            xtype: 'rallybutton',
            text: 'Export to CSV',
            handler: this._onClickExport,
            scope: this
        });
    },
    _onClickExport:function(){
        var data = this._getCSV();
        window.location = 'data:text/csv;charset=utf8,' + encodeURIComponent(data);
    },
    
    _getCSV: function () {
        
        var cols    = this._grid.columns;
        var store   = this._grid.store;
        var data = '';

        
        _.each(cols, function(col, index) {
                data += this._getFieldTextAndEscape(col.text) + ',';
        },this);
        
        data += "\r\n";
        _.each(this._permissions, function(record) {
            _.each(cols, function(col, index) {
                var text = '';
                var fieldName   = col.dataIndex;
                if (fieldName === 'ID') {
                    text = record[fieldName] + '-000'; //example how to modify how data is shown in csv
                }
                else{
                    text = record[fieldName];
                }
                
                data += this._getFieldTextAndEscape(text) + ',';

            },this);
            data += "\r\n";
        },this);

        return data;
    },
    _getFieldTextAndEscape: function(fieldData) {
        var string  = this._getFieldText(fieldData);  
        return this._escapeForCSV(string);
    },
    _getFieldText: function(fieldData) {
        var text;
        if (fieldData === null || fieldData === undefined || !fieldData.match) {
            text = '';
        } else if (fieldData._refObjectName) {
            text = fieldData._refObjectName;
        }else {
            text = fieldData;
        }

        return text;
    },
     _escapeForCSV: function(string) {
        if (string.match(/,/)) {
            if (!string.match(/"/)) {
                string = '"' + string + '"';
            } else {
                string = string.replace(/,/g, ''); 
            }
        }
        return string;
    }
});
