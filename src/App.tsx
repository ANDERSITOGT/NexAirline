import { useState } from 'react'
import './App.css'

const flights = [
  { code: 'NX 204', airline: 'NexAirline', from: 'MAD', to: 'JFK', depart: '09:40', arrive: '12:15', duration: '8h 35m', price: 429, tag: 'Best value', tone: 'orange' },
  { code: 'NX 118', airline: 'NexAirline', from: 'MAD', to: 'JFK', depart: '13:20', arrive: '15:55', duration: '8h 35m', price: 512, tag: 'Most popular', tone: 'blue' },
  { code: 'NX 332', airline: 'NexAirline', from: 'MAD', to: 'JFK', depart: '19:05', arrive: '21:40', duration: '8h 35m', price: 386, tag: 'Lowest price', tone: 'green' },
]

function App() {
  const [selectedFlight, setSelectedFlight] = useState(flights[0].code)
  const [tripType, setTripType] = useState('Round trip')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="NexAirline home"><span className="brand-mark">N</span><span>NEX<span>AIRLINE</span></span></a>
        <nav className="main-nav" aria-label="Main navigation"><a className="active" href="#book">Book</a><a href="#trips">My trips</a><a href="#status">Flight status</a></nav>
        <div className="account-actions"><button className="icon-button" type="button" aria-label="Change language">EN</button><button className="avatar" type="button" aria-label="Open account menu">AR</button></div>
      </header>

      <section className="hero-panel" id="top"><div className="hero-copy"><p className="eyebrow">THE SKY, REIMAGINED</p><h1>Go further.<br /><em>Feel closer.</em></h1><p className="hero-description">Thoughtful journeys, designed around you. Find your next destination and make it count.</p></div><div className="route-illustration" aria-hidden="true"><span className="sun"></span><span className="route-line"></span><span className="plane">✦</span><span className="route-label label-start">MAD</span><span className="route-label label-end">JFK</span></div></section>

      <section className="search-card" id="book"><div className="trip-switcher" role="group" aria-label="Trip type">{['Round trip', 'One way', 'Multi-city'].map((type) => <button className={tripType === type ? 'selected' : ''} key={type} onClick={() => setTripType(type)} type="button">{type}</button>)}</div><div className="search-fields"><label><span>From</span><strong>Madrid <small>MAD</small></strong></label><button className="swap" type="button" aria-label="Swap origin and destination">⇄</button><label><span>To</span><strong>New York <small>JFK</small></strong></label><label><span>Departure</span><strong>18 Sep 2025</strong></label><label><span>Return</span><strong>26 Sep 2025</strong></label><label><span>Passengers</span><strong>1 adult <small>Economy</small></strong></label><button className="search-button" onClick={() => setIsSearchOpen(true)} type="button"><span>⌕</span> Search flights</button></div>{isSearchOpen && <p className="search-feedback" role="status">Showing the best routes for your journey.</p>}</section>

      <section className="results-section" id="trips"><div className="section-heading"><div><p className="eyebrow">YOUR NEXT DEPARTURE</p><h2>Madrid <span>→</span> New York</h2></div><button className="date-button" type="button">18 Sep 2025 <span>⌄</span></button></div><div className="results-layout"><aside className="filters"><p className="filter-title">Filter by</p><label><input type="checkbox" defaultChecked /> Non-stop only</label><label><input type="checkbox" /> Morning departure</label><label><input type="checkbox" /> Free seat selection</label><div className="filter-rule"></div><p className="filter-title">Cabin class</p><label><input type="radio" name="cabin" defaultChecked /> Economy</label><label><input type="radio" name="cabin" /> Premium</label><label><input type="radio" name="cabin" /> Business</label></aside><div className="flight-list">{flights.map((flight) => <article className={`flight-card ${selectedFlight === flight.code ? 'chosen' : ''}`} key={flight.code}><div className="flight-main"><div className="airline-name"><span className={`airline-dot ${flight.tone}`}></span><div><strong>{flight.airline}</strong><small>{flight.code} · Airbus A321neo</small></div></div><div className="flight-times"><strong>{flight.depart}</strong><span>{flight.duration}<i></i> Non-stop</span><strong>{flight.arrive}</strong></div><div className="flight-cities"><span>Madrid</span><span>New York</span></div></div><div className="flight-price"><span className={`tag ${flight.tone}`}>{flight.tag}</span><strong>${flight.price}</strong><small>per passenger</small><button className="select-button" type="button" onClick={() => setSelectedFlight(flight.code)}>{selectedFlight === flight.code ? 'Selected' : 'Select'}</button></div></article>)}</div></div></section>
      <footer><span>© 2025 NexAirline</span><span>Travel with intention.</span><a href="#status">Need help?</a></footer>
    </main>
  )
}

export default App
