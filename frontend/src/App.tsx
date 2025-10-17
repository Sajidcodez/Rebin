import { Routes, Route } from 'react-router-dom'
// import { CameraUpload } from './components/CameraUpload'
//import { StatsPanel } from './components/StatsPanel'
import { Header } from './components/landingPage/header'
import { EarthBackground } from './components/landingPage/earthBackground'



function App() {
  return (
    
    
    <div className="min-h-screen flex flex-col bg-background">
      <EarthBackground />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* <Route path="/" element={<CameraUpload />} /> */}
          {/* <Route path="/stats" element={<StatsPanel />} /> */}
        </Routes>
      </main>
    </div>
  )
}

export default App
