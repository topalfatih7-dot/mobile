import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ComponentProps } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  clearHiddenFollowUps,
  getSoftWarningMessage,
  hasStoredAnswer,
  HEALTH_AUDIENCE_META,
  isDetailFilled,
  isDetailVisible,
  isFollowUpVisible,
  isQuestionFullyAnswered,
  toggleExclusiveMulti,
  type HealthOption,
  type HealthQuestion,
} from '@/data/healthTest';
import {
  pickLabFile,
  uploadHealthLabResult,
  type LabFileMeta,
} from '@/services/memberMedia';
import { colors, fonts, radius, spacing } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const SECTION_ICON: Record<string, IoniconName> = {
  HeartPulse: 'heart',
  Stethoscope: 'medkit',
  Dumbbell: 'barbell',
  Activity: 'pulse',
  Venus: 'female',
  Mars: 'male',
  Apple: 'nutrition',
  Moon: 'moon',
  Clock3: 'time',
  Flower2: 'sparkles',
  Bone: 'fitness',
};

type Theme = {
  grad: [string, string];
  soft: string;
  solid: string;
  text: string;
  bar: string;
  chipBg: string;
  chipBorder: string;
};

const THEME: Record<string, Theme> = {
  general: {
    grad: [colors.brand[500], colors.brand[600]],
    soft: colors.brand[50],
    solid: colors.brand[500],
    text: colors.brand[700],
    bar: colors.brand[500],
    chipBg: colors.brand[50],
    chipBorder: colors.brand[200],
  },
  medical: {
    grad: [colors.danger[500], colors.danger[600]],
    soft: colors.danger[50],
    solid: colors.danger[500],
    text: colors.danger[700],
    bar: colors.danger[500],
    chipBg: colors.danger[50],
    chipBorder: colors.danger[100],
  },
  physical: {
    grad: [colors.warm[500], colors.warm[400]],
    soft: colors.warm[50],
    solid: colors.warm[500],
    text: colors.warm[500],
    bar: colors.warm[500],
    chipBg: colors.warm[50],
    chipBorder: colors.warm[200],
  },
  lifestyle: {
    grad: [colors.brand[400], colors.brand[600]],
    soft: colors.brand[50],
    solid: colors.brand[500],
    text: colors.brand[700],
    bar: colors.brand[500],
    chipBg: colors.brand[50],
    chipBorder: colors.brand[200],
  },
  women: {
    grad: [colors.warm[500], colors.warm[400]],
    soft: colors.warm[50],
    solid: colors.warm[500],
    text: colors.warm[500],
    bar: colors.warm[500],
    chipBg: colors.warm[50],
    chipBorder: colors.warm[200],
  },
  men: {
    grad: [colors.cream[800], colors.cream[900]],
    soft: colors.cream[100],
    solid: colors.cream[800],
    text: colors.cream[900],
    bar: colors.cream[800],
    chipBg: colors.cream[100],
    chipBorder: colors.cream[200],
  },
  nutrition: {
    grad: [colors.sage[500], colors.sage[600]],
    soft: colors.sage[50],
    solid: colors.sage[500],
    text: colors.sage[700],
    bar: colors.sage[500],
    chipBg: colors.sage[50],
    chipBorder: colors.sage[200],
  },
};

function themeFor(sectionId?: string): Theme {
  return THEME[sectionId || ''] || THEME.general;
}

