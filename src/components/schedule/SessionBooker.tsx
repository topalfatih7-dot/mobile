import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import {
  BOOKING_POLICY_ACK_COPY,
  SLOT_ACTIVE_STATUSES,
} from '@/utils/sessionCancelRules';
import {
  BOOK_WINDOW_DAYS,
  DEFAULT_SESSION_DURATION,
  expandAvailabilitySlots,
  type MemberSession,
  type SessionType,
} from '@/utils/sessionBooking';
import { colors, fonts, radius, spacing } from '@/theme';

type Props = {
  open: boolean;
  onClose: () => void;
  type: SessionType;
  staff: Record<string, unknown> | null;
  existingSessions: MemberSession[];
  monthlyLimit: number;
  usedThisMonth: number;
  duration?: number;
  onBook: (iso: string, duration: number) => Promise<{ ok: true } | { ok: false; error: string }>;
  /** LOCK session-booker — başka üyelerin dolu slot timestamp’leri */
  getBookedSlots?: (
    staffId: string,
    type: SessionType,
    fromISO: string,
    toISO: string,
  ) => Promise<Set<number>>;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function SessionBooker({
  open,
  onClose,
  type,
  staff,
  existingSessions,
  monthlyLimit,
  usedThisMonth,
  duration = DEFAULT_SESSION_DURATION,
  onBook,
  getBookedSlots,
}: Props) {
  const insets = useSafeAreaInsets();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [booking, setBooking] = useState(false);
  const [policyAck, setPolicyAck] = useState(false);
  const [takenTimes, setTakenTimes] = useState<Set<number>>(new Set());

  const staffName = staff ? String(staff.name || 'Uzman') : '';
  const staffId = staff?.id ? String(staff.id) : '';

  const days = useMemo(() => {
    const out: Date[] = [];
    const base = startOfDay(new Date());
    for (let i = 0; i < BOOK_WINDOW_DAYS; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  const availability = (staff?.availability as Record<string, string[]>) || {};

  const daysWithSlots = useMemo(
    () =>
      days.filter((d) => {
        const slots = expandAvailabilitySlots(availability, d);
        return slots.some((s) => s.getTime() > Date.now());
      }),
    [days, availability],
  );

  const daySlots = useMemo(() => {
    if (!selectedDay) return [];
    return expandAvailabilitySlots(availability, selectedDay);
  }, [selectedDay, availability]);

  const selectedMonthUsed = useMemo(() => {
    if (!selectedDay) return usedThisMonth;
    return existingSessions.filter((session) => {
      if (
        !session.date ||
        !SLOT_ACTIVE_STATUSES.includes(
          (session.status || 'scheduled') as (typeof SLOT_ACTIVE_STATUSES)[number],
        )
      ) {
        return false;
      }
      const date = new Date(session.date);
      return (
        date.getFullYear() === selectedDay.getFullYear() &&
        date.getMonth() === selectedDay.getMonth()
      );
    }).length;
  }, [existingSessions, selectedDay, usedThisMonth]);
  const remaining = Math.max(0, monthlyLimit - selectedMonthUsed);
  const limitReached = monthlyLimit > 0 && selectedMonthUsed >= monthlyLimit;

  const ownActiveTimes = useMemo(() => {
    const set = new Set<number>();
    for (const s of existingSessions) {
      if (
        !s?.date ||
        !SLOT_ACTIVE_STATUSES.includes(
          (s.status || 'scheduled') as (typeof SLOT_ACTIVE_STATUSES)[number],
        )
      ) {
        continue;
      }
      set.add(new Date(s.date).getTime());
    }
    return set;
  }, [existingSessions]);

  useEffect(() => {
    if (!open || !staffId || !getBookedSlots) {
      setTakenTimes(new Set());
      return;
    }
    const from = days[0]?.toISOString();
    const to = days[days.length - 1]
      ? new Date(
          days[days.length - 1].getTime() + 24 * 60 * 60 * 1000 - 1,
        ).toISOString()
      : from;
    if (!from || !to) return;
    let alive = true;
    void getBookedSlots(staffId, type, from, to).then((set) => {
      if (alive) setTakenTimes(set);
    });
    return () => {
      alive = false;
    };
  }, [open, staffId, type, getBookedSlots, days]);

  const reset = () => {
    setSelectedDay(null);
    setSelectedSlot(null);
    setConfirming(false);
    setBooking(false);
    setPolicyAck(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickSlot = (slot: Date) => {
    if (slot.getTime() < Date.now()) {
      toast('Geçmiş bir saat seçilemez.', 'warning');
      return;
    }
    setSelectedSlot(slot);
    setConfirming(true);
  };

  const confirm = async () => {
    if (!selectedSlot) return;
    if (!policyAck) {
      toast('Devam etmek için iptal kurallarını onaylayın.', 'warning');
      return;
    }
    setBooking(true);
    const res = await onBook(selectedSlot.toISOString(), duration);
    setBooking(false);
    if (!res.ok) {
      toast(res.error || 'Randevu oluşturulamadı.', 'error');
      return;
    }
    handleClose();
  };

  return (
    <Modal animationType="slide" onRequestClose={handleClose} visible={open}>
      <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Randevu Al</Text>
          <Pressable hitSlop={12} onPress={handleClose}>
            <Text style={styles.close}>Kapat</Text>
          </Pressable>
        </View>

        {!staff ? (
          <Text style={styles.empty}>
            Henüz bir uzman atanmamış. Atama sonrası randevu alabilirsiniz.
          </Text>
        ) : daysWithSlots.length === 0 ? (
          <Text style={styles.empty}>
            {staffName} önümüzdeki 28 gün için müsaitlik belirtmemiş.
          </Text>
        ) : confirming && selectedSlot ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Randevuyu onaylayın</Text>
            <Text style={styles.confirmRow}>Uzman: {staffName}</Text>
            <Text style={styles.confirmRow}>
              Tarih: {format(selectedSlot, 'd MMMM yyyy', { locale: tr })}
            </Text>
            <Text style={styles.confirmRow}>
              Saat: {format(selectedSlot, 'HH:mm')} · {duration} dk
            </Text>
            <Pressable
              onPress={() => setPolicyAck((v) => !v)}
              style={styles.policyRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: policyAck }}>
              <View style={[styles.checkbox, policyAck && styles.checkboxOn]}>
                {policyAck ? <Text style={styles.checkboxMark}>✓</Text> : null}
              </View>
              <Text style={styles.policyText}>
                <Text style={styles.policyBold}>Anladım — </Text>
                {BOOKING_POLICY_ACK_COPY}
              </Text>
            </Pressable>
            <View style={styles.confirmActions}>
              <Button
                label="Saati değiştir"
                onPress={() => {
                  setConfirming(false);
                  setSelectedSlot(null);
                  setPolicyAck(false);
                }}
                variant="secondary"
              />
              <Button
                disabled={!policyAck}
                label={booking ? 'Oluşturuluyor…' : 'Randevuyu Onayla'}
                loading={booking}
                onPress={confirm}
              />
            </View>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.hint}>
              {staffName} ile gün ve saati seçin, ardından randevuyu onaylayın.
            </Text>
            {monthlyLimit > 0 ? (
              <Text style={styles.quota}>
                Bu ay kalan hakkınız: {remaining}/{monthlyLimit}.
              </Text>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
              {daysWithSlots.map((d) => {
                const selected =
                  selectedDay && startOfDay(selectedDay).getTime() === startOfDay(d).getTime();
                return (
                  <Pressable
                    key={d.toISOString()}
                    onPress={() => {
                      setSelectedDay(d);
                      setSelectedSlot(null);
                    }}
                    style={[styles.dayChip, selected && styles.dayChipOn]}>
                    <Text style={[styles.dayEee, selected && styles.dayOnText]}>
                      {format(d, 'EEE', { locale: tr })}
                    </Text>
                    <Text style={[styles.dayNum, selected && styles.dayOnText]}>
                      {format(d, 'd')}
                    </Text>
                    <Text style={[styles.dayMmm, selected && styles.dayOnText]}>
                      {format(d, 'MMM', { locale: tr })}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {limitReached ? (
              <Text style={styles.warn}>
                Bu ay için randevu hakkınız doldu. Sonraki ay için bir gün seçebilirsiniz.
              </Text>
            ) : !selectedDay ? (
              <Text style={styles.muted}>Gün seçin</Text>
            ) : daySlots.length === 0 ? (
              <Text style={styles.muted}>Bu gün için uygun slot yok.</Text>
            ) : (
              <View style={styles.grid}>
                {daySlots.map((slot) => {
                  const t = slot.getTime();
                  const past = t < Date.now();
                  const own = ownActiveTimes.has(t);
                  const taken = takenTimes.has(t);
                  const disabled = past || own || taken || limitReached;
                  return (
                    <Pressable
                      key={slot.toISOString()}
                      accessibilityRole="button"
                      accessibilityLabel={`${format(slot, 'HH:mm')}${own ? ', zaten randevunuz var' : taken ? ', dolu' : ''}`}
                      disabled={disabled}
                      onPress={() => pickSlot(slot)}
                      style={[styles.slot, disabled && styles.slotDisabled]}>
                      <Text style={[styles.slotText, disabled && styles.slotTextDisabled]}>
                        {format(slot, 'HH:mm')}
                      </Text>
                      {own ? (
                        <Text style={styles.slotHint}>Bu saatte zaten randevunuz var</Text>
                      ) : taken ? (
                        <Text style={styles.slotHint}>Bu saat dolu</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream[50], paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { fontFamily: fonts.displayExtra, fontSize: 24, color: colors.cream[900] },
  close: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[600] },
  body: { paddingBottom: spacing.xxl, gap: spacing.md },
  hint: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800], lineHeight: 20 },
  quota: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.brand[700] },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[800],
    marginTop: spacing.xl,
    lineHeight: 22,
  },
  dayRow: { marginVertical: spacing.sm },
  dayChip: {
    width: 64,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    alignItems: 'center',
  },
  dayChipOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  dayEee: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], textTransform: 'capitalize' },
  dayNum: { fontFamily: fonts.displayExtra, fontSize: 18, color: colors.cream[900] },
  dayMmm: { fontFamily: fonts.sans, fontSize: 11, color: colors.cream[800], textTransform: 'capitalize' },
  dayOnText: { color: colors.white },
  warn: { fontFamily: fonts.sans, fontSize: 14, color: colors.warm[500], lineHeight: 20 },
  muted: { fontFamily: fonts.sans, fontSize: 14, color: colors.cream[800] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slot: {
    minWidth: '30%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand[200],
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  slotDisabled: {
    backgroundColor: colors.cream[100],
    borderColor: colors.cream[200],
  },
  slotText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.brand[700] },
  slotTextDisabled: { color: colors.cream[300] },
  slotHint: { fontFamily: fonts.sans, fontSize: 10, color: colors.cream[800], marginTop: 2, textAlign: 'center' },
  confirmCard: {
    backgroundColor: colors.sage[50],
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.sage[200],
    gap: spacing.sm,
  },
  confirmTitle: { fontFamily: fonts.displayExtra, fontSize: 20, color: colors.cream[900], marginBottom: 4 },
  confirmRow: { fontFamily: fonts.sans, fontSize: 15, color: colors.cream[800] },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.warm[50] || colors.cream[100],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.brand[400],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: { backgroundColor: colors.brand[600], borderColor: colors.brand[600] },
  checkboxMark: { color: colors.white, fontSize: 13, fontFamily: fonts.sansSemi },
  policyText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.cream[900],
  },
  policyBold: { fontFamily: fonts.sansSemi },
  confirmActions: { marginTop: spacing.md, gap: spacing.sm },
});
