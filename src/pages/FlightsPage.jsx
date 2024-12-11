import React from "react";

import CoverPhoto from "../components/CoverPhoto";
import FlightScheduler from "../components/FlightScheduler";

const FlightsPage = () => {
  return (
    <div id="flights-page">
      <CoverPhoto />
      <FlightScheduler />
    </div>
  );
};

export default FlightsPage;
