# 🏗️ EcoWeb Architecture

## High-Level Overview

EcoWeb is a Single Page Application (SPA) designed to visualize complex ecological relationships. It acts as a visual bridge between unstructured biological data and a structured interactive graph.

The system follows a **Layered Architecture**:

1.  **Presentation Layer (React):** Handles UI state, modals, and user interactions.
2.  **Visualization Layer (D3.js):** Renders the physics-based graph and handles canvas interactions (zoom, drag).
3.  **Service Layer (Gemini SDK):** Acts as the data source and logic engine, transforming natural language into structured JSON.

---

## 🔧 Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** | Component-based UI structure. |
| **Visualization Engine** | **D3.js (v7)** | Force-directed physics simulations and SVG rendering. |
| **AI / Data Source** | **Google Gemini 2.5** | Generates graph topology, node details, and simulation outcomes. |
| **Styling** | **Tailwind CSS** | Utility-first styling for layout and glassmorphism effects. |
| **Icons** | **Lucide React** | Consistent iconography. |

---

## 🔄 Data Flow

### 1. Graph Generation
1.  **User Input:** User types a topic (e.g., "Amazon Rainforest").
2.  **Service Call:** `geminiService.ts` constructs a prompt with a strict JSON schema.
3.  **AI Processing:** Gemini 2.5 Flash generates entities (Nodes) and relationships (Links) based on ecological knowledge.
4.  **State Update:** `App.tsx` receives the JSON and updates the `graphData` state.
5.  **Rendering:** `ForceGraph.tsx` detects data changes and restarts the D3 simulation.

### 2. Simulation Mode (Impact Analysis)
1.  **Selection:** User clicks a node to "remove" it (extinction event).
2.  **Context Building:** The app sends the *current* graph structure (Nodes + Links) back to the AI.
3.  **Inference:** The AI predicts cascading effects (e.g., "If Wolves go extinct, Elk population thrives").
4.  **Visual Feedback:** The app updates specific node properties (`health: 'thriving' | 'endangered'`) which triggers visual style changes in D3.

---

## 📂 Directory Structure

```text
src/
├── components/
│   ├── ForceGraph.tsx       # The core D3 visualization wrapper
│   ├── InfoPanel.tsx        # Details sidebar
│   ├── Legend.tsx           # Filter controls
│   ├── NoteModal.tsx        # Text-to-Graph input
│   ├── ResearchModal.tsx    # "Add external concept" interface
│   └── GraphStats.tsx       # Statistics overlay
├── services/
│   └── geminiService.ts     # All AI interaction logic & prompt engineering
├── App.tsx                  # Main Controller / State Manager
├── types.ts                 # TypeScript Interfaces (GraphNode, GraphLink)
└── index.tsx                # Entry point
```