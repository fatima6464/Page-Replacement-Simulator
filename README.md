# 💾 Page Replacement Simulator

![HTML](https://img.shields.io/badge/HTML5-orange.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-CDN-38bdf8.svg)
![Status](https://img.shields.io/badge/Status-Academic%20Project-brightgreen.svg)

An **interactive, browser-based simulator** for visualizing memory page replacement algorithms — **FIFO**, **LRU**, and **Enhanced Second Chance (ESC)** — built as an **Operating Systems** course project. Instead of tracing algorithms by hand on paper, this tool animates every hit, miss, and replacement step-by-step with plain-language explanations.

---

## 📋 Overview

Page replacement is a core Operating Systems concept, but it's easy to lose track of *why* a particular page gets evicted just by reading pseudocode. This simulator makes the decision-making visible: enter a page reference string, pick an algorithm, and either step through it one reference at a time or run the whole thing and watch frames fill, hit, and get replaced in real time.

## ✨ Features

- 🎛️ **Configurable Simulation** — choose the algorithm, number of frames (1–10), and a custom or randomly generated page reference string
- ▶️ **Three Run Modes** — `Step` through one reference at a time, `Run All` for the full animated sequence, or `Next Step` (a sticky button) to keep advancing without scrolling back up
- 🔁 **Jump to Any Step** — click any page in the timeline to instantly replay the simulation up to that point
- 🎨 **Color-Coded Visualization** — green for hits, red for misses, yellow for replaced pages, with a highlighted pointer for ESC
- 📖 **Step-by-Step Explanations** — a plain-language breakdown of exactly why each hit, miss, or replacement happened
- 📊 **Live Summary Stats** — running total of faults, hits, and hit ratio
- ✅ **Input Validation** — clear error messages for invalid reference strings, unselected algorithms, or out-of-range frame counts
- 🖥️ **Landing Page** — a separate marketing-style home page introducing the three algorithms before linking into the simulator

## 🧠 Algorithms Implemented

| Algorithm | Strategy |
|---|---|
| **FIFO** (First-In-First-Out) | Evicts the page that has been in memory the longest, regardless of usage |
| **LRU** (Least Recently Used) | Evicts the page that hasn't been accessed for the longest time, tracked via a recency timestamp per frame |
| **ESC** (Enhanced Second Chance) | Combines reference (R) and modify (M) bits, scanning in up to three passes — (R=0,M=0) → (R=0,M=1) → reset R bits and retry — using a circular pointer, similar to the clock algorithm |

## 🛠️ Tech Stack

| Category | Details |
|---|---|
| Structure | HTML5 |
| Styling | Tailwind CSS (via CDN) |
| Logic | Vanilla JavaScript (no frameworks) |
| Pages | `index.html` (landing page), `simulator.html` (main simulator), `about.html` (algorithm details) |

## 📁 Project Structure

```
page-replacement-simulator/
├── index.html       # Landing page — intro, feature highlights, algorithm cards
├── simulator.html   # Main interactive simulator UI
├── about.html       # Detailed algorithm explanations (referenced, not included here)
├── script.js         # Core simulation logic (FIFO, LRU, ESC state machines)
└── README.md
```

## ▶️ How to Run

1. Clone or download this repository
2. Open `index.html` in any modern browser to view the landing page, or open `simulator.html` directly to jump straight into the tool
3. No build step or server required — it runs entirely client-side

```bash
git clone https://github.com/<your-username>/page-replacement-simulator.git
cd page-replacement-simulator
open index.html   # or simulator.html
```

## 🕹️ Usage

1. Select an algorithm (FIFO, LRU, or ESC)
2. Set the number of frames (1–10)
3. Enter a comma-separated page reference string (e.g. `1,2,3,2,4,1,5,2,1,2,3,4,5`) or click **Generate Random**
4. Click **Step** or **Next Step** to advance one reference at a time with an explanation, or **Run All** to animate the entire sequence
5. Click any page in the timeline to jump straight to that step
6. Watch the **Summary** panel update with total faults, hits, and hit ratio

## 🧠 Implementation Notes

- FIFO and LRU share a common state object (`fifoLruState`) and frame-tracking approach, differing only in how they select a victim frame on a fault (oldest load time vs. oldest access time)
- ESC pre-computes the entire simulation up front (`initSimulation`) rather than stepping live, so `Jump to Step` and `Run All` can replay any point instantly
- The modify (M) bit for ESC is derived synthetically — odd-numbered pages are treated as "modified" — since this is a simulation of memory access patterns rather than real writes

## 📚 What I Learned

- Translating textbook page-replacement pseudocode (FIFO, LRU, and the clock/second-chance family) into working, steppable state machines
- Managing complex, incrementally-updated UI state in vanilla JavaScript without a framework
- Designing an interface that explains *why* an algorithm made a decision, not just *what* it decided
- Structuring a small multi-page front-end project (landing page + tool + docs)

## 🔮 Future Improvements

- Add the Optimal (OPT) and Second Chance (non-enhanced) algorithms for comparison
- Side-by-side mode to run two algorithms on the same reference string at once
- Persist simulation history or export results (CSV/JSON)
- Refactor shared FIFO/LRU/ESC logic into reusable functions to reduce duplication

## 🎓 Course

Operating Systems — BS Computer Science

## 👩‍💻 Author

**Fatima Nadeem**
BS Computer Science

## 📎 Notes

- Requires an internet connection on first load (Tailwind CSS is pulled from CDN)
- Tested in modern Chromium/Firefox browsers; no build tools or dependencies needed

