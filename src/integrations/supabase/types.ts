export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          is_sent: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          is_sent?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          is_sent?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
        }
        Relationships: []
      }
      ai_conversation_context: {
        Row: {
          context_data: Json
          conversation_summary: string | null
          created_at: string
          id: string
          last_interaction: string
          message_count: number
          platform: string
          updated_at: string
          user_id: string
          user_preferences: Json | null
        }
        Insert: {
          context_data?: Json
          conversation_summary?: string | null
          created_at?: string
          id?: string
          last_interaction?: string
          message_count?: number
          platform?: string
          updated_at?: string
          user_id: string
          user_preferences?: Json | null
        }
        Update: {
          context_data?: Json
          conversation_summary?: string | null
          created_at?: string
          id?: string
          last_interaction?: string
          message_count?: number
          platform?: string
          updated_at?: string
          user_id?: string
          user_preferences?: Json | null
        }
        Relationships: []
      }
      ai_conversation_patterns: {
        Row: {
          context_requirements: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          pattern_name: string
          priority: number | null
          response_template: string
          success_rate: number | null
          trigger_keywords: string[] | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          context_requirements?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          pattern_name: string
          priority?: number | null
          response_template: string
          success_rate?: number | null
          trigger_keywords?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          context_requirements?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          pattern_name?: string
          priority?: number | null
          response_template?: string
          success_rate?: number | null
          trigger_keywords?: string[] | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          id: string
          message: string
          metadata: Json | null
          platform: string
          timestamp: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          id?: string
          message: string
          metadata?: Json | null
          platform: string
          timestamp?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          id?: string
          message?: string
          metadata?: Json | null
          platform?: string
          timestamp?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          ai_response: string
          conversation_id: string | null
          correction_provided: string | null
          created_at: string
          id: string
          is_correct: boolean | null
          learning_applied: boolean | null
          updated_at: string
          user_feedback: string | null
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          conversation_id?: string | null
          correction_provided?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          learning_applied?: boolean | null
          updated_at?: string
          user_feedback?: string | null
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          conversation_id?: string | null
          correction_provided?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean | null
          learning_applied?: boolean | null
          updated_at?: string
          user_feedback?: string | null
          user_id?: string
          user_message?: string
        }
        Relationships: []
      }
      ai_knowledge_base: {
        Row: {
          active: boolean | null
          answer: string
          category: string
          created_at: string | null
          id: string
          keywords: string[] | null
          priority: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          answer: string
          category: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          priority?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          answer?: string
          category?: string
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          priority?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_learning_insights: {
        Row: {
          confidence_score: number | null
          content: string
          created_at: string
          effectiveness_score: number | null
          id: string
          insight_type: string
          is_active: boolean | null
          metadata: Json | null
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          confidence_score?: number | null
          content: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          insight_type: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          confidence_score?: number | null
          content?: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          insight_type?: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      ai_metrics: {
        Row: {
          average_response_time: number | null
          created_at: string | null
          date: string
          failed_responses: number | null
          id: string
          platform_breakdown: Json | null
          successful_responses: number | null
          total_messages: number | null
          updated_at: string | null
          user_satisfaction_score: number | null
        }
        Insert: {
          average_response_time?: number | null
          created_at?: string | null
          date: string
          failed_responses?: number | null
          id?: string
          platform_breakdown?: Json | null
          successful_responses?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_satisfaction_score?: number | null
        }
        Update: {
          average_response_time?: number | null
          created_at?: string | null
          date?: string
          failed_responses?: number | null
          id?: string
          platform_breakdown?: Json | null
          successful_responses?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_satisfaction_score?: number | null
        }
        Relationships: []
      }
      ai_response_feedback: {
        Row: {
          ai_response: string
          created_at: string
          effectiveness_score: number | null
          id: string
          improvement_applied: boolean | null
          learned_pattern: string | null
          original_message: string
          platform: string
          user_id: string
          user_reaction: string | null
        }
        Insert: {
          ai_response: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          improvement_applied?: boolean | null
          learned_pattern?: string | null
          original_message: string
          platform?: string
          user_id: string
          user_reaction?: string | null
        }
        Update: {
          ai_response?: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          improvement_applied?: boolean | null
          learned_pattern?: string | null
          original_message?: string
          platform?: string
          user_id?: string
          user_reaction?: string | null
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          page_url: string
          session_id: string
          timestamp: string
          visitor_id: string
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          page_url: string
          session_id: string
          timestamp?: string
          visitor_id: string
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string
          session_id?: string
          timestamp?: string
          visitor_id?: string
        }
        Relationships: []
      }
      auction_bids: {
        Row: {
          bid_amount: number
          bid_time: string
          bidder_email: string
          bidder_name: string
          bidder_phone: string | null
          created_at: string
          id: string
          is_winning: boolean | null
          product_id: string
          updated_at: string
        }
        Insert: {
          bid_amount: number
          bid_time?: string
          bidder_email: string
          bidder_name: string
          bidder_phone?: string | null
          created_at?: string
          id?: string
          is_winning?: boolean | null
          product_id: string
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          bid_time?: string
          bidder_email?: string
          bidder_name?: string
          bidder_phone?: string | null
          created_at?: string
          id?: string
          is_winning?: boolean | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_intentions: {
        Row: {
          confidence_score: number | null
          created_at: string
          detected_intent: string
          entities: Json | null
          id: string
          message: string
          platform: string
          response_generated: string | null
          sentiment_label: string | null
          sentiment_score: number | null
          user_id: string
          was_successful: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          detected_intent: string
          entities?: Json | null
          id?: string
          message: string
          platform?: string
          response_generated?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          user_id: string
          was_successful?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          detected_intent?: string
          entities?: Json | null
          id?: string
          message?: string
          platform?: string
          response_generated?: string | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          user_id?: string
          was_successful?: boolean | null
        }
        Relationships: []
      }
      facebook_products: {
        Row: {
          created_at: string
          facebook_product_id: string | null
          id: string
          last_sync_at: string | null
          product_id: string
          sync_error: string | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          facebook_product_id?: string | null
          id?: string
          last_sync_at?: string | null
          product_id: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          facebook_product_id?: string | null
          id?: string
          last_sync_at?: string | null
          product_id?: string
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_settings: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_active: boolean | null
          section_name: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      meta_settings: {
        Row: {
          access_token: string | null
          app_id: string | null
          app_secret: string | null
          catalog_id: string | null
          created_at: string
          id: string
          instagram_id: string | null
          is_active: boolean | null
          page_id: string | null
          pixel_id: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          app_id?: string | null
          app_secret?: string | null
          catalog_id?: string | null
          created_at?: string
          id?: string
          instagram_id?: string | null
          is_active?: boolean | null
          page_id?: string | null
          pixel_id?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          app_id?: string | null
          app_secret?: string | null
          catalog_id?: string | null
          created_at?: string
          id?: string
          instagram_id?: string | null
          is_active?: boolean | null
          page_id?: string | null
          pixel_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          provider: string | null
          provider_response: Json | null
          recipient: string
          sent_at: string | null
          status: string
          subject: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          provider?: string | null
          provider_response?: Json | null
          recipient: string
          sent_at?: string | null
          status: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          provider?: string | null
          provider_response?: Json | null
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          order_created_email: boolean | null
          order_created_sms: boolean | null
          phone_number: string | null
          sms_notifications: boolean | null
          status_changed_email: boolean | null
          status_changed_sms: boolean | null
          updated_at: string | null
          user_id: string | null
          welcome_email: boolean | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          order_created_email?: boolean | null
          order_created_sms?: boolean | null
          phone_number?: string | null
          sms_notifications?: boolean | null
          status_changed_email?: boolean | null
          status_changed_sms?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          welcome_email?: boolean | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          order_created_email?: boolean | null
          order_created_sms?: boolean | null
          phone_number?: string | null
          sms_notifications?: boolean | null
          status_changed_email?: boolean | null
          status_changed_sms?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          welcome_email?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          order_date: string | null
          order_number: number
          order_source: string | null
          order_status: string | null
          payment_method: string | null
          payment_status: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: number
          order_source?: string | null
          order_status?: string | null
          payment_method?: string | null
          payment_status?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          order_number?: number
          order_source?: string | null
          order_status?: string | null
          payment_method?: string | null
          payment_status?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_requests: {
        Row: {
          additional_notes: string | null
          category: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string
          estimated_price: number | null
          id: string
          images: string[] | null
          product_name: string
          status: string
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          category?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description: string
          estimated_price?: number | null
          id?: string
          images?: string[] | null
          product_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          category?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          estimated_price?: number | null
          id?: string
          images?: string[] | null
          product_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          auction_end_date: string | null
          auction_start_date: string | null
          auto_extend_minutes: number | null
          bid_increment: number | null
          category_id: string | null
          colors: Json | null
          created_at: string
          current_bid: number | null
          description: string | null
          digital_file_url: string | null
          dimensions: string | null
          download_limit: number | null
          featured: boolean | null
          id: string
          image_url: string | null
          images: string[] | null
          in_stock: boolean | null
          is_auction: boolean | null
          is_digital: boolean | null
          license_key: string | null
          material: string | null
          name: string
          og_image: string | null
          original_price: number | null
          price: number
          product_type: string | null
          reserve_price: number | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          sizes: Json | null
          slug: string
          starting_bid: number | null
          stock_quantity: number | null
          subcategory_id: string | null
          updated_at: string
          variants: Json | null
          weight: number | null
        }
        Insert: {
          active?: boolean | null
          auction_end_date?: string | null
          auction_start_date?: string | null
          auto_extend_minutes?: number | null
          bid_increment?: number | null
          category_id?: string | null
          colors?: Json | null
          created_at?: string
          current_bid?: number | null
          description?: string | null
          digital_file_url?: string | null
          dimensions?: string | null
          download_limit?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          is_auction?: boolean | null
          is_digital?: boolean | null
          license_key?: string | null
          material?: string | null
          name: string
          og_image?: string | null
          original_price?: number | null
          price: number
          product_type?: string | null
          reserve_price?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          sizes?: Json | null
          slug: string
          starting_bid?: number | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          updated_at?: string
          variants?: Json | null
          weight?: number | null
        }
        Update: {
          active?: boolean | null
          auction_end_date?: string | null
          auction_start_date?: string | null
          auto_extend_minutes?: number | null
          bid_increment?: number | null
          category_id?: string | null
          colors?: Json | null
          created_at?: string
          current_bid?: number | null
          description?: string | null
          digital_file_url?: string | null
          dimensions?: string | null
          download_limit?: number | null
          featured?: boolean | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          is_auction?: boolean | null
          is_digital?: boolean | null
          license_key?: string | null
          material?: string | null
          name?: string
          og_image?: string | null
          original_price?: number | null
          price?: number
          product_type?: string | null
          reserve_price?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          sizes?: Json | null
          slug?: string
          starting_bid?: number | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          updated_at?: string
          variants?: Json | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          province: string | null
          role: string | null
          street: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          province?: string | null
          role?: string | null
          street?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          province?: string | null
          role?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          discount_type: string | null
          discount_value: number
          end_date: string
          id: string
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value: number
          end_date: string
          id?: string
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      pwa_settings: {
        Row: {
          app_shortcuts: Json | null
          background_color: string
          categories: string[] | null
          created_at: string
          description: string
          display: string
          icon_192: string | null
          icon_512: string | null
          icon_maskable: string | null
          id: string
          install_prompt_delay: number | null
          install_prompt_enabled: boolean | null
          lang: string
          name: string
          offline_cache_strategy: string | null
          offline_page_enabled: boolean | null
          orientation: string
          push_notifications_enabled: boolean | null
          scope: string
          screenshots: Json | null
          share_target: Json | null
          short_name: string
          start_url: string
          theme_color: string
          updated_at: string
        }
        Insert: {
          app_shortcuts?: Json | null
          background_color?: string
          categories?: string[] | null
          created_at?: string
          description?: string
          display?: string
          icon_192?: string | null
          icon_512?: string | null
          icon_maskable?: string | null
          id?: string
          install_prompt_delay?: number | null
          install_prompt_enabled?: boolean | null
          lang?: string
          name?: string
          offline_cache_strategy?: string | null
          offline_page_enabled?: boolean | null
          orientation?: string
          push_notifications_enabled?: boolean | null
          scope?: string
          screenshots?: Json | null
          share_target?: Json | null
          short_name?: string
          start_url?: string
          theme_color?: string
          updated_at?: string
        }
        Update: {
          app_shortcuts?: Json | null
          background_color?: string
          categories?: string[] | null
          created_at?: string
          description?: string
          display?: string
          icon_192?: string | null
          icon_512?: string | null
          icon_maskable?: string | null
          id?: string
          install_prompt_delay?: number | null
          install_prompt_enabled?: boolean | null
          lang?: string
          name?: string
          offline_cache_strategy?: string | null
          offline_page_enabled?: boolean | null
          orientation?: string
          push_notifications_enabled?: boolean | null
          scope?: string
          screenshots?: Json | null
          share_target?: Json | null
          short_name?: string
          start_url?: string
          theme_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parameters: Json | null
          report_type: string
          schedule: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parameters?: Json | null
          report_type: string
          schedule?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parameters?: Json | null
          report_type?: string
          schedule?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          canonical_url: string | null
          created_at: string
          description: string | null
          id: string
          keywords: string | null
          og_description: string | null
          og_image: string | null
          og_title: string | null
          page_slug: string | null
          page_type: string
          robots: string | null
          schema_markup: Json | null
          title: string | null
          twitter_description: string | null
          twitter_image: string | null
          twitter_title: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_slug?: string | null
          page_type: string
          robots?: string | null
          schema_markup?: Json | null
          title?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string | null
          og_description?: string | null
          og_image?: string | null
          og_title?: string | null
          page_slug?: string | null
          page_type?: string
          robots?: string | null
          schema_markup?: Json | null
          title?: string | null
          twitter_description?: string | null
          twitter_image?: string | null
          twitter_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      static_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          meta_description: string | null
          page_key: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          page_key: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          page_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          communication_style: string | null
          created_at: string
          id: string
          interaction_history: Json | null
          platform: string
          preferences: Json | null
          preferred_categories: string[] | null
          purchase_intent: number | null
          sentiment_profile: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          communication_style?: string | null
          created_at?: string
          id?: string
          interaction_history?: Json | null
          platform?: string
          preferences?: Json | null
          preferred_categories?: string[] | null
          purchase_intent?: number | null
          sentiment_profile?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          communication_style?: string | null
          created_at?: string
          id?: string
          interaction_history?: Json | null
          platform?: string
          preferences?: Json | null
          preferred_categories?: string[] | null
          purchase_intent?: number | null
          sentiment_profile?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visitor_analytics: {
        Row: {
          browser: string | null
          city: string | null
          conversion_event: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: unknown | null
          is_bounce: boolean | null
          language: string | null
          os: string | null
          page_title: string | null
          page_url: string
          page_views: number | null
          referrer: string | null
          region: string | null
          screen_resolution: string | null
          session_id: string
          updated_at: string
          user_agent: string | null
          visit_duration: number | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          conversion_event?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_bounce?: boolean | null
          language?: string | null
          os?: string | null
          page_title?: string | null
          page_url: string
          page_views?: number | null
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id: string
          updated_at?: string
          user_agent?: string | null
          visit_duration?: number | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          conversion_event?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: unknown | null
          is_bounce?: boolean | null
          language?: string | null
          os?: string | null
          page_title?: string | null
          page_url?: string
          page_views?: number | null
          referrer?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id?: string
          updated_at?: string
          user_agent?: string | null
          visit_duration?: number | null
          visitor_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_sentiment: {
        Args: { message_text: string }
        Returns: Json
      }
      get_recent_conversations: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          platform: string
          user_id: string
          message: string
          type: string
          msg_timestamp: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
