# 🌿 EcoWeb: AI-Powered Nature Knowledge Graph

**EcoWeb** is an interactive, generative visualization tool that maps natural ecosystems using Graph Theory and Artificial Intelligence. By leveraging the **Google Gemini API**, it dynamically constructs complex food webs, symbiotic relationships, and environmental dependencies in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech](https://img.shields.io/badge/Built%20with-React%20%7C%20D3.js%20%7C%20Gemini%20API-green)

---

## 🧠 What is a Knowledge Graph?

A **Knowledge Graph** is a way of organizing data that highlights the relationships between things, rather than just listing them.

*   **Nodes (Entities):** In EcoWeb, these are Animals, Plants, Habitats, Elements (like Carbon), or Concepts (like Photosynthesis).
*   **Edges (Links):** These represent the relationship between nodes (e.g., "Wolf" *hunts* "Elk", or "Bees" *pollinate* "Flowers").

Unlike a standard database or encyclopedia, a knowledge graph allows us to see the **structure** of information. It reveals how an entity connects to the wider system.

## 🔬 Concepts & Theory

EcoWeb is built upon several key theoretical pillars:

### 1. Systems Thinking
Nature is not linear; it is a complex adaptive system. This tool moves away from linear learning (A causes B) to networked learning (A affects B, which affects C, which feeds back into A). It visualizes:
*   **Trophic Cascades:** How a predator at the top affects the geography of the land (e.g., Wolves in Yellowstone).
*   **Symbiosis:** Mutual dependence between species.

### 2. Fundamental vs. Derived Entities
The graph visually distinguishes between:
*   **Fundamental Nodes (Large, Ringed):** The foundational blocks of an ecosystem (The Sun, Water, Primary Producers, Key Habitats).
*   **Derived Nodes (Standard):** Entities that depend on the foundations (Consumers, specific behaviors).
*   *Theory:* This helps users immediately identify the "load-bearing" pillars of an ecosystem.

### 3. Graph Topology
We use a **Force-Directed Graph algorithm (D3.js)** to render the data. This physics-based simulation naturally clusters related items together, revealing "communities" within the ecosystem automatically.

---

## ✨ Benefits of EcoWeb

*   **For Education:** Visualizing the invisible. Students can see how "Climate Change" connects to "Coral Reefs" and "Fish Populations" in a single view.
*   **For Research:** The "Field Research" mode allows users to test hypotheses about how unconnected concepts might integrate into an existing system.
*   **Impact Analysis:** Users can simulate the extinction of a species to see the ripple effect, teaching the fragility of biodiversity.
*   **Serendipitous Discovery:** By expanding nodes, users discover species and relationships they didn't know existed.

---

## 🚀 Key Features

*   **Generative Mapping:** Type in any ecosystem (e.g., "Amazon Rainforest", "Deep Sea Vents") and AI generates a unique graph instantly.
*   **Impact Simulation (💀):** Select a node to "remove" it from the ecosystem. The AI analyzes the graph and calculates which other species would become endangered, extinct, or overpopulated.
*   **Field Research Assistant (🔬):** Ask about a concept *not* on the map. The AI analyzes how it fits into the *current* graph context and integrates it visually.
*   **Pathfinding (📍):** Find the shortest ecological connection between two disparate entities (e.g., "How does a 'Mushroom' connect to a 'Hawk'?").
*   **Note Visualization:** Paste raw text notes, and the AI converts them into a structured graph.

---

## 📖 How to Use

### 1. Explore
Type a topic in the search bar (e.g., "Great Barrier Reef") and hit Enter. The graph will populate with key entities.

### 2. Interact
*   **Click** a node to view AI-generated scientific details.
*   **Drag** nodes to rearrange the view (physics are active!).
*   **Expand:** Click the "Expand" button in the info panel to generate *new* related nodes around the selection.

### 3. Analyze
*   **Simulation:** Click the **Pulse Icon (Activity)** in the toolbar to enter Simulation Mode. Click a node to simulate its extinction. Watch the health statuses of other nodes change (Red = Thriving, Orange = Endangered, Grey = Extinct).
*   **Pathfinding:** Click the **Route Icon**. Click two nodes to highlight the chain of interactions connecting them.

### 4. Research
Click the **Microscope Icon**. Type a concept (e.g., "Humans"). The AI will determine how Humans affect the specific graph you are currently looking at.

---

## 🛠️ Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/ecoweb.git
    cd ecoweb
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure API Key**
    You need a Google Gemini API Key.
    *   Get one here: [Google AI Studio](https://aistudio.google.com/)
    *   Set it in your environment (e.g., `.env` file or directly in the code for local testing, though `.env` is recommended).
    ```bash
    export API_KEY="your_google_api_key_here"
    ```

4.  **Run the App**
    ```bash
    npm start
    ```

---

## 💻 Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Visualization:** D3.js (Force Simulation)
*   **AI:** Google GenAI SDK (Gemini 2.5 Flash)
*   **Styling:** Tailwind CSS
*   **Icons:** Lucide React

---

*Powered by Google Gemini but control by Humans*