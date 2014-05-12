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
        'dojo/_base/array',
        'dojox/rpc/Service',
        'dojo/io/script',
        'dojox/data/JsonRestStore',
        'dijit/tree/ForestStoreModel',
        'dojo/dom',
        "dgrid/OnDemandGrid",
        "dojo/data/ObjectStore",
        "dojox/grid/DataGrid",
        "dgrid/Selection",
        "dgrid/extensions/Pagination",
        "dgrid/extensions/ColumnReorder",
        "dgrid/extensions/ColumnHider",
        'dojox/data/ServiceStore',
        'jimu/utils'
    ],
    function (declare, BaseWidget, dojoJson, request, win, Memory, ObjectStoreModel, Tree, JsonRest, ItemFileReadStore, array, RpcService, script, JsonRestStore, ForestStoreModel, dom, OnDemandGrid, ObjectStore, DataGrid, Selection, Pagination, ColumnReorder, ColumnHider, ServiceStore, utils) {

        return declare([BaseWidget], {

            name: 'IntrepidGrid',
            baseClass: 'jimu-widget-intrepid-grid',
            dataGridDiv: null,


            postCreate: function () {
                //console.log('postCreate');
                this.inherited(arguments);
            },

            startup: function () {
                this.inherited(arguments);

                dojo.declare('candc.data.CenterlineStore', dojox.data.ServiceStore, {
                    constructor: function (options) {
                        var mySmd = {
                            "SMDVersion": "2.0",
                            "id": "http://10.1.7.165:8080/pods/api/centerlineBasic/",
                            "description": "This is the service to get to the tree backend data",

                            transport: "JSONP",
                            envelope: "URL",
                            additionalParameters: true,
                            target: "http://10.1.7.165:8080/pods/api/centerlineBasic/",

                            services: {
                                getNode: {
                                    parameters: [
                                        { name: "routeId", type: "string", optional: true }
                                    ]
                                },
                                query: {
                                    parameters: [
                                        { name: "routeId", default: "-777", type: "string", optional: true }
                                    ]
                                }
                            }
                        };
                        var svc = new RpcService(mySmd);
                        this.service = svc.query;

                        // this lets ServiceStore's getLabel(), fetchItemByIdentity(),
                        // etc. all work correctly
                        this.idAttribute = this.labelAttribute = "routeId";
                    },
                    fetch: function (args) {
                        //console.log('fetch...');
                        args = args || {};
                        var rq = {routeId: '465'};
                        args.query = rq;
                        return this.inherited(arguments);
                    },
                    _processResults: function (results, deferred) {
                        /// this should return an object with the items as an array and the total count of
                        // items (maybe more than currently in the result set).
                        // for example:
                        //	| {totalCount:10, items: [{id:1},{id:2}]}

                        // index the results, assigning ids as necessary

                        if (results && typeof results == 'object') {
                            var id = results.__id;
                            if (!id) {// if it hasn't been assigned yet
                                if (this.idAttribute) {
                                    // use the defined id if available
                                    id = results[this.idAttribute];
                                } else {
                                    id = this._currentId++;
                                }
                                if (id !== undefined) {
                                    var existingObj = this._index[id];
                                    if (existingObj) {
                                        for (var j in existingObj) {
                                            delete existingObj[j]; // clear it so we can mixin
                                        }
                                        results = lang.mixin(existingObj, results);
                                    }
                                    results.__id = id;
                                    this._index[id] = results;
                                }
                            }
                            for (var i in results) {
                                results[i] = this._processResults(results[i], deferred).items;
                            }
                            var count = results.length;
                        }
                        //console.log("return: " + JSON.stringify({totalCount: deferred.request.count == count ? (deferred.request.start || 0) + count * this.estimateCountFactor : count, items: results}));
                        return {totalCount: deferred.request.count == count ? (deferred.request.start || 0) + count * this.estimateCountFactor : count, items: results};
                    }
                });

                this.grid = new DataGrid({
                    structure: [
                        {name: 'Event ID', field: 'eventId'},
                        {name: 'Begin Map Station', field: 'beginMapStation'},
                        {name: 'End Map Station', field: 'endMapStation'},
                        {name: 'Absolute Station', field: 'absoluteStation'},
                        {name: 'End Absolute Station', field: 'endAbsoluteStation'},
                        {name: 'Event Type', field: 'eventTypeDesc'},
                        {name: 'Label', field: 'label'}
                    ],
                    store: new candc.data.CenterlineStore(),
                    autoHeight: 20
                }, this.gridContainer);
                this.grid.startup();

                //console.log('startup');
            },

            onOpen: function () {
                //console.log('onOpen');
                this.inherited(arguments);
                if (!this.dataGridDiv) {
                    this.initDiv();
                }
            },

            onClose: function () {
                //console.log('onClose');
            },

            onMinimize: function () {
                //console.log('onMinimize');
            },

            onMaximize: function () {
                //console.log('onMaximize');
            },

            onSignIn: function (credential) {
                //console.log('onSignIn');
            },

            onSignOut: function () {
                //console.log('onSignOut');
            },

            initDiv: function() {
                this.dataGridDiv = domConstruct.create("div");
                domAttr.set(this.dataGridDiv, "id", "dataGridDiv");
                domClass.add(this.dataGridDiv, "candcDataGrid");
                domConstruct.place(this.dataGridDiv, this.domNode);
                this.dataGridDiv.innerHTML = "Loading......";
            }
        });
    })
;