/* schulsanierung.tursics.de - JavaScript file */

/*jslint browser: true*/
/*global $,L*/

var map = null;
var dataGermany = null;

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

var printerLabel = {
	layerPopup: null,

	show: function (coordinates, data, format, icon) {
		'use strict';

		var options = {
			closeButton: false,
			offset: L.point(0, -32),
			className: 'printerLabel'
		},
			str = '';

		str += '<div class="top ' + icon.options.markerColor + '">' + data[format.top] + '</div>';
		str += '<div class="middle">€' + formatNumber(data[format.middle]) + '</div>';
		str += '<div class="bottom ' + icon.options.markerColor + '">' + data[format.bottom] + '</div>';

		this.layerPopup = L.popup(options)
			.setLatLng(coordinates)
			.setContent(str)
			.openOn(map);
	},

	hide: function (data) {
		'use strict';

		if (this.layerPopup && map) {
			map.closePopup(this.layerPopup);
			this.layerPopup = null;
		}
	}
};

// -----------------------------------------------------------------------------

var receipt = {
	initUI: function () {
		'use strict';

		$('#receipt .group').on('click', function (e) {
			$(this).toggleClass('groupClosed');
		});
		$('#receiptClose').on('click', this.hide);
	},

	init: function (data) {
		'use strict';

		$('#receiptBox #receipt').html(data.receipt.body.join("\n"));
		$('#receiptInfo').css('display', data.receipt.info ? 'block' : 'none');
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

		var key;

		for (key in data) {
			if (data.hasOwnProperty(key)) {
				setText(key, data[key]);
			}
		}

		this.show();
	}
};

// -----------------------------------------------------------------------------

var marker = {
	layerGroup: null,

	show: function (data, cityData) {
		'use strict';

		try {
			this.layerGroup = L.featureGroup([]);
			this.layerGroup.addTo(map);

			this.layerGroup.addEventListener('click', function (evt) {
				receipt.update(evt.layer.options.data);
			});
			this.layerGroup.addEventListener('mouseover', function (evt) {
				printerLabel.show([evt.latlng.lat, evt.latlng.lng], evt.layer.options.data, evt.layer.options.format, evt.layer.options.icon);
			});
			this.layerGroup.addEventListener('mouseout', function (evt) {
				printerLabel.hide(evt.layer.options.data);
			});

			var that = this;
			$.each(data, function (key, val) {
				if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
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
	},

	select: function (selection) {
		'use strict';

		$.each(this.layerGroup._layers, function (key, val) {
			if (val.options.data.Schulnummer === selection) {
				map.panTo(new L.LatLng(val.options.data.lat, val.options.data.lng));
				receipt.update(val.options.data);
			}
		});
	}
};

//-----------------------------------------------------------------------------

var data = {
	initUI: function () {
		'use strict';

		var that = this;
		$('#searchBox .module select').on('change', function (e) {
			that.loadCity($('#searchBox .module select').val());
		});
	},

	loadGermany: function () {
		'use strict';

		var that = this;

		$.ajax({
			url: 'data/germany.json',
			dataType: 'json',
			mimeType: 'application/json',
			success: function (data) {
				that.initGermany(data);
			}
		});
	},

	initGermany: function (data) {
		'use strict';

		dataGermany = data;

		try {
			var str = '';

			str += '<option selected disabled value="-">Wähle eine Stadt aus</option>';

			$.each(dataGermany, function (key, val) {
				str += '<option value="' + val.key + '">' + val.title + '</option>';
			});

			$('#searchBox .module select').html(str).val('-').change();
			$('#searchBox .module').css('opacity', 1);
		} catch (e) {
//			console.log(e);
		}
	},

	loadCity: function (cityKey) {
		'use strict';

		try {
			var city = null,
				that = this;

			$.each(dataGermany, function (key, val) {
				if (val.key === cityKey) {
					city = val;
				}
			});

			if (city) {
				receipt.hide();
				marker.hide();
//				removeSearchBox();
				map.setView(new L.LatLng(city.lat, city.lng), city.zoom, {animation: true});

				$.ajax({
					url: 'data/' + city.data + '-config.json',
					dataType: 'json',
					mimeType: 'application/json',
					success: function (data) {
						that.initCity(city, data);
					}
				});
			}
		} catch (e) {
//			console.log(e);
		}
	},

	initCity: function (city, cityData) {
		'use strict';

		receipt.init(cityData);

		$.ajax({
			url: 'data/' + city.data + '.json',
			dataType: 'json',
			mimeType: 'application/json',
			success: function (data) {
				marker.show(data, cityData);
//				initSearchBox(data);
			}
		});
	}
};

//-----------------------------------------------------------------------------

function initSearchBox(data) {
	'use strict';

	var schools = [];

	try {
		$.each(data, function (key, val) {
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				var name = val.Schulname, color = 'gray';
				if ('' !== val.Schulnummer) {
					name += ' (' + val.Schulnummer + ')';
				}
				color = ((val.Schulart === 'Bezirk') || (val.Schulart === 'Stadt') ? 'gray' :
								val.costs >= 10000000 ? 'red' :
										val.costs >= 5000000 ? 'orange' :
												val.costs >= 1000 ? 'blue' :
														'green');
				schools.push({ value: name, data: val.Schulnummer, color: color, desc: val.Schulart });
			}
		});
	} catch (e) {
//		console.log(e);
	}

	schools.sort(function (a, b) {
		if (a.value === b.value) {
			return a.data > b.data ? 1 : -1;
		}

		return a.value > b.value ? 1 : -1;
	});

	$('#autocomplete').focus(function () {
		window.scrollTo(0, 0);
		document.body.scrollTop = 0;
		$('#pageMap').animate({
			scrollTop: parseInt(0, 10)
		}, 500);
	});
	$('#autocomplete').autocomplete({
		lookup: schools,
		onSelect: function (suggestion) {
			marker.select(suggestion.data);
		},
		formatResult: function (suggestion, currentValue) {
			var color = suggestion.color,
				icon  = 'fa-building-o',
				str = '';

			str += '<div class="autocomplete-icon back' + color + '"><i class="fa ' + icon + '" aria-hidden="true"></i></div>';
			str += '<div>' + suggestion.value.replace(new RegExp(currentValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'gi'), '<strong>' + currentValue + '</strong>') + '</div>';
			str += '<div class="' + color + '">' + suggestion.desc + '</div>';
			return str;
		},
		showNoSuggestionNotice: true,
		noSuggestionNotice: '<i class="fa fa-info-circle" aria-hidden="true"></i> Gebe den Namen einer Schule ein'
	});
}

// -----------------------------------------------------------------------------

var ControlInfo = L.Control.extend({
	options: {
		position: 'bottomright'
	},

	onAdd: function (map) {
		'use strict';

		var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

		container.innerHTML = '<a style="font-size:1.2em" href="#popupShare" title="Teilen" data-rel="popup" data-position-to="window" data-transition="pop"><i class="fa fa-share-alt" aria-hidden="true"></i></a>';
//		container.innerHTML += '<a style="font-size:1.2em" href="#popupInfo" title="Info" data-rel="popup" data-position-to="window" data-transition="pop"><i class="fa fa-info" aria-hidden="true"></i></a>';

		return container;
	}
});

// -----------------------------------------------------------------------------

function initMap(elementName, lat, lng, zoom) {
	'use strict';

	if (null === map) {
		var mapboxToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiI1UWlEY3RNIn0.U9sg8F_23xWXLn4QdfZeqg',
			mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v4/tursics.l7ad5ee8/{z}/{x}/{y}.png?access_token=' + mapboxToken, {
				attribution: '<a href="http://www.openstreetmap.org" target="_blank">OpenStreetMap-Mitwirkende</a>, <a href="https://www.mapbox.com" target="_blank">Mapbox</a>'
			});

		map = L.map(elementName, {zoomControl: false, scrollWheelZoom: true})
			.addLayer(mapboxTiles)
			.setView([lat, lng], zoom);

		map.addControl(L.control.zoom({ position: 'bottomright'}));
		map.addControl(new ControlInfo());

		data.loadGermany();
	}
}

