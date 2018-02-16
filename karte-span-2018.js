/*jslint browser: true*/
/*global $,L*/

var mapboxTiles = 'https://{s}.tiles.mapbox.com/v4/tursics.l7ad5ee8/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidHVyc2ljcyIsImEiOiI1UWlEY3RNIn0.U9sg8F_23xWXLn4QdfZeqg',
	map = null;

// -----------------------------------------------------------------------------

function formatNumber(txt) {
	'use strict';

	txt = String(parseInt(txt, 10));
	var sign = '',
		pos = 0;
	if (txt[0] === '-') {
		sign = '-';
		txt = txt.slice(1);
	}

	pos = txt.length;
	while (pos > 3) {
		pos -= 3;
		txt = txt.slice(0, pos) + '.' + txt.slice(pos);
	}

	return sign + txt;
}

// -----------------------------------------------------------------------------

var hover = {
	layerPopup: null,

	initUI: function () {
		'use strict';
	},

	show: function (coordinates, data, format, icon) {
		'use strict';

		var options = {
			closeButton: false,
			offset: L.point(0, -32),
			className: 'printerLabel'
		},
			str = '';

		str += '<div class="top ' + icon.options.markerColor + '">' + data.Name + '</div>';
		str += '<div class="middle">€' + formatNumber(data.Ausgaben2018) + '</div>';
		str += '<div class="bottom ' + icon.options.markerColor + '">' + 'Ausgaben für 2018' + '</div>';

		this.layerPopup = L.popup(options)
			.setLatLng(coordinates)
			.setContent(str)
			.openOn(map);
	},

	hide: function () {
		'use strict';

		if (this.layerPopup && map) {
			map.closePopup(this.layerPopup);
			this.layerPopup = null;
		}
	}
};

// -----------------------------------------------------------------------------

var info = {
	templateHeader: '<div id="receiptBox">' +
		'<div id="receiptClose"><i class="fa fa-close" aria-hidden="true"></i></div>' +
		'<div id="receipt" class="normal">' +
		'<div class="full center bold" id="recName"></div>' +
		'<div class="full center" id="recSchulform"></div>',
	templateItem: '<br>' +
		'<div class="full bold"><span id="recBautyp"></span></div>' +
		'<div class="sub">Zuständigkeit: <span id="recZustaendigkeit"></span></div>' +
		'<div class="sub autocomplete-selected"><span class="half">Gebäudescan 2015</span><span class="number"><span id="recScan2015"></span> €</span></div>' +
		'<div class="sub autocomplete-selected"><span class="half">Bestätigte Projektkosten</span><span class="number"><span id="recProjektkosten"></span> €</span></div>' +
		'<div class="sub autocomplete-selected"><span class="half">Ausgaben bisher (16/17)</span><span class="number"><span id="recAusgabenAb2016"></span> €</span></div>' +

		'<div class="sub"><span class="half">Ausgaben 2018</span><span class="number"><span id="recAusgaben2018"></span> €</span></div>' +
		'<div class="sub"><span class="half">Ausgaben 2019</span><span class="number"><span id="recAusgaben2019"></span> €</span></div>' +
		'<div class="sub"><span class="half">Ausgaben 2020</span><span class="number"><span id="recAusgaben2020"></span> €</span></div>' +
		'<div class="sub"><span class="half">Ausgaben 2021</span><span class="number"><span id="recAusgaben2021"></span> €</span></div>' +
		'<div class="sub"><span class="half">Ausgaben 2022 und später</span><span class="number"><span id="recAusgaben2022ff"></span> €</span></div>' +
		'<div class="sub"><span id="recBemerkungen"></span></div>',
	templateFooter: '</div>' +
		'</div>',
	initUI: function () {
		'use strict';

		var str = this.templateHeader;
		str += '<div id="dom"></div>';
		str += this.templateFooter;
		$('#pageMap').append(str);

		$('#receipt .group').on('click', function () {
			$(this).toggleClass('groupClosed');
		});
		$('#receiptClose').on('click', this.hide);
	},

	init: function (data) {
		'use strict';

		$('#receiptBox #receipt').html(data.info.body.join("\n"));
	},

	show: function () {
		'use strict';

		$('#receiptBox').css('display', 'block');
	},

	hide: function () {
		'use strict';

		$('#receiptBox').css('display', 'none');
	},

	update: function (data) {
		'use strict';

		function setText(key, txt) {
			var item = $('#rec' + key);

			if (item.parent().hasClass('number')) {
				txt = formatNumber(txt);
			} else if (item.parent().hasClass('boolean')) {
				txt = (txt === 1 ? 'ja' : 'nein');
			}

			item.text(txt);
		}
		function setTextWithDOM(root, key, txt) {
			var item = $('#rec' + key, root);

			if (item.parent().hasClass('number')) {
				txt = formatNumber(txt);
			} else if (item.parent().hasClass('boolean')) {
				txt = (txt === 1 ? 'ja' : 'nein');
			}

			item.text(txt);
		}

		var key,
			item,
			itemObj,
			dom,
			date = new Date(),
			dateD = date.getDate(),
			dateM = date.getMonth() + 1,
			dateY = date.getFullYear(),
			dateH = date.getHours(),
			dateMin = date.getMinutes();

		if (dateD < 10) {
			dateD = '0' + dateD;
		}
		if (dateM < 10) {
			dateM = '0' + dateM;
		}
		if (dateH < 10) {
			dateH = '0' + dateH;
		}
		if (dateMin < 10) {
			dateMin = '0' + dateMin;
		}
		setText('Now', dateD + '.' + dateM + '.' + dateY + ' ' + dateH + ':' + dateMin);

		$('#dom').html('');

		for (key in data) {
			if (data.hasOwnProperty(key)) {
				setText(key, data[key]);
			}
		}

		for (itemObj in dataObj.data) {
			item = dataObj.data[itemObj];
			if (item.BSN === data.BSN) {
				dom = $.parseHTML(this.templateItem);

				for (key in item) {
					if (item.hasOwnProperty(key)) {
						setTextWithDOM(dom, key, item[key]);
					}
				}

				$('#dom').append(dom);
			}
		}

		this.show();
	}
};

