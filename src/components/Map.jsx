import React, { Fragment } from "react";
import axios from "axios";

import {
  GoogleMap,
  LoadScript,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";

const MAP_API_KEY = import.meta.env.VITE_MAP_API_KEY;

export default class Map extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      regions: [],
      branches: [],
      selectedRegion: 0,
      activeBranch: null,
      openedBranch: null, // mobile open state
    };

    this.googleMap = null;

    this.loadRegions = this.loadRegions.bind(this);
    this.loadResults = this.loadResults.bind(this);
    this.openBranch = this.openBranch.bind(this);
    this.openBranchMobile = this.openBranchMobile.bind(this);
    this.closeBranch = this.closeBranch.bind(this);
    this.onMapInit = this.onMapInit.bind(this);

    this.addGoogleMapPin = this.addGoogleMapPin.bind(this);

    this.mapMarkers = {};
  }

  componentDidMount() {
    this.loadRegions();
    this.loadResults();
  }

  loadRegions() {
    axios.get("http://localhost:5000/regions").then((response) => {
      this.setState({
        regions: response.data,
      });
    });
  }

  loadResults() {
    console.log(this.state.selectedRegion);
    axios
      .get("http://localhost:5000/search", {
        params: {
          ...(this.state.selectedRegion
            ? { region: this.state.selectedRegion }
            : {}),
        },
      })
      .then((response) => {
        this.setState(
          {
            branches: response.data,
          },
          () => {
            this.fitBounds();
          }
        );
      });
  }

  selectRegion(e) {
    this.setState(
      {
        selectedRegion: e.target.value,
      },
      () => {
        this.loadResults();
        console.log({
          target: e.target.value,
          selected: this.state.selectedRegion,
        });
      }
    );
  }

  openBranch(branch) {
    if (this.state.activeBranch && this.state.activeBranch.id === branch.id) {
      this.setState({
        activeBranch: null,
      });
    } else {
      this.setState({
        activeBranch: branch,
      });
    }
  }

  openBranchMobile(branch) {
    if (this.state.openedBranch && this.state.openedBranch === branch.id) {
      this.setState({
        openedBranch: null,
      });
    } else {
      this.setState({
        openedBranch: branch.id,
      });
    }
  }

  closeBranch() {
    this.setState({
      activeBranch: null,
    });
  }

  validURL(url) {
    return url.indexOf("http://") >= 0 || url.indexOf("https://");
  }

  getDomainFromURL(url) {
    try {
      if (this.validURL(url)) {
        let domain = new URL(url);
        domain = domain.hostname.replace("www.", "");
        return domain;
      }
    } catch (e) {}
    return url;
  }

  onMapInit(map) {
    this.googleMap = map;
    this.fitBounds();
  }

  fitBounds() {
    if (this.googleMap && this.state.branches.length) {
      const bounds = new window.google.maps.LatLngBounds();
      for (const branch of this.state.branches) {
        if (parseFloat(branch.latitude) && parseFloat(branch.longitude)) {
          bounds.extend({
            lat: parseFloat(branch.latitude),
            lng: parseFloat(branch.longitude),
          });
        }
      }
      this.googleMap.fitBounds(bounds);
    }
  }

  addGoogleMapPin(branch, marker) {
    this.mapMarkers[`marker_${branch.id}`] = marker;
  }

  render() {
    const regions = this.state.regions;
    const markers = [];
    console.log(markers);
    this.mapMarkers = {};
    const containerStyle = {
      width: "100%",
      height: "100%",
    };

    const center = {
      lat: -41.192581,
      lng: 172.262211,
    };

    for (const branch of this.state.branches) {
      if (branch.longitude && branch.latitude) {
        center.lat = parseFloat(branch.latitude);
        center.lng = parseFloat(branch.longitude);

        const marker = (
          <MarkerF
            key={`d_${branch.id}`}
            onClick={() => {
              this.openBranch(branch);
            }}
            position={{
              lat: parseFloat(branch.latitude),
              lng: parseFloat(branch.longitude),
            }}
          >
            {!!(
              this.state.activeBranch &&
              this.state.activeBranch.id === branch.id
            ) && (
              <InfoWindowF
                onCloseClick={() => {
                  this.closeBranch();
                }}
                position={{
                  lat: parseFloat(this.state.activeBranch.latitude),
                  lng: parseFloat(this.state.activeBranch.longitude),
                }}
              >
                <div className="branch__map-popup">
                  <h3>{this.state.activeBranch.title}</h3>
                  {!!this.state.activeBranch.phone && (
                    <p>
                      <span>PH: </span>
                      <a href={`tel:${this.state.activeBranch.phone}`}>
                        {this.state.activeBranch.phone}
                      </a>
                    </p>
                  )}
                  {!!this.state.activeBranch.email && (
                    <p>
                      <span>Email: </span>
                      <a href={`mailto:${this.state.activeBranch.email}`}>
                        {this.state.activeBranch.email}
                      </a>
                    </p>
                  )}
                  {!!this.state.activeBranch.website && (
                    <p>
                      <span>Website: </span>
                      <a href={this.state.activeBranch.website} target="_blank">
                        {this.getDomainFromURL(this.state.activeBranch.website)}
                      </a>
                    </p>
                  )}
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        );
        markers.push(marker);
      }
    }

    return (
      <Fragment>
        <div className="branch__filter branch__filter--mobile">
          <h5>Select a Region</h5>
          <select
            value={this.state.selectedRegion}
            onChange={(e) => {
              e.preventDefault();
              this.selectRegion(e);
            }}
          >
            <option>Select</option>
            {regions.map((region) => {
              return (
                <option value={region.id} key={`mr_${region.id}`}>
                  {region.title}
                </option>
              );
            })}
          </select>
        </div>
        <div className="branch__cols">
          <div className="branch__list">
            <div className="branch__filter branch__filter--pc">
              <h5>Select a Region</h5>
              <select
                value={this.state.selectedRegion}
                onChange={(e) => {
                  e.preventDefault();
                  this.selectRegion(e);
                }}
              >
                <option value="">Select</option>
                {regions.map((region) => {
                  return (
                    <option value={region.id} key={`dr_${region.id}`}>
                      {region.title}
                    </option>
                  );
                })}
              </select>
            </div>

            {this.state.branches.length > 0 && (
              <div className="branch__grid">
                {this.state.branches.map((branch) => {
                  const className =
                    this.state.openedBranch === branch.id
                      ? "branch-card active"
                      : "branch-card";
                  return (
                    <div className={className} key={`branch_${branch.id}`}>
                      <div className="branch-card__inner">
                        <h4
                          className="branch-card__title js-branch-card-title"
                          onClick={() => {
                            this.openBranchMobile(branch);
                          }}
                        >
                          {branch.title}
                        </h4>
                        <div className="branch-card__content">
                          <ul>
                            {!!branch.phone && (
                              <li>
                                <span>PH:</span>
                                <a href={`tel:${branch.phone}`}>
                                  {branch.phone}
                                </a>
                              </li>
                            )}
                            {!!branch.email && (
                              <li>
                                <span>Email:</span>
                                <a href={`mailto:${branch.email}`}>
                                  {branch.email}
                                </a>
                              </li>
                            )}
                            {!!branch.address && (
                              <li className="address">
                                <span>Address:</span>
                                <address>{branch.address}</address>
                              </li>
                            )}
                          </ul>
                          <div className="branch-card__action">
                            <span
                              className="btn"
                              onClick={(e) => {
                                e.preventDefault();
                                this.openBranch(branch);
                              }}
                            >
                              Show on Map
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="branch__map">
            <div className="branch__map-align">
              <div className="branch__map-image">
                <LoadScript googleMapsApiKey={MAP_API_KEY}>
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={10}
                    onLoad={this.onMapInit}
                  >
                    {markers}
                  </GoogleMap>
                </LoadScript>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}
