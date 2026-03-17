# Memory Management Visualizer (Paging)

Interactive paging visualizer with step-by-step animation, page-fault highlighting, algorithm comparison graph, dark mode, and auto simulation mode.

## Features
- Paging + memory frame visualization (blocks update per step)
- Page replacement algorithms: FIFO, LRU, Optimal (logic in **C++**)
- Step-by-step controls: Prev / Next
- Auto Simulation Mode: Play / Pause + speed slider
- Page fault highlight: 🔴 on fault steps
- Comparison graph (Chart.js): FIFO vs LRU vs Optimal
- Dark mode UI (portfolio vibe)

## Tech stack
- React + JavaScript
- TailwindCSS
- Chart.js (`react-chartjs-2`)
- Node + Express API
- C++ (algorithms + step generation)

## Setup
1) Install dependencies
```bash
npm install
```

2) Build the C++ simulator binary (requires `g++` on PATH)
```bash
npm run build:cpp
```

3) Start client + server
```bash
npm run dev
```

Client: `http://localhost:5173`  
API: `http://localhost:5174/api/health`

## Project structure
- `src/` React UI (simulator + comparison)
- `server/index.mjs` Express API that runs the C++ binary
- `server/cpp/simulator.cpp` FIFO/LRU/Optimal + JSON step output

