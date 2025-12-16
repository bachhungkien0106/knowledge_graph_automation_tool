import { GoogleGenAI, Type } from "@google/genai";
import { GraphData, NodeGroup, ResearchResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_ID = 'gemini-2.5-flash';

const cleanJson = (text: string) => {
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const fetchInitialGraph = async (topic: string = "Tech Sector Portfolio"): Promise<GraphData> => {
  if (!apiKey) throw new Error("API Key not found");

  const prompt = `
    Create a financial knowledge graph about "${topic}".
    Generate about 10-15 diverse nodes representing financial assets, macro factors, sectors, or key concepts.
    
    Generate connections (links) between them representing correlations or dependencies.
    For each link:
    1. Provide a concise active verb for the 'relation' (e.g., "hedges", "correlates with", "supplies", "competitor").
    2. Classify the 'effect' of the source on the target as:
       - 'positive' (High positive correlation or beneficial relationship)
       - 'negative' (Inverse correlation or competitor)
       - 'neutral' (Loose connection)
    
    Ensure a mix of groups: Equity, ETF, Crypto, Commodity, Macro, Sector, Concept.
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
                ticker: { type: Type.STRING, description: "Stock ticker or symbol if applicable" },
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
    console.error("Failed to parse Gemini response:", text, e);
    return { nodes: [], links: [] };
  }
};

export const generateGraphFromText = async (userText: string): Promise<GraphData> => {
  if (!apiKey) throw new Error("API Key not found");

  const prompt = `
    Analyze the following financial notes/portfolio data and extract a knowledge graph.
    
    USER TEXT:
    """
    ${userText.slice(0, 10000)}
    """
    
    INSTRUCTIONS:
    1. Extract key assets (Stocks, Crypto, etc.) or economic concepts. Map them to: Equity, ETF, Crypto, Commodity, Macro, Sector, Concept.
    2. Extract relationships (correlations, holdings, dependencies).
    3. Determine the 'effect' (positive correlation, inverse/hedge, neutral).
    
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
                ticker: { type: Type.STRING },
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
    The user is analyzing a financial graph. 
    They selected the asset/concept: "${nodeLabel}".
    Existing visible nodes are: ${currentContextNodes.slice(0, 20).join(', ')}...
    
    Generate 5-8 NEW nodes that are financially related (competitors, suppliers, correlated assets, or key concepts) to "${nodeLabel}" but NOT already in the list.
    
    For each link, specify the 'relation' and 'effect' (positive/negative correlation).
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
                ticker: { type: Type.STRING },
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

  const prompt = `Provide a concise financial summary for "${nodeLabel}". Include recent market sentiment, key risks, and primary sector. Do not use markdown formatting.`;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
  });

  return response.text || "No details available.";
};

export interface ImpactResult {
  summary: string;
  impactedNodes: {
    id: string;
    health: 'bullish' | 'bearish' | 'volatile' | 'neutral';
  }[];
}

