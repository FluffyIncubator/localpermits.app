import React, { useContext, useEffect, useRef } from 'react';
import L from 'leaflet';
import { ApiContext } from './ApiContext';

interface QueryResponse<T> {
	fields: {
		[key: string]: {
			pgtype: string;
			type: string;
		}
	}
	rows: Array<T>;
}

interface PermitRow {
	permitnumber: string;
	permittype: string;
	address: string;
	approvedscopeofwork: string;
	lat: number;
	lng: number;
	start_date: string;
	completed_date: string;
	permitissuedate: string;
	status: string;
}

interface CEProperties {
	tagName: keyof HTMLElementTagNameMap;
	id?: string;
	classList?: string[];
	text?: string;
	children?: HTMLElement[];
}


var youIcon = L.icon({
	iconUrl: "/red-marker-icon.png",
	shadowUrl: "/marker-shadow.png",
	iconSize: [25, 41],
	shadowSize: [41, 41],
	iconAnchor: [13, 41],
	shadowAnchor: [13, 40],
	popupAnchor: [0, -36]
});

var demoIcon = L.icon({
	iconUrl: "/demo-active.png",
	shadowUrl: "/marker-shadow.png",
	iconSize: [25, 41],
	shadowSize: [41, 41],
	iconAnchor: [13, 41],
	shadowAnchor: [13, 40],
	popupAnchor: [0, -36]
});

var plumbingIcon = L.icon({
	iconUrl: "/plumbing-active.png",
	shadowUrl: "/marker-shadow.png",
	iconSize: [25, 41],
	shadowSize: [41, 41],
	iconAnchor: [13, 41],
	shadowAnchor: [13, 40],
	popupAnchor: [0, -36]
});

function CE(properties: CEProperties) {
	let el = document.createElement(properties.tagName);
	if (properties) {
		if (properties.id) el.setAttribute('id', properties.id);
		if (properties.classList) properties.classList.forEach(c => el.classList.add(c));
		if (properties.text) el.appendChild(document.createTextNode(properties.text));
		if (properties.children) properties.children.forEach(child => el.appendChild(child));
	}
	return el;
}

function runQuery<T>(query: string): Promise<QueryResponse<T>> {
	return new Promise((resolve, reject) => {
		let xhr = new XMLHttpRequest();
		let url = 'https://phl.carto.com/api/v2/sql?q=' + encodeURIComponent(query.replace(/\n/ig, ' '));
		console.log(url);
		xhr.open('GET', url);
		xhr.onload = function () {
			let response = JSON.parse(this.responseText);
			resolve(response);
		}
		xhr.send();
	});
}

async function getDemoPermits() {
	let permits = await runQuery<PermitRow>(`
        SELECT
            permitnumber,
            permittype,
            p.address,
            p.status,
            approvedscopeofwork,
            permitissuedate,
            start_date,
            completed_date,
            st_y(p.the_geom) as lat,
            st_x(p.the_geom) as lng
        FROM
            permits p
            LEFT JOIN demolitions d ON d.caseorpermitnumber = p.permitnumber
        WHERE
            (
                p.status = 'ACTIVE'
                OR p.status = 'ISSUED'
            )
            AND (
                p.permittype = 'DEMOLITION'
                OR p.permittype = 'BP_DEMO'
                OR p.approvedscopeofwork LIKE '%SEAL%LATERAL%'
                OR p.approvedscopeofwork LIKE '%LATERAL%SEAL%'
            )
            AND (
				completed_date IS NULL
				)
			ORDER BY
					permitissuedate DESC
		`);

	return permits;
}

var maps: { [key: string]: L.Map } = {};

