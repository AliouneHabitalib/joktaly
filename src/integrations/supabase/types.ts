export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      abonnements: {
        Row: {
          created_at: string
          cycle: string
          devise: string
          id: string
          montant: number
          paid_at: string | null
          plan: string
          provider: string
          provider_response: Json
          provider_token: string | null
          statut: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle?: string
          devise?: string
          id?: string
          montant?: number
          paid_at?: string | null
          plan: string
          provider?: string
          provider_response?: Json
          provider_token?: string | null
          statut?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle?: string
          devise?: string
          id?: string
          montant?: number
          paid_at?: string | null
          plan?: string
          provider?: string
          provider_response?: Json
          provider_token?: string | null
          statut?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          created_at: string
          entreprise_id: string | null
          id: string
          message: string | null
          metadata: Json
          target_id: string | null
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entreprise_id?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          target_id?: string | null
          type: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entreprise_id?: string | null
          id?: string
          message?: string | null
          metadata?: Json
          target_id?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          entreprise_id: string
          entreprise_nom: string | null
          id: string
          nom: string
          notes: string | null
          pays: string | null
          prenom: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
          whatsapp: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          entreprise_id: string
          entreprise_nom?: string | null
          id?: string
          nom: string
          notes?: string | null
          pays?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
          whatsapp?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          entreprise_id?: string
          entreprise_nom?: string | null
          id?: string
          nom?: string
          notes?: string | null
          pays?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      devis: {
        Row: {
          client_id: string
          conditions_paiement: string | null
          created_at: string
          date_emission: string
          date_validite: string
          entreprise_id: string
          id: string
          montant_tva: number
          notes: string | null
          numero: string
          objet: string | null
          remise_montant: number
          remise_pourcent: number
          sous_total: number
          statut: Database["public"]["Enums"]["devis_statut"]
          titre: string | null
          total_ttc: number
          tva_active: boolean
          tva_taux: number
          updated_at: string
        }
        Insert: {
          client_id: string
          conditions_paiement?: string | null
          created_at?: string
          date_emission?: string
          date_validite?: string
          entreprise_id: string
          id?: string
          montant_tva?: number
          notes?: string | null
          numero: string
          objet?: string | null
          remise_montant?: number
          remise_pourcent?: number
          sous_total?: number
          statut?: Database["public"]["Enums"]["devis_statut"]
          titre?: string | null
          total_ttc?: number
          tva_active?: boolean
          tva_taux?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          conditions_paiement?: string | null
          created_at?: string
          date_emission?: string
          date_validite?: string
          entreprise_id?: string
          id?: string
          montant_tva?: number
          notes?: string | null
          numero?: string
          objet?: string | null
          remise_montant?: number
          remise_pourcent?: number
          sous_total?: number
          statut?: Database["public"]["Enums"]["devis_statut"]
          titre?: string | null
          total_ttc?: number
          tva_active?: boolean
          tva_taux?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devis_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      devis_lignes: {
        Row: {
          created_at: string
          description: string
          devis_id: string
          id: string
          ordre: number
          prix_unitaire: number
          quantite: number
          total_ht: number
          total_ttc: number
          tva_taux: number
          unite: string
        }
        Insert: {
          created_at?: string
          description: string
          devis_id: string
          id?: string
          ordre?: number
          prix_unitaire?: number
          quantite?: number
          total_ht?: number
          total_ttc?: number
          tva_taux?: number
          unite?: string
        }
        Update: {
          created_at?: string
          description?: string
          devis_id?: string
          id?: string
          ordre?: number
          prix_unitaire?: number
          quantite?: number
          total_ht?: number
          total_ttc?: number
          tva_taux?: number
          unite?: string
        }
        Relationships: [
          {
            foreignKeyName: "devis_lignes_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
        ]
      }
      entreprises: {
        Row: {
          adresse: string | null
          coordonnees_bancaires: string | null
          couleur_primaire: string
          created_at: string
          devise: string
          email: string | null
          id: string
          logo_url: string | null
          ninea: string | null
          nom: string
          pays: string
          rc: string | null
          site_web: string | null
          slogan: string | null
          telephone: string | null
          tva_taux: number
          updated_at: string
          user_id: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          coordonnees_bancaires?: string | null
          couleur_primaire?: string
          created_at?: string
          devise?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          ninea?: string | null
          nom: string
          pays?: string
          rc?: string | null
          site_web?: string | null
          slogan?: string | null
          telephone?: string | null
          tva_taux?: number
          updated_at?: string
          user_id: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          coordonnees_bancaires?: string | null
          couleur_primaire?: string
          created_at?: string
          devise?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          ninea?: string | null
          nom?: string
          pays?: string
          rc?: string | null
          site_web?: string | null
          slogan?: string | null
          telephone?: string | null
          tva_taux?: number
          updated_at?: string
          user_id?: string
          ville?: string | null
        }
        Relationships: []
      }
      factures: {
        Row: {
          client_id: string
          conditions_paiement: string | null
          created_at: string
          date_echeance: string
          date_emission: string
          devis_id: string | null
          entreprise_id: string
          id: string
          mode_paiement: Database["public"]["Enums"]["mode_paiement"] | null
          montant_paye: number
          montant_tva: number
          notes: string | null
          numero: string
          objet: string | null
          remise_montant: number
          remise_pourcent: number
          sous_total: number
          statut: Database["public"]["Enums"]["facture_statut"]
          titre: string | null
          total_ttc: number
          tva_active: boolean
          tva_taux: number
          updated_at: string
        }
        Insert: {
          client_id: string
          conditions_paiement?: string | null
          created_at?: string
          date_echeance?: string
          date_emission?: string
          devis_id?: string | null
          entreprise_id: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"] | null
          montant_paye?: number
          montant_tva?: number
          notes?: string | null
          numero: string
          objet?: string | null
          remise_montant?: number
          remise_pourcent?: number
          sous_total?: number
          statut?: Database["public"]["Enums"]["facture_statut"]
          titre?: string | null
          total_ttc?: number
          tva_active?: boolean
          tva_taux?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          conditions_paiement?: string | null
          created_at?: string
          date_echeance?: string
          date_emission?: string
          devis_id?: string | null
          entreprise_id?: string
          id?: string
          mode_paiement?: Database["public"]["Enums"]["mode_paiement"] | null
          montant_paye?: number
          montant_tva?: number
          notes?: string | null
          numero?: string
          objet?: string | null
          remise_montant?: number
          remise_pourcent?: number
          sous_total?: number
          statut?: Database["public"]["Enums"]["facture_statut"]
          titre?: string | null
          total_ttc?: number
          tva_active?: boolean
          tva_taux?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_devis_id_fkey"
            columns: ["devis_id"]
            isOneToOne: false
            referencedRelation: "devis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "factures_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      factures_lignes: {
        Row: {
          created_at: string
          description: string
          facture_id: string
          id: string
          ordre: number
          prix_unitaire: number
          quantite: number
          total_ht: number
          total_ttc: number
          tva_taux: number
          unite: string
        }
        Insert: {
          created_at?: string
          description: string
          facture_id: string
          id?: string
          ordre?: number
          prix_unitaire?: number
          quantite?: number
          total_ht?: number
          total_ttc?: number
          tva_taux?: number
          unite?: string
        }
        Update: {
          created_at?: string
          description?: string
          facture_id?: string
          id?: string
          ordre?: number
          prix_unitaire?: number
          quantite?: number
          total_ht?: number
          total_ttc?: number
          tva_taux?: number
          unite?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_lignes_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          created_at: string
          date_paiement: string
          facture_id: string
          id: string
          mode: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          notes: string | null
          reference: string | null
        }
        Insert: {
          created_at?: string
          date_paiement?: string
          facture_id: string
          id?: string
          mode: Database["public"]["Enums"]["mode_paiement"]
          montant: number
          notes?: string | null
          reference?: string | null
        }
        Update: {
          created_at?: string
          date_paiement?: string
          facture_id?: string
          id?: string
          mode?: Database["public"]["Enums"]["mode_paiement"]
          montant?: number
          notes?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_facture_id_fkey"
            columns: ["facture_id"]
            isOneToOne: false
            referencedRelation: "factures"
            referencedColumns: ["id"]
          },
        ]
      }
      produits_services: {
        Row: {
          created_at: string
          description: string | null
          entreprise_id: string
          id: string
          nom: string
          prix_unitaire: number
          tva_applicable: boolean
          type: Database["public"]["Enums"]["produit_type"]
          unite: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entreprise_id: string
          id?: string
          nom: string
          prix_unitaire?: number
          tva_applicable?: boolean
          type?: Database["public"]["Enums"]["produit_type"]
          unite?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entreprise_id?: string
          id?: string
          nom?: string
          prix_unitaire?: number
          tva_applicable?: boolean
          type?: Database["public"]["Enums"]["produit_type"]
          unite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produits_services_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nom: string | null
          plan: Database["public"]["Enums"]["plan_type"]
          plan_expires_at: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nom?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_expires_at?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nom?: string | null
          plan?: Database["public"]["Enums"]["plan_type"]
          plan_expires_at?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_quota_refusal: {
        Args: { _entreprise_id: string; _kind: string; _user_id: string }
        Returns: undefined
      }
      next_devis_numero: { Args: { _entreprise_id: string }; Returns: string }
      next_facture_numero: { Args: { _entreprise_id: string }; Returns: string }
      user_owns_entreprise: {
        Args: { _entreprise_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "devis_created"
        | "facture_created"
        | "quota_refused_devis"
        | "quota_refused_facture"
        | "quota_reset_check"
      app_role: "admin" | "user"
      devis_statut: "brouillon" | "envoye" | "accepte" | "refuse" | "expire"
      facture_statut: "non_payee" | "partiellement_payee" | "payee" | "annulee"
      mode_paiement: "virement" | "wave" | "orange_money" | "especes" | "cheque"
      plan_type: "gratuit" | "starter" | "pro" | "business" | "essentiel"
      produit_type: "produit" | "service"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_type: [
        "devis_created",
        "facture_created",
        "quota_refused_devis",
        "quota_refused_facture",
        "quota_reset_check",
      ],
      app_role: ["admin", "user"],
      devis_statut: ["brouillon", "envoye", "accepte", "refuse", "expire"],
      facture_statut: ["non_payee", "partiellement_payee", "payee", "annulee"],
      mode_paiement: ["virement", "wave", "orange_money", "especes", "cheque"],
      plan_type: ["gratuit", "starter", "pro", "business", "essentiel"],
      produit_type: ["produit", "service"],
    },
  },
} as const
