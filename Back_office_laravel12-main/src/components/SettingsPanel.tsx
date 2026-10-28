/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Settings, 
  Database, 
  Server, 
  Cpu, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
  Share2,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  ExternalLink,
  Key,
  Globe,
  MessageSquare,
  Bot,
  RotateCcw,
  Mail,
  Send,
  Inbox,
  AtSign,
  CheckCircle2
} from "lucide-react";
import { SystemSettings, UserRole } from "../types";
import { DEFAULT_WHATSAPP_CS_PROMPT } from "../services/whatsappAutoService";

interface SettingsPanelProps {
  settings: SystemSettings;
  currentUserRole: UserRole;
  onSaveSettings: (settings: SystemSettings) => Promise<void>;
  onTestConnection: (service: "mongodb" | "nodeApi" | "facebook" | "email") => Promise<{ success: boolean; message: string }>;
}

export default function SettingsPanel({
  settings,
  currentUserRole,
  onSaveSettings,
  onTestConnection,
}: SettingsPanelProps) {
  // Local form state
  const [mongoUri, setMongoUri] = useState(settings.mongoUri);
  const [nodeApiUrl, setNodeApiUrl] = useState(settings.nodeApiUrl);
  const [automaticAlertsEnabled, setAutomaticAlertsEnabled] = useState(settings.automaticAlertsEnabled);
  const [facebookAutoPublishEnabled, setFacebookAutoPublishEnabled] = useState(
    settings.facebookAutoPublishEnabled !== undefined ? settings.facebookAutoPublishEnabled : true
  );
  const [facebookAutoStoryEnabled, setFacebookAutoStoryEnabled] = useState(
    settings.facebookAutoStoryEnabled !== undefined ? settings.facebookAutoStoryEnabled : true
  );
  const [whatsappAutoReplyEnabled, setWhatsappAutoReplyEnabled] = useState(
    settings.whatsappAutoReplyEnabled !== undefined ? settings.whatsappAutoReplyEnabled : true
  );
  const [whatsappCustomerServicePrompt, setWhatsappCustomerServicePrompt] = useState(
    settings.whatsappCustomerServicePrompt || DEFAULT_WHATSAPP_CS_PROMPT
  );
  const [websiteUrl, setWebsiteUrl] = useState(settings.websiteUrl || "http://localhost:30000");
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || "0347454871");
  const [facebookPageId, setFacebookPageId] = useState(settings.facebookPageId || "61591853776525");
  const [facebookPageName, setFacebookPageName] = useState(settings.facebookPageName || "PREMIUM SHOP Madagascar Official");
  const [metaAppId, setMetaAppId] = useState(settings.metaAppId || "1424497619527088");
  const [metaAppSecret, setMetaAppSecret] = useState(settings.metaAppSecret || "");
  const [metaPageAccessToken, setMetaPageAccessToken] = useState(settings.metaPageAccessToken || "EAAUPkrKYZAbABSXczijbB0TiKZB5KMhHTDbPJVeOhy0FSynRyD9ZA9gZBuM7BxxZA1XSfejmUCieflVzp5SBmKO05HUzGAvWjYsnGu5OElLwPlPEuBcM9XOV4L1KuulNMPh1U1QwJPTV3xTw5HNqgrgC378CZBj3KidwnrzGhjCMWcWFY6z1XidggxLMYZB");
  
  // Email and SMTP Settings
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    settings.emailNotificationsEnabled !== undefined ? settings.emailNotificationsEnabled : true
  );
  const [emailSmtpHost, setEmailSmtpHost] = useState(settings.emailSmtpHost || "smtp.gmail.com");
  const [emailSmtpPort, setEmailSmtpPort] = useState(settings.emailSmtpPort || 587);
  const [emailSmtpUser, setEmailSmtpUser] = useState(settings.emailSmtpUser || "andriamifehy18@gmail.com");
  const [emailSmtpPassword, setEmailSmtpPassword] = useState(settings.emailSmtpPassword || "aiiyhosoplaechbl");
  const [emailSmtpSecure, setEmailSmtpSecure] = useState(settings.emailSmtpSecure || false);
  const [emailSenderName, setEmailSenderName] = useState(settings.emailSenderName || "PREMIUM SHOP Madagascar");
  const [emailSenderAddress, setEmailSenderAddress] = useState(settings.emailSenderAddress || "andriamifehy18@gmail.com");
  const [emailSupportContact, setEmailSupportContact] = useState(settings.emailSupportContact || "andriamifehy18@gmail.com");
  const [storeName, setStoreName] = useState(settings.storeName || "PREMIUM SHOP Madagascar");

  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  // Connection testing states
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ service: string; success: boolean; message: string } | null>(null);

  // Test Email Live execution state
  const [testEmailRecipient, setTestEmailRecipient] = useState(settings.emailSupportContact || "client@hightech-mada.com");
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailFeedback, setTestEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Status message
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [securityWarning, setSecurityWarning] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityWarning("");
    setSaveSuccess(false);

    if (currentUserRole !== "Administrateur") {
      setSecurityWarning("Action refusée : Votre rôle 'Analyste' n'est pas autorisé à sauvegarder la configuration système (Spatie Laravel Permission: Admin requis).");
      return;
    }

    try {
      await onSaveSettings({
        mongoUri,
        nodeApiUrl,
        automaticAlertsEnabled,
        facebookAutoPublishEnabled,
        facebookAutoStoryEnabled,
        whatsappAutoReplyEnabled,
        whatsappCustomerServicePrompt,
        websiteUrl,
        whatsappNumber,
        facebookPageId,
        facebookPageName,
        metaAppId,
        metaAppSecret,
        metaPageAccessToken,
        emailNotificationsEnabled,
        emailSmtpHost,
        emailSmtpPort: Number(emailSmtpPort),
        emailSmtpUser,
        emailSmtpPassword,
        emailSmtpSecure,
        emailSenderName,
        emailSenderAddress,
        emailSupportContact,
        storeName
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Erreur lors de la sauvegarde : " + err.message);
    }
  };

  const handleTest = async (service: "mongodb" | "nodeApi" | "facebook" | "email") => {
    setTestingService(service);
    setTestResult(null);

    try {
      const res = await onTestConnection(service);
      setTestResult({
        service,
        success: res.success,
        message: res.message,
      });
    } catch (err: any) {
      setTestResult({
        service,
        success: false,
        message: "Échec : Impossible de joindre le service. Vérifiez la configuration.",
      });
    } finally {
      setTestingService(null);
    }
  };

  const handleSendLiveTestEmail = async () => {
    setIsSendingTestEmail(true);
    setTestEmailFeedback(null);
    try {
      const res = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: testEmailRecipient })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestEmailFeedback({
          success: true,
          message: data.message || "E-mail de confirmation de test envoyé avec succès !"
        });
      } else {
        setTestEmailFeedback({
          success: false,
          message: data.error || "Erreur lors de l'envoi de l'e-mail de test."
        });
      }
    } catch (err: any) {
      setTestEmailFeedback({
        success: false,
        message: err?.message || "Erreur réseau lors de l'envoi du test."
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Introduction */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
        <h4 className="font-bold text-slate-900 text-sm mb-1 font-display">Paramètres Système, Automatisation IA & Meta Graph API</h4>
        <p className="text-xs text-slate-500 font-medium">
          Configurez les points d'entrée des microservices, les connexions MongoDB Atlas, et la publication automatique de vos produits sur Facebook via l'IA marketing.
        </p>
      </div>

      {securityWarning && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="font-bold text-amber-900">Droits d'Accès Refusés (Middleware Spatie)</p>
            <p className="opacity-90 mt-0.5 font-semibold">{securityWarning}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CONFIGURATION FORM LEFT */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm lg:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 border-b border-slate-200 pb-3 flex items-center gap-2 font-display">
            <Settings className="w-4 h-4 text-blue-500" />
            Paramètres Généraux & Meta Facebook
          </h4>

          <form onSubmit={handleSave} className="space-y-5">
            
            {/* Facebook Meta Graph API Section */}
            <div className="p-4 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-xl border border-blue-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                    f
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                      Publication Automatique Facebook & Meta Graph API
                      <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> v21.0
                      </span>
                    </h5>
                    <p className="text-[10px] text-slate-500 font-medium">Génère un post marketing vendeur avec Gemini et publie sur votre Page pro dès l'enregistrement d'un produit.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFacebookAutoPublishEnabled(!facebookAutoPublishEnabled)}
                  className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer shrink-0"
                  title={facebookAutoPublishEnabled ? "Désactiver la publication auto" : "Activer la publication auto"}
                >
                  {facebookAutoPublishEnabled ? (
                    <ToggleRight className="w-8 h-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              {facebookAutoPublishEnabled && (
                <div className="space-y-3 pt-2 border-t border-blue-100">
                  
                  {/* Story auto toggle */}
                  <div className="flex items-center justify-between p-3 bg-pink-50/70 border border-pink-200/80 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-pink-600 text-white flex items-center justify-center text-xs shadow-xs font-bold">
                        📸
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Créer & Publier la Story Facebook automatiquement
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Génère automatiquement une Story verticale (1080×1920) haute définition pour chaque nouveau produit.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFacebookAutoStoryEnabled(!facebookAutoStoryEnabled)}
                      className="text-slate-400 hover:text-pink-600 transition-colors cursor-pointer shrink-0"
                      title={facebookAutoStoryEnabled ? "Désactiver les Stories auto" : "Activer les Stories auto"}
                    >
                      {facebookAutoStoryEnabled ? (
                        <ToggleRight className="w-7 h-7 text-pink-600" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-300" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Lien du Site Web Boutique (Call-to-Action)</span>
                        <span className="text-[10px] text-blue-600 font-mono">Affiché dans les posts</span>
                      </label>
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="http://localhost:30000"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-mono font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Numéro WhatsApp de Contact</span>
                        <span className="text-[10px] text-emerald-600 font-mono">wa.me direct</span>
                      </label>
                      <input
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="0347454871"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-mono font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>ID Application Meta (App ID)</span>
                        <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-100/60 px-1.5 py-0.2 rounded">developers.facebook.com</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={metaAppId}
                          onChange={(e) => setMetaAppId(e.target.value)}
                          placeholder="1424497619527088"
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Identifiant Page Facebook (Page ID)
                      </label>
                      <input
                        type="text"
                        value={facebookPageId}
                        onChange={(e) => setFacebookPageId(e.target.value)}
                        placeholder="Ex: 109876543210987"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-mono font-semibold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nom public de la Page Facebook
                      </label>
                      <input
                        type="text"
                        value={facebookPageName}
                        onChange={(e) => setFacebookPageName(e.target.value)}
                        placeholder="Ex: PREMIUM SHOP Madagascar Official"
                        className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Page Access Token (Jeton de Page)</span>
                        <span className="text-[10px] text-slate-400 font-normal">pages_manage_posts</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showToken ? "text" : "password"}
                          value={metaPageAccessToken}
                          onChange={(e) => setMetaPageAccessToken(e.target.value)}
                          placeholder="EAAV... (Laisser vide pour mode Bac à sable)"
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-800 outline-none font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Clé Secrète de l'App (App Secret)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Optionnel</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showSecret ? "text" : "password"}
                          value={metaAppSecret}
                          onChange={(e) => setMetaAppSecret(e.target.value)}
                          placeholder="••••••••••••••••••••••••••••••••"
                          className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-800 outline-none font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Meta API Diagnostic and Helper Info */}
                  <div className="bg-white/95 p-3.5 rounded-xl border border-blue-100 space-y-3 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {metaPageAccessToken && metaPageAccessToken.length > 20 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Mode Live Meta Connecté
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Mode Bac à Sable / Simulation Actif
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-slate-700">Meta Graph API v21.0</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTest("facebook")}
                          disabled={testingService !== null}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${testingService === "facebook" ? "animate-spin" : ""}`} />
                          <span>{testingService === "facebook" ? "Vérification..." : "Tester la liaison Meta"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Step-by-step guide for viewing posts on real Facebook Page & Token Longevity */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 space-y-2.5">
                      <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-600" />
                        Guide Jeton Meta Graph API & Durabilité (Éviter l'expiration Code 190) :
                      </p>
                      <ol className="text-[10px] space-y-1.5 text-slate-600 pl-4 list-decimal leading-relaxed">
                        <li>
                          <strong>Trouver votre Page ID :</strong> Sur Facebook, ouvrez votre Page pro &gt; <em>À propos</em> &gt; <em>Transparence de la page</em> (ex: <code className="font-mono text-blue-700 font-bold">61591853776525</code>).
                        </li>
                        <li>
                          <strong>Générer le Page Access Token :</strong> Rendez-vous sur <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5">Meta Graph API Explorer <ExternalLink className="w-2.5 h-2.5" /></a> avec l'App ID <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-bold">{metaAppId || "1424497619527088"}</code>.
                        </li>
                        <li>
                          Dans <em>"User or Page"</em>, sélectionnez votre <strong>Page Facebook Pro</strong>, cochez <code className="bg-slate-200 px-1 rounded text-slate-800 font-mono">pages_manage_posts</code> et <code className="bg-slate-200 px-1 rounded text-slate-800 font-mono">pages_read_engagement</code>, puis cliquez sur <strong>Generate Access Token</strong>.
                        </li>
                        <li>
                          <strong>Important (Durée de validité) :</strong> Les jetons de test temporaires expirent après 1 à 2 heures (Erreur 190). Pour obtenir un jeton <strong>Longue Durée (60 jours ou permanent)</strong>, vérifiez ou étendez votre jeton via l'outil officiel <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5">Meta Access Token Debugger <ExternalLink className="w-2.5 h-2.5" /></a> en cliquant sur <em>"Extend Access Token"</em>.
                        </li>
                        <li>
                          Collez votre jeton actualisé ci-dessus et cliquez sur <strong>Enregistrer les Paramètres</strong>.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* WhatsApp AI Auto-Reply & Customer Service Settings */}
            <div className="bg-emerald-950/5 border border-emerald-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-600 rounded-xl text-white">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      Agent IA Service Client WhatsApp (Rôle & Auto-Réponse)
                      <span className="px-2 py-0.5 bg-emerald-600/15 text-emerald-800 text-[10px] rounded-full font-mono font-bold">
                        Gemini & Boutique
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-800/80">
                      Vérifie les produits commandés dans la boutique, invite au paiement avant livraison, et notifie automatiquement le client dès que le règlement est validé pour expédier/livrer le produit.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setWhatsappAutoReplyEnabled(!whatsappAutoReplyEnabled)}
                  className="cursor-pointer"
                  title={whatsappAutoReplyEnabled ? "Désactiver l'auto-réponse WhatsApp" : "Activer l'auto-réponse WhatsApp"}
                >
                  {whatsappAutoReplyEnabled ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              {whatsappAutoReplyEnabled && (
                <div className="space-y-4 pt-1">
                  {/* System Prompt for the AI Agent */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-emerald-700" />
                        Prompt Système & Rôle de l'Agent IA WhatsApp :
                      </label>
                      <button
                        type="button"
                        onClick={() => setWhatsappCustomerServicePrompt(DEFAULT_WHATSAPP_CS_PROMPT)}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-emerald-200"
                        title="Restaurer le prompt officiel"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Rétablir le rôle & prompt par défaut
                      </button>
                    </div>

                    <textarea
                      value={whatsappCustomerServicePrompt}
                      onChange={(e) => setWhatsappCustomerServicePrompt(e.target.value)}
                      rows={9}
                      className="w-full bg-white border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 rounded-xl p-3.5 text-xs text-slate-800 leading-relaxed outline-none font-mono text-[11px] transition-all shadow-xs"
                      placeholder="Prompt de l'agent IA..."
                    />
                  </div>

                  {/* Expected output preview reference */}
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2 text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      Formats de messages clés du workflow :
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                        <span className="font-bold text-emerald-700">1. Commande reçue (Paiement avant livraison) :</span><br />
                        <span className="italic">"Bonjour Sarah 👋, nous avons bien reçu votre commande n°4589 pour votre Sac à main noir, disponible dans notre boutique ! Merci d'effectuer le paiement de 75 000 Ar afin que nous puissions lancer la livraison. Nous restons à votre disposition !"</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                        <span className="font-bold text-indigo-700">2. Paiement validé (Produit en livraison) :</span><br />
                        <span className="italic">"Bonjour Sarah 👋, votre paiement de 75 000 Ar pour la commande n°4589 (Sac à main noir) a bien été validé avec succès ! Votre colis est désormais en cours de livraison par notre coursier. Merci pour votre achat !"</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-500 pt-1">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Vérification boutique & stock
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Règlement avant livraison
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Validation & livraison automatique
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Email Confirmation & SMTP Notification Section */}
            <div className="p-4 bg-gradient-to-br from-purple-50/60 to-blue-50/40 rounded-xl border border-purple-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-display">
                      Réponse & Confirmation de Commande par E-mail Automatique
                      <span className="text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> HTML Responsive
                      </span>
                    </h5>
                    <p className="text-[10px] text-slate-500 font-medium">Envoie instantanément un e-mail professionnel et élégant au client dès l'enregistrement de sa commande.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                  className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer shrink-0"
                  title={emailNotificationsEnabled ? "Désactiver les e-mails automatiques" : "Activer les e-mails automatiques"}
                >
                  {emailNotificationsEnabled ? (
                    <ToggleRight className="w-8 h-8 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-300" />
                  )}
                </button>
              </div>

              {emailNotificationsEnabled && (
                <div className="space-y-3.5 pt-2 border-t border-purple-200/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom commercial de la Boutique</label>
                      <input
                        type="text"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="HighTech Store Madagascar"
                        className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom d'expéditeur E-mail</label>
                      <input
                        type="text"
                        value={emailSenderName}
                        onChange={(e) => setEmailSenderName(e.target.value)}
                        placeholder="HighTech Store Madagascar"
                        className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">E-mail d'expédition (From)</label>
                      <input
                        type="email"
                        value={emailSenderAddress}
                        onChange={(e) => setEmailSenderAddress(e.target.value)}
                        placeholder="orders@hightech-mada.com"
                        className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">E-mail Service Client (Reply-To / Support)</label>
                      <input
                        type="email"
                        value={emailSupportContact}
                        onChange={(e) => setEmailSupportContact(e.target.value)}
                        placeholder="support@hightech-mada.com"
                        className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-semibold outline-none font-mono"
                      />
                    </div>
                  </div>

                  {/* SMTP Server Configurations */}
                  <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-950 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-purple-600" />
                        Configuration du Serveur d'envoi SMTP (Nodemailer)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Gmail / Outlook / Brevo / SMTP Pro</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Hôte SMTP (Host)</label>
                        <input
                          type="text"
                          value={emailSmtpHost}
                          onChange={(e) => setEmailSmtpHost(e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Port</label>
                        <input
                          type="number"
                          value={emailSmtpPort}
                          onChange={(e) => setEmailSmtpPort(Number(e.target.value))}
                          placeholder="587"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Utilisateur SMTP (Login)</label>
                        <input
                          type="text"
                          value={emailSmtpUser}
                          onChange={(e) => setEmailSmtpUser(e.target.value)}
                          placeholder="contact@hightech-mada.com"
                          className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Mot de passe / App Password</label>
                        <div className="relative">
                          <input
                            type={showSmtpPassword ? "text" : "password"}
                            value={emailSmtpPassword}
                            onChange={(e) => setEmailSmtpPassword(e.target.value)}
                            placeholder="••••••••••••••••"
                            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-lg px-2.5 py-1.5 pr-8 text-xs font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showSmtpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="emailSmtpSecure"
                        checked={emailSmtpSecure}
                        onChange={(e) => setEmailSmtpSecure(e.target.checked)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="emailSmtpSecure" className="text-[11px] text-slate-600 font-semibold cursor-pointer">
                        Connexion SSL/TLS directe sécurisée (recommandé pour port 465)
                      </label>
                    </div>

                    {/* Google App Password helper notice */}
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Important pour l'envoi réel vers vos clients via Gmail ({emailSmtpUser || "andriamifehy18@gmail.com"}) :
                      </div>
                      <p className="text-[10px] text-amber-700 leading-relaxed">
                        Google bloque les mots de passe de compte standards par sécurité. Pour que vos clients reçoivent réellement les e-mails de confirmation dans leur boîte Gmail/Outlook :
                      </p>
                      <ol className="list-decimal list-inside text-[10px] text-amber-800 font-medium space-y-0.5 pl-1">
                        <li>Rendez-vous sur <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-bold text-amber-900">myaccount.google.com/apppasswords</a> (Authentification 2 étapes activée).</li>
                        <li>Créez un nouveau mot de passe d'application nommé <em>"E-commerce Madagascar"</em>.</li>
                        <li>Copiez le code à 16 caractères et collez-le ci-dessus dans <strong>Mot de passe / App Password</strong>.</li>
                      </ol>
                    </div>
                  </div>

                  {/* Email template highlights preview */}
                  <div className="p-3 bg-purple-100/40 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      Génération automatique responsive & version texte (Plain text) intégrée :
                    </div>
                    <div className="text-[10px] text-purple-700 leading-relaxed">
                      L'e-mail intègre le numéro de commande, le tableau complet des produits, les montants en Ariary, l'adresse de livraison, le mode de paiement (ex: Mobile Money) et les coordonnées de contact du support.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MongoDB Settings */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1 font-display">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Chaîne de Connexion MongoDB Atlas (URI NoSQL)
              </label>
              <input
                type="text"
                value={mongoUri}
                onChange={(e) => setMongoUri(e.target.value)}
                placeholder="mongodb+srv://admin_thesis:..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none font-mono font-semibold transition-all"
              />
            </div>

            {/* Microservices API URLs */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1 font-display">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Point d'Entrée API Node.js
              </label>
              <input
                type="text"
                value={nodeApiUrl}
                onChange={(e) => setNodeApiUrl(e.target.value)}
                placeholder="http://localhost:5000/api/v1/collect"
                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none font-mono font-semibold transition-all"
              />
            </div>

            {/* Alert toggle switches */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <h5 className="text-xs font-bold text-slate-900 mb-0.5">Envoi automatique d'alertes par e-mail / Discord</h5>
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Déclenché instantanément par la plateforme si un événement critique se produit.</p>
              </div>
              <button
                type="button"
                onClick={() => setAutomaticAlertsEnabled(!automaticAlertsEnabled)}
                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
              >
                {automaticAlertsEnabled ? (
                  <ToggleRight className="w-8 h-8 text-blue-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-300" />
                )}
              </button>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100 items-center gap-3">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  Configuration enregistrée avec succès !
                </span>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Sauvegarder les Paramètres
              </button>
            </div>

          </form>
        </div>

        {/* CONNECTION DIAGNOSTIC PANEL RIGHT */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between" id="connection-test-card">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 border-b border-slate-200 pb-3 flex items-center gap-2 font-display">
              <Server className="w-4 h-4 text-emerald-500" />
              Diagnostic Réseau & Intégrations
            </h4>

            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
              Vérifiez la viabilité des liaisons réseaux et des passerelles d'automatisation en temps réel.
            </p>

            <div className="space-y-3">
              
              {/* Test Facebook Meta Graph API */}
              <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800 font-display flex items-center gap-1">
                    <span className="w-4 h-4 bg-blue-600 text-white rounded text-[9px] flex items-center justify-center font-bold">f</span>
                    Meta Graph API (Facebook)
                  </h5>
                  <p className="text-[9px] text-slate-400 font-bold font-mono">Page feed / Photos API</p>
                </div>
                <button
                  onClick={() => handleTest("facebook")}
                  disabled={testingService !== null}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold font-mono transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testingService === "facebook" ? "Test..." : "Tester"}
                </button>
              </div>

              {/* Test MongoDB */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800 font-display">MongoDB Atlas Cluster</h5>
                  <p className="text-[9px] text-slate-400 font-bold font-mono">Protocole mongodb+srv://</p>
                </div>
                <button
                  onClick={() => handleTest("mongodb")}
                  disabled={testingService !== null}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testingService === "mongodb" ? "Test..." : "Tester"}
                </button>
              </div>

              {/* Test REST API */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800 font-display">REST API Node.js microservice</h5>
                  <p className="text-[9px] text-slate-400 font-bold font-mono">Port 5000 Express Gateway</p>
                </div>
                <button
                  onClick={() => handleTest("nodeApi")}
                  disabled={testingService !== null}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 border border-slate-200 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testingService === "nodeApi" ? "Test..." : "Tester"}
                </button>
              </div>

              {/* Test Email SMTP */}
              <div className="flex items-center justify-between p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800 font-display flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-purple-600" />
                    Serveur SMTP & Mailer
                  </h5>
                  <p className="text-[9px] text-slate-400 font-bold font-mono">{emailSmtpHost}:{emailSmtpPort}</p>
                </div>
                <button
                  onClick={() => handleTest("email")}
                  disabled={testingService !== null}
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white border border-purple-600 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testingService === "email" ? "Test..." : "Tester"}
                </button>
              </div>

            </div>

            {/* Live Order Confirmation Test Email */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <h5 className="text-[11px] font-bold text-slate-900 mb-1 flex items-center gap-1.5 font-display">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                Envoyer un e-mail de test de commande
              </h5>
              <p className="text-[10px] text-slate-500 font-medium mb-2.5">
                Génère instantanément une commande type avec le template HTML responsive et l'expédie à l'adresse de votre choix.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="votre-email@domaine.com"
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendLiveTestEmail}
                  disabled={isSendingTestEmail || !testEmailRecipient}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  {isSendingTestEmail ? "Envoi..." : "Envoyer"}
                </button>
              </div>

              {testEmailFeedback && (
                <div className={`mt-2.5 p-2.5 rounded-lg border text-xs flex items-start gap-1.5 ${testEmailFeedback.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                  {testEmailFeedback.success ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />}
                  <p className="text-[10px] font-medium leading-relaxed">{testEmailFeedback.message}</p>
                </div>
              )}
            </div>
          </div>

          {/* Test results box */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            {testResult ? (
              <div className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${testResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                {testResult.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />}
                <div>
                  <p className="font-bold">Résultat du test : {testResult.service.toUpperCase()}</p>
                  <p className="text-[10px] opacity-90 mt-0.5 leading-relaxed font-semibold">{testResult.message}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-400 rounded-xl border border-slate-200 text-center text-[10px] font-bold font-mono">
                Attente de diagnostic réseau...
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
