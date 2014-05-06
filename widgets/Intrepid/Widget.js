/*jshint bitwise:true, curly:true, eqeqeq:true, forin:true, immed:true, latedef:true, noarg:true, noempty:true, nonew:true, plusplus:true, regexp:true, undef:true, strict:true, browser:true, node:true */

/*global console */

define([
        'dojo/_base/declare',
        'jimu/BaseWidget',
        "dojo/_base/json",
        "dojo/request",
        'dojo/_base/window',
        'dojo/store/Memory',
        'dijit/tree/ObjectStoreModel',
        'dijit/Tree',
        'dojo/store/JsonRest',
        'dojo/data/ItemFileReadStore',
        'dojox/rpc/Service',
        'dojox/data/JsonRestStore',
        'dijit/tree/ForestStoreModel',
        'dojo/dom'
    ],
    function (declare, BaseWidget, dojoJson, request, win, Memory, ObjectStoreModel, Tree, JsonRest, ItemFileReadStore, RpcService, JsonRestStore, ForestStoreModel, dom) {

        // http://dojotoolkit.org/reference-guide/1.8/dijit/Tree.html
        // https://www.ibm.com/developerworks/library/wa-lazyload/
        // http://stackoverflow.com/questions/10829972/dojo-jsonrest-store-and-dijit-tree

        //To create a widget, you need to derive from BaseWidget.


        var clazz = declare([BaseWidget], {
            // DemoWidget code goes here

            //please note that this property is be set by the framework when widget is loaded.
            //templateString: template,

            baseClass: 'jimu-widget-intrepidHierarchy',

            name: 'IntrepidHierarchy',

            postCreate: function () {
                console.log('postCreate');
                this.inherited(arguments);
            },

            startup: function () {
                this.inherited(arguments);

                /*this.mapIdNode.innerHTML = 'map id:' + this.map.id;
                this.contentNode.innerHTML = dojo.version;*/

                dojo.declare('my.ForestStoreModel', dijit.tree.ForestStoreModel, {
                    onSetItem: function (item, attribute, oldValue, newValue) {
                        //console.log('onSetItem y');
                        //this._requeryTop();
                        //this.inherited(arguments);
                        // https://bugs.dojotoolkit.org/ticket/14552
                        dijit.tree.TreeStoreModel.prototype.onSetItem.apply(this, arguments);
                    }
                });

                var me = this;
                var myStore = me._init(this.config.intrepidUrl);
                this.routeSelected = null;

                this.treeModel = new my.ForestStoreModel({
                    store: myStore,
                    deferItemLoadingUntilExpand: true,
                    childrenAttrs: ["children"],
                    query: '-1'
                });

                this.tree = new Tree({
                    model: this.treeModel,
                    id: "myTree",
                    showRoot: false,
                    persist: false,
                    onClick: function (item) {
                        me._treeClick(item);
                    }
                });
                this.tree.placeAt(this.treeContainer);
                this.tree.startup();

                console.log('startup');
            },

            onOpen: function () {
                console.log('onOpen');
            },

            onClose: function () {
                console.log('onClose');
            },

            onMinimize: function () {
                console.log('onMinimize');
            },

            onMaximize: function () {
                console.log('onMaximize');
            },

            onSignIn: function (credential) {
                console.log('onSignIn');
            },

            onSignOut: function () {
                console.log('onSignOut');
            },

            _init: function (url) {
                console.log("Url: " + url);
                var mySmd = {
                    "SMDVersion": "2.0",
                    "id": url + "pods/api/test/",
                    "description": "This is the service to get to the tree backend data",

                    transport: "JSONP",
                    envelope: "URL",
                    additionalParameters: true,
                    //target: "http://10.1.7.165:8080/",
                    target: url,

                    services: {
                        "getNode": {
                            "target": "pods/api/test/",
                            parameters: [
                                { name: "id", type: "string"}
                            ]
                        }
                    }
                };

                var myService = new RpcService(mySmd);

                return new JsonRestStore({
                    service: myService.getNode,
                    idAttribute: "id",
                    labelAttribute: "name"
                });

                //create forestTreeModel; needed b/c we may have many items at 'top'
                /*var treeModelParams = {
                 store: myStore,
                 deferItemLoadingUntilExpand: true,
                 childrenAttrs: ["children"],
                 query: '-1',
                 onSetItem: function (item, attribute, oldValue, newValue) {
                 console.log('onSetItem x');
                 this._requeryTop();
                 this.inherited(arguments);
                 }
                 };*/
            },

            onReceiveData: function (name, widgetId, data) {
                if (name == "IntrepidGrid") {
                    if (this.routeSelected) {
                        this.publishData(this.routeSelected, false);
                    }
                }
            },

            _treeClick: function (item) {
                console.log('clicked: ' + JSON.stringify(item.id));
                if (item.routeId) {
                    this.routeSelected = item.routeId;
                    console.log('clicked with routeId: ' + this.routeSelected);
                    this.publishData(this.routeSelected, false);
                }
            }
        });

        return clazz;
    });