async function StartMap(mapId: string) {
	const urlSearchParams = new URLSearchParams(window.location.search);
	const requestedPermit = urlSearchParams.get('p');
	const dangerZoneLocation = urlSearchParams.get('dz');

	let map = L.map(mapId).setView([39.952583, -75.165222], 12);

	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
		attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
		tileSize: 512,
		maxZoom: 18,
		zoomOffset: -1,
		id: 'mapbox/dark-v11',
		accessToken: "pk.eyJ1IjoibXJpY2hhcmRzb242NTAyIiwiYSI6ImNqd2I1NnBkejA2Y2wzenVra3Q1MTUzZ2UifQ.3fy4ipWLvWo1Xc7CWq_ONQ"
	}).addTo(map);

	if (dangerZoneLocation == '2507') {
		let latlng: [number, number] = [39.9779445, -75.120211];
		L.circle(latlng, 609, {
			color: 'red',
			fillColor: 'red',
			fillOpacity: 0.25
		}).addTo(map);

		L.marker(latlng, { icon: demoIcon }).addTo(map).bindPopup("<strong>2507 Almond St</strong><br/>The red circle represents the area that may be contaminated with toxic dust from construction. Attend <a href='https://www.facebook.com/events/3198510937060794/?acontext=%7B%22source%22%3A5%2C%22action_history%22%3A[%7B%22surface%22%3A%22p3A%22page%22%2C%22mechanism%22%3A%22main_list%22%2C%22extra_data%22%3A%22%5C%22[]%5C%22%22%7D]%2C%22has_source%22%3Atrue%7D'>THE MEETING</a> to learn more.").openPopup();

		map.setView(latlng, 16);

		return;
	}

	let permits = await getDemoPermits();

	let locations: {
		[key: string]: Array<PermitRow>;
	} = {};

	let targetPermit = null as any;

	permits.rows.forEach(permit => {
		if (!locations[permit.address]) locations[permit.address] = [];
		locations[permit.address].push(permit);
	})

	Object.keys(locations).forEach(address => {
		let permits = locations[address];
		let hasDemo = false;
		let hasPlumbing = false;

		let permitElements = permits.map(permit => {
			if (permit.permittype == 'PLUMBING') hasPlumbing = true;
			if (permit.permittype.includes('DEMO')) hasDemo = true;

			let children: HTMLElement[] = [];

			children.push(CE({
				tagName: 'div',
				text: `${permit.permitnumber} - ${permit.permittype} - ${permit.status}`,
				classList: ['has-text-weight-bold']
			}));

			children.push(CE({
				tagName: 'div',
				text: `Issued: ${new Date(permit.permitissuedate).toLocaleDateString()}`
			}));

			if (permit.start_date) children.push(CE({
				tagName: 'div',
				text: `Started: ${new Date(permit.start_date).toLocaleDateString()}`
			}));

			if (permit.permittype == 'PLUMBING') children.push(CE({
				tagName: 'div',
				text: `Note: Plumbing permits that include sealing a lateral are a potential sign that a demolition will happen at this location.`,
				classList: ['has-text-weight-bold']
			}));

			children.push(CE({
				tagName: 'div',
				text: `${permit.approvedscopeofwork ? permit.approvedscopeofwork : 'NO DESCRIPTION OF WORK PROVIDED'}`,
				classList: [(permit.approvedscopeofwork ? 'has-text-weight-normal' : 'has-text-weight-bold')]
			}))

			return CE({
				tagName: 'div',
				classList: ['permit'],
				children: children
			});
		});

		let link = document.createElement('a');
		link.classList.add('button', 'is-primary');
		link.href = `https://atlas.phila.gov/${encodeURIComponent(address)}/property`;
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
		link.innerHTML = 'Open in Atlas';
		permitElements.push(link);

		let popupElement = CE({
			tagName: 'div',
			classList: ['popup'],
			children: permitElements
		});

		let permitsWithCoordinates = permits.filter(p => p.lat && p.lng);

		if (permitsWithCoordinates.length > 0) {
			let icon = demoIcon;
			if (hasPlumbing && !hasDemo) icon = plumbingIcon;
			let thisMarker = L.marker([permitsWithCoordinates[0].lat, permitsWithCoordinates[0].lng], {
				icon: icon
			}).addTo(map).bindPopup(popupElement);

			if (requestedPermit) {
				let matchingPermits = permitsWithCoordinates.filter(p => p.permitnumber == requestedPermit);
				if (matchingPermits.length > 0) {
					targetPermit = thisMarker;
				}
			}
		}
	});

	if (targetPermit) {
		targetPermit.openPopup()
	}

	console.log('store map ' + mapId);
	maps[mapId] = map;

	runQueue(mapId);
}

function addHomeZone(mapId: string, lnglat: number[], address: string) {
	if (typeof maps[mapId] == 'undefined') {
		queueAction(mapId, () => {
			addHomeZone(mapId, lnglat, address);
		});
		return;
	}

	let map = maps[mapId];
	L.rectangle([[lnglat[1] - 0.004, lnglat[0] - 0.005], [lnglat[1] + 0.004, lnglat[0] + 0.005]], {
		color: "#ff3333",
		weight: 4
	}).addTo(map);

	L.marker([lnglat[1], lnglat[0]], {
		icon: youIcon
	}).addTo(map).bindTooltip(address);

	zoomTo(mapId, lnglat);
}

function zoomTo(mapId: string, lnglat: number[]) {
	console.log('zoom map ' + mapId);

	if (typeof maps[mapId] == 'undefined') {
		queueAction(mapId, () => {
			zoomTo(mapId, lnglat);
		})
		return
	}

	let map = maps[mapId];
	map.flyTo([lnglat[1], lnglat[0]], 17);
}

type AnyCallback = () => any;

var mapActionQueue: { [mapId: string]: Array<AnyCallback> } = {};

function queueAction(mapId: string, cb: AnyCallback) {
	if (typeof mapActionQueue[mapId] == 'undefined') {
		mapActionQueue[mapId] = [];
	}
	mapActionQueue[mapId].push(cb);
	console.log('Action queued for ' + mapId)
}

function runQueue(mapId: string) {
	if (typeof mapActionQueue[mapId] == 'undefined') return;

	while (mapActionQueue[mapId].length > 0) {
		let cb = mapActionQueue[mapId].pop();
		cb && cb();
	}

	delete mapActionQueue[mapId];
}

export default function Map() {
	const isMapLoaded = useRef(false);
	const apiContext = useContext(ApiContext);
	const mapIdRef = useRef("map-" + Math.random().toFixed(10))
	const homeAddress = useRef("");
	const homeCoords = useRef([] as number[]);

	const coordsCb = (lnglat: number[]) => {
		if (lnglat.length != 2) return;

		homeCoords.current = lnglat;
		console.log('got coords', lnglat);

		if (homeCoords.current.length == 2 && homeAddress.current.length > 0) {
			addHomeZone(mapIdRef.current, homeCoords.current, homeAddress.current);
		}
	}

	const addressCb = (address: string) => {
		if (address.length == 0) return;

		homeAddress.current = address;
		console.log('got address', address);

		if (homeCoords.current.length == 2 && homeAddress.current.length > 0) {
			addHomeZone(mapIdRef.current, homeCoords.current, homeAddress.current);
		}
	}

	useEffect(() => {
		apiContext.on('getcoords', coordsCb);
		apiContext.on('getaddress', addressCb);

		if (!isMapLoaded.current) {
			isMapLoaded.current = true;
			StartMap(mapIdRef.current);
			apiContext.getAddress();
		}
		return () => {
			apiContext.remove('getcoords', coordsCb);
			apiContext.remove('getaddress', addressCb);
		}
	})
	return (
		<div id={mapIdRef.current} className="map"></div>
	)
}