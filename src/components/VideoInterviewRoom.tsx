/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Copy,
  ExternalLink,
  HardHat,
  PhoneOff,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface VideoInterviewRoomProps {
  matchId: string;
  partnerName: string;
  partnerAvatar: string;
  partnerTrade: string;
  userRole: 'worker' | 'employer';
  onEndCall: () => void;
}

const safeRoomPart = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48);

export default function VideoInterviewRoom({
  matchId,
  partnerName,
  partnerTrade,
  userRole,
  onEndCall,
}: VideoInterviewRoomProps) {
  const [copied, setCopied] = useState(false);

  const roomName = useMemo(
    () => `HireUpInterview${safeRoomPart(matchId) || 'Room'}`,
    [matchId]
  );

  const meetingLink = `https://meet.jit.si/${roomName}`;

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this interview link:', meetingLink);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white">
      <header className="flex flex-col gap-3 border-b border-zinc-800 bg-zinc-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-[#34D399]">
            <HardHat className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide">
              HireUp Video Interview
            </h2>
            <p className="text-xs text-zinc-400">
              With {partnerName} · {partnerTrade}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyMeetingLink}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-bold hover:bg-zinc-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>

          <a
            href={meetingLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#34D399] px-3 py-2 text-xs font-black text-zinc-950 hover:bg-[#10B981]"
          >
            Open in New Tab <ExternalLink className="h-4 w-4" />
          </a>

          <button
            type="button"
            onClick={onEndCall}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-black hover:bg-red-700"
          >
            <PhoneOff className="h-4 w-4" /> Leave
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 border-b border-zinc-800 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        The first person entering a new room may be asked to sign in as moderator.
      </div>

      <main className="min-h-0 flex-1 bg-black">
        <iframe
          src={`${meetingLink}#config.prejoinPageEnabled=true&config.disableDeepLinking=true`}
          title={`Video interview with ${partnerName}`}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          className="h-full w-full border-0"
        />
      </main>

      <footer className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-4 py-2 text-[11px] text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#34D399]" />
          Both users must open the same interview link
        </span>
        <span>{userRole === 'worker' ? 'Worker' : 'Contractor'} room</span>
      </footer>
    </div>
  );
}