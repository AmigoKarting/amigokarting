export interface Employee {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  phone_last4: string;
  email: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  province: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  uniform_size_shirt: string | null;
  uniform_size_pants: string | null;
  uniform_size_shoes: string | null;
  role: "employee" | "manager" | "patron";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeMissingInfo {
  id: string;
  first_name: string;
  last_name: string;
  missing_phone: boolean;
  missing_address: boolean;
  missing_emergency_contact: boolean;
  missing_uniform_shirt: boolean;
  has_missing_info: boolean;
}

export type EmployeeFormData = Pick<
  Employee,
  | "address" | "city" | "postal_code" | "province"
  | "phone" | "emergency_contact_name" | "emergency_contact_phone"
  | "uniform_size_shirt" | "uniform_size_pants" | "uniform_size_shoes"
>;
