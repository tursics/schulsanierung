/*jslint browser: true*/
/*global $,L*/

var mapboxTiles = 'https://{s}.tiles.mapbox.com/v4/tursics.l7ad5ee8/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidHVyc2ljcyIsImEiOiI1UWlEY3RNIn0.U9sg8F_23xWXLn4QdfZeqg',
	map = null;

// -----------------------------------------------------------------------------

var marker = {
	layerGroup: null,
	cityData: null,

	show: function (data, cityData) {
		'use strict';

		try {
			this.cityData = cityData;

			this.layerGroup = L.featureGroup([]);
			this.layerGroup.addTo(map);

			this.layerGroup.addEventListener('click', function (evt) {
				// clicked on a layer
				// data stored in evt.layer.options.data
			});
			this.layerGroup.addEventListener('mouseover', function (evt) {
				// hover a marker
				// data stored in evt.latlng.lat and evt.latlng.lng
				//                evt.layer.options.data
			});
			this.layerGroup.addEventListener('mouseout', function (evt) {
				// end hover a marker
				// data stored in evt.layer.options.data
			});

			var that = this;
			$.each(data, function (key, val) {
				if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined') && val.lat && val.lng) {
					var marker = L.marker([parseFloat(val.lat), parseFloat(val.lng)], {
							data: val,
							format: cityData.printerlabel,
							icon: L.AwesomeMarkers.icon({
								icon: val[cityData.marker.icon],
								prefix: 'fa',
								markerColor: val[cityData.marker.color]
							})
						});
					that.layerGroup.addLayer(marker);
				}
			});
		} catch (e) {
//			console.log(e);
		}
	},

	hide: function () {
		'use strict';

		try {
			if (this.layerGroup) {
				map.removeLayer(this.layerGroup);
				this.layerGroup = null;
			}
		} catch (e) {
//			console.log(e);
		}
	}
};

//-----------------------------------------------------------------------------

var data = {

	initUI: function () {
		'use strict';
	},

	loadData: function () {
		'use strict';

		var cityData = {
			printerlabel: 'printerlabel',
			marker: 'marker'
		};

		$.ajax({
			url: 'data/gebaeudescan2018-span.json',
			dataType: 'json',
			mimeType: 'application/json',
			success: function (data) {
				marker.show(data, cityData);
			}
		});
	}

};

// -----------------------------------------------------------------------------

function initMap(elementName, lat, lng, zoom) {
	'use strict';

	if (null === map) {
		var layer = L.tileLayer(mapboxTiles, {
				attribution: '<a href="http://www.openstreetmap.org" target="_blank">OpenStreetMap-Mitwirkende</a>, <a href="https://www.mapbox.com" target="_blank">Mapbox</a>'
			});

		map = L.map(elementName, {zoomControl: false, scrollWheelZoom: true})
			.addLayer(layer)
			.setView([lat, lng], zoom);

		map.addControl(L.control.zoom({ position: 'bottomright'}));

		data.loadData();
	}
}

// -----------------------------------------------------------------------------

$(document).on("pageshow", "#pageMap", function () {
	'use strict';

	initMap('mapContainer', 52.534982, 13.200651, 16);

	data.initUI();
});

// -----------------------------------------------------------------------------
