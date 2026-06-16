import React, { useState, useRef } from "react";
import { 
  X, 
  HelpCircle, 
  Sparkles, 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle, 
  Loader2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { addDoc, collection } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

// Helper function to send email via Gmail API using Base64url encoded MIME format
async function sendGmail(
  token: string, 
  to: string, 
  subject: string, 
  category: string, 
  description: string, 
  name: string,
  screenshotBase64: string | null,
  screenshotName: string
) {
  const boundary = "==_Boundary_Local_Terra_EcoTrace_" + Date.now();
  
  // Format HTML body beautifully
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e5dc; border-radius: 16px; background-color: #faf9f6; color: #2e2e26;">
      <div style="text-align: center; border-bottom: 2px solid #556b2f; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #4b5320; margin: 0; font-family: Georgia, serif; font-style: italic;">Terra - Climate Feedback</h2>
        <p style="margin: 4px 0 0 0; font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 1.5px; color: #8fbc8f;">Support & Feedback Summary</p>
      </div>
      
      <div style="margin-bottom: 16px;">
        <span style="display: inline-block; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #4b5320; background-color: #e5e5dc; padding: 4px 8px; border-radius: 4px; margin-bottom: 8px;">
          ${category.toUpperCase()}
        </span>
        <h3 style="margin: 0 0 8px 0; color: #2e2e26;">Inquiry Description</h3>
        <p style="font-size: 13px; line-height: 1.6; color: #4a4a40; white-space: pre-line; background-color: #fff; padding: 12px; border-radius: 8px; border: 1px solid #eeeeee;">
          ${description}
        </p>
      </div>

      <div style="background-color: #f0f0e8; padding: 12px; border-radius: 8px; font-size: 11px; font-family: monospace;">
        <div style="margin-bottom: 4px;"><strong>From:</strong> ${name}</div>
        <div style="margin-bottom: 4px;"><strong>Authenticated Email:</strong> ${to}</div>
        <div><strong>Recorded On:</strong> ${new Date().toLocaleString()}</div>
      </div>
      
      <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #8c8c82; border-top: 1px solid #e5e5dc; padding-top: 12px;">
        Terra EcoTrace — Secure Climate Portal
      </div>
    </div>
  `;

  // Construct standard MIME/multipart email string
  let mail = [
    `MIME-Version: 1.0`,
    `From: "Terra EcoTrace" <${to}>`,
    `To: ${to}`,
    `Reply-To: ${to}`,
    `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``
  ].join("\r\n");

  mail += [
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(htmlBody))),
    ``
  ].join("\r\n");

  if (screenshotBase64) {
    const match = screenshotBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const base64Data = match[2];
      
      mail += [
        `--${boundary}`,
        `Content-Type: ${mimeType}; name="${screenshotName || 'screenshot.png'}"`,
        `Content-Disposition: attachment; filename="${screenshotName || 'screenshot.png'}"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        base64Data,
        ``
      ].join("\r\n");
    }
  }

  mail += `--${boundary}--`;

  // Encode to Base64Url
  const encodedMail = btoa(unescape(encodeURIComponent(mail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      raw: encodedMail
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gmail API failure: ${response.status} ${response.statusText} - ${errText}`);
  }

  return response.json();
}

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user, profile, accessToken, reconnectGmail } = useAuth();
  
  const [category, setCategory] = useState<"feedback" | "question" | "bug" | "suggestion">("feedback");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string>("");
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [sendCopy, setSendCopy] = useState(true);
  const [isLinkingGmail, setIsLinkingGmail] = useState(false);
  const [gmailStatusMessage, setGmailStatusMessage] = useState<string | null>(null);
  const [gmailErrorMessage, setGmailErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle image compression and Base64 conversion
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG/JPG).");
      return;
    }

    // Limit image size to ~2.5MB to stay well under Firestore's 10MB document limit
    if (file.size > 2.5 * 1024 * 1024) {
      alert("The image is too large. Please select a screenshot smaller than 2.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshot(reader.result as string);
      setScreenshotName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const onFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!description.trim()) {
      alert("Please provide some details for your inquiry.");
      return;
    }

    setSubmitting(true);
    setGmailErrorMessage(null);
    setGmailStatusMessage(null);

    try {
      const feedbackPayload = {
        userId: user.uid,
        email: user.email || "unknown@gmail.com",
        name: user.displayName || profile?.name || "Eco Explorer",
        category,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        ...(screenshot ? { screenshot } : {}) // optionally write base64 image data
      };

      // 1. Write the inquiry to secure Firestore database
      await addDoc(collection(db, "feedback"), feedbackPayload);

      // 2. Dispatch the copy via Google Gmail API if opted-in
      if (sendCopy) {
        let currentToken = accessToken;
        if (!currentToken) {
          try {
            // Attempt to trigger authenticating on-the-fly to secure the access token
            currentToken = await reconnectGmail();
          } catch (tokErr) {
            console.error("Failed to connect Gmail on the fly:", tokErr);
          }
        }

        if (currentToken) {
          try {
            await sendGmail(
              currentToken,
              user.email || "unknown@gmail.com",
              `[Terra EcoTrace Copy] ${category.toUpperCase()} Inquiry`,
              category,
              description.trim(),
              user.displayName || profile?.name || "Eco Explorer",
              screenshot,
              screenshotName
            );
            setGmailStatusMessage("A formatted copy was successfully dispatched to your email address!");
          } catch (gmailErr: any) {
            console.error("Gmail Send Error:", gmailErr);
            setGmailErrorMessage("The copy could not be delivered to Gmail. Your inquiry is safely logged in our servers.");
          }
        } else {
          setGmailErrorMessage("Your account is authenticated, but Gmail dispatch requires signing in with Gmail send permission.");
        }
      }

      setSuccess(true);
      // Reset form states
      setDescription("");
      setScreenshot(null);
      setScreenshotName("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSuccess = () => {
    setSuccess(false);
    setGmailErrorMessage(null);
    setGmailStatusMessage(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white/60 dark:bg-[#1c1c18]/50 backdrop-blur-lg border border-[#e5e5dc] rounded-[32px] max-w-lg w-full p-8 shadow-xl relative max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-6 right-6 p-1.5 hover:bg-brand-sand rounded-lg text-brand-sage hover:text-brand-stone transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {!success ? (
            <>
              <div className="mb-6">
                <span className="text-[10px] uppercase font-mono tracking-wider text-brand-earth bg-brand-moss/20 px-2.5 py-0.5 rounded-full inline-block mb-2">
                  Interactive Support
                </span>
                <h3 className="text-2xl font-serif italic text-brand-earth">
                  Questions & feedback
                </h3>
                <p className="text-xs text-brand-sage mt-1 font-sans">
                  Have inquiries, ideas, or ran into problems? Send us a description with a screenshot to help configure your experience.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 font-sans text-brand-stone">
                
                {/* Visual categorizer selectors */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-sage uppercase tracking-wider mb-2">Inquiry Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: "feedback", label: "💬 Advice", emoji: "📢" },
                      { value: "question", label: "❓ Question", emoji: "🙋" },
                      { value: "bug", label: "🐛 Bug", emoji: "⚙️" },
                      { value: "suggestion", label: "💡 Idea", emoji: "🌿" }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCategory(opt.value as any)}
                        className={`py-2 px-3 text-xs rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          category === opt.value 
                            ? "bg-brand-moss/20 border-brand-earth text-brand-earth font-bold" 
                            : "bg-brand-milk/40 border-[#e5e5dc] hover:bg-brand-sand hover:border-brand-sage text-brand-stone"
                        }`}
                      >
                        <span className="text-sm">{opt.emoji}</span>
                        <span className="text-[10px]">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sender Pre-fill Indicators */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-brand-sage uppercase tracking-wider mb-1">Your Name</label>
                    <div className="bg-brand-sand border border-[#e5e5dc]/80 rounded-xl px-3 py-2 text-brand-sage font-mono truncate">
                      {user?.displayName || "Climate Warrior"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-brand-sage uppercase tracking-wider mb-1">Authenticated Account</label>
                    <div className="bg-brand-sand border border-[#e5e5dc]/80 rounded-xl px-3 py-2 text-brand-sage font-mono truncate">
                      {user?.email || "No email"}
                    </div>
                  </div>
                </div>

                {/* Feedback Description Textarea */}
                <div>
                  <label htmlFor="feedback-desc" className="block text-[10px] font-bold text-brand-sage uppercase tracking-wider mb-1">
                    Describe your thoughts / queries <span className="text-red-600 font-bold">*</span>
                  </label>
                  <textarea
                    id="feedback-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    maxLength={5000}
                    rows={4}
                    placeholder="Enter a detailed description here, details make climate solutions easier..."
                    className="w-full text-xs bg-brand-milk/40 border border-[#e5e5dc] rounded-2xl px-4 py-3 text-brand-stone focus:outline-none focus:border-brand-earth focus:ring-1 focus:ring-brand-earth/20 leading-relaxed font-sans placeholder-brand-sage/60"
                  />
                  <div className="text-right text-[9px] text-brand-sage font-mono mt-0.5">
                    {description.length} / 5000 characters
                  </div>
                </div>

                {/* Screenshot Uploader Component */}
                <div>
                  <label className="block text-[10px] font-bold text-brand-sage uppercase tracking-wider mb-1">
                    Upload Screenshot (Optional)
                  </label>
                  
                  {!screenshot ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#e5e5dc] hover:border-brand-earth rounded-2xl p-6 text-center cursor-pointer bg-brand-milk/20 hover:bg-brand-sand/50 transition-colors group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={onFileSelectChange}
                        accept="image/*"
                        className="hidden" 
                      />
                      <UploadCloud size={30} className="mx-auto text-brand-sage group-hover:text-brand-earth mb-2 transition-colors" />
                      <p className="text-xs text-brand-stone font-semibold">
                        Drag and drop or select a file
                      </p>
                      <p className="text-[10px] text-brand-sage mt-0.5 font-mono">
                        Supports PNG, JPG (Max 2.5 MB)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-brand-sand border border-[#e5e5dc] rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border border-[#e5e5dc] overflow-hidden bg-white shrink-0 relative flex items-center justify-center">
                          <img 
                            src={screenshot} 
                            alt="Screenshot Preview" 
                            className="object-cover w-full h-full"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-brand-stone font-semibold truncate max-w-[200px]" title={screenshotName}>
                            {screenshotName || "screenshot_upload.png"}
                          </p>
                          <p className="text-[10px] text-brand-sage font-mono">
                            Base64 Image Loaded
                          </p>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={removeScreenshot}
                        className="p-2 text-brand-sage hover:text-red-700 hover:bg-brand-moss/10 rounded-xl transition-colors cursor-pointer"
                        title="Delete image"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Gmail Sync Section */}
                <div className="border-t border-[#e5e5dc]/60 pt-4 mt-4 font-sans text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="send-gmail-copy"
                      checked={sendCopy}
                      onChange={(e) => setSendCopy(e.target.checked)}
                      className="rounded border-[#e5e5dc] text-brand-earth focus:ring-brand-earth/20 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="send-gmail-copy" className="font-semibold text-brand-stone select-none cursor-pointer">
                      Send a formatted copy which includes attachments to my Gmail inbox
                    </label>
                  </div>

                  {sendCopy && (
                    <>
                      {!accessToken ? (
                        <div className="bg-amber-50/80 border border-amber-200/50 rounded-2xl p-4 text-xs text-amber-800 space-y-2.5 transition-all">
                          <div className="flex items-start gap-2">
                            <HelpCircle className="text-amber-600 shrink-0 mt-0.5" size={15} />
                            <div>
                              <p className="font-semibold text-amber-900">Gmail Access Required</p>
                              <p className="text-amber-700/90 mt-0.5 leading-relaxed">
                                Google requires session consent verification to dispatch copies safely to your authenticated email <strong>{user?.email}</strong>.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              setIsLinkingGmail(true);
                              setGmailErrorMessage(null);
                              try {
                                const token = await reconnectGmail();
                                if (token) {
                                  setGmailStatusMessage("Gmail successfully linked!");
                                }
                              } catch (err: any) {
                                console.error(err);
                                const code = err?.code || "";
                                if (code === "auth/popup-blocked" || err?.message?.includes("popup")) {
                                  setGmailErrorMessage("Consent popup was blocked. Easiest fix: open this app in a new tab using the icon at the top right of the preview pane, then click Connect.");
                                } else if (code === "auth/popup-closed-by-user") {
                                  setGmailErrorMessage("The permission window was closed before completion. Please click Connect again and select your account.");
                                } else {
                                  setGmailErrorMessage(err?.message || "Verification failed. Please check your network and try again.");
                                }
                              } finally {
                                setIsLinkingGmail(false);
                              }
                            }}
                            disabled={isLinkingGmail}
                            className="w-full text-center py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            {isLinkingGmail ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Sparkles size={13} />
                            )}
                            Connect Gmail Send Account
                          </button>

                          {gmailErrorMessage && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[10px] text-red-800 leading-relaxed font-sans space-y-1">
                              <p className="font-semibold">⚠️ Link Failed:</p>
                              <p>{gmailErrorMessage}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-emerald-50/80 border border-emerald-200/50 rounded-2xl p-3.5 text-xs text-emerald-800 flex items-start gap-2.5 transition-all">
                          <span className="text-sm">📬</span>
                          <div>
                            <p className="font-semibold text-emerald-950">Gmail Inbox Dispatch Equipped</p>
                            <p className="text-emerald-700/90 mt-0.5 leading-relaxed">
                              A formatted HTML copy will reach your authentic mailbox: <strong>{user?.email}</strong>.
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Submission Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#e5e5dc] items-center">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="text-xs font-bold uppercase tracking-wider text-brand-sage hover:text-brand-stone px-4 py-2.5 disabled:opacity-55 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="text-xs font-bold uppercase tracking-widest text-white bg-brand-earth hover:bg-[#4a4a35] px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Sending Client...</span>
                      </>
                    ) : (
                      <span>Submit feedback</span>
                    )}
                  </button>
                </div>

              </form>
            </>
          ) : (
            <div className="text-center py-8 font-sans">
              <div className="w-16 h-16 rounded-full bg-[#f0f0e8] flex items-center justify-center mx-auto mb-4 border border-[#e5e5dc]">
                <CheckCircle size={32} className="text-brand-earth" />
              </div>
              <h3 className="text-2xl font-serif italic text-brand-earth mb-2">
                Thank you so much!
              </h3>
              <p className="text-xs text-brand-clay max-w-sm mx-auto mb-4 leading-relaxed">
                Your feedback/question was registered securely inside Firestore. Our technical team is routing your parameters to implement instant carbon enhancements.
              </p>

              {sendCopy && (
                <div className="mb-6 max-w-sm mx-auto">
                  {gmailStatusMessage ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-emerald-800 text-[11px] text-left flex items-start gap-2">
                      <span className="text-base shrink-0">📬</span>
                      <div>
                        <strong className="block text-emerald-950 font-bold mb-0.5">Inbox Copy Send Complete!</strong>
                        {gmailStatusMessage}
                      </div>
                    </div>
                  ) : gmailErrorMessage ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-800 text-[11px] text-left flex items-start gap-2">
                      <span className="text-base shrink-0">⚠️</span>
                      <div>
                        <strong className="block text-amber-950 font-bold mb-0.5">Mailing Copy Bypassed</strong>
                        {gmailErrorMessage}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-amber-800 text-[11px] text-left flex items-start gap-2">
                      <span className="text-base shrink-0">⏳</span>
                      <div>
                        <strong className="block text-amber-950 font-bold mb-0.5">Dispatching...</strong>
                        Attempting to deliver copy. Ensure connectivity.
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <button
                type="button"
                onClick={handleResetSuccess}
                className="text-xs font-bold uppercase tracking-widest text-white bg-brand-earth hover:bg-[#4a4a35] px-6 py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Close Window
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
