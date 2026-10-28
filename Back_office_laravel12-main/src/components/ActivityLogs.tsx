/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Activity, 
  Shield, 
  Database, 
  Cpu, 
  DownloadCloud, 
  Filter, 
  Trash2, 
  HelpCircle,
  FileText
} from "lucide-react";
import { ActivityLog } from "../types";

interface ActivityLogsProps {
  logs: ActivityLog[];
}

export default function ActivityLogs({ logs }: ActivityLogsProps) {
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredLogs = logs.filter(log => {
    return selectedType === "all" || log.type === selectedType;
  });

  const getLogIcon = (type: ActivityLog["type"]) => {
    switch (type) {
      case "auth":
        return <Shield className="w-4 h-4 text-blue-600" />;
      case "crud":
        return <Database className="w-4 h-4 text-emerald-600" />;
      case "system":
        return <Activity className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const getLogBadge = (type: ActivityLog["type"]) => {
    switch (type) {
      case "auth":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "crud":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "system":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Real-time Event Simulator Panel */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 p-5 rounded-xl shadow-md text-white space-y-4" id="event-simulator-banner">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full font-mono">
              Test Système d'Alertes Temps Réel
            </span>
            <h4 className="font-extrabold text-white text-base mt-1.5 font-display">
              Simulateur de Notifications & Transactions en Direct
            </h4>
            <p className="text-xs text-indigo-200 mt-1">
              Déclenchez instantanément de nouveaux flux d'événements sur le serveur. Notre système de polling à haute performance interceptera la mise à jour et affichera une notification de type <strong>Toast</strong> animée en temps réel.
            </p>
          </div>
          <div className="hidden lg:block bg-indigo-500/10 p-2 border border-indigo-500/20 rounded-xl">
            <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/test/generate-event", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "order" })
                });
                if (!res.ok) throw new Error();
              } catch (_) {
                alert("Erreur de communication avec le simulateur d'événements.");
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer border border-emerald-500"
            id="btn-sim-order"
          >
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>Simuler : Nouvel Achat (Commande)</span>
          </button>
        </div>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm mb-1 font-display">Journal d'activité & Audit de Sécurité</h4>
          <p className="text-xs text-slate-500 font-medium">
            Traçabilité totale de toutes les opérations de collecte, de modification de base de données MongoDB et de connexions administratives.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-transparent border-none text-slate-700 font-bold text-xs focus:ring-0 outline-none pr-4 cursor-pointer"
          >
            <option value="all">Tous les événements</option>
            <option value="auth">Sécurité & Authentification</option>
            <option value="crud">Édition MongoDB Atlas (CRUD)</option>
            <option value="system">Paramètres & Systèmes</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm" id="audit-logs-card">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">Flux d'audit de sécurité de la plateforme</h4>
          <span className="text-[10px] text-slate-500 font-bold font-mono bg-slate-200 border border-slate-300 px-2 py-0.5 rounded">
            Fichier log : `/storage/logs/laravel-${new Date().toISOString().slice(0, 10)}.log`
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4 w-12"></th>
                <th className="py-3 px-4">Événement / Catégorie</th>
                <th className="py-3 px-4">Auteur</th>
                <th className="py-3 px-4">Action effectuée</th>
                <th className="py-3 px-4">Adresse IP</th>
                <th className="py-3 px-4">Horodatage</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-600 divide-y divide-slate-100 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 text-center">
                    <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 inline-block">
                      {getLogIcon(log.type)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    <span className={`inline-flex items-center border px-2 py-0.5 rounded text-[10px] font-bold font-mono ${getLogBadge(log.type)}`}>
                      {log.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div className="flex flex-col">
                      <span className="font-display">{log.username}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{log.role}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-sm text-slate-600 leading-relaxed font-sans font-medium">{log.action}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400 font-bold">{log.ip}</td>
                  <td className="py-3.5 px-4 text-[10px] text-slate-400 font-bold font-mono">
                    {new Date(log.timestamp).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 font-bold font-mono text-xs">
                    Aucun log d'activité disponible pour ce filtre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
