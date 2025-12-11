import { GoogleGenAI, Type } from "@google/genai";
import { GraphData, NodeGroup } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_ID = 'gemini-2.5-flash';

// Helper to sanitize JSON string if needed (though responseSchema handles most)
const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const fetchInitialGraph = async (topic: string = "Nature ecosystem"): Promise<GraphData> => {
  if (!apiKey) throw new Error("API Key not found");

  const prompt = `
    Create a knowledge graph about "${topic}".
    Generate about 10-15 diverse nodes representing key entities (animals, plants, concepts, habitats).
    
    Generate connections (links) between them.
    For each link:
    1. Provide a concise active verb for the 'relation' (e.g., "eats", "pollinates", "hunts", "inhabits"). Keep it to 1-2 words if possible.
    2. Classify the 'effect' of the source on the target as:
       - 'positive' (beneficial, e.g., pollination, symbiosis, provides habitat)
       - 'negative' (harmful, e.g., predation, disease, competition)
       - 'neutral' (coexistence, connects to)
    
    Ensure a mix of groups: Animal, Plant, Fungi, Habitat, Concept, Element.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                group: { type: Type.STRING, enum: Object.values(NodeGroup) },
                description: { type: Type.STRING },
              },
              required: ["id", "label", "group", "description"]
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                relation: { type: Type.STRING },
                effect: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] }
              },
              required: ["source", "target", "relation", "effect"]
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from Gemini");
  
  try {
    const parsed = JSON.parse(cleanJson(text));
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const links = Array.isArray(parsed.links) ? parsed.links : [];
    
    // Defensive check: Ensure source/target exist in nodes
    const nodeIds = new Set(nodes.map((n: any) => n.id));
    const validLinks = links.filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target));

    return { nodes, links: validLinks };
  } catch (e) {
    console.error("Failed to parse Gemini response:", text, e);
    return { nodes: [], links: [] };
  }
};

export const generateGraphFromText = async (userText: string): Promise<GraphData> => {
  if (!apiKey) throw new Error("API Key not found");

  const prompt = `
    Analyze the following user notes/text and extract a knowledge graph structure from it.
    
    USER TEXT:
    """
    ${userText.slice(0, 10000)}
    """
    
    INSTRUCTIONS:
    1. Extract key entities (nodes) mentioned in the text. Map them to the closest group: Animal, Plant, Fungi, Habitat, Concept, Element. If unsure, use 'Concept'.
    2. Extract relationships (links) between these entities based explicitly on the text.
    3. Determine the 'effect' (positive, negative, neutral) based on the context of the text.
    4. Provide a short description for each node based on the text provided.
    
    Output strictly valid JSON matching the schema.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                group: { type: Type.STRING, enum: Object.values(NodeGroup) },
                description: { type: Type.STRING },
              },
              required: ["id", "label", "group", "description"]
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                relation: { type: Type.STRING },
                effect: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] }
              },
              required: ["source", "target", "relation", "effect"]
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from Gemini");
  
  try {
    const parsed = JSON.parse(cleanJson(text));
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const links = Array.isArray(parsed.links) ? parsed.links : [];
    
    const nodeIds = new Set(nodes.map((n: any) => n.id));
    const validLinks = links.filter((l: any) => nodeIds.has(l.source) && nodeIds.has(l.target));

    return { nodes, links: validLinks };
  } catch (e) {
    console.error("Failed to parse Gemini text analysis:", text, e);
    return { nodes: [], links: [] };
  }
};

export const expandNode = async (nodeLabel: string, currentContextNodes: string[]): Promise<GraphData> => {
  if (!apiKey) throw new Error("API Key not found");

  const prompt = `
    The user is exploring a knowledge graph about nature. 
    They selected the node: "${nodeLabel}".
    Existing visible nodes are: ${currentContextNodes.slice(0, 20).join(', ')}...
    
    Generate 5-8 NEW nodes that are directly related to "${nodeLabel}" but NOT already in the list.
    Also provide links connecting these new nodes to "${nodeLabel}" or other existing nodes if relevant.
    
    For each link, specify the 'relation' (active verb) and 'effect' (positive, negative, neutral).
  `;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                group: { type: Type.STRING, enum: Object.values(NodeGroup) },
                description: { type: Type.STRING },
              },
              required: ["id", "label", "group", "description"]
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                relation: { type: Type.STRING },
                effect: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] }
              },
              required: ["source", "target", "relation", "effect"]
            }
          }
        }
      }
    }
  });

  const text = response.text;
  if (!text) return { nodes: [], links: [] };
  
  try {
    const parsed = JSON.parse(cleanJson(text));
    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      links: Array.isArray(parsed.links) ? parsed.links : []
    };
  } catch (e) {
    console.error("Failed to parse Gemini expansion response:", text, e);
    return { nodes: [], links: [] };
  }
};

export const fetchNodeDetails = async (nodeLabel: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key not found");

  const prompt = `Provide a concise but interesting 3-sentence scientific summary about "${nodeLabel}" in the context of nature and ecology. Do not use markdown formatting.`;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
  });

  return response.text || "No details available.";
};