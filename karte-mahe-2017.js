/* schulsanierung.tursics.de - JavaScript file */

/*jslint browser: true*/
/*global $,L*/

var map = null;
var layerPopup = null;
var layerGroup = null;
var schools = null;
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
	} else if ('undefined' === typeof item) {
		return 0;
	} else if ('number' === typeof item) {
		return item;
	} else if ('T€' === item.substring(item.length - 2)) {
		return parseInt(item.substring(0, item.length - 2).replace('.', '').replace(',', '.'), 10) * 1000;
	} else if ('€' === item.substring(item.length - 1)) {
		return parseInt(item.substring(0, item.length - 1).replace('.', '').replace('.', '').replace(',', '.'), 10);
	}
	return item;
}

// -----------------------------------------------------------------------------

function fixData(val) {
	'use strict';

	function fixComma(item) {
		if (item === '') {
			return 0;
		} else if (item === null) {
			return 0;
		}
		return parseFloat(String(item).replace('.', '').replace(',', '.'));
	}

	val.GebaeudeGesamt = fixEuro(val.GebaeudeGesamt);

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
			if ((value.lat === '') || (value.lng === '')) {
				console.log('missing geocoordinate in ' + value.Gebaeudenummer);
			}
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
		BezNr: 10,
		Schulname: 'Marzahn-Hellersdorf',
		Schulnummer: 'gesamt',
		StNr: '10',
		Gebaeudenummer: '10',
		MassnahmeNr: '10',
		Leistungsart: '',
		Standardleistung: '',
		Prio: 1,
		Menge: '1',
		Einheit: '',
		Mengenfaktor: '1',
		Preisfaktor: '1',
		Finanzierung: '',
		Ignorieren: 'FALSCH',
		BemerkungSenBJW: '',
		UnterpriorisierungDurchFMBauBAMarzHell: '',
		lat: 52.536686,
		lng: 13.604863,
	},
		sum = [
			'GebaeudeGesamt'
		],
		id,
		len = 0;

	for (id in sum) {
		obj[sum[id]] = 0;
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
					}
				}
			}
		});

		len = data.length;

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

	var key,
		date = new Date(),
		dateD = date.getDate(),
		dateM = date.getMonth() + 1,
		dateY = date.getFullYear(),
		dateH = date.getHours(),
		dateMin = date.getMinutes(),
		dateSec = date.getSeconds(),
		id,
		building,
		str,
		item,
		menge,
		sum = 0;

	for (key in data) {
		setText(key, data[key]);
	}

	id = 0;
	for (building in schools) {
		item = schools[building];
		if (item.Gebaeudenummer === data.Gebaeudenummer) {
			str = '';

			menge = item.Menge;
			if ('1' !== item.Mengenfaktor) {
				menge = (parseInt(parseFloat(item.Mengenfaktor.replace('.', '').replace(',', '.')) * 100, 10) / 100) + ' x ' + menge;
			}

			str += '<div><span class="half">' + item.Standardleistung + '</span><span class="number">' + formatNumber(item.GebaeudeGesamt) + ' EUR</span></div>';
			if ('1' === item.Preisfaktor) {
				str += '<div class="sub"><span class="full">' + menge + ' ' + item.Einheit + '</span></div>';
			} else {
				str += '<div class="sub"><span class="full">' + menge + ' ' + item.Einheit + ', Preisfaktor ' + (parseInt(parseFloat(item.Preisfaktor.replace('.', '').replace(',', '.')) * 100, 10) / 100) + '</span></div>';
			}
			if (('' === item.UnterpriorisierungDurchFMBauBAMarzHell) || ('_' === item.UnterpriorisierungDurchFMBauBAMarzHell)) {
				str += '<div class="sub"><span class="full">Priorität: ' + item.Prio + ' von 4</span></div>';
			} else {
				str += '<div class="sub"><span class="full">Priorität: ' + item.Prio + ' von 4 (Unterpriorität ' + item.UnterpriorisierungDurchFMBauBAMarzHell + ')</span></div>';
			}
//			item.Leistungsart
//			item.MassnahmeNr
//			if (item.Finanzierung !== '') {
//				str += '<div class="sub"><span class="full">' + item.Finanzierung + '</span></div>';
//			}
			if ((item.Ignorieren !== 'FALSCH') && (item.GebaeudeGesamt > 0)) {
				str += '<div class="sub"><span class="half">Ignorieren</span><span class="string">Ja</span></div>';
			}
			if (item.BemerkungSenBJW !== '') {
				str += '<div class="sub"><span class="full" style="white-space:normal;color:#f69730;">„' + item.BemerkungSenBJW + '“</span></div>';
			}
			$('#item' + id).html(str).show();
			++id;
			sum += item.GebaeudeGesamt;
		}
	}
	for (; id < 20; ++id) {
		$('#item' + id).hide();
	}

	setText('GebaeudeGesamt', sum);

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
	setText('Now_', dateD + '.' + dateM + '.' + dateY + ' ' + dateH + ':' + dateMin);

	$('#receiptBox').css('display', 'block');
	$('#receiptBox .finished').css('display', [1160202, 1110701].indexOf(data.Gebaeudenummer) !== -1 ? 'block' : 'none');
}

