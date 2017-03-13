/* schulsanierung.tursics.de - JavaScript file */

/*jslint browser: true*/
/*global $,L*/

var map = null;
var layerPopup = null;
var layerGroup = null;
//var budget = null;

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
	} else if ('number' === typeof item) {
		return item;
	} else if ('T€' === item.substring(item.length - 2)) {
		return parseInt(item.substring(0, item.length - 2).replace('.', '').replace(',', '.'), 10) * 1000;
	}
	return item;
}

// -----------------------------------------------------------------------------

function fixData(val) {
	'use strict';

	return val;
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

function enrichMissingData(data) {
	'use strict';

	try {
		$.each(data, function (key, value) {
		});
	} catch (e) {
//		console.log(e);
	}

	return data;
}

// -----------------------------------------------------------------------------

function createStatistics(data) {
	'use strict';

	var obj = {
		Bauwerk: 'Bezirk',
		Dachart: 'Diverse',
		Schulart: 'Bezirk',
		Schulname: 'Lichtenberg',
		Schulnummer: 'gesamt',
		Strasse: '',
		PLZ: '',
		Gebaeudenummer: 1100000,
		lat: 52.515807,
		lng: 13.479470,
		GebaeudeHoeheInM: 0,
		GebaeudeUmfangInMAusConject: 0,
		FensterKostenpauschale: 0,
		FassadenKostenpauschale: 0,
		DachKostenpauschale: 0,
		RaeumeKostenpauschale: 0,
		Raeume2Kostenpauschale: 0,
		SanierungDachNotwendig: 1,
		SanierungFassadenNotwendig: 1,
		SanierungFensterNotwendig: 1,
		SanierungRaeume2Notwendig: 1,
		SanierungRaeumeNotwendig: 1,
		SanierungTuerbreitenNotwendig: 1,
		SanitaerSanierungsjahr: '-'
	},
		sum = [
			'AufzugKosten', 'BGF', 'BWCAnzahl', 'BWCKosten', 'DachKosten', 'EingangAnzahl', 'EingangKosten',
			'FassadenKosten', 'FensterKosten', 'FlaecheNichtSaniert', 'GF', 'Kosten',
			'Grundstuecksflaeche', 'NF', 'NGF', 'Raeume2Kosten', 'RaeumeKosten', 'RampeAnzahl',
			'RampeKosten', 'SanitaerKosten', 'Sanitaerflaeche', 'ZwischensummeBarrierefreiheitKosten',
			'zweiterRettungswegKosten', 'Baukosten', 'Aussenanlagen'
		],
		sumCond = [
			{calc: 'FensterFlaeche', condition: 'FensterKosten' /*'SanierungFensterNotwendig'*/},
			{calc: 'FassadenFlaeche', condition: 'FassadenKosten' /*'SanierungFassadenNotwendig'*/},
			{calc: 'FassadenFlaecheOhneFenster', condition: 'FassadenKosten' /*'SanierungFassadenNotwendig'*/},
			{calc: 'Dachflaeche', condition: 'DachKosten' /*'SanierungDachNotwendig'*/},
			{calc: 'TuerenKosten', condition: 'SanierungTuerbreitenNotwendig'},
			{calc: 'RaeumeNutzflaecheBGF', condition: 'RaeumeKosten' /*'SanierungRaeumeNotwendig'*/},
			{calc: 'Raeume2Nutzflaeche', condition: 'Raeume2Kosten' /*'SanierungRaeume2Notwendig'*/}
		],
		average = [
			'FassadenFaktorFlaechenanteil', 'FensterFaktorFlaechenanteil', 'BauPrioBauwerk', 'BauPrioTGA',
			'BauprioSumme', 'PrioritaetGesamt', 'bereitsSanierteFlaecheInProzent'
		],
		id,
		len = 0;

	for (id in sum) {
		obj[sum[id]] = 0;
	}
	obj.FensterFlaeche = 0;
	obj.FassadenFlaeche = 0;
	obj.FassadenFlaecheOhneFenster = 0;
	obj.Dachflaeche = 0;
	obj.TuerenKosten = 0;
	obj.RaeumeNutzflaecheBGF = 0;
	obj.Raeume2Nutzflaeche = 0;
	for (id in average) {
		obj[average[id]] = 0;
	}

	try {
		$.each(data, function (key, val) {
			val = fixData(val);
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				var id,
					cond;
				for (id in val) {
					if (-1 < $.inArray(id, sum)) {
						obj[id] += parseInt(val[id], 10);
					} else if (-1 < $.inArray(id, average)) {
						obj[id] += parseInt(val[id], 10);
					} else {
						for (cond in sumCond) {
							if ((sumCond[cond].calc === id) && (0 !== val[sumCond[cond].condition])) {
								obj[id] += parseInt(val[id], 10);
							}
						}
					}
				}
			}
		});

		len = data.length;
		for (id in obj) {
			if (-1 < $.inArray(id, average)) {
				obj[id] = parseInt(obj[id] / len * 10, 10) / 10;
			}
		}

		obj.FensterKostenpauschale = parseInt(obj.FensterKosten / obj.FensterFaktorFlaechenanteil / obj.FensterFlaeche * 100, 10) / 100;
		obj.FassadenKostenpauschale = parseInt(obj.FassadenKosten / obj.FassadenFaktorFlaechenanteil / obj.FassadenFlaecheOhneFenster * 100, 10) / 100;
		obj.DachKostenpauschale = parseInt(obj.DachKosten / obj.Dachflaeche * 100, 10) / 100;
		obj.RaeumeKostenpauschale = parseInt(obj.RaeumeKosten / obj.RaeumeNutzflaecheBGF * 100, 10) / 100;
		obj.Raeume2Kostenpauschale = parseInt(obj.Raeume2Kosten / obj.Raeume2Nutzflaeche * 100, 10) / 100;
		obj.bereitsSanierteFlaecheInProzent = parseInt(obj.bereitsSanierteFlaecheInProzent, 10);

		data.push(obj);
	} catch (e) {
//		console.log(e);
	}
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

	var key;

	for (key in data) {
		setText(key, data[key]);
	}

	setText('PrioritaetGesamt', (data.Prio === 1 ? 'Höchste Priorität' : (data.Kosten >= 5000000 ? 'Priorität 2 oder 3' : 'unbekannte Priorität')));

	$('.priceBox').removeClass('priceRed').removeClass('priceOrange').removeClass('priceBlue').removeClass('priceGreen')
		.addClass(data.Kosten >= 10000000 ? 'priceRed' :
								data.Kosten >= 5000000 ? 'priceOrange' :
										data.Kosten >= 1000 ? 'priceBlue' :
												'priceGreen');
	$('#receiptBox').css('display', 'block');
//	$('#receiptBox .finished').css('display', [1160202, 1110701].indexOf(data.Gebaeudenummer) !== -1 ? 'block' : 'none');
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
	str += '<div class="middle">' + (data.Kosten === 0 ? '-' : '€' + formatNumber(data.Kosten)) + '</div>';
	str += '<div class="bottom ' + icon.options.markerColor + '">' + (data.Prio === 1 ? 'Höchste Priorität' : (data.Kosten >= 5000000 ? 'Prio 2 oder 3' : 'unbekannte Prio')) + '</div>';

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

function createMarker(data) {
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
			minVal = 100000000,
			maxVal = 0;

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
						data: fixData(val),
						icon: val.Kosten >= 10000000 ? markerRed :
								val.Kosten >= 5000000 ? markerOrange :
										val.Kosten >= 1000 ? markerBlue :
												markerGreen,
						opacity: /*isDistrict ? 0 :*/ 1,
						clickable: /*isDistrict ? 0 :*/ 1
					});
				layerGroup.addLayer(marker);
				minVal = Math.min(minVal, val.Kosten);
				maxVal = Math.max(maxVal, val.Kosten);
			}
		});

		$('.priceBar2 .priceGreen').text(0);
		$('.priceBar2 .priceRed').text(maxVal);
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

