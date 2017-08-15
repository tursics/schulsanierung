/* schulsanierung.tursics.de - JavaScript file */

/*jslint browser: true*/
/*global $,L*/

var map = null;
var layerPopup = null;
var layerGroup = null;
var maxVal = 0;
var dataGermany = null;

// -----------------------------------------------------------------------------

String.prototype.startsWith = String.prototype.startsWith || function (prefix) {
	'use strict';

	return this.indexOf(prefix) === 0;
};

// -----------------------------------------------------------------------------

function mapAction() {
	'use strict';
}

// -----------------------------------------------------------------------------

function fixEuro(item) {
	'use strict';

	if (item === '') {
		return 0;
	} else if (item === null) {
		return 0;
	} else if ('undefined' === typeof item) {
		return 0;
	} else if ('number' === typeof item) {
		return item;
	} else if ('T€' === item.substring(item.length - 2)) {
		return parseInt(item.substring(0, item.length - 2).replace('.', '').replace(',', '.'), 10) * 1000;
	}
	return item;
}

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

function updateMapSelectItem(data) {
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

	mapAction();

	var key, item, costs, moneyPot = 0;

	for (key in data) {
		setText(key, data[key]);
	}

	setText('PrioritaetGesamt', (data.Prio === 0 ? '' : (data.Prio === 1 ? 'Höchste Priorität' : (data.costs >= 5000000 ? 'Priorität 2 oder 3' : 'unbekannte Priorität'))));

	if (moneyPot > 0) {
		$('#iPlanung').html('<br>In den Jahren 2015 bis 2019 werden über ' + formatNumber(moneyPot) + ' Euro ' + ((data.Schulart === 'Bezirk') || (data.Schulart === 'Stadt') ? 'in die Schulen' : 'in diese Schule') + ' investiert.' + (data.costs > 0 ? ' Trotz dieser Summe bleibt immer noch ein Sanierungsbedarf von ' + formatNumber(data.costs) + ' Euro.' : ' Danach ist sie vollständig saniert.'));
	} else {
		$('#iPlanung').html('<br>Diese Schule hat einen Sanierungsbedarf von ' + formatNumber(data.costs) + ' Euro.');
	}

	$('.priceBox').removeClass('priceRed').removeClass('priceOrange').removeClass('priceBlue').removeClass('priceGreen').removeClass('priceGray')
		.addClass((data.Schulart === 'Bezirk') || (data.Schulart === 'Stadt') ? 'priceGray' :
								data.costs >= 10000000 ? 'priceRed' :
										data.costs >= 5000000 ? 'priceOrange' :
												data.costs >= 1000 ? 'priceBlue' :
														'priceGreen');
	$('#receiptBox').css('display', 'block');

	if ((data.Schulart === 'Bezirk') || (data.Schulart === 'Stadt')) {
		$('.priceTriangle div:nth-child(1)').css('margin-left', parseInt(150, 10) + '%');
	} else if (data.costs >= 10000000) {
		$('.priceTriangle div:nth-child(1)').css('margin-left', parseInt(25 - (data.costs - 10000000) * 22 / (maxVal - 10000000), 10) + '%');
		$('.priceTriangle div:nth-child(2)').addClass('priceRed').removeClass('priceOrange').removeClass('priceBlue').removeClass('priceGreen');
	} else if (data.costs >= 5000000) {
		$('.priceTriangle div:nth-child(1)').css('margin-left', parseInt(50 - (data.costs - 5000000) * 25 / 5000000, 10) + '%');
		$('.priceTriangle div:nth-child(2)').removeClass('priceRed').addClass('priceOrange').removeClass('priceBlue').removeClass('priceGreen');
	} else if (data.costs >= 1000) {
		$('.priceTriangle div:nth-child(1)').css('margin-left', parseInt(75 - (data.costs - 1000) * 25 / 5000000, 10) + '%');
		$('.priceTriangle div:nth-child(2)').removeClass('priceRed').removeClass('priceOrange').addClass('priceBlue').removeClass('priceGreen');
	} else {
		$('.priceTriangle div:nth-child(1)').css('margin-left', parseInt(87.5, 10) + '%');
		$('.priceTriangle div:nth-child(2)').removeClass('priceRed').removeClass('priceOrange').removeClass('priceBlue').addClass('priceGreen');
	}
}

// -----------------------------------------------------------------------------

function updateMapHoverItem(coordinates, data, icon) {
	'use strict';

	var options = {
		closeButton: false,
		offset: L.point(0, -32),
		className: 'printerLabel'
	},
		str = '';

	str += '<div class="top ' + icon.options.markerColor + '">' + data.Schulname + '</div>';
	str += '<div class="middle">€' + formatNumber(data.costs) + '</div>';
	str += '<div class="bottom ' + icon.options.markerColor + '">' + (data.Prio === 1 ? 'Höchste Priorität' : (data.costs >= 5000000 ? 'Prio 2 oder 3' : 'unbekannte Prio')) + '</div>';

	layerPopup = L.popup(options)
		.setLatLng(coordinates)
		.setContent(str)
		.openOn(map);
}

