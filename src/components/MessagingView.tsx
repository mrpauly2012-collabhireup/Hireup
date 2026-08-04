/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Image, Paperclip, Phone, Video, Info, ArrowLeft, 
  Volume2, Check, FileText, CheckCheck, Clock, ShieldCheck, 
  AlertTriangle, Hammer, Wrench, Search, Archive, Trash2, 
  ShieldAlert, Ban, AlertCircle, FileSpreadsheet, FolderOpen, 
  Play, Pause, MoreVertical, X, Sparkles, Bell
} from 'lucide-react';
import { WorkerProfile, JobProfile, Match, Message, UserType, CompanyProfile } from '../types';

interface MessagingViewProps {
  userType: UserType;
  selectedMatchId: string | null;
  matches: Match[];
  messages: Message[];
  workers: WorkerProfile[];
  jobs: JobProfile[];
  companies: CompanyProfile[];
  onSendMessage: (matchId: string, text: string, attachmentType?: 'image' | 'document' | 'voice', attachmentName?: string) => void;
  onMessagesRead?: (matchId: string) => void | Promise<void>;
  onNavigateBack: () => void;
  onStartVideoCall?: (matchId: string) => void;
}

export default function MessagingView({
  userType,
  selectedMatchId,
  matches,
  messages,
  workers,
  jobs,
  companies,
  onSendMessage,
  onMessagesRead,
  onNavigateBack,
  onStartVideoCall
}: MessagingViewProps) {
  const [activeMatchId, setActiveMatchId] = useState<string | null>(selectedMatchId);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'all' | 'archived'>('all');
  
  // Local state for archived/blocked/reported conversations
  const [archivedMatchIds, setArchivedMatchIds] = useState<string[]>([]);
  const [blockedMatchIds, setBlockedMatchIds] = useState<string[]>([]);
  const [reportedMatchIds, setReportedMatchIds] = useState<string[]>([]);
  
  // In-app Notification list for simulated incoming updates
  const [toasts, setToasts] = useState<{ id: string; message: string; title: string }[]>([]);

  // Selection states for custom attachments
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Set initial active match if none selected but we have matches
  useEffect(() => {
    if (selectedMatchId) {
      setActiveMatchId(selectedMatchId);
    } else if (matches.length > 0 && !activeMatchId) {
      const activeMatches = matches.filter(m => !archivedMatchIds.includes(m.id));
      if (activeMatches.length > 0) {
        setActiveMatchId(activeMatches[0].id);
      }
    }
  }, [selectedMatchId, matches, archivedMatchIds]);

  // Scroll to bottom when messages or typing states update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeMatchId]);

  const activeMatch = matches.find(m => m.id === activeMatchId);
  const activeWorker = activeMatch ? workers.find(w => w.id === activeMatch.workerId) : null;
  const activeJob = activeMatch?.jobId ? jobs.find(j => j.id === activeMatch.jobId) : null;
  const activeCompany = activeMatch
    ? companies.find(c => c.id === (activeMatch.contractorId || activeJob?.companyId))
    : null;

  const currentMatchMessages = messages.filter(msg => msg.matchId === activeMatchId);

  // Persist incoming messages as read when the conversation is opened.
  useEffect(() => {
    if (!activeMatchId) return;

    const hasUnreadIncomingMessages = messages.some(
      message =>
        message.matchId === activeMatchId &&
        !message.isRead &&
        message.sender !== userType
    );

    if (
      hasUnreadIncomingMessages &&
      typeof onMessagesRead === 'function'
    ) {
      void onMessagesRead(activeMatchId);
    }
  }, [activeMatchId, messages, userType, onMessagesRead]);

  // Push notifications simulations
  const triggerToast = (title: string, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Construction quick responses
  const quickReplies = userType === 'worker' ? [
    "Yes, I have full PPE and my own transport.",
    "Can you provide the site postcode?",
    "I am CIS registered with a valid CSCS Gold card.",
    "What are the scheduled shift timings?"
  ] : [
    "Hi, can you start this coming Monday?",
    "Is your calibrated test kit fully certified?",
    "We pay CIS weekly. Direct Bank Transfer on Fridays.",
    "Site induction begins at 08:00 sharp."
  ];

  const handleSend = (
    text: string,
    attachmentType?: 'image' | 'document' | 'voice',
    attachmentName?: string
  ) => {
    if (!text.trim() || !activeMatchId) return;

    if (blockedMatchIds.includes(activeMatchId)) {
      triggerToast('Cannot Send', 'This conversation is currently blocked.');
      return;
    }

    onSendMessage(activeMatchId, text, attachmentType, attachmentName);
    setInputText('');
    setShowAttachmentMenu(false);
  };

  const handleArchiveToggle = (matchId: string) => {
    if (archivedMatchIds.includes(matchId)) {
      setArchivedMatchIds(prev => prev.filter(id => id !== matchId));
      triggerToast("Chat Restored", "Conversation moved back to active inbox.");
    } else {
      setArchivedMatchIds(prev => [...prev, matchId]);
      triggerToast("Chat Archived", "Conversation has been moved to Archives.");
      if (activeMatchId === matchId) {
        setActiveMatchId(null);
      }
    }
  };

  const handleBlockToggle = (matchId: string) => {
    if (blockedMatchIds.includes(matchId)) {
      setBlockedMatchIds(prev => prev.filter(id => id !== matchId));
      triggerToast("User Unblocked", "You can now send and receive messages.");
    } else {
      setBlockedMatchIds(prev => [...prev, matchId]);
      triggerToast("User Blocked", "This user is blocked and cannot contact you.");
    }
    setShowBlockMenu(false);
  };

  const handleReportUser = (matchId: string, reason: string) => {
    setReportedMatchIds(prev => [...prev, matchId]);
    triggerToast("Report Submitted", `Report regarding "${reason}" has been flagged to HireUp compliance.`);
    setShowBlockMenu(false);
  };

  // Pre-defined high-fidelity attachments to share
  const shareableFiles = [
    { name: "Dave_Knyte_CV_Electrician.pdf", type: "document", size: "1.2 MB", desc: "Full Trade Experience Resume" },
    { name: "ECS_Gold_Card_Certified.jpg", type: "image", size: "840 KB", desc: "ECS/CSCS Competence Back & Front" },
    { name: "Public_Liability_10M_Active.pdf", type: "document", size: "2.1 MB", desc: "Professional Indemnity & Trade Insurance" },
    { name: "Conduit_Route_Battersea_Plot12.pdf", type: "document", size: "4.5 MB", desc: "Approved Electrical Routing Drawings" },
    { name: "Site_Access_Safety_Induction.pdf", type: "document", size: "890 KB", desc: "Apex Site Rules & PPE Requisitions" },
    { name: "Conduit_Run_Plot12.jpg", type: "image", size: "1.5 MB", desc: "Current Site Conduit Progress Update" }
  ];

  // Resolve the real worker, contractor, and optional job attached to each match.
  const getPartnerDetails = (match: Match) => {
    const worker = workers.find(w => w.id === match.workerId);
    const job = match.jobId ? jobs.find(j => j.id === match.jobId) : undefined;
    const company = companies.find(
      c => c.id === (match.contractorId || job?.companyId)
    );

    return {
      name:
        userType === 'employer'
          ? worker?.name || 'Worker'
          : company?.name || job?.companyName || 'Contractor',
      trade:
        userType === 'employer'
          ? worker?.trade || 'Tradesperson'
          : job?.title || company?.industry || 'Direct company connection',
      avatar:
        userType === 'employer'
          ? worker?.profilePhotoUrl || worker?.avatar || ''
          : company?.companyLogoUrl || company?.logo || job?.companyLogo || '',
      isOnline: false,
      phone:
        userType === 'employer'
          ? worker?.phone || ''
          : company?.contactPhone || company?.phone || ''
    };
  };

  // Filter and Search matches
  const filteredMatches = matches.filter(m => {
    const details = getPartnerDetails(m);
    const matchesSearch = details.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          details.trade.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isArchived = archivedMatchIds.includes(m.id);
    const showArchived = currentTab === 'archived';
    
    return matchesSearch && (showArchived ? isArchived : !isArchived);
  });

  return (
    <div id="messaging_view" className="bg-zinc-100 -mx-4 -mt-4 h-[calc(100vh-125px)] flex rounded-2xl overflow-hidden border border-zinc-200/80 relative">
      
      {/* Dynamic In-App Push Toasts Container */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map(t => (
          <div key={t.id} className="bg-zinc-950 text-white p-3.5 rounded-xl border border-emerald-500/40 shadow-xl flex gap-2 items-start pointer-events-auto animate-fade-in animate-bounce">
            <Bell className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5 animate-swing" />
            <div>
              <p className="text-xs font-black font-mono uppercase tracking-wider text-white">{t.title}</p>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">{t.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar - Chats List and Filter Navigation */}
      <div className={`w-full md:w-85 bg-white border-r border-zinc-200/80 flex flex-col ${activeMatchId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Chats Header with Tabs */}
        <div className="p-4 border-b border-zinc-200/80 bg-zinc-50 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono font-black text-zinc-700 uppercase tracking-wider">Site Messaging</h3>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setCurrentTab('all')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase transition-all duration-200 ease-out ${currentTab === 'all' ? 'bg-[#34D399] text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-900'}`}
              >
                Inbox
              </button>
              <button 
                onClick={() => setCurrentTab('archived')}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase transition-all duration-200 ease-out relative ${currentTab === 'archived' ? 'bg-[#34D399] text-zinc-950 shadow-md' : 'text-zinc-400 hover:text-zinc-900'}`}
              >
                Archive
                {archivedMatchIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>

          {/* WhatsApp style Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats by name or trade..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-zinc-200/80 rounded-xl text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399]"
            />
          </div>
        </div>

        {/* Conversation List logs */}
        <div className="flex-grow overflow-y-auto divide-y divide-zinc-100">
          {filteredMatches.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-xs font-sans space-y-1">
              <FolderOpen className="w-8 h-8 text-zinc-300 mx-auto" />
              <p>No conversations found</p>
              <p className="text-[10px] text-zinc-400">Archived or filtered chats appear under correct filters.</p>
            </div>
          ) : (
            filteredMatches.map(m => {
              const details = getPartnerDetails(m);
              const isSelected = m.id === activeMatchId;
              
              // Count unread messages (client simulation)
              const unreadCount = messages.filter(msg => msg.matchId === m.id && !msg.isRead && msg.sender !== userType).length;

              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMatchId(m.id)}
                  className={`w-full p-4 flex gap-3 text-left transition-all duration-200 ease-out cursor-pointer active:scale-[0.99] border-b border-zinc-100 ${isSelected ? 'bg-zinc-100 border-l-4 border-[#34D399]' : 'hover:bg-white bg-white'}`}
                >
                  {/* Status Indicator */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-zinc-200/80 bg-zinc-100 flex items-center justify-center p-0.5">
                      <img 
                        src={details.avatar} 
                        alt="avatar" 
                        className="w-full h-full object-cover rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white rounded-full ${details.isOnline ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                  </div>

                  <div className="flex-grow space-y-0.5 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-zinc-900 truncate flex items-center gap-1">
                        {details.name}
                        {blockedMatchIds.includes(m.id) && (
                          <Ban className="w-3.5 h-3.5 text-red-500" title="Blocked" />
                        )}
                      </h4>
                      <span className="text-[9px] font-mono text-zinc-400">{m.lastMessageTime || '10:15'}</span>
                    </div>
                    <p className="text-[11px] font-mono font-bold text-zinc-500 truncate uppercase">{details.trade}</p>
                    
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[11px] text-zinc-600 truncate italic max-w-[150px]">
                        "{m.lastMessageText || 'Matched! Propose a walkthrough induction date.'}"
                      </p>
                      
                      {/* Interactive Counter Badge */}
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-mono font-black uppercase tracking-wider flex-shrink-0">
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chats Active Panel */}
      <div className={`flex-grow bg-zinc-50 flex flex-col justify-between ${!activeMatchId ? 'hidden md:flex' : 'flex'}`}>
        {activeMatch && activeWorker && (activeJob || activeCompany) ? (
          <>
            {/* Chat Room Active Header */}
            <div className="p-4 bg-white border-b border-zinc-200/80 flex items-center justify-between shadow-md relative">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setActiveMatchId(null);
                    onNavigateBack();
                  }}
                  className="p-1 text-zinc-500 hover:text-zinc-900 md:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-zinc-200/80 flex items-center justify-center p-0.5">
                    <img 
                      src={
                         userType === 'employer'
                           ? (activeWorker.profilePhotoUrl || activeWorker.avatar)
                           : (activeCompany?.companyLogoUrl || activeCompany?.logo || activeJob?.companyLogo || '')
                       } 
                      alt="avatar" 
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${getPartnerDetails(activeMatch).isOnline ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-zinc-900 font-sans flex items-center gap-1.5">
                    {userType === 'employer'
                       ? activeWorker.name
                       : (activeCompany?.name || activeJob?.companyName || 'Contractor')}
                    {activeWorker.verified && <ShieldCheck className="w-4 h-4 text-[#10B981]" />}
                  </h4>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    {getPartnerDetails(activeMatch).isOnline ? 'ONLINE' : 'OFFLINE'} &bull;{' '}
                     {userType === 'employer'
                       ? activeWorker.trade
                       : (activeJob?.title || activeCompany?.industry || 'Direct company connection')}
                  </p>
                </div>
              </div>

              {/* Messaging & Calling Actions */}
              <div className="flex items-center gap-1.5">
                {/* Instant Call Now / Video Interview Button */}
                <button 
                  onClick={() => onStartVideoCall && onStartVideoCall(activeMatch.id)}
                  className="p-2 text-zinc-500 hover:text-emerald-500 hover:bg-zinc-100 rounded-xl transition-all duration-200 ease-out flex items-center gap-1 border border-zinc-200/80 cursor-pointer active:scale-[0.99] text-xs font-mono font-bold uppercase tracking-wider"
                  title="Launch Instant Video Interview Call"
                >
                  <Video className="w-4 h-4 text-[#10B981]" /> Call Now
                </button>

                {/* Archive Button */}
                <button 
                  onClick={() => handleArchiveToggle(activeMatch.id)}
                  className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all duration-200 ease-out cursor-pointer active:scale-[0.99]"
                  title="Archive/Unarchive Chat"
                >
                  <Archive className="w-4.5 h-4.5" />
                </button>

                {/* Ellipsis Block / Report trigger */}
                <div className="relative">
                  <button 
                    onClick={() => setShowBlockMenu(!showBlockMenu)}
                    className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all duration-200 ease-out cursor-pointer active:scale-[0.99]"
                    title="Abuse reporting or blocks"
                  >
                    <MoreVertical className="w-4.5 h-4.5" />
                  </button>

                  {/* Block / Report Dropdown menu overlay */}
                  {showBlockMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-zinc-200/80 rounded-xl shadow-lg py-1.5 z-30 font-sans text-xs">
                      <button 
                        onClick={() => handleBlockToggle(activeMatch.id)}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer active:scale-[0.99] font-bold"
                      >
                        <Ban className="w-4 h-4" /> 
                        {blockedMatchIds.includes(activeMatch.id) ? 'Unblock Partner' : 'Block Tradesman'}
                      </button>
                      <hr className="border-zinc-100 my-1" />
                      <button 
                        onClick={() => handleReportUser(activeMatch.id, "No-show / Breach of site safety")}
                        className="w-full px-4 py-2 text-left text-zinc-700 hover:bg-white flex items-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-500" /> Report No-Show
                      </button>
                      <button 
                        onClick={() => handleReportUser(activeMatch.id, "Abusive language / Fraudulent profile")}
                        className="w-full px-4 py-2 text-left text-zinc-700 hover:bg-white flex items-center gap-2 cursor-pointer active:scale-[0.99]"
                      >
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Report Fraudulent Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Block Warning Overlay banner if blocked */}
            {blockedMatchIds.includes(activeMatch.id) && (
              <div className="bg-red-50 border-b border-red-100 p-3 flex items-center gap-2 text-red-700 text-xs font-sans">
                <Ban className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
                <p className="font-medium">
                  You have blocked this user. Unblock this profile in the header menu to resume on-site contract discussions.
                </p>
              </div>
            )}

            {/* Chat Message Scroll Logs */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 font-sans text-sm bg-zinc-50">
              
              {/* Secure advisory card */}
              <div className="mx-auto max-w-sm bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-black text-[#10B981] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#34D399]" /> HireUp Verified Connection
                </div>
                <p className="text-[10px] text-zinc-600 leading-relaxed font-sans">
                  Identity, CSCS qualifications, and CITB credentials verified. Secure real-time chat with double ticks read receipts.
                </p>
              </div>

              {currentMatchMessages.map(msg => {
                const isMe = (msg.sender === 'worker' && userType === 'worker') || 
                             (msg.sender === 'employer' && userType === 'employer');

                return (
                  <div 
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-3 shadow-md space-y-1.5 ${isMe ? 'bg-[#34D399] text-zinc-950 rounded-br-none font-medium' : 'bg-white text-zinc-900 rounded-bl-none border border-zinc-200/80'}`}>
                      
                      {/* Custom Attachment Visual Cards */}
                      {msg.attachmentType === 'image' && (
                        <div className="rounded-xl overflow-hidden border border-zinc-200/80 mb-1.5 aspect-video bg-zinc-950 flex items-center justify-center relative">
                          <img 
                            src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&auto=format&fit=crop&q=80" 
                            alt="attachment" 
                            className="w-full h-full object-cover opacity-90"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 left-2 bg-zinc-950/80 backdrop-blur-xs border border-zinc-800 rounded px-2 py-0.5 text-[8px] font-mono text-white uppercase tracking-wider flex items-center gap-1 shadow-md">
                            <Image className="w-2.5 h-2.5 text-[#34D399]" /> SITE_UPDATE_PHOTO.JPEG
                          </div>
                        </div>
                      )}

                      {msg.attachmentType === 'document' && (
                        <div className="rounded-xl bg-zinc-900 text-white p-3 flex items-center gap-2 border border-zinc-800 mb-1.5">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[#34D399]">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="overflow-hidden flex-grow">
                            <p className="text-xs font-mono font-bold truncate text-white">{msg.attachmentName || 'CSCS_CARD_COPY.PDF'}</p>
                            <span className="text-[9px] text-[#34D399] font-mono uppercase tracking-wider font-bold">Secure Verified Attachment</span>
                          </div>
                          <button className="p-1.5 hover:bg-zinc-800 rounded-xl text-[#34D399]" title="Download document file">
                            <FolderOpen className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {msg.attachmentType === 'voice' && (
                        <div className="rounded-xl bg-zinc-900 text-white p-3 flex items-center gap-2.5 border border-zinc-800 mb-1.5 min-w-[200px]">
                          <Volume2 className="w-4 h-4 text-[#34D399] flex-shrink-0 animate-pulse" />
                          <div className="flex-grow flex gap-0.5 h-5 items-center">
                            {[2, 4, 1, 3, 5, 2, 4, 1, 3, 2, 4, 3, 2, 5, 3, 1].map((h, i) => (
                              <span key={i} style={{ height: `${h * 2.8}px` }} className="w-0.5 bg-[#34D399] rounded-full" />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">0:24</span>
                        </div>
                      )}

                      <p className="text-xs leading-relaxed font-sans">{msg.text}</p>
                      
                      {/* Delivery ticks and receipts */}
                      <div className="flex justify-end items-center gap-1 text-[8px] font-mono opacity-60">
                        <span>{new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (
                          <span title="Message read/seen by partner" className="flex items-center">
                            <CheckCheck className="w-3.5 h-3.5 text-zinc-950 font-bold" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={chatEndRef} />
            </div>

            {/* Quick construction Chips list */}
            {!blockedMatchIds.includes(activeMatch.id) && (
              <div className="px-4 py-2 border-t border-zinc-100 bg-white flex gap-2 overflow-x-auto select-none">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(reply)}
                    className="px-3 py-1.5 bg-zinc-50 border border-zinc-200/80 hover:border-[#34D399] hover:bg-emerald-50 text-zinc-700 text-xs font-mono font-bold rounded-full transition-all duration-200 ease-out flex-shrink-0 cursor-pointer active:scale-[0.99]"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Inputs bar with Rich file uploads */}
            <div className="p-4 bg-white border-t border-zinc-200/80 flex flex-col gap-2 relative">
              
              {/* Upload menus for shareable files */}
              {showAttachmentMenu && (
                <div className="absolute bottom-18 left-4 w-72 bg-white border border-zinc-200/80 rounded-2xl shadow-xl p-3 z-30 font-sans text-xs space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">SHARE VERIFIED DOCUMENT</span>
                    <button onClick={() => setShowAttachmentMenu(false)} className="text-zinc-400 hover:text-zinc-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto">
                    {shareableFiles.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleSend(
                            `I have shared: ${file.name} - ${file.desc}`, 
                            file.type as any, 
                            file.name
                          );
                        }}
                        className="w-full p-2 hover:bg-white rounded-xl text-left flex items-start gap-2 border border-zinc-100 hover:border-zinc-200/80 transition-all duration-200 ease-out cursor-pointer active:scale-[0.99]"
                      >
                        <FileText className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" />
                        <div className="overflow-hidden">
                          <p className="font-bold text-zinc-950 truncate text-[11px]">{file.name}</p>
                          <p className="text-[9px] text-zinc-500 font-mono">{file.desc} &bull; {file.size}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Input Row */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  disabled={blockedMatchIds.includes(activeMatch.id)}
                  className="p-2.5 text-zinc-400 hover:text-[#34D399] hover:bg-white rounded-xl transition-all duration-200 ease-out flex-shrink-0 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  title="Share qualifying documents, insurance forms, or blueprints"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input 
                  type="text" 
                  value={inputText}
                  disabled={blockedMatchIds.includes(activeMatch.id)}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                  placeholder={blockedMatchIds.includes(activeMatch.id) ? "Conversation is blocked" : "Discuss rate expectations, site card checks, or travel..."}
                  className="flex-grow px-4 py-2.5 bg-zinc-50 border border-zinc-200/80 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 focus-visible:ring-offset-2 focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399] text-xs md:text-sm font-medium disabled:opacity-50"
                />

                <button 
                  onClick={() => handleSend(inputText)}
                  disabled={blockedMatchIds.includes(activeMatch.id) || !inputText.trim()}
                  className="p-2.5 bg-[#34D399] hover:bg-[#10B981] text-zinc-950 hover:text-white rounded-xl transition-all duration-200 ease-out shadow-md flex-shrink-0 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  title="Send message"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col justify-center items-center text-center p-6 space-y-3">
            <Wrench className="w-12 h-12 text-zinc-300 stroke-[1.5]" />
            <div>
              <h3 className="text-sm font-bold text-zinc-900">No Chat Selected</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Connect with site openings or tradespeople via the Swipe Deck to unlock real-time chats, voice dispatches, and video calls.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}