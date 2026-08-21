/**
 * Mobile Daily call lifecycle — web `useDailyCall.js` parity.
 * Singleton: aynı anda tek call object (orphan kamera yayını önlenir).
 * Phases: idle → preview (startCamera) → loading → joined; leave → preview.
 */
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

export type DailyParticipant = {
  session_id: string;
  user_name?: string;
  local?: boolean;
  tracks?: {
    video?: { state?: string; track?: unknown; persistentTrack?: unknown };
    audio?: { state?: string; track?: unknown; persistentTrack?: unknown };
  };
};

type DailyCallObject = {
  leave: () => Promise<void> | void;
  destroy: () => Promise<void> | void;
  join: (opts: Record<string, unknown>) => Promise<void>;
  startCamera?: (opts?: Record<string, unknown>) => Promise<void>;
  setLocalAudio: (on: boolean) => Promise<void> | void;
  setLocalVideo: (on: boolean) => Promise<void> | void;
  participants: () => Record<string, DailyParticipant>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
};

export type DailyMediaViewProps = {
  videoTrack: unknown;
  audioTrack: unknown;
  mirror?: boolean;
  zOrder?: number;
  objectFit?: 'contain' | 'cover';
  style?: object;
};

type Phase = 'idle' | 'preview' | 'loading' | 'joined' | 'error';

/** Process-wide: exit sonrası kamera yayınının sürmesini engeller */
let globalCall: DailyCallObject | null = null;
let globalDestroying: Promise<void> | null = null;

async function hardDestroy(call: DailyCallObject | null) {
  if (!call) return;
  try {
    await call.setLocalVideo(false);
  } catch {
    /* ignore */
  }
  try {
    await call.setLocalAudio(false);
  } catch {
    /* ignore */
  }
  try {
    await call.leave();
  } catch {
    /* ignore */
  }
  try {
    await call.destroy();
  } catch {
    /* ignore */
  }
}

export async function destroyGlobalDailyCall() {
  if (globalDestroying) {
    await globalDestroying;
    return;
  }
  const call = globalCall;
  globalCall = null;
  if (!call) return;
  globalDestroying = hardDestroy(call).finally(() => {
    globalDestroying = null;
  });
  await globalDestroying;
}

function trackFor(
  participant: DailyParticipant | null | undefined,
  kind: 'video' | 'audio',
) {
  const t = participant?.tracks?.[kind];
  if (!t) return null;
  const state = String(t.state || '');
  // playable/sendable = aktif; loading/interrupted sırasında da persistentTrack olabilir
  if (state === 'off' || state === 'blocked') return null;
  return t.persistentTrack || t.track || null;
}

export function isTrackPlayable(
  participant: DailyParticipant | null | undefined,
  kind: 'video' | 'audio',
) {
  const state = String(participant?.tracks?.[kind]?.state || '');
  return state === 'playable' || state === 'sendable';
}