function BatteryLevelIcon({
  level = 1,
  selected,
}: {
  level?: number;
  selected: boolean;
}) {
  const clamped = Math.min(5, Math.max(1, Number(level) || 1));
  const fill =
    clamped <= 2
      ? selected
        ? colors.danger[100]
        : colors.danger[500]
      : clamped === 3
        ? selected
          ? colors.warm[200]
          : colors.warm[500]
        : selected
          ? colors.sage[200]
          : colors.sage[500];
  const empty = selected ? 'rgba(255,255,255,0.25)' : colors.cream[200];
  const frame = selected ? 'rgba(255,255,255,0.8)' : colors.cream[300];
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 12,
          height: 6,
          borderTopLeftRadius: 2,
          borderTopRightRadius: 2,
          backgroundColor: frame,
          marginBottom: 1,
        }}
      />
      <View
        style={{
          width: 28,
          height: 44,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: selected ? 'rgba(255,255,255,0.8)' : colors.cream[300],
          padding: 2,
          flexDirection: 'column-reverse',
          gap: 2,
        }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <View
            key={n}
            style={{
              flex: 1,
              borderRadius: 2,
              backgroundColor: n <= clamped ? fill : empty,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function StarLevelIcon({
  count = 1,
  selected,
}: {
  count?: number;
  selected: boolean;
}) {
  const filled = Math.min(5, Math.max(1, Number(count) || 1));
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Text
          key={i}
          style={{
            fontSize: 14,
            color:
              i < filled
                ? selected
                  ? colors.gold[400]
                  : colors.gold[500]
                : selected
                  ? 'rgba(255,255,255,0.25)'
                  : colors.cream[200],
          }}>
          ★
        </Text>
      ))}
    </View>
  );
}

function EmojiVisual({
  option,
  selected,
}: {
  option: HealthOption;
  selected: boolean;
}) {
  if (option.batteryLevel != null) {
    return <BatteryLevelIcon level={option.batteryLevel} selected={selected} />;
  }
  if (option.stars != null) {
    return <StarLevelIcon count={option.stars} selected={selected} />;
  }
  return <Text style={{ fontSize: 36 }}>{option.emoji}</Text>;
}

function ScaleInput({
  q,
  value,
  onChange,
  theme,
}: {
  q: HealthQuestion;
  value: unknown;
  onChange: (v: number) => void;
  theme: Theme;
}) {
  const min = q.min ?? 0;
  const max = q.max ?? 10;
  const num = value === '' || value == null ? min : Number(value);
  const display = Number.isFinite(num) ? num : min;

  return (
    <View style={[styles.scaleBox, { backgroundColor: theme.soft }]}>
      <View style={styles.scaleHeader}>
        <Text style={styles.scaleRange}>
          {min} – {max}
        </Text>
        <Text style={[styles.scaleValue, { color: theme.text }]}>{display}</Text>
      </View>
      <View style={styles.scaleRow}>
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((i) => {
          const on = display === i && value !== '' && value != null;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(i)}
              style={[
                styles.scaleChip,
                on && { backgroundColor: theme.solid, borderColor: theme.solid },
              ]}>
              <Text
                style={[
                  styles.scaleChipText,
                  on && { color: colors.white },
                ]}>
                {i}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleHint}>{q.minLabel || String(min)}</Text>
        <Text style={styles.scaleHint}>{q.maxLabel || String(max)}</Text>
      </View>
    </View>
  );
}

