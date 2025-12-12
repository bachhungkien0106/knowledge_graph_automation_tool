# 🧮 Algorithms & Logic

## 1. Force-Directed Layout (D3.js)
The visualization uses a physics simulation to organize the graph naturally.

*   **Center Force:** Keeps the graph centered in the viewport.
*   **Charge (Repulsion):** Nodes repel each other (`strength: -600`) to prevent overlap.
*   **Collision Detection:** Prevents nodes from physically clipping into each other (`radius: 60`).
*   **Link Distance:** Links act as springs, pulling connected nodes together (`distance: 200`).

## 2. Pathfinding (BFS)
To find connections between two nodes, we implement a **Breadth-First Search** in `App.tsx`.

**Why BFS?** We want the *shortest* path (fewest hops) between ecological entities, not necessarily a weighted path.

```typescript
// Pseudocode Logic
function findShortestPath(start, end, graph) {
  let queue = [[start]];
  let visited = new Set();
  
  while (queue.length > 0) {
    let path = queue.shift();
    let node = path[path.length - 1];
    
    if (node === end) return path;
    
    for (let neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
}
```

## 3. Generative Schema Enforcement
We use the Google GenAI SDK's `responseSchema` to guarantee that the AI output is parseable by our visualization engine.

**Structure:**
*   **Nodes:** Must contain `id`, `label`, `group` (Enum), `role` (Enum: Fundamental/Derived).
*   **Links:** Must contain `source`, `target`, `relation`, `effect` (Enum: Positive/Negative/Neutral).

**Role Logic:**
The AI determines the topological importance of a node:
*   `Fundamental` -> `r=28`, double-ring border.
*   `Derived` -> `r=18`, standard border.

## 4. Simulation Inference
The ecosystem collapse logic combines Graph Theory with LLM Inference.

1.  **Subgraph Extraction:** The system serializes the current graph state into a text prompt.
2.  **Causal Reasoning:** The prompt instructs the LLM to apply ecological rules:
    *   `Loss of Habitat` -> `Status: Extinct`
    *   `Loss of Food` -> `Status: Endangered`
    *   `Loss of Threat` -> `Status: Thriving`
3.  **State Mapping:** The JSON result is mapped back to the D3 data array, updating the `health` property which triggers CSS filters (Grayscale for Extinct, Red glow for Thriving).