// -----------------------------------------------------------------------------

$(document).on("pageshow", "#pageMap", function () {
	'use strict';

	function updateEmbedURI() {
		var size = $('#selectEmbedSize').val().split('x'),
			x = size[0],
			y = size[1],
			html = '<iframe src="https://tursics.github.io/schulsanierung/karte-deutschland.html" width="' + x + '" height="' + y + '" frameborder="0" style="border:0" allowfullscreen></iframe>';

		$('#inputEmbedURI').val(html);
		if (-1 === $('#embedMap iframe')[0].outerHTML.indexOf('width="' + x + '"')) {
			$('#embedMap iframe')[0].outerHTML = html.replace('.html"', '.html?foo=' + (new Date().getTime()) + '"');
			$('#embedMap input').focus().select();
		}
	}

	// center of Germany
	initMap('mapContainer', 51.220915, 9.357579, 6);

	receipt.initUI();
	data.initUI();

	$('#autocomplete').val('');

	$("#popupShare").on('popupafteropen', function (e, ui) {
		$('#shareLink input').focus().select();
	});
	$('#tabShareLink').on('click', function (e) {
		$('#popupShare').popup('reposition', 'positionTo: window');
		$('#shareLink input').focus().select();
	});
	$('#tabEmbedMap').on('click', function (e) {
		updateEmbedURI();
		$('#popupShare').popup('reposition', 'positionTo: window');
		$('#embedMap input').focus().select();
	});

	$('#selectEmbedSize').val('400x300').selectmenu('refresh');
	$('#selectEmbedSize').on('change', function (e) {
		updateEmbedURI();
		$('#popupShare').popup('reposition', 'positionTo: window');
	});
});

// -----------------------------------------------------------------------------
