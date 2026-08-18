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

// Global broadcast dispatcher supporting both global and topic-level private broadcast
export function broadcastRealtimeChange(table: RealtimeTable | string, eventType: 'INSERT' | 'UPDATE' | 'DELETE' | string, payload?: any) {
  const cleanTable = table.replace(/^public:/, '');
  const topic = `public:${cleanTable}`;

  console.log(`[Supabase Realtime] Dispatching table broadcast for ${topic} (${eventType})`);

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

    // 2. Broadcast via Supabase Realtime channel to table-level topic with private config
    const tableChannel = supabase.channel(topic, {
      config: { private: true }
    });

    tableChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        tableChannel.send({
          type: 'broadcast',
          event: '*',
          payload: { topic, table: cleanTable, eventType, data: payload, timestamp: Date.now() }
        });
        tableChannel.send({
          type: 'broadcast',
          event: 'table_change',
          payload: { topic, table: cleanTable, eventType, data: payload, timestamp: Date.now() }
        });
      }
    });

    // 3. Also send to legacy global sync channel for backward compatibility
    const globalChannel = supabase.channel('mps_global_realtime_sync');
    globalChannel.send({
      type: 'broadcast',
      event: 'table_change',
      payload: { topic, table: cleanTable, eventType, data: payload, timestamp: Date.now() }
    });
  } catch (err) {
    console.warn('[Supabase Realtime] Broadcast error:', err);
  }
}

/**
 * Custom React hook that subscribes to Realtime Postgres Changes & Broadcasts for one or more tables.
 * Subscribes to table-level topics (public:<table>) with private channel config.
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

    console.log(`[Supabase Realtime] Subscribing to tables:`, tableList);

    tableList.forEach(t => {
      const topic = `public:${t}`;
      try {
        const channel = supabase.channel(topic, {
          config: { private: true }
        });

        // 1. Listen to broadcast wildcard '*'
        channel.on('broadcast', { event: '*' }, (res: any) => {
          console.log(`[Supabase Realtime] Broadcast * received on ${topic}:`, res);
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
          console.log(`[Supabase Realtime] Broadcast table_change on ${topic}:`, res);
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
            console.log(`[Supabase Realtime] Postgres change on table ${t}:`, payload);
            onUpdateRef.current({
              topic,
              table: t,
              eventType: payload.eventType,
              payload: payload.new || payload.old
            });
          }
        );

        channel.subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`[Supabase Realtime] Subscribed to channel ${topic}`);
          } else if (status === 'CHANNEL_ERROR') {
            console.warn(`[Supabase Realtime] Channel ${topic} error:`, err);
          }
        });

        channels.push(channel);
      } catch (e) {
        console.warn(`[Supabase Realtime] Subscription error on ${topic}:`, e);
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

