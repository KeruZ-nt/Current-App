export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  stock: number;
  min_stock: number;
  category: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  movement_id?: string;
  product_id: string;
  product_name_snapshot?: string;
  type: 'sale' | 'purchase' | 'creation' | 'adjustment' | 'deletion';
  quantity: number;
  total_price: number;
  created_at?: string;
  // Relacional
  product?: Product;
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Workspace {
  id: string;
  name: string;
  invite_code: string;
  created_by?: string;
  settings?: any;
  created_at?: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'admin' | 'collaborator';
  created_at?: string;
  
  // Relacional
  profile?: Profile;
  workspace?: Workspace;
}

export interface Supplier {
  id: string;
  name: string;
  website?: string;
  contact_info?: string;
  category?: string;
  notes?: string;
  created_at?: string;
}
