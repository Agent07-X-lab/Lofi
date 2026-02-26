import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Header from "./layout/Header";
import FirstTimeModal from "./components/Model/firstTimeModel";
import { useState } from "react";
import { chill, jazzy, sleep } from "./data/songData";

function App() {
  const [songs, setSongs] = useState<any[]>([...chill, ...jazzy, ...sleep]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Header />
              <Home
                songs={songs}
                setSongs={setSongs}
                currentSongIndex={currentSongIndex}
                setCurrentSongIndex={setCurrentSongIndex}
              />
            </>
          }
        />
      </Routes>
      <FirstTimeModal />
    </BrowserRouter>
  );
}

export default App;