function FileUploadInput({
  value,
  onChange,
  theme,
  userId,
}: {
  value: unknown;
  onChange: (v: LabFileMeta[]) => void;
  theme: Theme;
  userId: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const files: LabFileMeta[] = Array.isArray(value)
    ? (value as LabFileMeta[])
    : [];

  const handlePick = async () => {
    setError('');
    const picked = await pickLabFile();
    if (!picked) return;
    setUploading(true);
    try {
      const res = await uploadHealthLabResult({
        userId,
        uri: picked.uri,
        fileName: picked.name,
        contentType: picked.mimeType,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onChange([...files, res.meta]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <Pressable
        disabled={uploading || !userId}
        onPress={() => void handlePick()}
        style={[
          styles.fileDrop,
          { backgroundColor: theme.soft, borderColor: colors.cream[300] },
        ]}>
        <Ionicons color={theme.text} name="cloud-upload-outline" size={24} />
        <Text style={styles.fileDropTitle}>
          {uploading ? 'Yükleniyor…' : 'PDF veya fotoğraf yükleyin'}
        </Text>
        <Text style={styles.fileDropHint}>En fazla 8 MB · PDF, JPG, PNG, WEBP</Text>
      </Pressable>
      {error ? (
        <Text style={styles.errorInline}>
          <Ionicons name="alert-circle" size={14} /> {error}
        </Text>
      ) : null}
      {files.map((f, idx) => (
        <View key={`${f.path}-${idx}`} style={styles.fileRow}>
          <Ionicons color={colors.cream[300]} name="document-text" size={16} />
          <Text numberOfLines={1} style={styles.fileName}>
            {f.name || f.path}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => onChange(files.filter((_, i) => i !== idx))}>
            <Ionicons color={colors.cream[800]} name="close" size={18} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function OptionGrid({
  q,
  theme,
  healthTest,
  onPick,
  onToggle,
}: {
  q: HealthQuestion;
  theme: Theme;
  healthTest: Record<string, unknown>;
  onPick: (v: string) => void;
  onToggle: (v: string) => void;
}) {
  if (q.type === 'emoji') {
    return (
      <View style={styles.emojiGrid}>
        {(q.options || []).map((o) => {
          const sel = healthTest[q.key] === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onPick(o.value)}
              style={[
                styles.emojiOpt,
                sel && {
                  backgroundColor: theme.solid,
                  borderColor: theme.solid,
                },
              ]}>
              <EmojiVisual option={o} selected={sel} />
              <Text
                style={[
                  styles.emojiLabel,
                  sel && { color: colors.white },
                ]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (q.type === 'single') {
    return (
      <View style={{ gap: 10 }}>
        {(q.options || []).map((o) => {
          const sel = healthTest[q.key] === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onPick(o.value)}
              style={[
                styles.singleOpt,
                sel && {
                  backgroundColor: theme.solid,
                  borderColor: theme.solid,
                },
              ]}>
              <Text
                style={[
                  styles.singleLabel,
                  sel && { color: colors.white },
                ]}>
                {o.label}
              </Text>
              {o.desc ? (
                <Text
                  style={[
                    styles.singleDesc,
                    sel && { color: 'rgba(255,255,255,0.85)' },
                  ]}>
                  {o.desc}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (q.type === 'multi') {
    const selected = Array.isArray(healthTest[q.key])
      ? (healthTest[q.key] as string[])
      : healthTest[q.key]
        ? [String(healthTest[q.key])]
        : [];
    return (
      <View style={{ gap: 10 }}>
        {(q.options || []).map((o) => {
          const sel = selected.includes(o.value);
          return (
            <Pressable
              key={o.value}
              onPress={() => onToggle(o.value)}
              style={[
                styles.multiOpt,
                sel && {
                  backgroundColor: theme.chipBg,
                  borderColor: theme.chipBorder,
                },
              ]}>
              <View
                style={[
                  styles.checkBox,
                  sel && {
                    backgroundColor: theme.solid,
                    borderColor: theme.solid,
                  },
                ]}>
                {sel ? (
                  <Ionicons color={colors.white} name="checkmark" size={14} />
                ) : null}
              </View>
              <Text style={styles.multiLabel}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return null;
}

function FollowUpBlock({
  followUp,
  healthTest,
  updateHealthTest,
  theme,
  showErrors,
  userId,
}: {
  followUp: HealthQuestion;
  healthTest: Record<string, unknown>;
  updateHealthTest: (patch: Record<string, unknown>) => void;
  theme: Theme;
  showErrors: boolean;
  userId: string;
}) {
  const parentVal = healthTest?.[followUp.key];
  const detailVisible =
    followUp.detail && isDetailVisible(followUp.detail, parentVal);
  const missing =
    showErrors &&
    followUp.required !== false &&
    !isQuestionFullyAnswered(followUp, healthTest);
  const detailMissing =
    showErrors &&
    detailVisible &&
    !isDetailFilled(followUp.detail, healthTest);

  const pickSingle = (value: string) => {
    updateHealthTest({
      [followUp.key]: value,
      ...clearHiddenFollowUps(followUp, value),
    });
  };
  const toggleMulti = (value: string) => {
    const next = toggleExclusiveMulti(
      healthTest[followUp.key],
      value,
      followUp.options || [],
    );
    updateHealthTest({
      [followUp.key]: next,
      ...clearHiddenFollowUps(followUp, next),
    });
  };

  return (
    <View style={styles.followUp}>
      <Text style={styles.followUpTitle}>
        {followUp.label}
        {followUp.required !== false ? (
          <Text style={{ color: colors.danger[500] }}> *</Text>
        ) : null}
      </Text>
      {followUp.hint ? (
        <Text style={styles.hint}>{followUp.hint}</Text>
      ) : null}
      <View style={{ marginTop: 10 }}>
        {(followUp.type === 'emoji' ||
          followUp.type === 'single' ||
          followUp.type === 'multi') && (
          <OptionGrid
            healthTest={healthTest}
            onPick={pickSingle}
            onToggle={toggleMulti}
            q={followUp}
            theme={theme}
          />
        )}
        {followUp.type === 'text' ? (
          <TextInput
            multiline
            onChangeText={(t) => updateHealthTest({ [followUp.key]: t })}
            placeholder={followUp.placeholder}
            placeholderTextColor={colors.cream[300]}
            style={styles.textArea}
            value={String(healthTest[followUp.key] || '')}
          />
        ) : null}
        {followUp.type === 'scale' ? (
          <ScaleInput
            onChange={(v) => updateHealthTest({ [followUp.key]: v })}
            q={followUp}
            theme={theme}
            value={healthTest[followUp.key]}
          />
        ) : null}
        {followUp.type === 'file' ? (
          <FileUploadInput
            onChange={(v) => updateHealthTest({ [followUp.key]: v })}
            theme={theme}
            userId={userId}
            value={healthTest[followUp.key]}
          />
        ) : null}
        {followUp.detail && detailVisible ? (
          <TextInput
            onChangeText={(t) =>
              updateHealthTest({ [followUp.detail!.key]: t })
            }
            placeholder={followUp.detail.placeholder}
            placeholderTextColor={colors.cream[300]}
            style={[
              styles.detailInput,
              detailMissing && styles.detailInputError,
            ]}
            value={String(healthTest[followUp.detail.key] || '')}
          />
        ) : null}
      </View>
      {missing ? (
        <Text style={styles.errorInline}>Lütfen bu alanı tamamlayın</Text>
      ) : null}
      {(followUp.followUps || [])
        .filter((fu) => isFollowUpVisible(fu, parentVal))
        .map((fu) => (
          <FollowUpBlock
            key={fu.key}
            followUp={fu}
            healthTest={healthTest}
            showErrors={showErrors}
            theme={theme}
            updateHealthTest={updateHealthTest}
            userId={userId}
          />
        ))}
    </View>
  );
}

/**
 * Web parity: Adsız `HealthTestStep.jsx`
 */
export function HealthTestStep({
  question,
  questionIndex,
  totalQuestions,
  sectionTitle,
  healthTest,
  updateHealthTest,
  showErrors,
  userId,
}: {
  question: HealthQuestion;
  questionIndex: number;
  totalQuestions: number;
  sectionTitle?: string;
  healthTest: Record<string, unknown>;
  updateHealthTest: (patch: Record<string, unknown>) => void;
  showErrors: boolean;
  userId: string;
}) {
  if (!question) return null;

  const theme = themeFor(question.sectionId);
  const iconName =
    SECTION_ICON[question.sectionIcon || ''] || ('fitness' as IoniconName);
  const audienceMeta =
    HEALTH_AUDIENCE_META[question.audience || 'shared'] ||
    HEALTH_AUDIENCE_META.shared;
  const progress = Math.round(((questionIndex + 1) / totalQuestions) * 100);
  const q = question;
  const parentVal = healthTest?.[q.key];
  const detailVisible = Boolean(q.detail && isDetailVisible(q.detail, parentVal));
  const visibleFollowUps = (q.followUps || []).filter((fu) =>
    isFollowUpVisible(fu, parentVal),
  );
  const softWarning = getSoftWarningMessage(q, healthTest);
  const missing = showErrors && !isQuestionFullyAnswered(q, healthTest);
  const detailMissing =
    showErrors && detailVisible && !isDetailFilled(q.detail, healthTest);

  let infoNote: string | null = null;
  if (typeof q.infoNote === 'function') {
    infoNote = q.infoNote(healthTest);
  } else if (
    q.infoNoteWhen &&
    isDetailVisible({ key: '', when: q.infoNoteWhen }, parentVal)
  ) {
    infoNote = typeof q.infoNote === 'string' ? q.infoNote : null;
  }

  const toggleMulti = (value: string) => {
    const next = toggleExclusiveMulti(
      healthTest[q.key],
      value,
      q.options || [],
    );
    updateHealthTest({ [q.key]: next, ...clearHiddenFollowUps(q, next) });
  };
  const pickSingle = (value: string) => {
    updateHealthTest({ [q.key]: value, ...clearHiddenFollowUps(q, value) });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.progressHeader}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressSection}>
            {sectionTitle || question.sectionTitle || 'Sağlık Profili'}
          </Text>
          <Text style={styles.progressCount}>
            {questionIndex + 1} / {totalQuestions}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: theme.bar },
            ]}
          />
        </View>
      </View>

      <View style={styles.card}>
        <LinearGradient
          colors={theme.grad}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons color={colors.white} name={iconName} size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.cardHeaderMeta}>
              <Text style={styles.cardHeaderSection}>
                {question.sectionTitle}
              </Text>
              <View
                style={[
                  styles.audienceChip,
                  { backgroundColor: audienceMeta.chipBg },
                ]}>
                <Text
                  style={[
                    styles.audienceChipText,
                    { color: audienceMeta.chipText },
                  ]}>
                  {audienceMeta.label}
                </Text>
              </View>
            </View>
            <Text style={styles.cardHeaderQ}>Soru {questionIndex + 1}</Text>
          </View>
        </LinearGradient>

        <View style={styles.cardBody}>
          <Text style={styles.label}>
            {q.label}
            {q.required ? (
              <Text style={{ color: colors.danger[500] }}> *</Text>
            ) : null}
          </Text>
          {q.hint ? <Text style={styles.hint}>{q.hint}</Text> : null}
          {!q.required ? (
            <View style={styles.optionalBadge}>
              <Ionicons
                color={colors.cream[800]}
                name="play-skip-forward"
                size={12}
              />
              <Text style={styles.optionalText}>
                İsteğe bağlı — atlayabilirsiniz
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: spacing.md }}>
            {(q.type === 'emoji' ||
              q.type === 'single' ||
              q.type === 'multi') && (
              <OptionGrid
                healthTest={healthTest}
                onPick={pickSingle}
                onToggle={toggleMulti}
                q={q}
                theme={theme}
              />
            )}

            {q.type === 'text' ? (
              <TextInput
                multiline
                numberOfLines={4}
                onChangeText={(t) => updateHealthTest({ [q.key]: t })}
                placeholder={q.placeholder || 'Yanıtınız…'}
                placeholderTextColor={colors.cream[300]}
                style={styles.textArea}
                value={String(healthTest[q.key] || '')}
              />
            ) : null}

            {q.type === 'time' ? (
              <View style={[styles.timeBox, { backgroundColor: theme.soft }]}>
                <View
                  style={[
                    styles.timeIcon,
                    { backgroundColor: theme.solid },
                  ]}>
                  <Ionicons color={colors.white} name="time" size={20} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.timeLabel}>Saat seçin</Text>
                  <TextInput
                    keyboardType="numbers-and-punctuation"
                    onChangeText={(t) => updateHealthTest({ [q.key]: t })}
                    placeholder="Örn. 07:30"
                    placeholderTextColor={colors.cream[300]}
                    style={styles.timeInput}
                    value={String(healthTest[q.key] || '')}
                  />
                </View>
              </View>
            ) : null}

            {q.type === 'scale' ? (
              <ScaleInput
                onChange={(v) =>
                  updateHealthTest({
                    [q.key]: v,
                    ...clearHiddenFollowUps(q, v),
                  })
                }
                q={q}
                theme={theme}
                value={healthTest[q.key]}
              />
            ) : null}

            {q.type === 'file' ? (
              <FileUploadInput
                onChange={(v) => updateHealthTest({ [q.key]: v })}
                theme={theme}
                userId={userId}
                value={healthTest[q.key]}
              />
            ) : null}

            {q.detail && detailVisible ? (
              <TextInput
                onChangeText={(t) =>
                  updateHealthTest({ [q.detail!.key]: t })
                }
                placeholder={q.detail.placeholder}
                placeholderTextColor={colors.cream[300]}
                style={[
                  styles.detailInput,
                  detailMissing && styles.detailInputError,
                ]}
                value={String(healthTest[q.detail.key] || '')}
              />
            ) : null}

            {visibleFollowUps.map((fu) => (
              <FollowUpBlock
                key={fu.key}
                followUp={fu}
                healthTest={healthTest}
                showErrors={showErrors}
                theme={theme}
                updateHealthTest={updateHealthTest}
                userId={userId}
              />
            ))}
          </View>

          {infoNote ? (
            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>{infoNote}</Text>
            </View>
          ) : null}

          {softWarning ? (
            <View style={styles.softWarn}>
              <Ionicons
                color={colors.warm[500]}
                name="alert-circle"
                size={16}
              />
              <Text style={styles.softWarnText}>{softWarning}</Text>
            </View>
          ) : null}

          {q.footerNote ? (
            <Text style={styles.footerNote}>{q.footerNote}</Text>
          ) : null}

          {missing ? (
            <View style={styles.errorBox}>
              <Ionicons
                color={colors.danger[600]}
                name="alert-circle"
                size={16}
              />
              <Text style={styles.errorBoxText}>
                {detailMissing
                  ? 'Lütfen açıklama alanını doldurun'
                  : q.required || hasStoredAnswer(q, healthTest)
                    ? 'Lütfen seçiminizi tamamlayın'
                    : 'Lütfen bir seçenek belirleyin'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  progressHeader: { gap: 8 },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSection: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressCount: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.5,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.cream[100],
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  cardHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderSection: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  audienceChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  audienceChipText: { fontFamily: fonts.sansSemi, fontSize: 10 },
  cardHeaderQ: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  cardBody: { padding: spacing.lg, gap: 4 },
  label: {
    fontFamily: fonts.displayExtra,
    fontSize: 20,
    color: colors.cream[900],
    lineHeight: 28,
  },
  hint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.6,
    marginTop: 6,
    lineHeight: 18,
  },
  optionalBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cream[100],
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  optionalText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.55,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiOpt: {
    width: '47%',
    minHeight: 110,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  emojiLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 12,
    color: colors.cream[900],
    textAlign: 'center',
  },
  singleOpt: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    minHeight: 52,
    justifyContent: 'center',
  },
  singleLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  singleDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.6,
    marginTop: 4,
  },
  multiOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.cream[300],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiLabel: {
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  textArea: {
    backgroundColor: colors.cream[50],
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cream[200],
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cream[200],
    padding: spacing.md,
  },
  timeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabel: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  timeInput: {
    fontFamily: fonts.displayExtra,
    fontSize: 24,
    color: colors.cream[900],
    marginTop: 2,
    padding: 0,
  },
  scaleBox: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cream[200],
    padding: spacing.md,
    gap: 12,
  },
  scaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  scaleRange: {
    fontFamily: fonts.sansSemi,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  scaleValue: {
    fontFamily: fonts.displayExtra,
    fontSize: 32,
  },
  scaleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  scaleChip: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cream[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleChipText: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.45,
  },
  detailInput: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.cream[200],
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.cream[900],
  },
  detailInputError: {
    borderColor: colors.danger[500],
    backgroundColor: colors.danger[50],
  },
  followUp: {
    marginTop: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.cream[50],
    padding: spacing.md,
  },
  followUpTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 15,
    color: colors.cream[900],
  },
  fileDrop: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 28,
    paddingHorizontal: spacing.md,
  },
  fileDropTitle: {
    fontFamily: fonts.sansSemi,
    fontSize: 14,
    color: colors.cream[900],
  },
  fileDropHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.cream[800],
    opacity: 0.5,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cream[200],
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fileName: {
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.cream[900],
  },
  infoNote: {
    marginTop: 14,
    backgroundColor: colors.cream[100],
    borderRadius: radius.md,
    padding: 12,
  },
  infoNoteText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.cream[800],
    opacity: 0.7,
    lineHeight: 18,
  },
  softWarn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.warm[50],
    borderRadius: radius.md,
    padding: 12,
  },
  softWarnText: {
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.warm[500],
    lineHeight: 18,
  },
  footerNote: {
    marginTop: 12,
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.cream[800],
    opacity: 0.45,
    lineHeight: 16,
  },
  errorBox: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger[50],
    borderRadius: radius.md,
    padding: 12,
  },
  errorBoxText: {
    flex: 1,
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.danger[600],
  },
  errorInline: {
    marginTop: 10,
    fontFamily: fonts.sansSemi,
    fontSize: 13,
    color: colors.danger[600],
  },
});
