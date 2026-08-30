import { compactIban } from '@/utils/iban';
import { bankDisplayName, findBankByCode } from '@/data/turkishBanks';

export type StaffPayoutAccount = {
  staffId: string;
  accountHolderName: string;
  iban: string;
  bankCode: string;
  bankName: string;
  bankShort: string;
  accountType: 'individual' | 'business';
  createdAt?: string;
  updatedAt?: string;
};

export type PayoutAccountForm = {
  accountHolderName: string;
  iban: string;
  bankCode: string;
  bankName?: string;
  accountType?: 'individual' | 'business';
};

export function rowToPayoutAccount(row: Record<string, unknown> | null | undefined): StaffPayoutAccount | null {
  if (!row) return null;
  const bankCode = String(row.bank_code || '').padStart(5, '0');
  const bank = findBankByCode(bankCode);
  return {
    staffId: String(row.staff_id || ''),
    accountHolderName: String(row.account_holder_name || ''),
    iban: compactIban(row.iban),
    bankCode: String(row.bank_code || ''),
    bankName: String(row.bank_name || bank?.name || ''),
    bankShort: bank?.short || bankDisplayName(row.bank_code, String(row.bank_name || '')),
    accountType: row.account_type === 'business' ? 'business' : 'individual',
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export function payoutAccountToRow(staffId: string, form: PayoutAccountForm) {
  const bank = findBankByCode(form.bankCode);
  return {
    staff_id: staffId,
    account_holder_name: String(form.accountHolderName || '').trim(),
    iban: compactIban(form.iban),
    bank_code: String(form.bankCode || '').replace(/\D/g, '').padStart(5, '0'),
    bank_name: bank?.name || String(form.bankName || '').trim(),
    account_type: form.accountType === 'business' ? 'business' : 'individual',
    updated_at: new Date().toISOString(),
  };
}
