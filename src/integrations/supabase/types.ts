export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      alerts: {
        Row: {
          central_device_id: number | null
          created_at: string | null
          id: number
          message: string
          notes: string | null
          project_id: number | null
          resolved_at: string | null
          severity: string | null
          spdu_id: string | null
          status: string | null
          type: string
        }
        Insert: {
          central_device_id?: number | null
          created_at?: string | null
          id?: never
          message: string
          notes?: string | null
          project_id?: number | null
          resolved_at?: string | null
          severity?: string | null
          spdu_id?: string | null
          status?: string | null
          type: string
        }
        Update: {
          central_device_id?: number | null
          created_at?: string | null
          id?: never
          message?: string
          notes?: string | null
          project_id?: number | null
          resolved_at?: string | null
          severity?: string | null
          spdu_id?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_central_device_id_fkey"
            columns: ["central_device_id"]
            isOneToOne: false
            referencedRelation: "central_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      building_meter_readings: {
        Row: {
          building_meter_id: number | null
          id: number
          reading: number | null
          timestamp: string | null
        }
        Insert: {
          building_meter_id?: number | null
          id?: never
          reading?: number | null
          timestamp?: string | null
        }
        Update: {
          building_meter_id?: number | null
          id?: never
          reading?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_meter_readings_building_meter_id_fkey"
            columns: ["building_meter_id"]
            isOneToOne: false
            referencedRelation: "building_meters"
            referencedColumns: ["id"]
          },
        ]
      }
      building_meters: {
        Row: {
          building_id: number | null
          id: number
          installation_date: string | null
          meter_id: string | null
          meter_type: string | null
        }
        Insert: {
          building_id?: number | null
          id?: never
          installation_date?: string | null
          meter_id?: string | null
          meter_type?: string | null
        }
        Update: {
          building_id?: number | null
          id?: never
          installation_date?: string | null
          meter_id?: string | null
          meter_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "building_meters_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          id: number
          name: string
          net_meter_capacity: number | null
          net_meter_commissioning_date: string | null
          project_id: number | null
          solar_inverter_capacity: number | null
          solar_inverter_make: string | null
          solar_panels_make: string | null
          solar_pv_capacity: number | null
          total_apartments: number | null
        }
        Insert: {
          id?: never
          name: string
          net_meter_capacity?: number | null
          net_meter_commissioning_date?: string | null
          project_id?: number | null
          solar_inverter_capacity?: number | null
          solar_inverter_make?: string | null
          solar_panels_make?: string | null
          solar_pv_capacity?: number | null
          total_apartments?: number | null
        }
        Update: {
          id?: never
          name?: string
          net_meter_capacity?: number | null
          net_meter_commissioning_date?: string | null
          project_id?: number | null
          solar_inverter_capacity?: number | null
          solar_inverter_make?: string | null
          solar_panels_make?: string | null
          solar_pv_capacity?: number | null
          total_apartments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      central_devices: {
        Row: {
          apn: string | null
          baud_rate: number | null
          building_id: number | null
          connection_type: string | null
          data_bits: number | null
          delay_between_polls: number | null
          dns_server: string | null
          firmware_version: string | null
          gateway: string | null
          hardware_version: string | null
          id: number
          installation_date: string | null
          ip_address: string | null
          name: string | null
          parity: string | null
          port: number | null
          project_id: number | null
          response_timeout: number | null
          sim_pin: string | null
          status: string | null
          stop_bits: number | null
          subnet_mask: string | null
          wifi_password: string | null
          wifi_ssid: string | null
        }
        Insert: {
          apn?: string | null
          baud_rate?: number | null
          building_id?: number | null
          connection_type?: string | null
          data_bits?: number | null
          delay_between_polls?: number | null
          dns_server?: string | null
          firmware_version?: string | null
          gateway?: string | null
          hardware_version?: string | null
          id?: never
          installation_date?: string | null
          ip_address?: string | null
          name?: string | null
          parity?: string | null
          port?: number | null
          project_id?: number | null
          response_timeout?: number | null
          sim_pin?: string | null
          status?: string | null
          stop_bits?: number | null
          subnet_mask?: string | null
          wifi_password?: string | null
          wifi_ssid?: string | null
        }
        Update: {
          apn?: string | null
          baud_rate?: number | null
          building_id?: number | null
          connection_type?: string | null
          data_bits?: number | null
          delay_between_polls?: number | null
          dns_server?: string | null
          firmware_version?: string | null
          gateway?: string | null
          hardware_version?: string | null
          id?: never
          installation_date?: string | null
          ip_address?: string | null
          name?: string | null
          parity?: string | null
          port?: number | null
          project_id?: number | null
          response_timeout?: number | null
          sim_pin?: string | null
          status?: string | null
          stop_bits?: number | null
          subnet_mask?: string | null
          wifi_password?: string | null
          wifi_ssid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "central_devices_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "central_devices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          city: string | null
          created_at: string | null
          id: number
          image_url: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          status: string | null
          total_solar_capacity: number | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: never
          image_url?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          status?: string | null
          total_solar_capacity?: number | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: never
          image_url?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          status?: string | null
          total_solar_capacity?: number | null
        }
        Relationships: []
      }
      spdu_readings: {
        Row: {
          active_power: number | null
          apparent_power: number | null
          balance_kwh: number | null
          date: number | null
          date_of_monthly_billing: number | null
          day_limit_kwh: number | null
          hour: number | null
          id: number
          load_current: number | null
          load_vrn: number | null
          minute: number | null
          mode_of_operation: number | null
          month: number | null
          month_limit_kwh: number | null
          second: number | null
          solar_end_time_hour: number | null
          solar_end_time_minute: number | null
          solar_start_time_hour: number | null
          solar_start_time_minute: number | null
          source_of_load: number | null
          source1_kwh: number | null
          source2_kwh: number | null
          spdu_id: string | null
          timestamp: string | null
          vrn_s1: number | null
          year: number | null
        }
        Insert: {
          active_power?: number | null
          apparent_power?: number | null
          balance_kwh?: number | null
          date?: number | null
          date_of_monthly_billing?: number | null
          day_limit_kwh?: number | null
          hour?: number | null
          id?: never
          load_current?: number | null
          load_vrn?: number | null
          minute?: number | null
          mode_of_operation?: number | null
          month?: number | null
          month_limit_kwh?: number | null
          second?: number | null
          solar_end_time_hour?: number | null
          solar_end_time_minute?: number | null
          solar_start_time_hour?: number | null
          solar_start_time_minute?: number | null
          source_of_load?: number | null
          source1_kwh?: number | null
          source2_kwh?: number | null
          spdu_id?: string | null
          timestamp?: string | null
          vrn_s1?: number | null
          year?: number | null
        }
        Update: {
          active_power?: number | null
          apparent_power?: number | null
          balance_kwh?: number | null
          date?: number | null
          date_of_monthly_billing?: number | null
          day_limit_kwh?: number | null
          hour?: number | null
          id?: never
          load_current?: number | null
          load_vrn?: number | null
          minute?: number | null
          mode_of_operation?: number | null
          month?: number | null
          month_limit_kwh?: number | null
          second?: number | null
          solar_end_time_hour?: number | null
          solar_end_time_minute?: number | null
          solar_start_time_hour?: number | null
          solar_start_time_minute?: number | null
          source_of_load?: number | null
          source1_kwh?: number | null
          source2_kwh?: number | null
          spdu_id?: string | null
          timestamp?: string | null
          vrn_s1?: number | null
          year?: number | null
        }
        Relationships: []
      }
      spdus: {
        Row: {
          central_device_id: number | null
          daily_limit: number | null
          flat_no: string | null
          id: number
          monthly_limit: number | null
          owner_name: string | null
          phase: string | null
          spdu_id: string | null
          spdu_type: string | null
          status: string | null
        }
        Insert: {
          central_device_id?: number | null
          daily_limit?: number | null
          flat_no?: string | null
          id?: never
          monthly_limit?: number | null
          owner_name?: string | null
          phase?: string | null
          spdu_id?: string | null
          spdu_type?: string | null
          status?: string | null
        }
        Update: {
          central_device_id?: number | null
          daily_limit?: number | null
          flat_no?: string | null
          id?: never
          monthly_limit?: number | null
          owner_name?: string | null
          phase?: string | null
          spdu_id?: string | null
          spdu_type?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spdus_central_device_id_fkey"
            columns: ["central_device_id"]
            isOneToOne: false
            referencedRelation: "central_devices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
