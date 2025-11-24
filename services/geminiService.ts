import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// In-memory cache to store results
const selfAttentionCache = new Map<string, any>();
const crossAttentionCache = new Map<string, any>();

export const analyzeSelfAttention = async (sentence: string): Promise<{ matrix: number[][], explanation: string, tokens?: string[] }> => {
  // Check cache first
  if (selfAttentionCache.has(sentence)) {
    return selfAttentionCache.get(sentence);
  }

  // Static override for the Homonym "Manga" demo
  if (sentence.includes("costureira consertou a manga") || sentence.includes("manga da camisa")) {
    const tokens = sentence.trim().split(/\s+/);
    const n = tokens.length;
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));

    // Generate realistic causal attention patterns (Dense lower triangle)
    for (let i = 0; i < n; i++) {
      let rowSum = 0;
      for (let j = 0; j <= i; j++) {
        // 1. Locality bias: recent tokens get more attention
        // Distance 0 (self) -> 1.0, Dist 1 -> 0.5, Dist 2 -> 0.33...
        let score = 1.0 / (Math.abs(i - j) + 1);

        // 2. Add some random noise for "reality"
        score += Math.random() * 0.15;

        // 3. Strong self-attention
        if (i === j) score += 0.8;

        matrix[i][j] = score;
        rowSum += score;
      }

      // Normalize row (Softmax-like)
      for (let j = 0; j <= i; j++) {
        matrix[i][j] /= rowSum;
      }
    }

    // Helper to find token index
    const idx = (word: string, startFrom = 0) => tokens.findIndex((t, i) => i >= startFrom && t.toLowerCase().includes(word));

    const costureira = idx("costureira");
    const consertou = idx("consertou");
    const manga1 = idx("manga");
    const camisa = idx("camisa");
    const comia = idx("comia");
    const manga2 = idx("manga", manga1 + 1);
    const doce = idx("doce");

    // Boost specific semantic connections for the demo narrative
    const boost = (source: number, target: number, value: number) => {
      if (source !== -1 && target !== -1 && target <= source) {
        // Set a high value, overriding the background noise
        matrix[source][target] = value;
      }
    };

    // 1. Manga (Roupa) relationships
    if (manga1 !== -1) {
      boost(manga1, costureira, 0.45);
      boost(manga1, consertou, 0.4);
    }

    // 2. Camisa relationship
    boost(camisa, manga1, 0.6);

    // 3. Context continuity
    if (comia !== -1 && costureira !== -1) boost(comia, costureira, 0.3);

    // 4. Manga (Fruta) relationships
    if (manga2 !== -1) {
      boost(manga2, comia, 0.7);
      if (costureira !== -1) matrix[manga2][costureira] *= 0.1; // Suppress wrong context
    }

    // 5. Doce relationship
    boost(doce, manga2, 0.6);

    const result = {
      matrix,
      tokens,
      explanation: "Visualização completa da atenção: Cada palavra atende a todas as anteriores (máscara causal), com pesos maiores em conexões gramaticais e semânticas relevantes."
    };

    selfAttentionCache.set(sentence, result);
    return result;
  }

  try {
    const ai = getClient();
    const modelId = "gemini-2.5-flash";

    const prompt = `
      Analise as relações semânticas e sintáticas entre as palavras da seguinte frase em Português: "${sentence}".
      Imagine um mecanismo de auto-atenção (self-attention).
      Forneça uma matriz (N x N) onde N é o número de tokens.
      A célula [i][j] deve representar o quanto a palavra na posição 'i' depende ou se relaciona com a palavra na posição 'j'.
      
      Destaque relações como:
      1. Correferência (pronomes -> nomes)
      2. Sujeito -> Verbo
      3. Adjetivo -> Substantivo
      
      Se a frase for "Conhecimento, paixão e muito trabalho...", mostre como esses conceitos se reforçam.
      
      Forneça também uma breve explicação EM PORTUGUÊS do Brasil sobre as conexões mais fortes.
      
      Retorne o formato JSON com:
      - matrix: array 2D de números (0-1)
      - tokens: array de strings (os tokens usados)
      - explanation: string (em português)
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matrix: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              }
            },
            tokens: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            explanation: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text);
    // Cache the successful result
    selfAttentionCache.set(sentence, result);
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback mock data
    const tokens = sentence.split(" ");
    // Heuristic for the specific complex sentence fallback if API fails
    let matrix;
    if (sentence.startsWith("Conhecimento")) {
      // Mock specific strong connections for the demo phrase
      const n = tokens.length;
      matrix = Array(n).fill(0).map(() => Array(n).fill(0.05));
      // Hardcode some "attention" just for visual flair in fallback
      // "pilares" attends to "Conhecimento", "paixão", "trabalho"
      const pilaresIdx = tokens.findIndex(t => t.includes("pilares"));
      if (pilaresIdx !== -1) {
        matrix[pilaresIdx][0] = 0.8; // Conhecimento
        matrix[pilaresIdx][1] = 0.8; // paixão
        matrix[pilaresIdx][4] = 0.8; // trabalho
      }
    } else {
      matrix = tokens.map(() => tokens.map(() => Math.random() * 0.3));
    }

    const result = {
      matrix: matrix,
      tokens: tokens,
      explanation: "Simulação (API Indisponível): Exibindo padrões de atenção simulados para demonstração."
    };

    // Cache the fallback result so we don't retry/flicker
    selfAttentionCache.set(sentence, result);
    return result;
  }
};

export const getCrossAttentionScenario = async (customSource?: string, customTarget?: string): Promise<{ source: string, target: string, alignment: number[][] }> => {
  const cacheKey = `${customSource || 'default'}|${customTarget || 'default'}`;

  if (crossAttentionCache.has(cacheKey)) {
    return crossAttentionCache.get(cacheKey);
  }

  // OFFLINE STATIC OVERRIDE: "The Black Cat" (O Gato Preto)
  // This demonstrates Adjective Noun inversion visually (Cross Pattern)
  if ((!customSource && !customTarget) || (customSource && customSource.includes("gato preto"))) {
    const s = "O gato preto saltou sobre o muro alto .";
    const t = "The black cat jumped over the high wall .";

    const sTokens = s.split(" ");
    const tTokens = t.split(" ");
    const sLen = sTokens.length;
    const tLen = tTokens.length;

    // Manual Alignment Matrix
    // Row: Target Index (EN), Col: Source Index (PT)
    const alignment = Array(tLen).fill(0).map(() => Array(sLen).fill(0));

    const setAlign = (tIdx: number, sIdx: number, strength: number) => {
      if (tIdx < tLen && sIdx < sLen) alignment[tIdx][sIdx] = strength;
    };

    // 0: The -> O (0)
    setAlign(0, 0, 0.95);

    // 1: black (Adj) -> preto (2) (Adj) CROSSES!
    setAlign(1, 2, 0.95);

    // 2: cat (Noun) -> gato (1) (Noun)
    setAlign(2, 1, 0.95);

    // 3: jumped -> saltou (3)
    setAlign(3, 3, 0.95);

    // 4: over -> sobre (4)
    setAlign(4, 4, 0.95);

    // 5: the -> o (5)
    setAlign(5, 5, 0.95);

    // 6: high (Adj) -> alto (7) (Adj) CROSSES!
    setAlign(6, 7, 0.95);

    // 7: wall (Noun) -> muro (6) (Noun)
    setAlign(7, 6, 0.95);

    // 8: . -> . (8)
    setAlign(8, 8, 0.95);

    const result = {
      source: s,
      target: t,
      alignment: alignment
    };

    crossAttentionCache.set(cacheKey, result);
    return result;
  }

  // OFFLINE STATIC OVERRIDE: "Conhecimento..." (Old Default)
  if (customSource && customSource.includes("Conhecimento, paixão")) {
    const s = "Conhecimento, paixão e muito trabalho são os pilares fundamentais que sustentam qualquer grande realização.";
    const t = "Knowledge, passion, and hard work are the fundamental pillars that sustain any great achievement.";

    const sTokens = s.split(" ");
    const tTokens = t.split(" ");
    const sLen = sTokens.length;
    const tLen = tTokens.length;

    const alignment = Array(tLen).fill(0).map(() => Array(sLen).fill(0));
    const setAlign = (tIdx: number, sIdx: number, strength: number) => {
      if (tIdx < tLen && sIdx < sLen) alignment[tIdx][sIdx] = strength;
    };

    setAlign(0, 0, 0.95); // Knowledge
    setAlign(1, 1, 0.95); // Passion
    setAlign(2, 2, 0.9);  // and
    setAlign(3, 3, 0.7);  // hard -> muito
    setAlign(3, 4, 0.5);  // hard -> trabalho
    setAlign(4, 4, 0.95); // work -> trabalho
    setAlign(5, 5, 0.9);  // are
    setAlign(6, 6, 0.9);  // the
    setAlign(7, 8, 0.95); // fundamental -> fundamentais
    setAlign(8, 7, 0.95); // pillars -> pilares
    setAlign(9, 9, 0.9);  // that
    setAlign(10, 10, 0.95); // sustain
    setAlign(11, 11, 0.95); // any
    setAlign(12, 12, 0.95); // great
    setAlign(13, 13, 0.95); // achievement

    const result = {
      source: customSource || s,
      target: customTarget || t,
      alignment: alignment
    };

    crossAttentionCache.set(cacheKey, result);
    return result;
  }

  try {
    const ai = getClient();
    const modelId = "gemini-2.5-flash";

    let prompt;
    if (customSource && customTarget) {
      prompt = `
          Atue como um mecanismo de Atenção Cruzada (Cross-Attention) em tradução automática (PT-BR para EN).
          Analise o alinhamento entre a frase fonte (PT): "${customSource}" e a frase alvo (EN): "${customTarget}".
          Forneça uma matriz de alinhamento (Tamanho Alvo x Tamanho Fonte) onde os valores (0 a 1) representam o quanto a palavra em Inglês (Alvo) atende à palavra em Português (Fonte) para ser gerada.
          Retorne JSON.
        `;
    } else {
      prompt = `
          Gere uma frase complexa e inspiradora em Português do Brasil e sua tradução para o Inglês.
          A frase deve ser sobre tecnologia, futuro ou aprendizado.
          Forneça uma matriz de alinhamento (Tamanho Alvo x Tamanho Fonte) onde 1 significa que as palavras se alinham/traduzem.
          Retorne JSON.
        `;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            source: { type: Type.STRING, description: "Frase em Português" },
            target: { type: Type.STRING, description: "Tradução em Inglês" },
            alignment: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    const result = JSON.parse(text);

    crossAttentionCache.set(cacheKey, result);
    return result;

  } catch (e) {
    // Fallback logic for unknown inputs if API fails
    const s = customSource || "Entrada desconhecida.";
    const t = customTarget || "Unknown input.";
    const sTokens = s.split(" ");
    const tTokens = t.split(" ");

    const result = {
      source: s,
      target: t,
      alignment: Array(tTokens.length).fill(0).map(() => Array(sTokens.length).fill(0.1))
    };

    crossAttentionCache.set(cacheKey, result);
    return result;
  }
}