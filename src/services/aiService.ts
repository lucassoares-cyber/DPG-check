import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function analyzeTask(type: string, data: any): Promise<AnalysisResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  let prompt = "";
  let parts: any[] = [];

  try {
    switch (type) {
      case 'copy':
        prompt = `Você é um revisor sênior e copywriter especialista da DPG. Analise o seguinte texto:
        
        "${data.text}"
        
        Sua análise deve ser extremamente detalhada e cobrir:
        1. Ortografia e Gramática: Corrija todos os erros.
        2. Clareza e Coerência: O texto faz sentido? É fácil de ler?
        3. Estrutura e Persuasão: Se for comercial, avalie o poder de conversão.
        4. Melhorias de Copy: Como tornar o texto mais impactante?
        5. Sugestões Estratégicas: Dicas para o contexto do negócio.

        Retorne um JSON com:
        - resumo: Visão geral da análise.
        - pontos_positivos: O que está bom.
        - pontos_de_ajuste: O que precisa mudar.
        - sugestoes: Dicas práticas.
        - texto_corrigido: O texto com correções gramaticais.
        - melhorias_sugeridas: Lista de melhorias de redação.
        - versao_revisada: A versão final otimizada pronta para uso.
        - status: "Conforme" ou "Requer Ajustes".`;
        parts.push({ text: prompt });
        break;
        
      case 'site':
        prompt = `Você é um especialista em UX/UI, SEO e Auditoria Web da DPG. Analise o site na URL: ${data.url}.
        
        Sua auditoria deve cobrir:
        1. Estrutura: Botões, espaçamento, grid, alinhamento, responsividade.
        2. SEO: Hierarquia de títulos (H1-H3), meta description, title tag, palavras-chave, estrutura semântica.
        3. UX/UI: Clareza visual, hierarquia de informação, experiência do usuário.
        4. Performance básica.

        Retorne um JSON com:
        - resumo: Resumo da auditoria.
        - checklist_tecnico: Lista de itens (item, status: OK/Ajustar, observacao).
        - seo_analysis: Detalhes de H1-H3, meta, title, keywords.
        - ux_ui_analysis: Avaliação de clareza, hierarquia e experiência.
        - pontos_positivos, pontos_de_ajuste, sugestoes, conclusao.
        - status: "Conforme" ou "Requer Ajustes".`;
        parts.push({ text: prompt });
        
        // Use urlContext tool for site analysis
        const siteConfig = {
          tools: [{ urlContext: {} }]
        };
        
        const siteResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: { parts },
          config: {
            ...siteConfig,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                resumo: { type: Type.STRING },
                pontos_positivos: { type: Type.ARRAY, items: { type: Type.STRING } },
                pontos_de_ajuste: { type: Type.ARRAY, items: { type: Type.STRING } },
                sugestoes: { type: Type.ARRAY, items: { type: Type.STRING } },
                conclusao: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Conforme", "Requer Ajustes"] },
                checklist_tecnico: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      item: { type: Type.STRING },
                      status: { type: Type.STRING, enum: ["OK", "Ajustar"] },
                      observacao: { type: Type.STRING }
                    },
                    required: ["item", "status", "observacao"]
                  }
                },
                seo_analysis: {
                  type: Type.OBJECT,
                  properties: {
                    h1_h2_h3: { type: Type.STRING },
                    meta_description: { type: Type.STRING },
                    title_tag: { type: Type.STRING },
                    keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["h1_h2_h3", "meta_description", "title_tag", "keywords"]
                },
                ux_ui_analysis: {
                  type: Type.OBJECT,
                  properties: {
                    clareza_visual: { type: Type.STRING },
                    hierarquia_informacao: { type: Type.STRING },
                    experiencia_usuario: { type: Type.STRING }
                  },
                  required: ["clareza_visual", "hierarquia_informacao", "experiencia_usuario"]
                }
              },
              required: ["resumo", "pontos_positivos", "pontos_de_ajuste", "sugestoes", "conclusao", "status", "checklist_tecnico", "seo_analysis", "ux_ui_analysis"]
            }
          }
        });
        return JSON.parse(siteResponse.text || "{}");

      case 'imagem':
        prompt = `Você é um diretor de arte sênior da DPG. Analise as imagens enviadas.
        Avalie qualidade visual, composição, tipografia, espaçamento e consistência de marca.`;
        parts.push({ text: prompt });
        for (const imgBase64 of data.images) {
          parts.push({
            inlineData: {
              data: imgBase64.split(',')[1],
              mimeType: "image/png"
            }
          });
        }
        break;

      case 'social':
        prompt = `Você é um Social Media Manager sênior da DPG. Analise o post para a plataforma ${data.platform}:
        Legenda: ${data.text}
        Avalie copy, visual, formato para a plataforma, engajamento e acessibilidade.`;
        parts.push({ text: prompt });
        if (data.images) {
          for (const imgBase64 of data.images) {
            parts.push({
              inlineData: {
                data: imgBase64.split(',')[1],
                mimeType: "image/png"
              }
            });
          }
        }
        break;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumo: { type: Type.STRING },
            pontos_positivos: { type: Type.ARRAY, items: { type: Type.STRING } },
            pontos_de_ajuste: { type: Type.ARRAY, items: { type: Type.STRING } },
            sugestoes: { type: Type.ARRAY, items: { type: Type.STRING } },
            conclusao: { type: Type.STRING },
            status: { type: Type.STRING, enum: ["Conforme", "Requer Ajustes"] },
            // Optional fields for copy
            texto_corrigido: { type: Type.STRING },
            melhorias_sugeridas: { type: Type.ARRAY, items: { type: Type.STRING } },
            versao_revisada: { type: Type.STRING }
          },
          required: ["resumo", "pontos_positivos", "pontos_de_ajuste", "sugestoes", "conclusao", "status"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Gemini AI Analysis Error:", {
      message: error.message,
      stack: error.stack,
      type,
      data: { ...data, images: data.images ? `${data.images.length} images` : undefined }
    });
    
    if (error.message?.includes('quota')) {
      throw new Error("Limite de uso da IA atingido. Tente novamente em alguns minutos.");
    }
    
    if (error.message?.includes('safety')) {
      throw new Error("O conteúdo foi bloqueado pelos filtros de segurança da IA.");
    }

    throw new Error("Erro ao processar a análise com IA. Por favor, tente novamente.");
  }
}
