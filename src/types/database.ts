export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          credit_balance: number;
          subscription_status: string | null;
          has_completed_qualification: boolean;
          has_completed_first_review: boolean;
          created_at: string;
          updated_at: string;
          role: "admin" | "moderator" | "user";
          onboarding_complete: boolean;
          exchanges_this_month: number;
          last_exchange_reset_date: string | null;
          cookie_preferences: "accepted" | "declined" | "not_set";
          cookie_consent_timestamp: string | null;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          credit_balance?: number;
          subscription_status?: string | null;
          has_completed_qualification?: boolean;
          has_completed_first_review?: boolean;
          created_at?: string;
          updated_at?: string;
          role?: "admin" | "moderator" | "user";
          onboarding_complete?: boolean;
          exchanges_this_month?: number;
          last_exchange_reset_date?: string | null;
          cookie_preferences?: "accepted" | "declined" | "not_set";
          cookie_consent_timestamp?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          credit_balance?: number;
          subscription_status?: string | null;
          has_completed_qualification?: boolean;
          has_completed_first_review?: boolean;
          created_at?: string;
          updated_at?: string;
          role?: "admin" | "moderator" | "user";
          onboarding_complete?: boolean;
          exchanges_this_month?: number;
          last_exchange_reset_date?: string | null;
          cookie_preferences?: "accepted" | "declined" | "not_set";
          cookie_consent_timestamp?: string | null;
        };
      };
      extensions: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          chrome_store_url: string;
          description: string | null;
          category: string[] | null;
          feedback_type: string[] | null;
          access_type: "free" | "freemium" | "free_trial" | "promo_code";
          access_details: string | null;
          promo_code: string | null;
          promo_code_expires_at: string | null;
          status:
            | "library"
            | "verified"
            | "queued"
            | "assigned"
            | "reviewed"
            | "completed"
            | "rejected";
          rejection_reason: string | null;
          queue_position: number | null;
          submitted_to_queue_at: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          chrome_store_url: string;
          description?: string | null;
          category?: string[] | null;
          feedback_type?: string[] | null;
          access_type?: "free" | "freemium" | "free_trial" | "promo_code";
          access_details?: string | null;
          promo_code?: string | null;
          promo_code_expires_at?: string | null;
          status?:
            | "library"
            | "verified"
            | "queued"
            | "assigned"
            | "reviewed"
            | "completed"
            | "rejected";
          rejection_reason?: string | null;
          queue_position?: number | null;
          submitted_to_queue_at?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name?: string;
          chrome_store_url?: string;
          description?: string | null;
          category?: string[] | null;
          feedback_type?: string[] | null;
          access_type?: "free" | "freemium" | "free_trial" | "promo_code";
          access_details?: string | null;
          promo_code?: string | null;
          promo_code_expires_at?: string | null;
          status?:
            | "library"
            | "verified"
            | "queued"
            | "assigned"
            | "reviewed"
            | "completed"
            | "rejected";
          rejection_reason?: string | null;
          queue_position?: number | null;
          submitted_to_queue_at?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: "earned" | "spent";
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: "earned" | "spent";
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: "earned" | "spent";
          description?: string;
          created_at?: string;
        };
      };
      review_assignments: {
        Row: {
          id: string;
          batch_id: string;
          extension_id: string;
          reviewer_id: string;
          assignment_number: number;
          assigned_at: string;
          due_at: string;
          status: "assigned" | "submitted" | "approved" | "cancelled";
          installed_at: string | null;
          earliest_review_time: string | null;
          review_text: string | null;
          rating: number | null;
          chrome_store_proof: string | null;
          submitted_at: string | null;
          admin_notes: string | null;
        };
        Insert: {
          id?: string;
          batch_id: string;
          extension_id: string;
          reviewer_id: string;
          assignment_number: number;
          assigned_at?: string;
          due_at: string;
          status?: "assigned" | "submitted" | "approved" | "cancelled";
          installed_at?: string | null;
          earliest_review_time?: string | null;
          review_text?: string | null;
          rating?: number | null;
          chrome_store_proof?: string | null;
          submitted_at?: string | null;
          admin_notes?: string | null;
        };
        Update: {
          id?: string;
          batch_id?: string;
          extension_id?: string;
          reviewer_id?: string;
          assignment_number?: number;
          assigned_at?: string;
          due_at?: string;
          status?: "assigned" | "submitted" | "approved" | "cancelled";
          installed_at?: string | null;
          earliest_review_time?: string | null;
          review_text?: string | null;
          rating?: number | null;
          chrome_store_proof?: string | null;
          submitted_at?: string | null;
          admin_notes?: string | null;
        };
      };
      assignment_batches: {
        Row: {
          id: string;
          reviewer_id: string;
          assignment_type: "single" | "dual";
          status: "active" | "completed";
          credits_earned: number | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          assignment_type: "single" | "dual";
          status?: "active" | "completed";
          credits_earned?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          reviewer_id?: string;
          assignment_type?: "single" | "dual";
          status?: "active" | "completed";
          credits_earned?: number | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      email_logs: {
        Row: {
          id: string;
          created_at: string;
          to_email: string;
          type: string;
          status: string;
          subject: string;
          body: string;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          to_email: string;
          type: string;
          status: string;
          subject: string;
          body: string;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          to_email?: string;
          type?: string;
          status?: string;
          subject?: string;
          body?: string;
          error_message?: string | null;
        };
      };
      review_relationships: {
        Row: {
          id: string;
          reviewer_id: string;
          reviewed_owner_id: string;
          extension_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          reviewed_owner_id: string;
          extension_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reviewer_id?: string;
          reviewed_owner_id?: string;
          extension_id?: string;
          created_at?: string;
        };
      };
    };
  };
}
