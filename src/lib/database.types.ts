/**
 * Supabase Database Types
 * Generated types for type-safe database operations
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      signals: {
        Row: {
          id: string
          asset_symbol: string
          asset_name: string
          asset_type: string
          direction: 'LONG' | 'SHORT' | 'NEUTRAL'
          strength: 'STRONG' | 'MODERATE' | 'WEAK'
          composite_score: number
          confidence: number
          components: Json
          weights: Json
          suggested_action: Json
          risk_metrics: Json
          created_at: string
          expires_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          asset_symbol: string
          asset_name: string
          asset_type: string
          direction: 'LONG' | 'SHORT' | 'NEUTRAL'
          strength: 'STRONG' | 'MODERATE' | 'WEAK'
          composite_score: number
          confidence: number
          components: Json
          weights: Json
          suggested_action: Json
          risk_metrics: Json
          created_at?: string
          expires_at: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          asset_symbol?: string
          asset_name?: string
          asset_type?: string
          direction?: 'LONG' | 'SHORT' | 'NEUTRAL'
          strength?: 'STRONG' | 'MODERATE' | 'WEAK'
          composite_score?: number
          confidence?: number
          components?: Json
          weights?: Json
          suggested_action?: Json
          risk_metrics?: Json
          created_at?: string
          expires_at?: string
          metadata?: Json | null
        }
      }
      positions: {
        Row: {
          id: string
          user_id: string
          asset_symbol: string
          side: 'long' | 'short'
          size: number
          entry_price: number
          current_price: number
          unrealized_pnl: number
          leverage: number
          margin: number
          liquidation_price: number
          stop_loss: number | null
          take_profit: number | null
          signal_id: string | null
          opened_at: string
          closed_at: string | null
          exit_price: number | null
          realized_pnl: number | null
          status: 'open' | 'closed' | 'liquidated'
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          asset_symbol: string
          side: 'long' | 'short'
          size: number
          entry_price: number
          current_price: number
          unrealized_pnl?: number
          leverage?: number
          margin: number
          liquidation_price: number
          stop_loss?: number | null
          take_profit?: number | null
          signal_id?: string | null
          opened_at?: string
          closed_at?: string | null
          exit_price?: number | null
          realized_pnl?: number | null
          status?: 'open' | 'closed' | 'liquidated'
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          asset_symbol?: string
          side?: 'long' | 'short'
          size?: number
          entry_price?: number
          current_price?: number
          unrealized_pnl?: number
          leverage?: number
          margin?: number
          liquidation_price?: number
          stop_loss?: number | null
          take_profit?: number | null
          signal_id?: string | null
          opened_at?: string
          closed_at?: string | null
          exit_price?: number | null
          realized_pnl?: number | null
          status?: 'open' | 'closed' | 'liquidated'
          metadata?: Json | null
        }
      }
      market_data_cache: {
        Row: {
          id: string
          source: 'reddit' | 'defillama' | 'news' | 'hyperliquid'
          asset_symbol: string
          data: Json
          fetched_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          source: 'reddit' | 'defillama' | 'news' | 'hyperliquid'
          asset_symbol: string
          data: Json
          fetched_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          source?: 'reddit' | 'defillama' | 'news' | 'hyperliquid'
          asset_symbol?: string
          data?: Json
          fetched_at?: string
          expires_at?: string
        }
      }
      portfolio_snapshots: {
        Row: {
          id: string
          user_id: string
          total_value: number
          available_balance: number
          total_margin: number
          unrealized_pnl: number
          realized_pnl: number
          portfolio_heat: number
          positions_count: number
          snapshot_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_value: number
          available_balance: number
          total_margin: number
          unrealized_pnl?: number
          realized_pnl?: number
          portfolio_heat?: number
          positions_count?: number
          snapshot_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_value?: number
          available_balance?: number
          total_margin?: number
          unrealized_pnl?: number
          realized_pnl?: number
          portfolio_heat?: number
          positions_count?: number
          snapshot_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          type: 'signal' | 'risk' | 'system' | 'execution'
          severity: 'info' | 'warning' | 'error' | 'critical'
          title: string
          message: string
          acknowledged: boolean
          created_at: string
          acknowledged_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'signal' | 'risk' | 'system' | 'execution'
          severity: 'info' | 'warning' | 'error' | 'critical'
          title: string
          message: string
          acknowledged?: boolean
          created_at?: string
          acknowledged_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'signal' | 'risk' | 'system' | 'execution'
          severity?: 'info' | 'warning' | 'error' | 'critical'
          title?: string
          message?: string
          acknowledged?: boolean
          created_at?: string
          acknowledged_at?: string | null
          metadata?: Json | null
        }
      }
      strategy_configs: {
        Row: {
          id: string
          user_id: string
          name: string
          signal_weights: Json
          risk_parameters: Json
          feature_flags: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          signal_weights: Json
          risk_parameters: Json
          feature_flags: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          signal_weights?: Json
          risk_parameters?: Json
          feature_flags?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      backtest_results: {
        Row: {
          id: string
          user_id: string
          strategy_config_id: string
          start_date: string
          end_date: string
          initial_capital: number
          final_capital: number
          total_return: number
          sharpe_ratio: number
          max_drawdown: number
          win_rate: number
          total_trades: number
          metrics: Json
          equity_curve: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          strategy_config_id: string
          start_date: string
          end_date: string
          initial_capital: number
          final_capital: number
          total_return: number
          sharpe_ratio?: number
          max_drawdown?: number
          win_rate?: number
          total_trades?: number
          metrics: Json
          equity_curve: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          strategy_config_id?: string
          start_date?: string
          end_date?: string
          initial_capital?: number
          final_capital?: number
          total_return?: number
          sharpe_ratio?: number
          max_drawdown?: number
          win_rate?: number
          total_trades?: number
          metrics?: Json
          equity_curve?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      signal_direction: 'LONG' | 'SHORT' | 'NEUTRAL'
      signal_strength: 'STRONG' | 'MODERATE' | 'WEAK'
      position_side: 'long' | 'short'
      position_status: 'open' | 'closed' | 'liquidated'
      data_source: 'reddit' | 'defillama' | 'news' | 'hyperliquid'
      alert_type: 'signal' | 'risk' | 'system' | 'execution'
      alert_severity: 'info' | 'warning' | 'error' | 'critical'
    }
  }
}
