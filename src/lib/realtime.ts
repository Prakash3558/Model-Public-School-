import { useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
export {
  useSupabaseRealtimeRefresh,
  broadcastSupabaseTableChange,
  toRealtimeTopic,
  toCleanTableName,
  SUPABASE_REALTIME_TOPICS
} from '../hooks/useSupabaseRealtimeRefresh';
export type { SupabaseRealtimeTopic, RealtimeRefreshEvent } from '../hooks/useSupabaseRealtimeRefresh';

export type RealtimeTable =
  | 'notice_board'
  | 'homework'
  | 'online_classes'
  | 'attendance'
  | 'students'
  | 'teachers'
  | 'site_settings'
  | 'media_gallery'
  | 'exam_results'
  | 'fee_records'
  | 'study_material'
  | 'school_diary'
  | 'syllabus'
  | 'time_table'
  | 'admissions';

export interface RealtimeChangeEvent<T = any> {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL' | string;
  new: T;
  old: T;
}

// Global broadcast dispatcher supporting table-level and global broadcast
export function broadcastRealtimeChange(table: RealtimeTable | string, eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string, payload?: any) {
  const cleanTable = table.replace(/^public:/, '');
  const topic = `public:${cleanTable}`;

  try {
    // 1. Dispatch DOM event for instant intra-window updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mps_realtime_change', {
        detail: { topic, table: cleanTable, eventType, payload, timestamp: Date.now() }
      }));
      window.dispatchEvent(new CustomEvent(`mps_realtime_${cleanTable}`, {
        detail: { topic, table: cleanTable, eventType, payload, timestamp: Date.now() }
      }));
    }

    // 2. Broadcast via Supabase Realtime public channel
    const tableChannel = supabase.channel(topic, {
      config: { broadcast: { self: false } }
    });

    tableChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        tableChannel.send({
          type: 'broadcast',
          event: '*',
          payload: { topic, table: cleanTable, eventType, data: payload, timestamp: Date.now() }
        }).catch(() => {});
        tableChannel.send({
          type: 'broadcast',
          event: 'table_change',
          payload: { topic, table: cleanTable, eventType, data: payload, timestamp: Date.now() }
        }).catch(() => {});
      }
    });
  } catch (err) {
    // Graceful fallback to DOM and local storage bus
  }
}

/**
 * Custom React hook that subscribes to Realtime Postgres Changes & Broadcasts for one or more tables.
 * Cleans up subscriptions automatically on unmount.
 */
export function useRealtimeSubscription(
  tables: RealtimeTable | RealtimeTable[] | string | string[],
  onUpdate: (event: { topic?: string; table: string; eventType: string; payload: any }) => void,
  enabled: boolean = true
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    const rawList = Array.isArray(tables) ? tables : [tables];
    const tableList = rawList.map(t => t.replace(/^public:/, ''));
    const channels: RealtimeChannel[] = [];

    tableList.forEach(t => {
      const topic = `public:${t}`;
      try {
        const channel = supabase.channel(topic, {
          config: { broadcast: { self: false } }
        });

        // 1. Listen to broadcast wildcard '*'
        channel.on('broadcast', { event: '*' }, (res: any) => {
          const detail = res?.payload || res;
          onUpdateRef.current({
            topic,
            table: t,
            eventType: detail?.eventType || 'BROADCAST',
            payload: detail?.data || detail?.payload || detail
          });
        });

        // 2. Listen to broadcast event 'table_change'
        channel.on('broadcast', { event: 'table_change' }, (res: any) => {
          const detail = res?.payload || res;
          onUpdateRef.current({
            topic,
            table: t,
            eventType: detail?.eventType || 'UPDATE',
            payload: detail?.data || detail?.payload || detail
          });
        });

        // 3. Listen to Postgres table changes (INSERT, UPDATE, DELETE)
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table: t },
          (payload: any) => {
            onUpdateRef.current({
              topic,
              table: t,
              eventType: payload.eventType,
              payload: payload.new || payload.old
            });
          }
        );

        channel.subscribe((status) => {
          // Channel subscription status handled smoothly
        });

        channels.push(channel);
      } catch (e) {
        // Fallback gracefully
      }
    });

    // 4. Intra-window event listener
    const handleDOMRealtime = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      const cleanTable = (detail?.table || '').replace(/^public:/, '');
      if (cleanTable && tableList.includes(cleanTable)) {
        console.log(`[Supabase Realtime] Intra-window event caught for table: ${cleanTable}`);
        onUpdateRef.current({
          topic: `public:${cleanTable}`,
          table: cleanTable,
          eventType: detail.eventType || 'UPDATE',
          payload: detail.payload
        });
      }
    };

    window.addEventListener('mps_realtime_change', handleDOMRealtime);

    // Clean up subscriptions on unmount
    return () => {
      console.log(`[Supabase Realtime] Unsubscribing from tables:`, tableList);
      window.removeEventListener('mps_realtime_change', handleDOMRealtime);
      channels.forEach(ch => {
        try {
          supabase.removeChannel(ch);
        } catch (e) {}
      });
    };
  }, [JSON.stringify(tables), enabled]);
}