function initSearchBox(data) {
	'use strict';

	var schools = [];

	try {
		$.each(data, function (key, val) {
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				var name = val.Schulname;
				if ('' !== val.Schulnummer) {
					name += ' (' + val.Schulnummer + ')';
				}
				schools.push({ value: name, data: val.Schulnummer, color: '', desc: val.Schulart });
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
			var color = 'gray',
				icon  = 'fa-building-o',
				str = '';

			str += '<div class="autocomplete-icon back' + color + '"><i class="fa ' + icon + '" aria-hidden="true"></i></div>';
			str += '<div>' + suggestion.value.replace(new RegExp(currentValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'gi'), '<strong>' + currentValue + '</strong>') + '</div>';
			str += '<div class="' + color + '">' + suggestion.desc + '</div>';
			return str;
		},
		showNoSuggestionNotice: true,
		noSuggestionNotice: '<i class="fa fa-info-circle" aria-hidden="true"></i> Geben sie den Namen einer Schule ein'
	});
}

// -----------------------------------------------------------------------------

function printerLabelClick() {
	if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && (location.hostname === this.hostname)) {
		var hash = this.hash,
			schoolId = hash.lastIndexOf('='),
			target;

		if (-1 === schoolId) {
			schoolId = '';
		} else {
			hash = this.hash.substr(0, schoolId);
			schoolId = this.hash.substr(schoolId + 1);
		}

		target = $(hash);
		target = target.length ? target : $('[name=' + hash.slice(1) + ']');
		if (target.length) {
			$('#pageMap').animate({
				scrollTop: parseInt(target.offset().top, 10)
			}, 500, function () {
				selectSuggestion(parseInt(schoolId, 10));
			});
			return false;
		}
	}
}

