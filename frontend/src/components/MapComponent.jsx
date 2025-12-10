import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import L from 'leaflet';

// Fix for default Leaflet marker icons not showing in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapComponent = ({ books }) => {
  // Default center (India) if no books
  const defaultCenter = [20.5937, 78.9629]; 
  
  // Use the first book's location as center, or fallback to default
  const center = books.length > 0 && books[0].location 
    ? [books[0].location.coordinates[1], books[0].location.coordinates[0]] 
    : defaultCenter;

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden shadow-lg border border-gray-300 z-0">
      <MapContainer center={center} zoom={5} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        
        {/* The Map Tiles (Skin) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render a Pin for each book */}
        {books.map((book) => (
          book.location && (
            <Marker 
              key={book._id} 
              // MongoDB stores as [Lng, Lat], Leaflet needs [Lat, Lng]
              position={[book.location.coordinates[1], book.location.coordinates[0]]}
            >
              <Popup>
                <div className="text-center">
                  <img src={book.image?.url} alt={book.title} className="w-16 h-16 object-cover mx-auto mb-2 rounded"/>
                  <h3 className="font-bold text-sm">{book.title}</h3>
                  <p className="text-green-600 font-bold">₹{book.price}</p>
                  <Link to={`/book/${book._id}`} className="text-blue-500 text-xs underline block mt-1">
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;