export interface Mall {
  id: number;
  name: string;
  companyName: string;
  address: string;
  taxId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMallRequest {
  name: string;
  companyName: string;
  address: string;
  taxId: string;
}