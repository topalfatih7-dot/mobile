import { addDays, format } from 'date-fns';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import {
  NutritionProgramBuilder,
  type NutritionProgramPayload,
} from '@/components/staff/NutritionProgramBuilder';
import { PanelScaffold } from '@/components/panel/PanelScaffold';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineSpinner } from '@/components/ui/InlineSpinner';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/context/ToastContext';
import { createProgram, updateProgram } from '@/services/staffDb';
import {
  findEntriesOutsidePackage,
  getMemberPackageDateRange,
  getPackageWindowsForProgramType,
  isDateInPackageWindows,
  memberHasProgramTypePackage,
} from '@/utils/programPackageScope';

/** LOCK: F12 — web StaffClientNutritionPage + edit branch parity */
export default function ClientNutritionList() {
  const { id, programId } = useLocalSearchParams<{
    id: string;
    programId?: string;
  }>();
  const { staff } = useAuth();
  const { loading, staffClients, programs, refreshData } = useData();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const role = String(staff?.role || '');
  const isDietitian = role === 'dietitian';

  const member = useMemo(
    () => staffClients.find((c) => String(c.id) === String(id)) || null,
    [staffClients, id],
  );

  const packageRange = useMemo(
    () => (member ? getMemberPackageDateRange(member, 'nutrition') : null),
    [member],
  );

  const initialProgram = useMemo(() => {
    if (!programId) return null;
    const found =
      programs.find((p) => String(p.id) === String(programId)) || null;
    if (!found) return null;
    if (String(found.staffId || '') !== String(staff?.id || '')) return null;
    if (String(found.memberId || '') !== String(id)) return null;
    if (String(found.type || '') !== 'nutrition') return null;
    return found as Record<string, unknown>;
  }, [programId, programs, staff?.id, id]);

  if (!isDietitian) {
    return <Redirect href="/(staff)/clients" />;
  }

  const validateNutritionPayload = (data: NutritionProgramPayload) => {
    if (!member) return false;
    if (!memberHasProgramTypePackage(member, 'nutrition')) {
      toast('Üyenin bu program türü için aktif paketi yok', 'error');
      return false;
    }
    const outside = findEntriesOutsidePackage(
      data.entries || [],
      member,
      'nutrition',
    );
    if (outside.length) {
      const dates = [...new Set(outside.map((e) => e.date))].join(', ');
      toast(`Paket süresi dışındaki tarihler: ${dates}`, 'error');
      return false;
    }
    if (data.scheduleType === 'cycle14' && data.cycleStartDate) {
      const windows = getPackageWindowsForProgramType(member, 'nutrition');
      if (!isDateInPackageWindows(data.cycleStartDate, windows)) {
        toast(
          'Liste başlangıç tarihi üyenin paket süresi içinde olmalı',
          'error',
        );
        return false;
      }
      const endDate = format(
        addDays(
          new Date(`${data.cycleStartDate}T12:00:00`),
          (data.cycleLength || 14) - 1,
        ),
        'yyyy-MM-dd',
      );
      if (!isDateInPackageWindows(endDate, windows)) {
        toast('14 günlük listenin bitiş tarihi paket süresini aşıyor', 'error');
        return false;
      }
    }
    return true;
  };

  const handleCreate = async (data: NutritionProgramPayload) => {
    if (submitting || !member || !staff?.id) return;
    if (!validateNutritionPayload(data)) return;

    setSubmitting(true);
    try {
      const created = await createProgram({
        type: 'nutrition',
        memberId: String(member.id),
        memberName: String(member.name || ''),
        staffId: String(staff.id),
        staffName: String(staff.name || ''),
        ...data,
      });
      if (!created) {
        toast('Program kaydedilemedi. Lütfen tekrar deneyin.', 'error');
        return;
      }
      toast(
        `${member.name} için liste oluşturuldu — danışana bildirim gönderildi`,
        'success',
      );
      await refreshData({ silent: true });
      router.replace('/(staff)/clients');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: NutritionProgramPayload) => {
    if (submitting || !member || !staff?.id || !initialProgram?.id) return;
    if (!validateNutritionPayload(data)) return;

    setSubmitting(true);
    try {
      const updated = await updateProgram(String(initialProgram.id), {
        type: 'nutrition',
        memberName: String(member.name || ''),
        staffName: String(
          (initialProgram.staffName as string) || staff.name || '',
        ),
        ...data,
      });
      if (!updated) {
        toast('Liste kaydedilemedi', 'error');
        return;
      }
      toast('Beslenme listesi güncellendi', 'success');
      await refreshData({ silent: true });
      router.replace('/(staff)/lists');
    } finally {
      setSubmitting(false);
    }
  };

  const clientName = member ? String(member.name) : 'Danışan';
  const isEdit = Boolean(initialProgram);

  return (
    <PanelScaffold
      keyboard
      showBack
      subtitle={
        isEdit
          ? 'Beslenme listesini düzenle'
          : 'Beslenme listesi hazırlayın · süre seçin, öğünleri ekleyin, önizleyip gönderin'
      }
      title={clientName}>
      {loading && !member ? (
        <InlineSpinner fill />
      ) : !member ? (
        <EmptyState
          description="Danışan bulunamadı veya size atanmamış."
          title="Üye bulunamadı"
        />
      ) : programId && !initialProgram ? (
        <EmptyState
          description="Liste bulunamadı veya size ait değil."
          title="Liste yok"
        />
      ) : (
        <NutritionProgramBuilder
          initialData={initialProgram}
          memberName={clientName}
          onCreate={isEdit ? undefined : handleCreate}
          onUpdate={isEdit ? handleUpdate : undefined}
          packageRange={packageRange}
          submitLabel={
            isEdit ? 'Beslenme Listesini Kaydet' : 'Beslenme Listesini Gönder'
          }
        />
      )}
    </PanelScaffold>
  );
}
