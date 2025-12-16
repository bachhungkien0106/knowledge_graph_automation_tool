# EcoWeb — A Generative Interface for Systemic Nature

> As ecological complexity becomes increasingly difficult to grasp through linear text, static databases fail to capture the fragility and interdependence of the natural world.

## Context & Question

In the digital age, our access to biological information is vast but fragmented. We typically encounter nature through isolated search queries, Wikipedia articles, or static diagrams that strip away context. While we have more data than ever, we lack the intuitive interfaces to understand the *relationships* that define ecosystems.

This disconnect creates a tension: we are told that "everything is connected," but our digital tools present the world as a list of separate items.

This raises a question: **How might generative AI and interactive physics reshape how we perceive, manipulate, and understand ecological interdependence?**

## Forces & Trends

Today, educational platforms and search engines promise instant answers. However, they often prioritize direct retrieval over contextual understanding. Underneath these narratives, technologies like Large Language Models (LLMs) and force-directed graph algorithms are making it possible to model complexity in real-time.

*   **Technological:** The shift from keyword search to semantic reasoning allows AI (like Google Gemini) to understand *causality*, not just definitions.
*   **Cultural:** There is a growing demand for "Systems Thinking"—moving beyond isolated facts to understanding loops, feedbacks, and cascades in the environment.

EcoWeb leverages these forces, utilizing Gemini 2.5 Flash for causal inference and D3.js for visual physics to bridge the gap between raw data and human intuition.

## Design Response (Concept)

We imagine **EcoWeb**, a generative knowledge graph designed to visualize the invisible threads connecting species, habitats, and biological concepts.

Instead of reading a linear article about "Trophic Cascades," it allows people to build and break a living ecosystem on their screen. It transforms the abstract concept of "biodiversity" into a tangible, fragile structure.

The design treats information as physical matter—nodes have weight, links have tension, and the entire system reacts kinetically to user intervention.

## How It Works (Experience)

A person enters a topic (e.g., "The Amazon Rainforest" or "Carbon Cycle") and is presented with a living network of floating nodes.

1.  **Exploration:** The system uses Gemini to generate entities and relationships, rendering them as a physics simulation. Fundamental pillars (Sun, Water) are anchored, while derived species float in orbit.
2.  **Manipulation:** The user drags nodes to feel the tension of connections or uses the "Jolt" function to physically reshuffle the ecosystem.
3.  **Simulation (The "What If"):** The user enters "Stress Test Mode" and removes a keystone species (e.g., The Wolf). The system uses AI to predict the ripple effects—prey populations turn red (thriving/overpopulated), while dependent species turn grey (endangered).
4.  **Research:** Users can inject external concepts (e.g., "Plastic Pollution") to see how they graft onto the existing biological network.

The experience feels like manipulating a digital spiderweb rather than browsing a library catalog.

## Making Of (Process)

We combined high-performance frontend engineering with prompt engineering to create a seamless feedback loop between the user and the AI.

*   **Tech Stack:** Built with React 19, D3.js (v7) for the physics engine, and Google Gemini 2.5 Flash for the intelligence layer.
*   **Iterations:** Early versions were static charts. We iterated to add "Simulation Mode," moving from simple visual removal to AI-driven inference of biological consequences.
*   **Refinement:** We developed specific visual grammars—ringed nodes for foundational elements and color-coded arrows for correlation types—to make the topology instantly readable.

## Reflections & Next Steps

This project is not a replacement for scientific fieldwork, but a lens on how AI can serve as a "reasoning engine" for complexity. It suggests that the future of education isn't just about accessing facts, but about simulating consequences.

It raises questions such as:
*   How do we balance the "hallucination" risks of Generative AI with the need for scientific accuracy?
*   Can interfaces like this foster empathy for species we rarely see?

Future work could explore integrating real-time climate data APIs, allowing the graph to react to live weather patterns, or implementing multi-agent simulations where nodes "act" independently over time.

---

**Project setup:**
1. Clone repository.
2. `npm install`
3. Set `API_KEY` (Google Gemini) in environment.
4. `npm start`
