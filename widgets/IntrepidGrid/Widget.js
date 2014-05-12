define([
        'dijit/_WidgetsInTemplateMixin',
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/dom-attr',
        'dojo/dom-class',
        'dojo/dom-construct',
        'dojo/dom-style',
        'dojo/on',
        'dojox/data/ServiceStore',
        'dojox/grid/DataGrid',
        'dojox/rpc/Service',
        'esri/InfoTemplate',
        'esri/layers/FeatureLayer',
        'jimu/BaseWidget'
    ],
    function (_WidgetsInTemplateMixin, declare, lang, domAttr, domClass, domConstruct, domStyle, on, ServiceStore, DataGrid, RpcService, InfoTemplate, FeatureLayer, BaseWidget) {
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

            name: 'IntrepidGrid',
            baseClass: 'jimu-widget-intrepidGrid',
            eventUpdateEnd: [],
            timeSlider: null,
            timeSliderDiv: null,
            loaded: false,

            onOpen: function () {
                this.inherited(arguments);
                if (!this.timeSliderDiv) {
                    this.initDiv(this.config.intrepidUrl);
                }
                if (this.timeSlider) {
                    domStyle.set(this.timeSlider.domNode, "display", "");
                }
                if (!this.loaded) {
                    this.loadLayer();
                }
            },

            onClose: function () {
                if (this.timeSlider) {
                    domStyle.set(this.timeSlider.domNode, "display", "none");
                }
            },

            loadLayer: function () {
                this.loaded = true;
                var json = this.config.intrepidGrid;
                var len = json.layers.length;
                for (var i = 0; i < len; i++) {
                    var layer = this.getLayerFromMap(json.layers[i].url);
                    if (!layer) {
                        if (!json.layers[i].options) {
                            json.layers[i].options = {};
                        }
                        json.layers[i].options.mode = FeatureLayer.MODE_SNAPSHOT;
                        if (json.layers[i].options.infoTemplate) {
                            json.layers[i].options.infoTemplate = new InfoTemplate(json.layers[i].options.infoTemplate);
                        }
                        layer = new FeatureLayer(json.layers[i].url, json.layers[i].options);
                        if (json.layers[i].options && json.layers[i].options.infoTemplate) {
                            layer.setInfoTemplate(new InfoTemplate(json.layers[i].options.infoTemplate));
                        }
                        var eventUpdate = this.own(on(layer, "update-end", lang.hitch(this, this.onUpdateEnd, i)));
                        this.map.addLayer(layer);
                        json.layers[i] = layer;
                        this.addUpdateEvent(i, eventUpdate);
                    } else {
                        json.layers[i] = layer;
                        if (json.layers[i].infoTemplate) {
                            layer.setInfoTemplate(new InfoTemplate(json.layers[i].infoTemplate));
                        }
                        if (layer.mode !== FeatureLayer.MODE_SNAPSHOT) {
                            layer.attr("mode", FeatureLayer.MODE_SNAPSHOT);
                            layer.refresh();
                            var eventUpdate2 = this.own(on(layer, "update-end", lang.hitch(this, this.onUpdateEnd, i)));
                            this.addUpdateEvent(i, eventUpdate2);
                        } else {
                            this.onUpdateEnd(i);
                        }
                    }
                }
            },

            addUpdateEvent: function (i, eventUpdate) {
                this.eventUpdateEnd.push({
                    id: i,
                    event: eventUpdate
                });
            },

            getLayerFromMap: function (url) {
                var ids = this.map.graphicsLayerIds;
                var len = ids.length;
                for (var i = 0; i < len; i++) {
                    var layer = this.map.getLayer(ids[i]);
                    if (layer.url === url) {
                        return layer;
                    }
                }
                return null;
            },

            onUpdateEnd: function (index) {
                var len = this.eventUpdateEnd.length;
                for (var i = 0; i < len; i++) {
                    if (this.eventUpdateEnd[i].id === index) {
                        if (!this.eventUpdateEnd[i].event.length) {
                            this.eventUpdateEnd[i].event.remove();
                        } else {
                            for (var j = 0; j < this.eventUpdateEnd[i].event.length; j++) {
                                this.eventUpdateEnd[i].event[j].remove();
                            }
                        }
                    }
                }
                var sliderParams = this.config.intrepidGrid;
            },

            initDiv: function (url) {
                //console.log('initDiv url: ' + url);
                this.timeSliderDiv = domConstruct.create("div");
                domAttr.set(this.timeSliderDiv, "id", "intrepidGridDiv");
                domClass.add(this.timeSliderDiv, "intrepidGridSlider");
                domConstruct.place(this.timeSliderDiv, this.domNode);
                this.timeSliderDiv.innerHTML = "Loading......";


                dojo.declare('candc.data.CenterlineStore', dojox.data.ServiceStore, {

                    constructor: function () {
                        this.serviceRouteId = 0;
                        var mySmd = {
                            "SMDVersion": "2.0",
                            "id": url + "pods/api/centerlineBasic/",
                            "description": "This is the service to get the tree backend data",

                            transport: "JSONP",
                            envelope: "URL",
                            additionalParameters: true,
                            target: url + "pods/api/",
                            parameters: [
                                { name: "routeId", optional: false }
                            ],

                            services: {
                                query: {
                                    target: 'centerlineBasic'
                                }
                            }
                        };
                        var svc = new RpcService(mySmd);
                        this.service = svc.query;

                        // this lets ServiceStore's getLabel(), fetchItemByIdentity(),
                        // etc. all work correctly
                        this.idAttribute = this.labelAttribute = "routeId";
                    },

                    fetch: function (request) {
                        //console.log('fetch request (1): ' + JSON.stringify(request));
                        var routeIdForQuery = this.xxx || 0;
                        this.lastRoute = this.lastRoute || -333;
                        var rq = dojo.mixin({}, request.query);
                        rq.routeId = this.serviceRouteId;
                        //console.log('fetch request (3): ' + JSON.stringify(request));
                        request.query = rq;
                        return this.inherited(arguments);
                    },

                    getServiceRouteId: function () {
                        return this.serviceRouteId;
                    },

                    setServiceRouteId: function (x) {
                        this.serviceRouteId = x;
                        return x;
                    },

                    _processResults: function (results, deferred) {
                        /// this should return an object with the items as an array and the total count of
                        // items (maybe more than currently in the result set).
                        // for example:
                        //  | {totalCount:10, items: [{id:1},{id:2}]}

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
                    autoHeight: 5
                }, this.timeSliderDiv);
                //this.grid.placeAt(this.gridContainer);
                this.grid.startup();
            },

            onReceiveData: function (name, widgetId, data) {
                //console.log(name);
                //console.log(widgetId);
                if (name === "Intrepid") {
                    //console.log("received data!");
                    this.grid.store.setServiceRouteId(data);
                    this.grid.render();
                }
            }
        });
        return clazz;
    });