// -----------------------------------------------------------------------------

function updateMapVoidItem(data) {
	'use strict';

	if (layerPopup && map) {
		map.closePopup(layerPopup);
		layerPopup = null;
    }
}

// -----------------------------------------------------------------------------

function createMarkers(data) {
	'use strict';

	try {
		var markerBlue = L.AwesomeMarkers.icon({
			icon: 'fa-building-o',
			prefix: 'fa',
			markerColor: 'blue'
		}),
			markerOrange = L.AwesomeMarkers.icon({
				icon: 'fa-building-o',
				prefix: 'fa',
				markerColor: 'orange'
			}),
			markerGreen = L.AwesomeMarkers.icon({
				icon: 'fa-building-o',
				prefix: 'fa',
				markerColor: 'green'
			}),
			markerRed = L.AwesomeMarkers.icon({
				icon: 'fa-building-o',
				prefix: 'fa',
				markerColor: 'red'
			}),
			minVal = 100000000;

		layerGroup = L.featureGroup([]);
		layerGroup.addTo(map);

		layerGroup.addEventListener('click', function (evt) {
			updateMapSelectItem(evt.layer.options.data);
		});
		layerGroup.addEventListener('mouseover', function (evt) {
			updateMapHoverItem([evt.latlng.lat, evt.latlng.lng], evt.layer.options.data, evt.layer.options.icon);
		});
		layerGroup.addEventListener('mouseout', function (evt) {
			updateMapVoidItem(evt.layer.options.data);
		});

		$.each(data, function (key, val) {
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				var marker = L.marker([parseFloat(val.lat), parseFloat(val.lng)], {
						data: val,
						icon: val.color === 'red' ? markerRed :
								val.color === 'orange' ? markerOrange :
										val.color === 'blue' ? markerBlue :
												markerGreen
					});
				layerGroup.addLayer(marker);
				minVal = Math.min(minVal, val.costs);
				maxVal = Math.max(maxVal, val.costs);
			}
		});

		$('.priceBar3 .right').html('0 €&nbsp;&nbsp;');
		$('.priceBar3 .left').html('&nbsp;' + formatNumber(maxVal) + ' €');
	} catch (e) {
//		console.log(e);
	}
}

// -----------------------------------------------------------------------------

function removeMarkers() {
	'use strict';

	try {
		if (layerGroup) {
			map.removeLayer(layerGroup);
			layerGroup = null;
		}
	} catch (e) {
//		console.log(e);
	}
}

// -----------------------------------------------------------------------------

function selectSuggestion(selection) {
	'use strict';

	$.each(layerGroup._layers, function (key, val) {
		if (val.options.data.Schulnummer === selection) {
			map.panTo(new L.LatLng(val.options.data.lat, val.options.data.lng));
			updateMapSelectItem(val.options.data);
		}
	});
}

//-----------------------------------------------------------------------------

function initGermany(data) {
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
//		console.log(e);
	}
}

//-----------------------------------------------------------------------------

function initCity(cityKey) {
	'use strict';

	try {
		var city = null;
		$.each(dataGermany, function (key, val) {
			if (val.key === cityKey) {
				city = val;
			}
		});

		if (city) {
			removeMarkers();
//			removeSearchBox();
			map.setView(new L.LatLng(city.lat, city.lng), city.zoom, {animation: true});

			$.ajax({
				url: 'data/' + city.data,
				dataType: 'json',
				mimeType: 'application/json',
				success: function (data) {
					createMarkers(data);
//					initSearchBox(data);
				}
			});
		}
	} catch (e) {
//		console.log(e);
	}
}

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
		mapAction();

		window.scrollTo(0, 0);
		document.body.scrollTop = 0;
		$('#pageMap').animate({
			scrollTop: parseInt(0, 10)
		}, 500);
	});
	$('#autocomplete').autocomplete({
		lookup: schools,
		onSelect: function (suggestion) {
			selectSuggestion(suggestion.data);
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
			}),
			dataUrl = 'data/germany.json';

		map = L.map(elementName, {zoomControl: false, scrollWheelZoom: true})
			.addLayer(mapboxTiles)
			.setView([lat, lng], zoom);

		map.addControl(L.control.zoom({ position: 'bottomright'}));
		map.addControl(new ControlInfo());
		map.once('focus', mapAction);

		$.ajax({
			url: dataUrl,
			dataType: 'json',
			mimeType: 'application/json',
			success: function (data) {
				initGermany(data);
			}
		});
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

	$('#autocomplete').val('');
	$('#receipt .group').on('click', function (e) {
		$(this).toggleClass('groupClosed');
	});
	$('#receiptClose').on('click', function (e) {
		$('#receiptBox').css('display', 'none');
	});
	$('#searchBox .module select').on('change', function (e) {
		var val = $('#searchBox .module select').val();
		initCity(val);
	});

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
