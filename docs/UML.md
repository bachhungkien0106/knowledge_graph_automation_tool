# 📊 System UML Diagrams

## 1. Component Diagram
Displays the hierarchy of the React application.

```mermaid
graph TD
    App[App.tsx] --> Header[Header / Toolbar]
    App --> ForceGraph[ForceGraph.tsx]
    App --> InfoPanel[InfoPanel.tsx]
    App --> Legend[Legend.tsx]
    App --> Modals[Modals Layer]
    
    ForceGraph --> D3[D3.js SVG Layer]
    
    Modals --> NoteModal[NoteModal.tsx]
    Modals --> ResearchModal[ResearchModal.tsx]
    Modals --> GraphStats[GraphStats.tsx]
    
    App --> Service[GeminiService.ts]
    Service --> API[Google GenAI API]
```

## 2. Sequence Diagram: Generating a Graph
How data flows from user input to visualization.

```mermaid
sequenceDiagram
    participant User
    participant App
    participant GeminiService
    participant GoogleAPI
    participant ForceGraph

    User->>App: Enters "Coral Reef"
    App->>App: Set Status "Loading"
    App->>GeminiService: fetchInitialGraph("Coral Reef")
    GeminiService->>GoogleAPI: generateContent(Prompt + Schema)
    GoogleAPI-->>GeminiService: JSON { nodes: [], links: [] }
    GeminiService-->>App: GraphData object
    App->>App: Update State (graphData)
    App->>ForceGraph: Pass new Data Prop
    ForceGraph->>ForceGraph: D3 Simulation Restart
    ForceGraph-->>User: Render Visual Graph
```

## 3. Sequence Diagram: Simulation Mode
The flow of an impact analysis event.

```mermaid
sequenceDiagram
    participant User
    participant App
    participant GeminiService
    participant GoogleAPI

    User->>App: Toggles Simulation Mode
    User->>App: Clicks Node "Wolf" (Remove)
    App->>GeminiService: simulateEcosystemChange("Wolf", currentNodes, currentLinks)
    GeminiService->>GoogleAPI: Send Graph Context + Removal Instruction
    GoogleAPI-->>GeminiService: JSON { impactedNodes: [{id, health: 'thriving'}] }
    GeminiService-->>App: ImpactResult
    App->>App: Update GraphData (Node Health)
    App-->>User: Visual Update (Red/Grey nodes)
```

## 4. Class Diagram (Data Models)
The TypeScript interfaces defining the domain model.

```mermaid
classDiagram
    class GraphNode {
        +string id
        +string label
        +string group
        +string role
        +string description
        +string health
        +number x
        +number y
    }

    class GraphLink {
        +string source
        +string target
        +string relation
        +string effect
    }

    class ResearchResult {
        +string summary
        +GraphNode newNode
        +Connection[] connections
    }

    class NodeGroup {
        <<enumeration>>
        ANIMAL
        PLANT
        FUNGI
        HABITAT
        CONCEPT
        ELEMENT
    }

    GraphLink --> GraphNode : connects
    GraphNode --> NodeGroup : belongs_to
```