// -----------------------------------------------------------------------------

function updateMapHoverItem(coordinates, data, icon) {
	'use strict';

	var options = {
		closeButton: false,
		offset: L.point(0, -32),
		className: 'printerLabel'
	},
		str = '',
		sum = 0,
		prio = 4,
		item,
		building;

	for (building in schools) {
		item = fixData(schools[building]);
		if (item.Gebaeudenummer === data.Gebaeudenummer) {
			sum += item.GebaeudeGesamt;
			prio = Math.min(prio, item.Prio);
		}
	}

	str += '<div class="top ' + icon.options.markerColor + '">' + data.Schulname + '</div>';
	str += '<div class="middle">€' + formatNumber(sum) + '</div>';
	str += '<div class="bottom ' + icon.options.markerColor + '">Priorität ' + prio + '</div>';

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
			building,
			buildings = [],
			item,
			prio;

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
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined') && (val.lat !== '') && (val.lng !== '')) {
				if (-1 === buildings.indexOf(val.Gebaeudenummer)) {
					buildings.push(val.Gebaeudenummer);

					prio = 4;
					for (building in schools) {
						item = fixData(schools[building]);
						if (item.Gebaeudenummer === val.Gebaeudenummer) {
							prio = Math.min(prio, val.Prio);
						}
					}

					var isDistrict = (val.StNr === '10'),
						marker = L.marker([parseFloat(val.lat), parseFloat(val.lng)], {
							data: fixData(val),
							icon: prio === 1 ? markerRed :
									prio === 2 ? markerOrange :
											prio === 3 ? markerBlue :
													markerGreen,
							opacity: isDistrict ? 0 : 1,
							clickable: isDistrict ? 0 : 1
						});
					layerGroup.addLayer(marker);
				}
			}
		});
	} catch (e) {
//		console.log(e);
	}
}

// -----------------------------------------------------------------------------

function selectSuggestion(selection) {
	'use strict';

	$.each(layerGroup._layers, function (key, val) {
		if (val.options.data.Gebaeudenummer === selection) {
			map.panTo(new L.LatLng(val.options.data.lat, val.options.data.lng));
			updateMapSelectItem(val.options.data);
		}
	});
}

//-----------------------------------------------------------------------------

function initSearchBox(data) {
	'use strict';

	var schools = [],
		buildings = [];

	try {
		$.each(data, function (key, val) {
			if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined')) {
				if (-1 === buildings.indexOf(val.Gebaeudenummer)) {
					buildings.push(val.Gebaeudenummer);

					var name = val.Schulname,
						color = '',
						desc = '';
					if ('' !== val.Gebaeudenummer) {
						desc = val.Gebaeudenummer;
					}
					color = 'gray';
					schools.push({ value: name, data: val.Gebaeudenummer, color: color, desc: desc });
				}
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
			dataUrl = 'data/gebaeudescan2017-mahe.json';

		map = L.map(elementName, {zoomControl: false, scrollWheelZoom: true})
			.addLayer(mapboxTiles)
			.setView([lat, lng], zoom);

		map.addControl(L.control.zoom({ position: 'bottomright'}));
		map.once('focus', mapAction);

		$.getJSON(dataUrl, function (data) {
			schools = enrichMissingData(data);
			createStatistics(schools);
			createMarker(schools);
			initSearchBox(schools);
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
	initMap('mapContainer', 52.536686, 13.604863, 16);

	$('#autocomplete').val('');
	$('#receipt .group').on('click', function (e) {
		$(this).toggleClass('groupClosed');
	});
	$('#receiptClose').on('click', function (e) {
		$('#receiptBox').css('display', 'none');
	});
	$('#searchBox .sample a:nth-child(1)').on('click', function (e) {
		$('#autocomplete').val('Obersee-Schule (11G19)');
		selectSuggestion(1111901);
	});
	$('#searchBox .sample a:nth-child(2)').on('click', function (e) {
		$('#autocomplete').val('Marzahn-Hellersdorf');
		selectSuggestion('10');
	});
});

// -----------------------------------------------------------------------------

$(function () {
	'use strict';

	$('a[href*="#"]:not([href="#"])').click(printerLabelClick);
});

// -----------------------------------------------------------------------------