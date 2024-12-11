import { useState, useEffect } from "react";
import axios from "axios";

import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import SearchIcon from "@mui/icons-material/Search";

const FlightScheduler = () => {
  const apiURL = import.meta.env.VITE_API_URL;
  const apiHost = import.meta.env.VITE_API_HOST;
  const apiKey = import.meta.env.VITE_APP_KEY;

  const [flightType, setFlightType] = useState(1);
  const [flightClass, setFlightClass] = useState(0);

  const [originInput, setOriginInput] = useState("");
  const [originOptions, setOriginOptions] = useState([]);
  const [originFocused, setOriginFocused] = useState(false);
  const [originLoading, setOriginLoading] = useState(false);
  const [originSelected, setOriginSelected] = useState(null);
  const [originError, setOriginError] = useState(null);

  const [destinationInput, setDestinationInput] = useState("");
  const [destinationOptions, setDestinationOptions] = useState([]);
  const [destinationFocused, setDestinationFocused] = useState(false);
  const [destinationLoading, setDestinationLoading] = useState(false);
  const [destinationSelected, setDestinationSelected] = useState(null);
  const [destinationError, setDestinationError] = useState(null);

  const [flightItineraries, setFlightItineraries] = useState([]);
  const [itinerariesLoading, setItinerariesLoading] = useState(false);
  const [itinerariesError, setItinerariesError] = useState(false);

  const [departureDate, setDepartureDate] = useState(dayjs(new Date()));

  const handleChangeOriginInput = (e) => {
    const value = e.target.value;
    setOriginInput(value);
  };

  const handleSelectOrigin = (e, airport) => {
    const { skyId, entityId } = airport;
    setOriginSelected({ skyId, entityId });
    setOriginInput(airport.navigation.localizedName);
  };

  const handleChangeDestinationInput = (e) => {
    const value = e.target.value;
    setDestinationInput(value);
  };

  const handleSelectDestination = (e, airport) => {
    const { skyId, entityId } = airport;
    setDestinationSelected({ skyId, entityId });
    setDestinationInput(airport.navigation.localizedName);
  };

  //Bug fix function, to add a slight delay before dropdown disappears so the list item buttons will recognize click event
  const handleBlurOriginDropdown = () => {
    setTimeout(() => {
      setOriginFocused(false);
    }, 200);
  };

  const handleBlurDestinationDropdown = () => {
    setTimeout(() => {
      setDestinationFocused(false);
    }, 200);
  };

  const searchAirport = async (query, airportType) => {
    const options = {
      method: "GET",
      url: `${apiURL}/v1/flights/searchAirport`,
      params: {
        query,
        locale: "en-US",
      },
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
    };

    if (airportType === 0) {
      if (!query) {
        setOriginOptions([]);
        return;
      }

      setOriginLoading(true);
      setOriginError(null);

      try {
        const response = await axios.request(options);
        const airportsData = response.data.data;
        setOriginOptions(airportsData);
      } catch (err) {
        setOriginError("Error fetching data");
        setOriginOptions([]);
      } finally {
        setOriginLoading(false);
      }
    } else {
      if (!query) {
        setDestinationOptions([]);
        return;
      }

      setDestinationLoading(true);
      setDestinationError(null);

      try {
        const response = await axios.request(options);
        const airportsData = response.data.data;
        setDestinationOptions(airportsData);
      } catch (err) {
        setDestinationError("Error fetching data");
        setDestinationOptions([]);
      } finally {
        setDestinationLoading(false);
      }
    }
  };

  const handleChangeDepartureDate = (dateValue) => {
    setDepartureDate(dateValue);
  };

  const searchFlights = async () => {
    const options = {
      method: "GET",
      url: `${apiURL}/v2/flights/searchFlights`,
      params: {
        originSkyId: originSelected.skyId,
        destinationSkyId: destinationSelected.skyId,
        originEntityId: originSelected.entityId,
        destinationEntityId: destinationSelected.entityId,
        date: dayjs(departureDate["$d"]).format("YYYY-MM-DD"),
        cabinClass: "economy",
        adults: "1",
        sortBy: "best",
        currency: "USD",
        market: "en-US",
        countryCode: "US",
      },
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
    };

    setItinerariesLoading(true);
    setItinerariesError(null);

    try {
      const response = await axios.request(options);
      const itineraries = response.data.data.itineraries;
      setFlightItineraries(itineraries);
    } catch (error) {
      setItinerariesError("Error fetching data");
      setFlightItineraries([]);
    } finally {
      setItinerariesLoading(false);
    }
  };

  const handleClickSearchFlights = async () => {
    if (originSelected && destinationSelected) {
      await searchFlights();
    } else {
      alert("Please select your flight origin or destination");
    }
  };

  const convertMinutesToHours = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr ${remainingMinutes} min`;
  };

  const formatDateToAMPM = (dateString) => {
    const date = new Date(dateString);

    let hours = date.getHours();
    let minutes = date.getMinutes();

    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    if (hours === 0) {
      hours = 12;
    }
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
  };

  // Debouncing the input to prevent multiple API calls in case user types fast
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      searchAirport(originInput, 0);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimeout); // Cleanup the debounce on input change
  }, [originInput]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      searchAirport(destinationInput, 1);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimeout); // Cleanup the debounce on input change
  }, [destinationInput]);

  return (
    <>
      <div id="flight-scheduler">
        <div id="flight-preferences" className="flight-input-group">
          <div>
            <FormControl
              sx={{
                minWidth: 120,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    border: "none",
                  },
                },
              }}
            >
              <Select
                value={flightType}
                // onChange={handleChange}
                displayEmpty
              >
                <MenuItem value={0}>Round trip</MenuItem>
                <MenuItem value={1}>One way</MenuItem>
                <MenuItem value={2}>Multi-city</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div>
            <FormControl
              sx={{
                minWidth: 120,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    border: "none",
                  },
                },
              }}
            >
              <Select
                value={flightClass}
                // onChange={handleChange}
                displayEmpty
              >
                <MenuItem value={0}>Economy</MenuItem>
                <MenuItem value={1}>Premium Economy</MenuItem>
                <MenuItem value={2}>Business</MenuItem>
                <MenuItem value={3}>First</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
        <div id="flight-locations-and-date">
          <div id="flight-locations" className="flight-input-group">
            <div className="flight-location-autocomplete">
              <TextField
                placeholder="Origin"
                onChange={handleChangeOriginInput}
                value={originInput}
                onFocus={() => setOriginFocused(true)}
                onBlur={handleBlurOriginDropdown}
                autoComplete="off"
                sx={{
                  width: "100%",
                  "& .MuiInputBase-root": {
                    height: "60px",
                  },
                }}
              />
              {originFocused && (
                <div className="dropdown-options">
                  {originLoading ? (
                    <CircularProgress />
                  ) : originOptions && originOptions.length ? (
                    <List sx={{ width: "100%" }}>
                      {originOptions.map((option, index) => (
                        <ListItemButton
                          key={index}
                          onClick={(e) => handleSelectOrigin(e, option)}
                        >
                          <ListItemText
                            primary={option.navigation.localizedName}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  ) : (
                    <ListItem>
                      <ListItemText>No nearby airports found</ListItemText>
                    </ListItem>
                  )}
                </div>
              )}
            </div>
            <div className="flight-location-autocomplete">
              <TextField
                placeholder="Destination"
                onChange={handleChangeDestinationInput}
                value={destinationInput}
                onFocus={() => setDestinationFocused(true)}
                onBlur={handleBlurDestinationDropdown}
                autoComplete="off"
                sx={{
                  width: "100%",
                  "& .MuiInputBase-root": {
                    height: "60px",
                  },
                }}
              />
              {destinationFocused && (
                <div className="dropdown-options">
                  {destinationLoading ? (
                    <CircularProgress />
                  ) : destinationOptions.length ? (
                    <List sx={{ width: "100%" }}>
                      {destinationOptions.map((option, index) => (
                        <ListItemButton
                          key={index}
                          onClick={(e) => handleSelectDestination(e, option)}
                        >
                          <ListItemText
                            primary={option.navigation.localizedName}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  ) : (
                    <ListItem>
                      <ListItemText>No nearby airports found</ListItemText>
                    </ListItem>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flight-date-picker flight-input-group">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Departure Date"
                value={departureDate}
                onChange={handleChangeDepartureDate}
                sx={{
                  width: "100%",
                  "& .MuiInputBase-root": {
                    height: "60px",
                  },
                }}
              />
            </LocalizationProvider>
          </div>
        </div>
        <div id="flight-scheduler-button-container">
          <Button
            variant="contained"
            sx={{
              fontWeight: "600",
              textTransform: "none",
              width: "120px",
            }}
            onClick={handleClickSearchFlights}
          >
            <SearchIcon />
            Explore
          </Button>
        </div>
      </div>
      <div id="flight-itineraries">
        <h1>Available Flights</h1>
        <div id="flight-itinerary-list">
          {itinerariesLoading ? (
            <CircularProgress />
          ) : flightItineraries.length ? (
            flightItineraries.map((itinerary, index) => (
              <div className="flight-itinerary" key={index}>
                <h3>{`${formatDateToAMPM(
                  itinerary.legs[0].departure
                )} - ${formatDateToAMPM(itinerary.legs[0].arrival)}`}</h3>
                <p>{`${itinerary.legs[0].origin.id} - ${itinerary.legs[0].destination.id}`}</p>
                <p>
                  {convertMinutesToHours(itinerary.legs[0].durationInMinutes)}
                </p>
                <p>{itinerary.price.formatted}</p>
              </div>
            ))
          ) : (
            <p>No flights found.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default FlightScheduler;