export const simulateEcosystemChange = async (
  shockEventNode: string, 
  allNodes: {id: string, label: string}[],
  allLinks: {source: string, target: string, relation: string, effect: string}[]
): Promise<ImpactResult> => {
  if (!apiKey) throw new Error("API Key not found");

  const nodesList = allNodes.map(n => `"${n.label}" (ID: ${n.id})`).join(", ");
  const linksList = allLinks.map(l => `${l.source} ${l.relation} ${l.target} (${l.effect})`).slice(0, 30).join("; ");

  const prompt = `
    Run a Market Stress Test.
    Scenario: The asset/factor "${shockEventNode}" has crashed or experienced a major negative shock (e.g. Bankruptcy, Regulation, Price Crash).

    Context Graph:
    Nodes: ${nodesList}
    Links: ${linksList}

    Predict the immediate market reaction on the OTHER nodes.
    Rules:
    - Highly positive correlated assets should become 'bearish'.
    - Inverse correlated assets (Safe havens, Hedges) should become 'bullish'.
    - Unrelated assets remain 'neutral' or 'volatile'.

    Return a short summary of the market impact, and a list of specific nodes that change status.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          impactedNodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                health: { type: Type.STRING, enum: ['bullish', 'bearish', 'volatile', 'neutral'] }
              },
              required: ["id", "health"]
            }
          }
        },
        required: ["summary", "impactedNodes"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from Gemini for simulation");

  try {
    return JSON.parse(cleanJson(text));
  } catch (e) {
    console.error("Simulation parse error", e);
    return { summary: "Simulation failed.", impactedNodes: [] };
  }
};

export const researchExternalConnection = async (
    targetConcept: string,
    currentNodes: { label: string }[]
  ): Promise<ResearchResult> => {
    if (!apiKey) throw new Error("API Key not found");
  
    const nodeList = currentNodes.map(n => n.label).slice(0, 40).join(", ");
  
    const prompt = `
      The user is managing a portfolio with these assets: [${nodeList}].
      
      The user wants to investigate a NEW asset/concept: "${targetConcept}".
      
      Tasks:
      1. Explain in 2-3 sentences how "${targetConcept}" correlates or relates to the existing portfolio.
      2. Identify specific EXISTING nodes it should connect to (Competitors, Correlated assets).
      3. Define the new node details.
      
      Output strictly JSON.
    `;
  
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            newNode: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                group: { type: Type.STRING, enum: Object.values(NodeGroup) },
                description: { type: Type.STRING }
              },
              required: ["label", "group", "description"]
            },
            connections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetNodeLabel: { type: Type.STRING },
                  relation: { type: Type.STRING },
                  effect: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] }
                },
                required: ["targetNodeLabel", "relation", "effect"]
              }
            }
          },
          required: ["summary", "newNode", "connections"]
        }
      }
    });
  
    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini for research");
  
    try {
      return JSON.parse(cleanJson(text));
    } catch (e) {
      throw new Error("Failed to parse research results.");
    }
  };

export const chatWithGraphAssistant = async (
    question: string,
    graphData: GraphData,
    messageHistory: { role: string, content: string }[]
  ): Promise<string> => {
    if (!apiKey) throw new Error("API Key not found");
  
    const nodesContext = (graphData.nodes || []).map(n => {
        let status = n.sentiment || 'neutral';
        return `- ${n.label} (${n.ticker || n.group}) [Sentiment: ${status}]`;
    }).join("\n");
  
    const linksContext = (graphData.links || []).map(l => {
        const source = typeof l.source === 'object' ? (l.source as any).label : l.source;
        const target = typeof l.target === 'object' ? (l.target as any).label : l.target;
        return `- ${source} ${l.relation} ${target} (${l.effect})`;
    }).slice(0, 40).join("\n");
  
    const systemInstruction = `
      You are an expert Financial Analyst Assistant named "FinGuide".
      You are analyzing a live knowledge graph of an investment portfolio/market map.
      
      CURRENT GRAPH DATA:
      Assets:
      ${nodesContext}
      
      Correlations/Links:
      ${linksContext}
      
      INSTRUCTIONS:
      1. Answer the user's question based PRIMARILY on the graph data.
      2. If asked about risk, look for 'negative' correlations (hedges) or lack of diversity.
      3. Keep answers concise and professional.
      4. Highlight specific asset names in double asterisks (e.g., **AAPL**).
    `;
  
    const historyContext = messageHistory.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'FinGuide'}: ${m.content}`).join("\n\n");
  
    const content = `
      Conversation History:
      ${historyContext}
  
      Current Question:
      ${question}
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: content,
        config: {
          systemInstruction: systemInstruction,
        }
      });
    
      return response.text || "I'm having trouble analyzing the market data right now.";
    } catch (e) {
      console.error("Gemini Assistant Error", e);
      return "I encountered an error connecting to the analysis service. Please try again later.";
    }
  };