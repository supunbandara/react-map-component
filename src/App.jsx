import "./App.css";
import Map from "./components/Map";

function App() {
  return (
    <div className="main-content">
      <div className="element--pt-default element--pb-default">
        <div className="element__main">
          <div className="container">
            <Map />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
