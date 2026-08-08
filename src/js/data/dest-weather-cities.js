'use strict';
/**
 * Destination card → weather city coords (matches tools-weather MAJOR list).
 * Shared by homepage weather chips and tools-weather deep links (?city=slug).
 */
window.DEST_WEATHER_CITIES = {
  nyc:      { name: 'New York', admin1: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
  la:       { name: 'Los Angeles', admin1: 'California', lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' },
  chicago:  { name: 'Chicago', admin1: 'Illinois', lat: 41.8781, lon: -87.6298, tz: 'America/Chicago' },
  miami:    { name: 'Miami', admin1: 'Florida', lat: 25.7617, lon: -80.1918, tz: 'America/New_York' },
  nola:     { name: 'New Orleans', admin1: 'Louisiana', lat: 29.9511, lon: -90.0715, tz: 'America/Chicago' },
  vegas:    { name: 'Las Vegas', admin1: 'Nevada', lat: 36.1699, lon: -115.1398, tz: 'America/Los_Angeles' },
  sf:       { name: 'San Francisco', admin1: 'California', lat: 37.7749, lon: -122.4194, tz: 'America/Los_Angeles' },
  seattle:  { name: 'Seattle', admin1: 'Washington', lat: 47.6062, lon: -122.3321, tz: 'America/Los_Angeles' },
  austin:   { name: 'Austin', admin1: 'Texas', lat: 30.2672, lon: -97.7431, tz: 'America/Chicago' },
  dc:       { name: 'Washington', admin1: 'District of Columbia', lat: 38.9072, lon: -77.0369, tz: 'America/New_York' },
  honolulu: { name: 'Honolulu', admin1: 'Hawaii', lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu' },
  boston:   { name: 'Boston', admin1: 'Massachusetts', lat: 42.3601, lon: -71.0589, tz: 'America/New_York' }
};