export function useDailyCall() {
  const callRef = useRef<DailyCallObject | null>(null);
  const handlersRef = useRef<Array<{ event: string; handler: (...args: unknown[]) => void }>>(
    [],
  );
  const mediaStateRef = useRef({ camOn: true, micOn: true });
  const returningToPreviewRef = useRef(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<{
    local: DailyParticipant | null;
    remote: DailyParticipant[];
  }>({ local: null, remote: [] });
  const [mediaState, setMediaState] = useState({ camOn: true, micOn: true });
  const [DailyMediaView, setDailyMediaView] = useState<ComponentType<DailyMediaViewProps> | null>(
    null,
  );

  useEffect(() => {
    mediaStateRef.current = mediaState;
  }, [mediaState]);

  const refreshParticipants = useCallback(() => {
    const call = callRef.current;
    if (!call) {
      setParticipants({ local: null, remote: [] });
      return;
    }
    try {
      const all = call.participants() || {};
      const local = all.local || Object.values(all).find((p) => p.local) || null;
      const remote = Object.values(all).filter((p) => !p.local);
      setParticipants({ local, remote });
    } catch {
      /* ignore */
    }
  }, []);

  const detachHandlers = useCallback((call: DailyCallObject) => {
    for (const { event, handler } of handlersRef.current) {
      try {
        call.off(event, handler);
      } catch {
        /* ignore */
      }
    }
    handlersRef.current = [];
  }, []);

  const applyLocalMedia = useCallback(async (call: DailyCallObject, camOn: boolean, micOn: boolean) => {
    if (typeof call.startCamera === 'function') {
      await call.startCamera({
        startVideoOff: !camOn,
        startAudioOff: !micOn,
      });
    }
    try {
      await call.setLocalVideo(camOn);
    } catch {
      /* ignore */
    }
    try {
      await call.setLocalAudio(micOn);
    } catch {
      /* ignore */
    }
  }, []);

  const returnToPreview = useCallback(
    async (call: DailyCallObject) => {
      const { camOn, micOn } = mediaStateRef.current;
      returningToPreviewRef.current = true;
      try {
        try {
          await call.leave();
        } catch {
          /* already left */
        }
        await applyLocalMedia(call, camOn, micOn);
        setPhase('preview');
        refreshParticipants();
      } catch {
        setPhase('preview');
        refreshParticipants();
      } finally {
        returningToPreviewRef.current = false;
      }
    },
    [applyLocalMedia, refreshParticipants],
  );

  const attachHandlers = useCallback(
    (call: DailyCallObject) => {
      detachHandlers(call);
      const onPart = () => refreshParticipants();
      const onLeft = () => {
        // leaveMeeting / returnToPreview leave() tetikler — çift işlem yok
        if (returningToPreviewRef.current) {
          refreshParticipants();
          return;
        }
        // Beklenmeyen düşüş: web parity — preview'a dön (destroy yok)
        void returnToPreview(call);
      };
      const onError = (ev: unknown) => {
        const msg =
          (ev as { errorMsg?: string; error?: { msg?: string } })?.errorMsg ||
          (ev as { error?: { msg?: string } })?.error?.msg ||
          'Bağlantı hatası';
        setError(String(msg));
      };
      const pairs: Array<[string, (...args: unknown[]) => void]> = [
        ['joined-meeting', onPart],
        ['participant-joined', onPart],
        ['participant-updated', onPart],
        ['participant-left', onPart],
        ['track-started', onPart],
        ['track-stopped', onPart],
        ['left-meeting', onLeft],
        ['error', onError],
      ];
      handlersRef.current = pairs.map(([event, handler]) => {
        call.on(event, handler);
        return { event, handler };
      });
    },
    [detachHandlers, refreshParticipants, returnToPreview],
  );

  const ensureCallObject = useCallback(async () => {
    if (callRef.current) return callRef.current;

    const DailyMod = await import('@daily-co/react-native-daily-js');
    const Daily = DailyMod.default;
    const MediaView = DailyMod.DailyMediaView as ComponentType<DailyMediaViewProps>;
    if (MediaView) setDailyMediaView(() => MediaView);

    const call = Daily.createCallObject({
      reactNativeConfig: {
        androidInCallNotification: {
          title: 'Görüntülü görüşme',
          subtitle: 'Görüşme devam ediyor. Açmak için dokun.',
        },
        // Android: FGS ile arka planda kamera akışı. iOS arka planda kamera yok (Apple).
        disableAutoDeviceManagement: {
          video: Platform.OS === 'android',
        },
      },
    }) as unknown as DailyCallObject;
    globalCall = call;
    callRef.current = call;
    attachHandlers(call);
    return call;
  }, [attachHandlers]);

  const destroy = useCallback(async () => {
    const call = callRef.current;
    callRef.current = null;
    if (call) {
      detachHandlers(call);
      if (globalCall === call) globalCall = null;
      await hardDestroy(call);
    } else {
      await destroyGlobalDailyCall();
    }
    setPhase('idle');
    setParticipants({ local: null, remote: [] });
  }, [detachHandlers]);

  const startPreview = useCallback(
    async (opts?: { camOn?: boolean; micOn?: boolean }) => {
      setError(null);
      const camOn = opts?.camOn !== false;
      const micOn = opts?.micOn !== false;
      setMediaState({ camOn, micOn });
      mediaStateRef.current = { camOn, micOn };

      try {
        const call = await ensureCallObject();
        await applyLocalMedia(call, camOn, micOn);
        setPhase('preview');
        refreshParticipants();
        return { ok: true as const };
      } catch (e: unknown) {
        const err = e as { errorMsg?: string; message?: string };
        const message = String(
          err?.errorMsg || err?.message || 'Kamera önizlemesi başlatılamadı.',
        );
        setError(message);
        setPhase('error');
        return { ok: false as const, error: message };
      }
    },
    [applyLocalMedia, ensureCallObject, refreshParticipants],
  );

  const join = useCallback(
    async (opts: {
      url: string;
      token: string;
      userName: string;
      camOn?: boolean;
      micOn?: boolean;
    }) => {
      setError(null);
      const camOn = opts.camOn !== false;
      const micOn = opts.micOn !== false;
      setMediaState({ camOn, micOn });
      mediaStateRef.current = { camOn, micOn };

      try {
        setPhase('loading');
        const hadPreview = Boolean(callRef.current);
        const call = await ensureCallObject();

        // Preview yoksa join öncesi medya (web parity)
        if (!hadPreview) {
          await applyLocalMedia(call, camOn, micOn);
        } else {
          try {
            await call.setLocalVideo(camOn);
          } catch {
            /* ignore */
          }
          try {
            await call.setLocalAudio(micOn);
          } catch {
            /* ignore */
          }
        }

        await call.join({
          url: opts.url,
          token: opts.token,
          userName: opts.userName || 'Katılımcı',
          startVideoOff: !camOn,
          startAudioOff: !micOn,
        });

        try {
          await call.setLocalVideo(camOn);
        } catch {
          /* ignore */
        }
        try {
          await call.setLocalAudio(micOn);
        } catch {
          /* ignore */
        }

        setPhase('joined');
        refreshParticipants();
        return { ok: true as const };
      } catch (e: unknown) {
        const err = e as { errorMsg?: string; message?: string };
        const message = String(err?.errorMsg || err?.message || 'Görüşmeye bağlanılamadı.');
        setError(message);
        // Preview call object'i koru — destroy yok
        const call = callRef.current;
        if (call) {
          try {
            await applyLocalMedia(call, camOn, micOn);
          } catch {
            /* ignore */
          }
          setPhase('preview');
          refreshParticipants();
        } else {
          setPhase('error');
        }
        return { ok: false as const, error: message };
      }
    },
    [applyLocalMedia, ensureCallObject, refreshParticipants],
  );

  const leaveMeeting = useCallback(async () => {
    const call = callRef.current;
    if (!call) {
      setPhase('preview');
      return;
    }
    setError(null);
    const { camOn, micOn } = mediaStateRef.current;
    returningToPreviewRef.current = true;
    try {
      try {
        await call.leave();
      } catch {
        /* ignore */
      }
      await applyLocalMedia(call, camOn, micOn);
      setPhase('preview');
      refreshParticipants();
    } catch {
      setPhase('preview');
    } finally {
      returningToPreviewRef.current = false;
    }
  }, [applyLocalMedia, refreshParticipants]);

  const toggleCam = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;
    const next = !mediaState.camOn;
    try {
      await call.setLocalVideo(next);
      setMediaState((s) => ({ ...s, camOn: next }));
      refreshParticipants();
    } catch {
      setError('Kamera değiştirilemedi.');
    }
  }, [mediaState.camOn, refreshParticipants]);

  const toggleMic = useCallback(async () => {
    const call = callRef.current;
    if (!call) return;
    const next = !mediaState.micOn;
    try {
      await call.setLocalAudio(next);
      setMediaState((s) => ({ ...s, micOn: next }));
      refreshParticipants();
    } catch {
      setError('Mikrofon değiştirilemedi.');
    }
  }, [mediaState.micOn, refreshParticipants]);

  // Unmount / exit: orphan kamera yayını bırakma
  useEffect(() => {
    return () => {
      const call = callRef.current;
      callRef.current = null;
      if (call) {
        if (globalCall === call) globalCall = null;
        void hardDestroy(call);
      } else {
        void destroyGlobalDailyCall();
      }
    };
  }, []);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active' && callRef.current) refreshParticipants();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [refreshParticipants]);

  const remote = participants.remote[0] || null;
  const local = participants.local;

  return {
    phase,
    error,
    mediaState,
    DailyMediaView,
    local,
    remote,
    localVideo: mediaState.camOn ? trackFor(local, 'video') : null,
    localAudio: trackFor(local, 'audio'),
    remoteVideo: trackFor(remote, 'video'),
    remoteAudio: trackFor(remote, 'audio'),
    remoteVideoPlayable: isTrackPlayable(remote, 'video'),
    localVideoPlayable: isTrackPlayable(local, 'video') && mediaState.camOn,
    isJoined: phase === 'joined',
    isPreview: phase === 'preview',
    isLoading: phase === 'loading',
    startPreview,
    join,
    leaveMeeting,
    destroy,
    toggleCam,
    toggleMic,
    refreshParticipants,
  };
}
