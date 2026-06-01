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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          candidate_id: string
          created_at: string
          cv_id: string | null
          id: string
          lettre: string | null
          notes_recruteur: string | null
          offer_id: string
          statut: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          cv_id?: string | null
          id?: string
          lettre?: string | null
          notes_recruteur?: string | null
          offer_id: string
          statut?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          cv_id?: string | null
          id?: string
          lettre?: string | null
          notes_recruteur?: string | null
          offer_id?: string
          statut?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cv_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          payload: Json | null
          ressource: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          payload?: Json | null
          ressource?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          payload?: Json | null
          ressource?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          bio: string | null
          competences: string[] | null
          created_at: string
          diplome: string | null
          disponibilite: string | null
          experiences: Json | null
          id: string
          langues: Json | null
          pretention_salariale: string | null
          titre: string | null
          updated_at: string
          user_id: string
          ville: string | null
        }
        Insert: {
          bio?: string | null
          competences?: string[] | null
          created_at?: string
          diplome?: string | null
          disponibilite?: string | null
          experiences?: Json | null
          id?: string
          langues?: Json | null
          pretention_salariale?: string | null
          titre?: string | null
          updated_at?: string
          user_id: string
          ville?: string | null
        }
        Update: {
          bio?: string | null
          competences?: string[] | null
          created_at?: string
          diplome?: string | null
          disponibilite?: string | null
          experiences?: Json | null
          id?: string
          langues?: Json | null
          pretention_salariale?: string | null
          titre?: string | null
          updated_at?: string
          user_id?: string
          ville?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          localisation: string | null
          logo_url: string | null
          nom: string
          owner_id: string
          secteur: string | null
          site_web: string | null
          statut: Database["public"]["Enums"]["company_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          localisation?: string | null
          logo_url?: string | null
          nom: string
          owner_id: string
          secteur?: string | null
          site_web?: string | null
          statut?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          localisation?: string | null
          logo_url?: string | null
          nom?: string
          owner_id?: string
          secteur?: string | null
          site_web?: string | null
          statut?: Database["public"]["Enums"]["company_status"]
          updated_at?: string
        }
        Relationships: []
      }
      cv_documents: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          nom_fichier: string
          storage_path: string
          taille: number | null
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          nom_fichier: string
          storage_path: string
          taille?: number | null
          type?: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          nom_fichier?: string
          storage_path?: string
          taille?: number | null
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "cv_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          recruiter_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          recruiter_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          recruiter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          company_id: string
          competences_requises: string[] | null
          contrat: Database["public"]["Enums"]["contract_type"]
          created_at: string
          description: string
          expire_le: string | null
          id: string
          localisation: string | null
          publiee_le: string | null
          salaire_max: number | null
          salaire_min: number | null
          secteur: string | null
          statut: Database["public"]["Enums"]["offer_status"]
          teletravail: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          company_id: string
          competences_requises?: string[] | null
          contrat: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          description: string
          expire_le?: string | null
          id?: string
          localisation?: string | null
          publiee_le?: string | null
          salaire_max?: number | null
          salaire_min?: number | null
          secteur?: string | null
          statut?: Database["public"]["Enums"]["offer_status"]
          teletravail?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          competences_requises?: string[] | null
          contrat?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          description?: string
          expire_le?: string | null
          id?: string
          localisation?: string | null
          publiee_le?: string | null
          salaire_max?: number | null
          salaire_min?: number | null
          secteur?: string | null
          statut?: Database["public"]["Enums"]["offer_status"]
          teletravail?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          application_id: string | null
          contenu: string
          created_at: string
          id: string
          lu: boolean
          recipient_id: string
          sender_id: string
        }
        Insert: {
          application_id?: string | null
          contenu: string
          created_at?: string
          id?: string
          lu?: boolean
          recipient_id: string
          sender_id: string
        }
        Update: {
          application_id?: string | null
          contenu?: string
          created_at?: string
          id?: string
          lu?: boolean
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          lu: boolean
          message: string | null
          titre: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          lu?: boolean
          message?: string | null
          titre: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          lu?: boolean
          message?: string | null
          titre?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nom: string | null
          photo_url: string | null
          prenom: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nom?: string | null
          photo_url?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string | null
          photo_url?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      referentials: {
        Row: {
          actif: boolean
          created_at: string
          id: string
          ordre: number
          type: string
          valeur: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          id?: string
          ordre?: number
          type: string
          valeur: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          id?: string
          ordre?: number
          type?: string
          valeur?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "candidat" | "recruteur" | "admin"
      application_status:
        | "brouillon"
        | "envoyee"
        | "recue"
        | "en_analyse"
        | "preselectionne"
        | "entretien"
        | "rejete"
        | "retenu"
      company_status: "en_attente" | "validee" | "rejetee"
      contract_type: "CDI" | "CDD" | "Freelance" | "Stage" | "Alternance"
      document_type: "cv" | "lettre"
      offer_status: "brouillon" | "publiee" | "suspendue" | "expiree"
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
    Enums: {
      app_role: ["candidat", "recruteur", "admin"],
      application_status: [
        "brouillon",
        "envoyee",
        "recue",
        "en_analyse",
        "preselectionne",
        "entretien",
        "rejete",
        "retenu",
      ],
      company_status: ["en_attente", "validee", "rejetee"],
      contract_type: ["CDI", "CDD", "Freelance", "Stage", "Alternance"],
      document_type: ["cv", "lettre"],
      offer_status: ["brouillon", "publiee", "suspendue", "expiree"],
    },
  },
} as const
