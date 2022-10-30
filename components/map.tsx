import { useState, useMemo, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  Circle,
  MarkerClusterer,
  StreetViewService,
  InfoWindow,
} from "@react-google-maps/api";
import Places from "./places";
import Distance from "./distance";
import { GoodPageCache } from "next/dist/client/page-loader";

type LatLngLiteral = google.maps.LatLngLiteral;
type DirectionsResult = google.maps.DirectionsResult;
type MapOptions = google.maps.MapOptions;

export default function Map() {
  const [newHouse, setNewHouse] = useState(false);
  const [openRightClickWindow, setOpenRightClickWindow] = useState(false);
  const [newCorrdinates, setNewCoordinate] = useState<LatLngLiteral>();
  const [office, setOffice] = useState<LatLngLiteral>();
  const [directions, setDirections] = useState<DirectionsResult>();
  const mapRef = useRef<GoogleMap>();
  const center = useMemo<LatLngLiteral>(
    () => ({ lat: 39.920673, lng: 32.845841 }),
    []
  );
  const options = useMemo<MapOptions>(
    () => ({
      // mapId: "fe8cf89b201e6159",
      // disableDefaultUI: true,
      clickableIcons: true,
      mapTypeControl: true,
      streetViewControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels.icon",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
      ],
      // mapTypeId: google.maps.MapTypeId.TERRAIN,
      // mapTypeControlOptions: {
      //   mapTypeIds: ["satellite", "terrain"],
      //   style: google.maps.MapTypeControlStyle.DEFAULT,
      //   position: google.maps.ControlPosition.TOP_CENTER,
      // },
    }),
    []
  );

  const onLoad = useCallback((map) => (mapRef.current = map), []);
  const houses = useMemo(() => office && generateHouses(office), [office]);

  console.log(houses);
  const rightClickHandler = (e: google.maps.MapMouseEvent) => {
    console.log(e.latLng?.lat(), e.latLng?.lng());
    setNewCoordinate({
      lat: e.latLng ? e.latLng.lat() : center.lat,
      lng: e.latLng ? e.latLng?.lng() : center.lng,
    });

    setOpenRightClickWindow(true);
  };

  const fetchDirections = (house: LatLngLiteral) => {
    if (!office) return;

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: house,
        destination: office,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        }
      }
    );
  };

  return (
    <div className="container">
      <div className="controls">
        <h1>Commute?</h1>
        <Places
          setOffice={(position) => {
            setOffice(position);
            mapRef.current?.panTo(position);
          }}
        />
        {!office && <p>Enter the address of your office</p>}
        {directions && <Distance leg={directions.routes[0].legs[0]} />}
      </div>
      <div className="map">
        <GoogleMap
          zoom={11}
          center={center}
          mapContainerClassName="map-container"
          options={options}
          onLoad={onLoad}
          onRightClick={rightClickHandler}
        >
          {openRightClickWindow && (
            <>
              <InfoWindow position={newCorrdinates}>
                <div>
                  <div
                    className="contextMenu"
                    onClick={() => {
                      setOffice(newCorrdinates);
                      setOpenRightClickWindow(false);
                    }}
                  >
                    Set Office Here
                  </div>
                  <div
                    className="contextMenu"
                    onClick={() => {
                      newCorrdinates && houses?.push(newCorrdinates);
                      setNewHouse(true);
                      setOpenRightClickWindow(false);
                    }}
                  >
                    Add House Here
                  </div>
                </div>
              </InfoWindow>
              {newCorrdinates && newHouse && (
                <Marker
                  key={newCorrdinates.lat}
                  position={newCorrdinates}
                  onClick={() => fetchDirections(newCorrdinates)}
                />
              )}
            </>
          )}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                polylineOptions: {
                  zIndex: 50,
                  strokeColor: "#1976D2",
                  strokeWeight: 4,
                },
              }}
            />
          )}
          {office && (
            <>
              <Marker
                position={office}
                icon="https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png"
              />
              <MarkerClusterer>
                {(clusterer) =>
                  houses &&
                  houses.map((house) => (
                    <Marker
                      key={house.lat}
                      position={house}
                      clusterer={clusterer}
                      onClick={() => fetchDirections(house)}
                    />
                  ))
                }
              </MarkerClusterer>

              {}
              <Circle center={office} radius={3000} options={closeOptions} />
              <Circle center={office} radius={6000} options={middleOptions} />
              <Circle center={office} radius={10000} options={farOptions} />
            </>
          )}
          <StreetViewService />
        </GoogleMap>
      </div>
    </div>
  );
}

const defaultOptions = {
  strokeOpacity: 0.5,
  strokeWeight: 2,
  clickable: false,
  draggable: false,
  editable: false,
  visible: true,
};
const closeOptions = {
  ...defaultOptions,
  zIndex: 3,
  fillOpacity: 0.15,
  strokeColor: "lightBlue",
};
const middleOptions = {
  ...defaultOptions,
  zIndex: 2,
  fillOpacity: 0.15,
  strokeColor: "orange",
};
const farOptions = {
  ...defaultOptions,
  zIndex: 1,
  fillOpacity: 0.2,
  strokeColor: "red",
};

const generateHouses = (position: LatLngLiteral) => {
  const _houses: Array<LatLngLiteral> = [];
  for (let i = 0; i < 100; i++) {
    const direction = Math.random() < 0.5 ? -10 : 10;
    _houses.push({
      lat: position.lat + Math.random() / direction,
      lng: position.lng + Math.random() / direction,
    });
  }
  return _houses;
};
