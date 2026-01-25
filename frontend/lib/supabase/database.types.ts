export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      product_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      pricing_tiers: {
        Row: {
          id: string;
          product_id: string;
          quantity_grams: number;
          price: number;
          is_custom_price: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          quantity_grams: number;
          price: number;
          is_custom_price?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          quantity_grams?: number;
          price?: number;
          is_custom_price?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          currency: string;
          images: Json;
          category: string | null;
          tags: string[] | null;
          farm_label: string | null;
          origin_flag: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          // New cannabis pricing fields
          category_id: string | null;
          stock_quantity: number | null;
          variety: string | null;
          cost_price_per_gram: number;
          margin_percentage: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price?: number;
          currency?: string;
          images?: Json;
          category?: string | null;
          tags?: string[] | null;
          farm_label?: string | null;
          origin_flag?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          // New cannabis pricing fields
          category_id?: string | null;
          stock_quantity?: number | null;
          variety?: string | null;
          cost_price_per_gram?: number;
          margin_percentage?: number;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          images?: Json;
          category?: string | null;
          tags?: string[] | null;
          farm_label?: string | null;
          origin_flag?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          // New cannabis pricing fields
          category_id?: string | null;
          stock_quantity?: number | null;
          variety?: string | null;
          cost_price_per_gram?: number;
          margin_percentage?: number;
        };
      };
      reviews: {
        Row: {
          id: string;
          product_id: string | null;
          telegram_user_id: string;
          username: string | null;
          rating: number;
          content: string;
          status: "pending" | "published" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          telegram_user_id: string;
          username?: string | null;
          rating: number;
          content: string;
          status?: "pending" | "published" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          telegram_user_id?: string;
          username?: string | null;
          rating?: number;
          content?: string;
          status?: "pending" | "published" | "rejected";
          created_at?: string;
        };
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          telegram_user_id: string;
          username: string | null;
          items: Json;
          total: number;
          currency: string;
          status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
          notes: string | null;
          delivery_address: string | null;
          order_day: string | null;
          daily_order_number: number | null;
          driver_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          telegram_user_id: string;
          username?: string | null;
          items: Json;
          total: number;
          currency?: string;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
          notes?: string | null;
          delivery_address?: string | null;
          order_day?: string | null;
          daily_order_number?: number | null;
          driver_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          telegram_user_id?: string;
          username?: string | null;
          items?: Json;
          total?: number;
          currency?: string;
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
          notes?: string | null;
          delivery_address?: string | null;
          order_day?: string | null;
          daily_order_number?: number | null;
          driver_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Better Auth tables
      user: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          emailVerified: boolean;
          image: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email: string;
          emailVerified?: boolean;
          image?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string;
          emailVerified?: boolean;
          image?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      session: {
        Row: {
          id: string;
          expiresAt: string;
          token: string;
          createdAt: string;
          updatedAt: string;
          ipAddress: string | null;
          userAgent: string | null;
          userId: string;
        };
        Insert: {
          id?: string;
          expiresAt: string;
          token: string;
          createdAt?: string;
          updatedAt?: string;
          ipAddress?: string | null;
          userAgent?: string | null;
          userId: string;
        };
        Update: {
          id?: string;
          expiresAt?: string;
          token?: string;
          createdAt?: string;
          updatedAt?: string;
          ipAddress?: string | null;
          userAgent?: string | null;
          userId?: string;
        };
      };
      account: {
        Row: {
          id: string;
          accountId: string;
          providerId: string;
          userId: string;
          accessToken: string | null;
          refreshToken: string | null;
          idToken: string | null;
          accessTokenExpiresAt: string | null;
          refreshTokenExpiresAt: string | null;
          scope: string | null;
          password: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          accountId: string;
          providerId: string;
          userId: string;
          accessToken?: string | null;
          refreshToken?: string | null;
          idToken?: string | null;
          accessTokenExpiresAt?: string | null;
          refreshTokenExpiresAt?: string | null;
          scope?: string | null;
          password?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          accountId?: string;
          providerId?: string;
          userId?: string;
          accessToken?: string | null;
          refreshToken?: string | null;
          idToken?: string | null;
          accessTokenExpiresAt?: string | null;
          refreshTokenExpiresAt?: string | null;
          scope?: string | null;
          password?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      verification: {
        Row: {
          id: string;
          identifier: string;
          value: string;
          expiresAt: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          identifier: string;
          value: string;
          expiresAt: string;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          identifier?: string;
          value?: string;
          expiresAt?: string;
          createdAt?: string;
          updatedAt?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      review_status: "pending" | "published" | "rejected";
      order_status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
    };
  };
};

// Helper types
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
export type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export type ProductCategory = Database["public"]["Tables"]["product_categories"]["Row"];
export type ProductCategoryInsert = Database["public"]["Tables"]["product_categories"]["Insert"];
export type ProductCategoryUpdate = Database["public"]["Tables"]["product_categories"]["Update"];

export type PricingTier = Database["public"]["Tables"]["pricing_tiers"]["Row"];
export type PricingTierInsert = Database["public"]["Tables"]["pricing_tiers"]["Insert"];
export type PricingTierUpdate = Database["public"]["Tables"]["pricing_tiers"]["Update"];

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

export type Setting = Database["public"]["Tables"]["settings"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];

export type Driver = Database["public"]["Tables"]["drivers"]["Row"];
export type DriverInsert = Database["public"]["Tables"]["drivers"]["Insert"];
export type DriverUpdate = Database["public"]["Tables"]["drivers"]["Update"];

// Order with driver relation
export type OrderWithDriver = Order & {
  driver?: Driver | null;
};

// Order item type for the items JSON field
export type OrderItem = {
  product_id: string;
  product_name: string;
  tier_id: string;
  quantity_grams: number;
  quantity: number;
  unit_price: number;
  total_price: number;
};

// Extended types with relations
export type ProductWithCategory = Product & {
  category_info?: ProductCategory | null;
};

export type ProductWithPricing = Product & {
  category_info?: ProductCategory | null;
  pricing_tiers?: PricingTier[];
  selling_price_per_gram?: number;
  min_tier_price?: number;
  min_tier_quantity?: number;
};

// Strain data type
export type StrainData = {
  id: string;
  strain_name: string;
  strain_type: string | null;
  rating: number | null;
  effects: string[] | null;
  flavors: string[] | null;
  description: string | null;
  source: "cannabis_api" | "manual" | "ai" | null;
  created_at: string;
  updated_at: string;
};
