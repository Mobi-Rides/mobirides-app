export interface DriverLicense {
  id: string
  user_id: string
  license_number: string
  country_of_issue: string
  expiry_date: string
  date_of_birth: string
  phone_number: string
  front_image_url: string
  back_image_url: string
  created_at: string
  updated_at: string
}

export interface DriverLicenseInsert extends Omit<DriverLicense, 'id' | 'created_at' | 'updated_at'> {}
export interface DriverLicenseUpdate extends Partial<DriverLicenseInsert> {}