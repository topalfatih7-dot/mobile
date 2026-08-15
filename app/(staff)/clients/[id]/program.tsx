import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { CoachProgramEditor } from '@/components/staff/CoachProgramEditor';
import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { createProgram, updateProgram } from '@/services/staffDb';
import {
  buildWeeklyCoachProgramPayload,
} from '@/utils/coachProgram';

type CoachPayload = ReturnType<typeof buildWeeklyCoachProgramPayload>;

/** LOCK: docs/mobile/screens/staff/client-program.md — web StaffClientProgramPage parity */
export default function ClientProgram() {
  const { id, programId } = useLocalSearchParams<{
    id: string;
    programId?: string;
  }>();
  const { staff } = useAuth();
  const { loading, staffClients, programs, refreshData } = useData();
  const { toast } = useToast();

  const role = String(staff?.role || '');
  const isCoach = role === 'coach';

  const member = useMemo(
    () => staffClients.find((c) => String(c.id) === String(id)) || null,
    [staffClients, id],
  );

  const initialProgram = useMemo(() => {
    if (!programId) return null;
    const found =
      programs.find((p) => String(p.id) === String(programId)) || null;
    if (!found) return null;
    if (String(found.staffId || '') !== String(staff?.id || '')) return null;
    if (String(found.memberId || '') !== String(id)) return null;
    if (String(found.type || 'workout') === 'nutrition') return null;
    return found as Record<string, unknown>;
  }, [programId, programs, staff?.id, id]);

  if (!isCoach) {
    return <Redirect href="/(staff)/clients" />;
  }

  const handleSubmit = async (data: CoachPayload) => {
    if (!member || !staff?.id) return false;

    if (initialProgram?.id) {
      const updated = await updateProgram(String(initialProgram.id), {
        type: 'workout',
        memberName: String(member.name || ''),
        staffName: String(
          (initialProgram.staffName as string) || staff.name || '',
        ),
        ...data,
      });
      if (!updated) return false;
      toast('Antrenman programı güncellendi', 'success');
      await refreshData({ silent: true });
      router.replace('/(staff)/programs');
      return true;
    }

    const created = await createProgram({
      type: 'workout',
      memberId: String(member.id),
      memberName: String(member.name || ''),
      staffId: String(staff.id),
      staffName: String(staff.name || ''),
      ...data,
    });
    if (!created) return false;
    toast(`${member.name} için program gönderildi`, 'success');
    await refreshData({ silent: true });
    router.replace('/(staff)/clients');
    return true;
  };

  const clientName = member ? String(member.name) : 'Danışan';
  const isEdit = Boolean(initialProgram);

  return (
    <PanelScaffold
      keyboard
      showBack
      subtitle={clientName}
      title={isEdit ? 'Programı düzenle' : 'Program oluştur'}>
      {loading && !member ? (
        <InlineSpinner fill />
      ) : !member ? (
        <EmptyState
          description="Danışan listesinde bulunamadı."
          title="Üye bulunamadı"
        />
      ) : programId && !initialProgram ? (
        <EmptyState
          description="Program bulunamadı veya size ait değil."
          title="Program yok"
        />
      ) : (
        <CoachProgramEditor
          initialProgram={initialProgram}
          member={member as Record<string, unknown>}
          onSubmit={handleSubmit}
          relaxAvailability={isEdit}
          submitLabel={isEdit ? 'Programı Kaydet' : 'Programı Gönder'}
          submittingLabel={isEdit ? 'Kaydediliyor…' : 'Gönderiliyor…'}
          titleSuffix={
            isEdit
              ? 'Antrenman programını düzenle'
              : 'Antrenman programı · haftalık şablon'
          }
        />
      )}
    </PanelScaffold>
  );
}