// -----------------------------------------------------------------------------

var marker = {
	layerGroup: null,
	cityData: null,

	initUI: function () {
		'use strict';
	},

	show: function (data, cityData) {
		'use strict';

		try {
			this.cityData = cityData;

			this.layerGroup = L.featureGroup([]);
			this.layerGroup.addTo(map);

			this.layerGroup.addEventListener('click', function (evt) {
				info.update(evt.layer.options.data);
			});
			this.layerGroup.addEventListener('mouseover', function (evt) {
				hover.show([evt.latlng.lat, evt.latlng.lng], evt.layer.options.data, evt.layer.options.format, evt.layer.options.icon);
			});
			this.layerGroup.addEventListener('mouseout', function (evt) {
				hover.hide(evt.layer.options.data);
			});

			var that = this,
				buildings = [];

			$.each(data, function (key, val) {
				if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined') && val.lat && val.lng) {
					if (-1 === buildings.indexOf(val.BSN)) {
						buildings.push(val.BSN);

						var marker = L.marker([parseFloat(val.lat), parseFloat(val.lng)], {
								data: val,
								format: cityData.printerlabel,
								icon: L.AwesomeMarkers.icon({
									icon: 'fa-building-o',
									prefix: 'fa',
									markerColor: 'blue'
								})
							});
						that.layerGroup.addLayer(marker);
					}
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

var dataObj = {

	data: [],

	initUI: function () {
		'use strict';
	},

	loadData: function () {
		'use strict';

		var cityData = {
			printerlabel: 'printerlabel'
		},
			that = this;

		that.data = [];

		$.ajax({
			url: 'data/gebaeudescan2018-span.json',
			dataType: 'json',
			mimeType: 'application/json',
			success: function (data) {
				that.data = data;
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

		dataObj.loadData();
	}
}

// -----------------------------------------------------------------------------

$(document).on("pageshow", "#pageMap", function () {
	'use strict';

	initMap('mapContainer', 52.534982, 13.200651, 16);

	marker.initUI();
	hover.initUI();
	info.initUI();
	dataObj.initUI();
});

// -----------------------------------------------------------------------------