// -----------------------------------------------------------------------------

function initSocialMedia() {
	'use strict';

	setTimeout(function () {
		$.ajax('http://www.tursics.de/v5shariff.php?url=http://schulsanierung.tursics.de/')
			.done(function (json) {
				$('.social .facebook span').html(json.facebook);
				if (json.facebook > 0) {
					$('.social .facebook span').addClass('active');
				}

				$('.social .twitter span').html(json.twitter);
				if (json.twitter > 0) {
					$('.social .twitter span').addClass('active');
				}
			});
	}, 1000);
}

// -----------------------------------------------------------------------------

function initMap(elementName, lat, lng, zoom) {
	'use strict';

	if (null === map) {
		var mapboxToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiI1UWlEY3RNIn0.U9sg8F_23xWXLn4QdfZeqg',
			mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v4/tursics.l7ad5ee8/{z}/{x}/{y}.png?access_token=' + mapboxToken, {
				attribution: '<a href="http://www.openstreetmap.org" target="_blank">OpenStreetMap-Mitwirkende</a>, <a href="https://www.mapbox.com" target="_blank">Mapbox</a>'
			}),
			dataUrl = 'data/gebaeudescan2017-03.json';

		map = L.map(elementName, {zoomControl: false, scrollWheelZoom: true})
			.addLayer(mapboxTiles)
			.setView([lat, lng], zoom);

		map.addControl(L.control.zoom({ position: 'bottomright'}));
		map.once('focus', mapAction);

		$.getJSON(dataUrl, function (data) {
			data = enrichMissingData(data);
//			createStatistics(data);
			createMarker(data);
			initSearchBox(data);
			initSocialMedia();

//			var budgetUrl = 'data/gebaeudesanierungen.json';
//			$.getJSON(budgetUrl, function (budgetData) {
//				budget = budgetData;
//			});
		});
	}
}

// -----------------------------------------------------------------------------

$(document).on("pagecreate", "#pageMap", function () {
	'use strict';

	// center the city hall
//	initMap( 'mapContainer', 52.515807, 13.479470, 16);
});

// -----------------------------------------------------------------------------

$(document).on("pageshow", "#pageMap", function () {
	'use strict';

	// center the city hall
	initMap('mapContainer', 52.515807, 13.479470, 16);

	$('#autocomplete').val('');
	$('#receipt .group').on('click', function (e) {
		$(this).toggleClass('groupClosed');
	});
	$('#receiptClose').on('click', function (e) {
		$('#receiptBox').css('display', 'none');
	});
	$('#searchBox .sample a:nth-child(1)').on('click', function (e) {
		$('#autocomplete').val('Clay-Schule (08K05)');
		selectSuggestion(1111901);
	});
	$('#searchBox .sample a:nth-child(2)').on('click', function (e) {
		$('#autocomplete').val('Lichtenberg');
		selectSuggestion(1100000);
	});
});

// -----------------------------------------------------------------------------

$(function () {
	'use strict';

	$('a[href*="#"]:not([href="#"])').click(printerLabelClick);
});

// -----------------------------------------------------------------------------
