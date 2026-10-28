import { jsPDF } from "jspdf";

export interface AIChatKPI {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export interface AIChatPriorityAction {
  title: string;
  priority: "HAUTE" | "MOYENNE" | "BASSE";
  impact?: string;
  reason?: string;
}

export interface AIChatChartData {
  type: "bar" | "line" | "pie";
  title?: string;
  data: Array<{ name: string; value: number; [key: string]: any }>;
}

export interface AIChatReply {
  executiveSummary: string;
  detailedAnalysis: string;
  detectedProblems?: string[];
  recommendations?: string[];
  priorityActions?: AIChatPriorityAction[];
  kpis?: AIChatKPI[];
  chart?: AIChatChartData;
  fullText?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  timestamp: string;
  content: string;
  structuredReply?: AIChatReply;
  error?: boolean;
}

const SESSION_KEY = "admin_ai_chat_session_id";
const HISTORY_KEY = "admin_ai_chat_history";

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function getSavedHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Erreur lors de la lecture de l'historique de chat AI:", err);
  }
  return [];
}

export function saveHistory(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error("Erreur lors de la sauvegarde de l'historique de chat AI:", err);
  }
}

export function clearSavedHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.error("Erreur lors de la suppression de l'historique:", err);
  }
}

export async function sendAdminChatMessage(
  message: string,
  adminId: string = "ADMIN_ID"
): Promise<{ sessionId: string; reply: AIChatReply }> {
  const sessionId = getSessionId();

  const response = await fetch("/api/admin-ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      adminId,
      sessionId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur serveur (${response.status}): ${errorText || "Impossible d'obtenir une réponse de l'IA"}`);
  }

  const data = await response.json();
  return data;
}

export function exportReportPDF(reply: AIChatReply, promptMessage?: string): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RAPPORT D'ANALYSE IA - TABLEAU DE BORD", margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Généré le ${new Date().toLocaleString("fr-FR")} | Session: ${getSessionId()}`, margin, 20);

  y = 35;

  if (promptMessage) {
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 12, "F");
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Demande Administrateur : "${promptMessage}"`, margin + 3, y + 8);
    y += 18;
  }

  // Executive summary
  if (reply.executiveSummary) {
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. Résumé Exécutif", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const execLines = doc.splitTextToSize(reply.executiveSummary.replace(/^📊\s*/, ""), contentWidth);
    doc.text(execLines, margin, y);
    y += execLines.length * 5 + 6;
  }

  // KPIs Section
  if (reply.kpis && reply.kpis.length > 0) {
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. Indicateurs Clés de Performance (KPI)", margin, y);
    y += 6;

    const boxWidth = (contentWidth - (reply.kpis.length - 1) * 4) / reply.kpis.length;
    reply.kpis.forEach((kpi, idx) => {
      const xPos = margin + idx * (boxWidth + 4);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(xPos, y, boxWidth, 16, 2, 2, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label.toUpperCase(), xPos + 3, y + 5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.value, xPos + 3, y + 12);
    });
    y += 22;
  }

  // Detailed Analysis
  if (reply.detailedAnalysis) {
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("3. Analyse Détaillée", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const detailLines = doc.splitTextToSize(reply.detailedAnalysis.replace(/^📈\s*/, ""), contentWidth);
    doc.text(detailLines, margin, y);
    y += detailLines.length * 5 + 6;
  }

  // Detected Problems
  if (reply.detectedProblems && reply.detectedProblems.length > 0) {
    doc.setTextColor(185, 28, 28); // red-700
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("4. Problèmes & Points d'Attention Détectés", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    reply.detectedProblems.forEach((prob) => {
      const probLines = doc.splitTextToSize(`• ${prob.replace(/^⚠️\s*/, "")}`, contentWidth - 4);
      doc.text(probLines, margin + 2, y);
      y += probLines.length * 4.5 + 2;
    });
    y += 4;
  }

  // Priority Actions
  if (reply.priorityActions && reply.priorityActions.length > 0) {
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("5. Actions Prioritaires Recommandées", margin, y);
    y += 6;

    reply.priorityActions.forEach((act) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`[${act.priority}] ${act.title}`, margin + 2, y);
      y += 4;

      if (act.reason) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const reasonLines = doc.splitTextToSize(`Impact / Raison : ${act.reason}`, contentWidth - 8);
        doc.text(reasonLines, margin + 6, y);
        y += reasonLines.length * 4 + 2;
      }
    });
  }

  // Footer page stamp
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Document confidentiel généré par l'Assistant IA E-Commerce", margin, 285);

  doc.save(`Rapport_IA_ECommerce_${Date.now()}.pdf`);
}
